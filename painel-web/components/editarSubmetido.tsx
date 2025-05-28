'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { Comparecimento } from '@/types';
import { formatContato, formatCPF, formatRG, formatProcesso, unformat } from '@/lib/utils/formatting';

interface Props {
  dados: Comparecimento;
  onClose: () => void;
  onVoltar: () => void;
  onSave: (novo: Comparecimento) => void;
}

export default function EditarSubmetidoModal({ dados, onClose, onVoltar, onSave }: Props) {
  const [form, setForm] = useState<Comparecimento>({
    ...dados,
    cpf: formatCPF(dados.cpf),
    rg: formatRG(dados.rg),
    processo: formatProcesso(dados.processo),
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;

    const formatters: Record<string, (v: string) => string> = {
      cpf: formatCPF,
      rg: formatRG,
      processo: formatProcesso,
    };

    const formattedValue = formatters[name] ? formatters[name](value) : value;
    setForm((prev) => ({ ...prev, [name]: formattedValue }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const dadosNormalizados = {
      ...form,
      cpf: unformat(form.cpf),
      rg: unformat(form.rg),
      processo: unformat(form.processo),
    };
    onSave(dadosNormalizados);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-overlay-blue flex items-center justify-center z-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white p-8 rounded-2xl shadow-2xl w-full max-w-3xl space-y-6"
      >
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-primary-dark hover:text-primary"
        >
          <X size={22} />
        </button>

        <h3 className="text-xl font-semibold text-primary-dark mb-4 text-center">Editar Dados do Submetido</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-text-base">
          <div className="col-span-2">
            <label className="block font-medium mb-1">Nome</label>
            <input className="w-full border border-border p-2 rounded" name="nome" value={form.nome} onChange={handleChange} />
          </div>
          <div>
            <label className="block font-medium mb-1">CPF</label>
            <input className="w-full border border-border p-2 rounded" name="cpf" value={form.cpf} onChange={handleChange} />
          </div>
          <div>
            <label className="block font-medium mb-1">RG</label>
            <input className="w-full border border-border p-2 rounded" name="rg" value={form.rg} onChange={handleChange} />
          </div>
          <div>
            <label className="block font-medium mb-1">Contato</label>
            <input className="w-full border border-border p-2 rounded" name="contato" value={formatContato(form.contato)} onChange={handleChange} />
          </div>
          <div className="col-span-2">
            <label className="block font-medium mb-1">Número do Processo</label>
            <input className="w-full border border-border p-2 rounded" name="processo" value={form.processo} onChange={handleChange} />
          </div>
          <div>
            <label className="block font-medium mb-1">Vara</label>
            <input className="w-full border border-border p-2 rounded" name="vara" value={form.vara} onChange={handleChange} />
          </div>
          <div>
            <label className="block font-medium mb-1">Comarca</label>
            <input className="w-full border border-border p-2 rounded" name="comarca" value={form.comarca} onChange={handleChange} />
          </div>
          <div>
            <label className="block font-medium mb-1">Data da Decisão</label>
            <input type="date" className="w-full border border-border p-2 rounded" name="decisao" value={form.decisao} onChange={handleChange} />
          </div>
          <div>
            <label className="block font-medium mb-1">Periodicidade</label>
            <select className="w-full border border-border p-2 rounded" name="periodicidade" value={form.periodicidade} onChange={handleChange}>
              <option value="mensal">Mensal</option>
              <option value="bimensal">Bimensal</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">Data Inicial</label>
            <input type="date" className="w-full border border-border p-2 rounded" name="dataComparecimentoInicial" value={form.dataComparecimentoInicial} onChange={handleChange} />
          </div>
          <div>
            <label className="block font-medium mb-1">Status</label>
            <select className="w-full border border-border p-2 rounded" name="status" value={form.status} onChange={handleChange}>
              <option value="em conformidade">Em Conformidade</option>
              <option value="inadimplente">Inadimplente</option>
            </select>
          </div>
          <div>
            <label className="block font-medium mb-1">1º Comparecimento</label>
            <input type="date" className="w-full border border-border p-2 rounded" name="primeiroComparecimento" value={form.primeiroComparecimento} onChange={handleChange} />
          </div>
          <div>
            <label className="block font-medium mb-1">Último Comparecimento</label>
            <input type="date" className="w-full border border-border p-2 rounded" name="ultimoComparecimento" value={form.ultimoComparecimento} onChange={handleChange} />
          </div>
          <div>
            <label className="block font-medium mb-1">Próximo Comparecimento</label>
            <input type="date" className="w-full border border-border p-2 rounded" name="proximoComparecimento" value={form.proximoComparecimento} onChange={handleChange} />
          </div>
        </div>

        <div className="pt-4 flex justify-between">
          <button
            type="button"
            onClick={onVoltar}
            className="bg-gray-200 text-gray-700 px-5 py-2 rounded hover:bg-gray-300"
          >
            Voltar
          </button>

          <button
            type="submit"
            className="bg-primary text-white px-5 py-2 rounded hover:bg-primary-dark"
          >
            Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
}
