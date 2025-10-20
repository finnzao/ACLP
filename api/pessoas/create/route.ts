import { NextRequest, NextResponse } from 'next/server';
import { User, ROLE_PERMISSIONS, UserPermissions } from '@/types/user';
import { validateComparecimentoForm, validateDocuments } from '@/lib/utils/validation';
import { ComparecimentoFormData } from '@/types/comparecimento';

// Simular dados de usuários para validação
const MOCK_USERS = {
  '1': { 
    id: '1', 
    role: 'admin' as const, 
    nome: 'João Silva', 
    email: 'admin@tjba.com.br',
    ativo: true,
    criadoEm: new Date().toISOString()
  },
  '2': { 
    id: '2', 
    role: 'usuario' as const, 
    nome: 'Maria Santos', 
    email: 'usuario@tjba.com.br',
    ativo: true,
    criadoEm: new Date().toISOString()
  }
};

function getUserFromRequest(request: NextRequest): User | null {
  // Em produção, extrair do JWT no header Authorization
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role') as 'admin' | 'usuario';
  
  if (!userId || !userRole) {
    return null;
  }
  
  // Verificar se o usuário existe (em produção, consultar banco de dados)
  const user = MOCK_USERS[userId as keyof typeof MOCK_USERS];
  return user || null;
}

function hasPermission(
  user: User, 
  resource: string, 
  action: string
): boolean {
  const userPermissions = ROLE_PERMISSIONS[user.role];
  const resourcePermissions = (userPermissions as any)[resource];
  return resourcePermissions && resourcePermissions[action] === true;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticação
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized', 
          message: 'Token de autenticação inválido ou expirado.' 
        },
        { status: 401 }
      );
    }

    // 2. Verificar permissão específica
    if (!hasPermission(user, 'pessoas', 'cadastrar')) {
      // Log da tentativa de acesso negado
      console.log(`[SECURITY] Tentativa de cadastro negada para usuário ${user.id} (${user.role}) - ${user.email}`);
      
      return NextResponse.json(
        { 
          error: 'Forbidden', 
          message: 'Você não tem permissão para cadastrar novas pessoas. Esta ação é restrita a administradores.',
          details: {
            requiredPermission: 'pessoas.cadastrar',
            userRole: user.role,
            allowedRoles: ['admin']
          }
        },
        { status: 403 }
      );
    }

    // 3. Validar dados de entrada
    const body: ComparecimentoFormData = await request.json();
    
    // Validação completa do formulário
    const validation = validateComparecimentoForm(body);
    
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation Error', 
          message: 'Dados inválidos fornecidos.',
          errors: validation.errors,
          warnings: validation.warnings
        },
        { status: 400 }
      );
    }

    // 4. Validação específica de documentos (redundante, mas importante)
    const docValidation = validateDocuments(body.cpf, body.rg);
    if (!docValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation Error', 
          message: docValidation.error
        },
        { status: 400 }
      );
    }

    // 5. Validações de negócio específicas
    const processo = body.processo.replace(/\D/g, '');
    if (processo.length !== 20) {
      return NextResponse.json(
        { 
          error: 'Validation Error', 
          message: 'Número do processo deve ter 20 dígitos.' 
        },
        { status: 400 }
      );
    }

    // 6. Verificar se processo já existe (simulação)
    const processoExistente = false; // Simular consulta
    if (processoExistente) {
      return NextResponse.json(
        { 
          error: 'Conflict', 
          message: 'Já existe uma pessoa cadastrada com este número de processo.' 
        },
        { status: 409 }
      );
    }

    // 7. Validar se há conflito de documentos
    if (body.cpf?.trim()) {
      // Simular verificação de CPF duplicado
      const cpfExistente = false; // Em produção, consultar banco
      if (cpfExistente) {
        return NextResponse.json(
          { 
            error: 'Conflict', 
            message: 'CPF já cadastrado no sistema.' 
          },
          { status: 409 }
        );
      }
    }

    if (body.rg?.trim()) {
      // Simular verificação de RG duplicado
      const rgExistente = false; // Em produção, consultar banco
      if (rgExistente) {
        return NextResponse.json(
          { 
            error: 'Conflict', 
            message: 'RG já cadastrado no sistema.' 
          },
          { status: 409 }
        );
      }
    }

    // 8. Processar dados para salvamento
    const novaPessoa = {
      id: `pessoa_${Date.now()}`,
      ...body,
      // Garantir que apenas documentos preenchidos sejam salvos
      cpf: body.cpf?.trim() || undefined,
      rg: body.rg?.trim() || undefined,
      status: 'em conformidade',
      primeiroComparecimento: body.dataComparecimentoInicial,
      ultimoComparecimento: body.dataComparecimentoInicial,
      proximoComparecimento: calcularProximoComparecimento(
        body.dataComparecimentoInicial, 
        body.periodicidade
      ),
      criadoPor: user.id,
      criadoEm: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString()
    };

    // 9. Salvar no banco de dados (simulação)
    console.log(`[INFO] Nova pessoa cadastrada por ${user.nome} (${user.email}):`, {
      processo: novaPessoa.processo,
      nome: novaPessoa.nome,
      documentos: {
        cpf: novaPessoa.cpf ? 'Informado' : 'Não informado',
        rg: novaPessoa.rg ? 'Informado' : 'Não informado'
      },
      endereco: {
        cidade: novaPessoa.endereco.cidade,
        estado: novaPessoa.endereco.estado
      },
      periodicidade: `${novaPessoa.periodicidade} dias`,
      criadoEm: novaPessoa.criadoEm
    });

    // 10. Log de auditoria detalhado
    const auditLog = {
      userId: user.id,
      userName: user.nome,
      action: 'create_person',
      resource: 'pessoas',
      resourceId: novaPessoa.id,
      details: {
        processo: novaPessoa.processo,
        nome: novaPessoa.nome,
        documentos: {
          cpf: !!novaPessoa.cpf,
          rg: !!novaPessoa.rg
        },
        endereco: novaPessoa.endereco,
        periodicidade: novaPessoa.periodicidade
      },
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    // Em produção, salvar no sistema de auditoria
    console.log('[AUDIT]', auditLog);

    // 11. Retornar sucesso
    return NextResponse.json({
      success: true,
      message: 'Pessoa cadastrada com sucesso!',
      data: {
        id: novaPessoa.id,
        processo: novaPessoa.processo,
        nome: novaPessoa.nome,
        documentos: {
          cpf: !!novaPessoa.cpf,
          rg: !!novaPessoa.rg
        },
        proximoComparecimento: novaPessoa.proximoComparecimento,
        criadoEm: novaPessoa.criadoEm
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[ERROR] Erro ao cadastrar pessoa:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Erro interno do servidor. Tente novamente mais tarde.' 
      },
      { status: 500 }
    );
  }
}

// Função auxiliar para calcular próximo comparecimento
function calcularProximoComparecimento(dataInicial: string, periodicidade: number): string {
  const data = new Date(dataInicial);
  data.setDate(data.getDate() + periodicidade);
  return data.toISOString().split('T')[0];
}

// Endpoint para listar pessoas (todos podem acessar)
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Token inválido.' },
        { status: 401 }
      );
    }

    // Verificar permissão de listagem
    if (!hasPermission(user, 'pessoas', 'listar')) {
      return NextResponse.json(
        { 
          error: 'Forbidden', 
          message: 'Você não tem permissão para listar pessoas.' 
        },
        { status: 403 }
      );
    }

    // Simular busca no banco
    const pessoas = [
      {
        id: '1',
        nome: 'João Silva',
        processo: '1234567-89.2024.1.01.0001',
        status: 'em conformidade',
        proximoComparecimento: '2024-07-20',
        documentos: {
          cpf: true,
          rg: false
        }
      }
    ];

    // Log da consulta
    console.log(`[INFO] Listagem de pessoas acessada por ${user.nome} (${user.email})`);

    return NextResponse.json({
      success: true,
      data: pessoas,
      total: pessoas.length
    });

  } catch (error) {
    console.error('[ERROR] Erro ao listar pessoas:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}