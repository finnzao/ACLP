'use client';

import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Comparecimento } from '@/types';

interface Props {
  dados: Comparecimento;
  onClose: () => void;
  onEditar: (dados: Comparecimento) => void;
}

export default function DetalhesSubmetidoModal({ dados, onClose, onEditar }: Props) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-overlay-blue flex items-center justify-center z-50 px-4">
      <div className="relative bg-white p-6 rounded-xl shadow-xl w-full max-w-md space-y-4">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-primary-dark hover:text-primary"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-semibold text-primary-dark mb-2">Detalhes do Acusado</h3>

        <div className="grid grid-cols-2 gap-3 text-sm text-text-base">
          <div><strong>Nome:</strong><br />{dados.nome}</div>
          <div><strong>CPF:</strong><br />{dados.cpf}</div>
          <div><strong>RG:</strong><br />{dados.rg}</div>
          <div><strong>Contato:</strong><br />{dados.contato}</div>
          <div className="col-span-2"><strong>Processo:</strong><br />{dados.processo}</div>
          <div><strong>Vara:</strong><br />{dados.vara}</div>
          <div><strong>Comarca:</strong><br />{dados.comarca}</div>
          <div><strong>Decisão:</strong><br />{dados.decisao}</div>
          <div><strong>Periodicidade:</strong><br />{dados.periodicidade}</div>
          <div><strong>Data Inicial:</strong><br />{dados.dataComparecimentoInicial}</div>
          <div><strong>Status:</strong><br />{dados.status}</div>
          <div><strong>1º Comparecimento:</strong><br />{dados.primeiroComparecimento}</div>
          <div><strong>Último Comparecimento:</strong><br />{dados.ultimoComparecimento}</div>
          <div><strong>Próximo Comparecimento:</strong><br />{dados.proximoComparecimento}</div>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => router.push(`/dashboard/comparecimento/confirmar?processo=${dados.processo}`)}
            className="bg-secondary text-white px-4 py-2 rounded hover:bg-green-600">
            Confirmar Presença
          </button>
          <button
            onClick={() => onEditar(dados)}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
          >
            Editar
          </button>
          <button
            onClick={() => router.push(`/dashboard/comparecimento/justificar?processo=${dados.processo}`)}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
          >
            Justificar
          </button>
          <button className="bg-danger text-white px-4 py-2 rounded hover:bg-red-700">
            Apagar
          </button>
        </div>
      </div>
    </div>
  );
}
