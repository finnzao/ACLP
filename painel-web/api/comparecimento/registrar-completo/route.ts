// painel-web/api/comparecimentos/registrar-completo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { RegistroComparecimentoCompleto, Endereco } from '@/types/comparecimento';

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

interface User {
  id: string;
  role: 'admin' | 'usuario';
  nome: string;
  email: string;
  ativo: boolean;
  criadoEm: string;
}

function getUserFromRequest(request: NextRequest): User | null {
  const userId = request.headers.get('x-user-id');
  const userRole = request.headers.get('x-user-role') as 'admin' | 'usuario';
  
  if (!userId || !userRole) {
    return null;
  }
  
  const user = MOCK_USERS[userId as keyof typeof MOCK_USERS];
  return user || null;
}

function hasPermission(user: User, action: string): boolean {
  // Usuários podem registrar comparecimentos
  if (action === 'registrar_comparecimento') {
    return true;
  }
  
  // Apenas admins podem atualizar endereços
  if (action === 'atualizar_endereco') {
    return user.role === 'admin';
  }
  
  return false;
}

function validateEnderecoData(endereco: Endereco | undefined): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!endereco) {
    return { isValid: true, errors: [] }; // Endereço é opcional
  }
  
  // Validar CEP se fornecido
  if (endereco.cep) {
    const cepLimpo = endereco.cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) {
      errors.push('CEP deve ter 8 dígitos');
    }
  }
  
  // Validar estado se fornecido
  if (endereco.estado && endereco.estado.length !== 2) {
    errors.push('Estado deve ter 2 caracteres');
  }
  
  // Se tem logradouro, deve ter cidade
  if (endereco.logradouro && !endereco.cidade) {
    errors.push('Cidade é obrigatória quando logradouro é informado');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Função auxiliar para verificar se um campo existe no objeto
function hasField(obj: RegistroComparecimentoCompleto, field: string): boolean {
  return field in obj && obj[field as keyof RegistroComparecimentoCompleto] !== undefined;
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

    // 2. Verificar permissão para registrar comparecimento
    if (!hasPermission(user, 'registrar_comparecimento')) {
      console.log(`[SECURITY] Tentativa de registro negada para usuário ${user.id} (${user.role}) - ${user.email}`);
      
      return NextResponse.json(
        { 
          error: 'Forbidden', 
          message: 'Você não tem permissão para registrar comparecimentos.',
          details: {
            requiredPermission: 'comparecimentos.registrar',
            userRole: user.role
          }
        },
        { status: 403 }
      );
    }

    // 3. Validar dados de entrada
    const body: RegistroComparecimentoCompleto = await request.json();
    
    const requiredFields = ['processo', 'nome', 'validadoPor', 'tipoValidacao'];
    const missingFields = requiredFields.filter(field => !hasField(body, field));
    
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

    // 4. Validações específicas para cada tipo de validação
    if (body.tipoValidacao !== 'justificado') {
      if (!body.dataComparecimento || !body.horaComparecimento) {
        return NextResponse.json(
          { 
            error: 'Validation Error', 
            message: 'Data e hora são obrigatórias para comparecimentos presenciais e documentais.' 
          },
          { status: 400 }
        );
      }
    }

    // 5. Validar dados de endereço se fornecidos
    if (body.atualizacaoEndereco?.houveAlteracao) {
      // Verificar permissão para atualizar endereço
      if (!hasPermission(user, 'atualizar_endereco')) {
        return NextResponse.json(
          { 
            error: 'Forbidden', 
            message: 'Você não tem permissão para atualizar endereços. Entre em contato com um administrador.' 
          },
          { status: 403 }
        );
      }

      const enderecoValidation = validateEnderecoData(body.atualizacaoEndereco.endereco);
      if (!enderecoValidation.isValid) {
        return NextResponse.json(
          { 
            error: 'Validation Error', 
            message: 'Dados de endereço inválidos.',
            errors: enderecoValidation.errors
          },
          { status: 400 }
        );
      }
    }

    // 6. Validações de negócio
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

    // 7. Processar dados
    const novoComparecimento = {
      id: `comparecimento_${Date.now()}`,
      ...body,
      criadoPor: user.id,
      criadoEm: new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString()
    };

    // 8. Simular salvamento no banco de dados
    console.log(`[INFO] Novo comparecimento registrado por ${user.nome} (${user.email}):`, {
      processo: novoComparecimento.processo,
      nome: novoComparecimento.nome,
      tipoValidacao: novoComparecimento.tipoValidacao,
      dataComparecimento: novoComparecimento.dataComparecimento,
      houveAlteracaoEndereco: novoComparecimento.atualizacaoEndereco?.houveAlteracao || false,
      criadoEm: novoComparecimento.criadoEm
    });

    // 9. Processar atualização de endereço se necessário
    let enderecoAtualizado = false;
    if (body.atualizacaoEndereco?.houveAlteracao && body.atualizacaoEndereco.endereco) {
      // Simular atualização de endereço no banco
      console.log(`[INFO] Endereço atualizado para processo ${body.processo}:`, {
        endereco: body.atualizacaoEndereco.endereco,
        motivo: body.atualizacaoEndereco.motivoAlteracao,
        atualizadoPor: user.nome,
        dataAtualizacao: new Date().toISOString()
      });
      
      enderecoAtualizado = true;
    }

    // 10. Log de auditoria
    const auditLog = {
      userId: user.id,
      userName: user.nome,
      action: 'register_attendance_complete',
      resource: 'comparecimentos',
      resourceId: novoComparecimento.id,
      details: {
        processo: novoComparecimento.processo,
        nome: novoComparecimento.nome,
        tipoValidacao: novoComparecimento.tipoValidacao,
        enderecoAtualizado,
        dataComparecimento: novoComparecimento.dataComparecimento
      },
      timestamp: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    };

    console.log('[AUDIT]', auditLog);

    // 11. Preparar mensagem de resposta
    let message = 'Comparecimento registrado com sucesso!';
    if (body.tipoValidacao === 'justificado') {
      message = 'Justificativa de ausência registrada com sucesso!';
    }
    if (enderecoAtualizado) {
      message += ' Endereço atualizado com sucesso.';
    }

    // 12. Retornar sucesso
    return NextResponse.json({
      success: true,
      message,
      data: {
        id: novoComparecimento.id,
        processo: novoComparecimento.processo,
        nome: novoComparecimento.nome,
        tipoValidacao: novoComparecimento.tipoValidacao,
        dataComparecimento: novoComparecimento.dataComparecimento,
        enderecoAtualizado,
        criadoEm: novoComparecimento.criadoEm
      }
    }, { status: 201 });

  } catch (error) {
    console.error('[ERROR] Erro ao registrar comparecimento completo:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal Server Error', 
        message: 'Erro interno do servidor. Tente novamente mais tarde.' 
      },
      { status: 500 }
    );
  }
}

// Endpoint para buscar endereço atual de uma pessoa
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Token inválido.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const processo = searchParams.get('processo');

    if (!processo) {
      return NextResponse.json(
        { error: 'Bad Request', message: 'Processo é obrigatório.' },
        { status: 400 }
      );
    }

    // Simular busca no banco
    const enderecoAtual = {
      cep: '40070-110',
      logradouro: 'Av. Sete de Setembro',
      numero: '1238',
      bairro: 'Centro',
      cidade: 'Salvador',
      estado: 'BA',
      ultimaAtualizacao: '2024-01-15T10:30:00.000Z'
    };

    console.log(`[INFO] Endereço consultado para processo ${processo} por ${user.nome}`);

    return NextResponse.json({
      success: true,
      data: enderecoAtual
    });

  } catch (error) {
    console.error('[ERROR] Erro ao buscar endereço:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}