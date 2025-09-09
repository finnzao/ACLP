import './globals.css';
import { Metadata } from 'next';
import { ToastProvider } from '@/components/Toast';
import { AuthProvider } from '@/contexts/AuthContext';
import { ApiProvider, ApiStatusIndicator } from '@/contexts/ApiContext';
import DebugApiStatus from '@/components/DebugApiStatus';

export const metadata: Metadata = {
  title: 'Sistema de Controle de Comparecimento',
  description: 'Controle de Comparecimento de Liberdade Provisória',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
      <body>
        <ApiProvider autoCheck={true} checkInterval={300000}>
          <AuthProvider>
            <ToastProvider>
              {children}
              <ApiStatusIndicator />
              <DebugApiStatus />
            </ToastProvider>
          </AuthProvider>
        </ApiProvider>
      </body>
    </html>
  );
}