import React from 'react';

interface BadgeProps {
  status: 'compareceu' | 'pendente' | 'atrasado';
}

const variants: Record<string, string> = {
  compareceu: 'bg-secondary text-white',
  pendente: 'bg-warning text-text-base',
  atrasado: 'bg-danger text-white',
};

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${variants[status]}`}>
      {status === 'compareceu' && 'Compareceu'}
      {status === 'pendente' && 'Pendente'}
      {status === 'atrasado' && 'Atrasado'}
    </span>
  );
};