'use client';

import { useEffect, useRef, useState } from 'react';
import usuarios from '@/db/usuarios_mock.json';
import type { Comparecimento } from '@/types';
import DetalhesAcusadoModal from '@/components/detalhesSubmetido';
import EditarAcusadoModal from '@/components/editarSubmetido';

export default function GeralPage() {
  const [filtro, setFiltro] = useState('');
  const [colunaOrdenacao, setColunaOrdenacao] = useState<keyof Comparecimento>('nome');
  const [ordem, setOrdem] = useState<'asc' | 'desc'>('asc');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [selecionado, setSelecionado] = useState<Comparecimento | null>(null);
  const [editando, setEditando] = useState<Comparecimento | null>(null);
  const [dados, setDados] = useState<Comparecimento[]>([]);
  const [page, setPage] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const novos = usuarios.slice((page - 1) * 20, page * 20).map((item) => ({
      ...item,
      periodicidade: item.periodicidade as Comparecimento['periodicidade'],
      status: item.status as Comparecimento['status'],
    }));
    setDados((prev) => [...prev, ...novos]);
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setPage((prev) => prev + 1);
      },
      { threshold: 1 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  function limparMascaraProcesso(processo: string) {
    return processo.replace(/\D/g, '');
  }

  function normalizarTexto(texto: string) {
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  function filtrarDados(data: Comparecimento[]): Comparecimento[] {
    const termo = filtro.trim();
    const temFiltroTexto = termo.length > 0;
    const primeiraLetra = termo[0];
    const buscandoProcesso = /\d/.test(primeiraLetra);

    const termoNormalizado = normalizarTexto(termo);
    const termoSomenteNumeros = limparMascaraProcesso(termo);

    return data.filter((item) => {
      const nomeNormalizado = normalizarTexto(item.nome);
      const processoSemMascara = limparMascaraProcesso(item.processo);

      const matchNome = nomeNormalizado.includes(termoNormalizado);
      const matchProcesso =
        item.processo.includes(termo) ||
        processoSemMascara.includes(termoSomenteNumeros);

      const matchTexto = !temFiltroTexto
        ? true
        : buscandoProcesso
          ? matchProcesso
          : matchNome;

      const dentroPeriodo = (!dataInicio || !dataFim)
        ? true
        : new Date(item.proximoComparecimento) >= new Date(dataInicio) &&
        new Date(item.proximoComparecimento) <= new Date(dataFim);

      return matchTexto && dentroPeriodo;
    });
  }

  function ordenarDados(data: Comparecimento[]): Comparecimento[] {
    return [...data].sort((a, b) => {
      const valA = a[colunaOrdenacao];
      const valB = b[colunaOrdenacao];

      if (colunaOrdenacao.includes('Comparecimento') || colunaOrdenacao === 'decisao') {
        const dateA = new Date(valA);
        const dateB = new Date(valB);
        return ordem === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      }

      return ordem === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }

  const dadosFiltrados = ordenarDados(filtrarDados(dados));

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <h2 className="text-h2 text-primary mb-4">Painel Geral de Comparecimentos</h2>

      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <input
          type="text"
          placeholder="Buscar por nome ou processo"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="flex-1 min-w-[200px] px-4 py-2 border border-border rounded bg-white"
        />

        <select
          className="px-3 py-2 border border-border rounded"
          value={colunaOrdenacao}
          onChange={(e) => setColunaOrdenacao(e.target.value as keyof Comparecimento)}
        >
          <option value="nome">Nome</option>
          <option value="status">Status</option>
          <option value="proximoComparecimento">Próximo Comparecimento</option>
          <option value="ultimoComparecimento">Último Comparecimento</option>
          <option value="decisao">Data da Decisão</option>
        </select>

        <select
          className="px-3 py-2 border border-border rounded"
          value={ordem}
          onChange={(e) => setOrdem(e.target.value as 'asc' | 'desc')}
        >
          <option value="asc">Crescente</option>
          <option value="desc">Decrescente</option>
        </select>

        <div className="flex flex-col">
          <label htmlFor="dataInicio" className="text-sm text-text-muted">Data Inicial</label>
          <input
            id="dataInicio"
            type="date"
            className="px-3 py-2 border border-border rounded"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="dataFim" className="text-sm text-text-muted">Data Final</label>
          <input
            id="dataFim"
            type="date"
            className="px-3 py-2 border border-border rounded"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-md">
        <table className="w-full min-w-[600px] table-auto border-collapse">
          <thead>
            <tr className="bg-primary text-white">
              <th className="p-2 text-left">Nome</th>
              <th className="p-2 text-left">Processo</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-center">Último</th>
              <th className="p-2 text-center">Próximo</th>
              <th className="p-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {dadosFiltrados.map((item, index) => (
              <tr key={index} className="border-b border-border hover:bg-background">
                <td className="p-2 font-medium text-text-base">{item.nome}</td>
                <td className="p-2 text-sm text-text-muted">{item.processo}</td>
                <td className={`p-2 text-sm font-semibold ${item.status === 'inadimplente' ? 'text-danger' : 'text-secondary'}`}>
                  {item.status === 'inadimplente' ? 'Inadimplente' : 'Em Conformidade'}
                </td>
                <td className="p-2 text-sm text-center">{item.ultimoComparecimento}</td>
                <td className="p-2 text-sm text-center">{item.proximoComparecimento}</td>
                <td className="p-2 text-sm text-center">
                  <button
                    onClick={() => setSelecionado(item)}
                    className="bg-primary text-white px-3 py-1 rounded hover:bg-primary-dark"
                  >
                    Visualizar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div ref={containerRef} className="h-8"></div>
      </div>

      {selecionado && (
        <DetalhesAcusadoModal
          dados={selecionado}
          onClose={() => setSelecionado(null)}
          onEditar={(dados) => {
            setSelecionado(null);
            setEditando(dados);
          }}
        />
      )}

      {editando && (
        <EditarAcusadoModal
          dados={editando}
          onClose={() => setEditando(null)}
          onVoltar={() => {
            setSelecionado(editando);
            setEditando(null);
          }}
          onSave={(novo: Comparecimento) => {
            setDados((prev) =>
              prev.map((item) => (item.processo === novo.processo ? novo : item))
            );
            setEditando(null);
          }}
        />
      )}

    </div>
  );
}
