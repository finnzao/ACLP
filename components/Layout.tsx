import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background text-text-base">
      <header className="bg-primary text-white py-4 px-6 shadow-md fixed top-0 left-0 right-0 z-50">
        <h1 className="text-xl font-semibold">ACLP – Controle de Comparecimentos</h1>
      </header>
      <main className="pt-20 px-6 pb-10 max-w-5xl mx-auto">{children}</main>
    </div>
  );
};
