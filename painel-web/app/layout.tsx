import './globals.css';
import { Metadata } from 'next';
import { ToastProvider } from '@/components/Toast';
import { AuthProvider } from '@/contexts/AuthContext';

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
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}