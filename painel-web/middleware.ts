import { NextRequest, NextResponse } from 'next/server';
import { UserPermissions } from '@/types/user';

interface User {
  id: string;
  role: 'admin' | 'usuario';
  nome: string;
  email: string;
}

// Rotas que requerem permissões específicas
const PROTECTED_ROUTES = {
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
const PUBLIC_ROUTES = [
  '/login', 
  '/api/auth/login',
  '/ativar',
  '/invite',           // Rota de convite adicionada
  '/cadastro',         // Rota de cadastro adicionada
  '/api/auth/invite',  // API de convite adicionada
  '/api/auth/accept-invite',  // API para aceitar convite
  '/api/auth/validate-invite', // API para validar convite
  '/api/auth/cadastro', // API de cadastro adicionada
  '/api/auth/setup',    // API de setup inicial
  '/_next',
  '/favicon.ico',
  '/img',
  '/public'
];

// Rotas que qualquer usuário autenticado pode acessar
const AUTHENTICATED_ROUTES = [
  '/dashboard',
  '/dashboard/geral',
  '/dashboard/registrar',
  '/dashboard/configuracoes',
  '/api/pessoas/list',
  '/api/comparecimentos'
];

function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('[Middleware] Erro ao decodificar token:', error);
    return null;
  }
}

function getUserFromToken(token: string): User | null {
  try {
    console.log('[Middleware] Verificando token...');
    
    // Decodificar o JWT real
    const decoded = decodeJWT(token);
    
    if (!decoded) {
      console.log('[Middleware] Token inválido - não foi possível decodificar');
      return null;
    }

    console.log('[Middleware] Token decodificado:', {
      userId: decoded.userId,
      email: decoded.email,
      tipo: decoded.tipo,
      exp: new Date(decoded.exp * 1000).toISOString()
    });

    // Verificar se o token expirou
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      console.log('[Middleware] Token expirado');
      return null;
    }

    // Converter tipo do backend (ADMIN/USUARIO) para role do frontend (admin/usuario)
    const role = decoded.tipo === 'ADMIN' ? 'admin' : 'usuario';

    return {
      id: decoded.userId?.toString() || '0',
      role: role,
      nome: decoded.nome || 'Usuário',
      email: decoded.email || ''
    };
  } catch (error) {
    console.error('[Middleware] Erro ao processar token:', error);
    return null;
  }
}

function hasPermission(user: User, resource: string, action: string): boolean {
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
      sistema: [] as string[],
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
  
  console.log('[Middleware] Processando:', pathname);
  
  // Permitir rotas públicas
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    console.log('[Middleware] Rota pública, permitindo acesso');
    return NextResponse.next();
  }

  // Verificar token de autenticação
  const token = req.cookies.get('auth-token')?.value;
  
  console.log('[Middleware] Token encontrado:', token ? 'SIM' : 'NÃO');
  
  if (!token) {
    console.log('[Middleware] Sem token, redirecionando para login');
    
    // Se for rota de API, retornar 401
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Token de autenticação não encontrado' 
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Para rotas de página, redirecionar para login
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Obter usuário do token
  const user = getUserFromToken(token);
  
  if (!user) {
    console.log('[Middleware] Token inválido ou expirado, redirecionando para login');
    
    // Se for rota de API, retornar 401
    if (pathname.startsWith('/api/')) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Unauthorized', 
          message: 'Token inválido ou expirado' 
        }),
        { 
          status: 401, 
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Token inválido - limpar cookie e redirecionar
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('auth-token');
    return response;
  }

  console.log('[Middleware] Usuário autenticado:', user.email, '- Role:', user.role);

  // Verificar se a rota requer permissões específicas
  const protectedRoute = Object.entries(PROTECTED_ROUTES).find(([route]) => 
    pathname.startsWith(route)
  );

  if (protectedRoute) {
    const [routePath, permissions] = protectedRoute;
    console.log('[Middleware] Verificando permissões para rota protegida:', routePath);
    
    // Verificar se é rota apenas para admin
    if (permissions.adminOnly && user.role !== 'admin') {
      console.log('[Middleware] Acesso negado - rota requer admin');
      
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
      
      // Para rotas de página, redirecionar para página de acesso negado
      return NextResponse.redirect(new URL('/dashboard/acesso-negado', req.url));
    }

    // Verificar permissão específica
    if (!hasPermission(user, permissions.resource, permissions.action)) {
      console.log('[Middleware] Acesso negado - permissão insuficiente');
      
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

  // Adicionar informações do usuário no header para uso na aplicação
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-id', user.id);
  requestHeaders.set('x-user-role', user.role);
  requestHeaders.set('x-user-email', user.email);
  requestHeaders.set('x-user-nome', user.nome);

  console.log('[Middleware] Acesso permitido');

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
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