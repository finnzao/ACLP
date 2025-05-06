'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import usuarios from '@/db/usuarios_mock.json';
import type { Comparecimento } from '@/types';

export default function JustificarSubmetidoPage() {
  const [justificativa, setJustificativa] = useState('');
  const [data, setData] = useState('');
  const [datasDisponiveis, setDatasDisponiveis] = useState<string[]>([]);
  const [processo, setProcesso] = useState<string>('');

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const proc = searchParams.get('processo') ?? '';
    setProcesso(proc);

    const datas = usuarios
      .filter((item: Comparecimento) => item.processo === proc)
      .map((item: Comparecimento) => item.ultimoComparecimento)
      .filter(Boolean);

    const unicas = Array.from(new Set(datas)); // evita datas duplicadas
    setDatasDisponiveis(unicas);
  }, [searchParams]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('Processo:', processo);
    console.log('Data:', data);
    console.log('Justificativa:', justificativa);

    // Aqui você pode enviar para uma API ou salvar em banco
    router.back();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white w-full max-w-2xl p-8 rounded-xl shadow-xl space-y-6"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-primary-dark">Justificar Ausência</h2>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-gray-500 hover:text-primary-dark"
          >
            <X size={20} />
          </button>
        </div>

        {processo && (
          <div className="text-sm text-gray-700">
            <strong>Processo:</strong> {processo}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="data" className="block text-sm font-medium text-gray-700">
              Data da Ocorrência
            </label>
            <select
              id="data"
              name="data"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              required
            >
              <option value="">Selecione uma data</option>
              {datasDisponiveis.map((d, i) => (
                <option key={i} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="justificativa" className="block text-sm font-medium text-gray-700">
              Justificativa
            </label>
            <textarea
              id="justificativa"
              name="justificativa"
              value={justificativa}
              onChange={(e) => setJustificativa(e.target.value)}
              rows={5}
              className="mt-1 block w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Descreva o motivo da ausência ou atraso"
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="bg-gray-200 text-gray-700 px-5 py-2 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="bg-primary text-white px-5 py-2 rounded hover:bg-primary-dark"
          >
            Enviar Justificativa
          </button>
        </div>
      </form>
    </div>
  );
}
