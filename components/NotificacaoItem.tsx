import React from 'react';

interface NotificacaoItemProps {
  email: string;
  dias: number;
  editando: boolean;
  editandoEmail: string;
  editandoDias: number;
  error?: string;
  onChangeEmail: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onChangeDias: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSalvar: () => void;
  onEditar: () => void;
  onRemover: () => void;
}

export function NotificacaoItem({
  email,
  dias,
  editando,
  editandoEmail,
  editandoDias,
  error,
  onChangeEmail,
  onChangeDias,
  onSalvar,
  onEditar,
  onRemover,
}: NotificacaoItemProps) {
  return (
    <li className="flex justify-between items-center border border-gray-200 px-3 py-2 rounded">
      {editando ? (
        <>
          <input
            value={editandoEmail}
            onChange={onChangeEmail}
            className="flex-1 border border-gray-300 rounded px-2 py-1 mr-2"
          />
          <input
            type="number"
            value={editandoDias}
            onChange={onChangeDias}
            className="w-20 border border-gray-300 rounded px-2 py-1 mr-2"
          />
          <button onClick={onSalvar} className="text-green-600 text-sm">
            Salvar
          </button>
          {error && <p className="text-sm text-red-500 ml-2">{error}</p>}
        </>
      ) : (
        <>
          <span className="flex-1">
            {email} <span className="text-gray-500">(após {dias} dias)</span>
          </span>
          <div className="flex gap-3">
            <button onClick={onEditar} className="text-blue-600 text-sm">
              Editar
            </button>
            <button onClick={onRemover} className="text-red-500 text-sm">
              Remover
            </button>
          </div>
        </>
      )}
    </li>
  );
} 