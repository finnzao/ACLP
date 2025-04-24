import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ACLP',
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
      <body>{children}</body>
    </html>
  );
}
