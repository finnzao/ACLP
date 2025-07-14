import { NextRequest, NextResponse } from 'next/server';
import { User, ROLE_PERMISSIONS, UserPermissions } from '@/types/user';

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
    // Linha 63: corrigida para usar string literal
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
    const body = await request.json();
    
    const requiredFields = ['nome', 'processo', 'vara', 'comarca', 'decisao', 'dataComparecimentoInicial'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Validation Error', 
          message: 'Campos obrigatórios não preenchidos.',
          missingFields 
        },
        { status: 400 }
      );
    }

    // Validar que pelo menos CPF ou RG estão preenchidos
    if (!body.cpf && !body.rg) {
      return NextResponse.json(
        { 
          error: 'Validation Error', 
          message: 'Pelo menos CPF ou RG deve ser informado.' 
        },
        { status: 400 }
      );
    }

    // 4. Validações de negócio
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

    // Verificar se processo já existe (simulação)
    // Em produção, consultar banco de dados
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

    // 5. Processar dados
    const novaPessoa = {
      id: `pessoa_${Date.now()}`,
      ...body,
      status: 'em conformidade',
      criadoPor: user.id,
      criadoEm: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString()
    };

    // 6. Salvar no banco de dados (simulação)
    console.log(`[INFO] Nova pessoa cadastrada por ${user.nome} (${user.email}):`, {
      processo: novaPessoa.processo,
      nome: novaPessoa.nome,
      criadoEm: novaPessoa.criadoEm
    });

    // 7. Log de auditoria
    const auditLog = {
      userId: user.id,
      userName: user.nome,
      action: 'create_person',
      resource: 'pessoas',
      resourceId: novaPessoa.id,
      details: {
        processo: novaPessoa.processo,
        nome: novaPessoa.nome
      },
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    // Em produção, salvar no sistema de auditoria
    console.log('[AUDIT]', auditLog);

    // 8. Retornar sucesso
    return NextResponse.json({
      success: true,
      message: 'Pessoa cadastrada com sucesso!',
      data: {
        id: novaPessoa.id,
        processo: novaPessoa.processo,
        nome: novaPessoa.nome,
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
    // Linha 207: corrigida para usar string literal
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
        proximoComparecimento: '2024-07-20'
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