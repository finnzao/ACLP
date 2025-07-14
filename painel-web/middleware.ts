import { NextRequest, NextResponse } from 'next/server';

interface User {
  id: string;
  role: 'admin' | 'usuario';
  nome: string;
  email: string;
}

// Rotas que requerem permissões específicas
const PROTECTED_ROUTES = {
  '/dashboard/registrar': {
    resource: 'pessoas',
    action: 'cadastrar',
    adminOnly: false
  },
  '/dashboard/configuracoes/sistema': {
    resource: 'sistema',
    action: 'configurar',
    adminOnly: true
  },
  '/dashboard/configuracoes/usuarios': {
    resource: 'sistema',
    action: 'gerenciarUsuarios',
    adminOnly: true
  },
  '/api/pessoas/create': {
    resource: 'pessoas',
    action: 'cadastrar',
    adminOnly: false
  },
  '/api/sistema/config': {
    resource: 'sistema',
    action: 'configurar',
    adminOnly: true
  },
  '/api/usuarios': {
    resource: 'sistema',
    action: 'gerenciarUsuarios',
    adminOnly: true
  }
};

// Rotas públicas que não precisam de autenticação
const PUBLIC_ROUTES = ['/login', '/api/auth/login'];

// Rotas que qualquer usuário autenticado pode acessar
const AUTHENTICATED_ROUTES = [
  '/dashboard',
  '/dashboard/geral',
  '/dashboard/configuracoes',
  '/api/pessoas/list',
  '/api/comparecimentos'
];

function getUserFromToken(token: string): User | null {
  try {
    // Em produção, decodificar e validar JWT real
    // Por ora, simulação baseada no token
    if (token === 'fake-token-admin') {
      return {
        id: '1',
        role: 'admin',
        nome: 'João Silva',
        email: 'admin@tjba.com.br'
      };
    }
    
    if (token === 'fake-token-usuario') {
      return {
        id: '2',
        role: 'usuario',
        nome: 'Maria Santos',
        email: 'usuario@tjba.com.br'
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

function hasPermission(user: User, resource: string, action: string): boolean {
  // Definir permissões baseadas no role
  const permissions = {
    admin: {
      pessoas: ['listar', 'visualizar', 'cadastrar', 'editar', 'excluir', 'exportar'],
      comparecimentos: ['listar', 'visualizar', 'registrar', 'editar', 'cancelar', 'exportar'],
      sistema: ['configurar', 'gerenciarUsuarios', 'backup', 'logs'],
      relatorios: ['visualizar', 'gerar', 'exportar'],
      biometria: ['cadastrar', 'verificar', 'gerenciar']
    },
    usuario: {
      pessoas: ['listar', 'visualizar', 'exportar'],
      comparecimentos: ['listar', 'visualizar', 'registrar', 'exportar'],
      sistema: [],
      relatorios: ['visualizar', 'exportar'],
      biometria: ['verificar']
    }
  };

  const userPermissions = permissions[user.role];
  const resourcePermissions = userPermissions[resource as keyof typeof userPermissions] || [];
  
  return resourcePermissions.includes(action);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Permitir rotas públicas
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Verificar token de autenticação
  const token = req.cookies.get('token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Obter usuário do token
  const user = getUserFromToken(token);
  
  if (!user) {
    // Token inválido - limpar cookie e redirecionar
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('token');
    return response;
  }

  // Verificar se a rota requer permissões específicas
  const protectedRoute = Object.entries(PROTECTED_ROUTES).find(([route]) => 
    pathname.startsWith(route)
  );

  if (protectedRoute) {
    const [routePath, permissions] = protectedRoute;
    
    // Verificar se é rota apenas para admin
    if (permissions.adminOnly && user.role !== 'admin') {
      // Para rotas de API, retornar 403
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Forbidden', 
            message: 'Acesso negado. Esta funcionalidade é restrita a administradores.' 
          }),
          { 
            status: 403, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Para rotas de página, redirecionar para página de erro
      return NextResponse.redirect(new URL('/dashboard/acesso-negado', req.url));
    }

    // Verificar permissão específica
    if (!hasPermission(user, permissions.resource, permissions.action)) {
      // Para rotas de API, retornar 403
      if (pathname.startsWith('/api/')) {
        return new NextResponse(
          JSON.stringify({ 
            error: 'Forbidden', 
            message: `Acesso negado. Você não tem permissão para ${permissions.action} em ${permissions.resource}.` 
          }),
          { 
            status: 403, 
            headers: { 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Para rotas de página, permitir que o componente de proteção trate
      // (o componente PermissionGuard vai mostrar a mensagem apropriada)
    }
  }

  // Verificar se é rota autenticada geral
  const isAuthenticatedRoute = AUTHENTICATED_ROUTES.some(route => 
    pathname.startsWith(route)
  );

  if (isAuthenticatedRoute || pathname.startsWith('/api/')) {
    // Adicionar informações do usuário no header para uso na aplicação
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-role', user.role);
    requestHeaders.set('x-user-email', user.email);

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Rota não reconhecida para usuário autenticado - permitir
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};