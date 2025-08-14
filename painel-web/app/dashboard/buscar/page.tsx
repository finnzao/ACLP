'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, User, FileText, ChevronRight, Loader2 } from 'lucide-react';
import usuarios from '@/db/usuarios_mock.json';
import type { Comparecimento } from '@/types';

export default function BuscarPage() {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<Comparecimento[]>([]);
  const [loading, setLoading] = useState(false);

  const handleBusca = () => {
    if (!busca.trim()) return;

    setLoading(true);
    
    // Simular busca
    setTimeout(() => {
      const termo = busca.toLowerCase().trim();
      const dados = usuarios.map(item => ({
        ...item,
        status: item.status as Comparecimento['status'],
        periodicidade: item.periodicidade as Comparecimento['periodicidade']
      }));

      const resultadosFiltrados = dados.filter(item => 
        item.nome.toLowerCase().includes(termo) ||
        item.processo.toLowerCase().includes(termo) ||
        item.cpf.includes(termo)
      );

      setResultados(resultadosFiltrados);
      setLoading(false);
    }, 500);
  };

  const handleConfirmarPresenca = (processo: string) => {
    router.push(`/dashboard/comparecimento/confirmar?processo=${encodeURIComponent(processo)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 md:p-6">
      <div className="max-w-full md:max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-primary-dark">
            Buscar Custodiado
          </h1>
          <p className="text-gray-600 mt-2">
            Pesquise por nome, CPF ou número do processo
          </p>
        </div>

        {/* Barra de Busca */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBusca()}
                placeholder="Digite sua busca..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base md:text-lg"
              />
            </div>
            <button
              onClick={handleBusca}
              disabled={loading || !busca.trim()}
              className="bg-primary text-white px-4 md:px-6 py-3 rounded-lg hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span className="hidden md:inline">Buscar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Resultados */}
        {resultados.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-semibold text-lg text-gray-700">
              {resultados.length} resultado(s) encontrado(s)
            </h2>

            {resultados.map((pessoa, index) => {
              const isToday = new Date(pessoa.proximoComparecimento).toDateString() === new Date().toDateString();
              const isOverdue = new Date(pessoa.proximoComparecimento) < new Date();

              return (
                <div
                  key={index}
                  className={`bg-white rounded-xl shadow-md p-4 transition-all hover:shadow-lg ${
                    isOverdue ? 'border-l-4 border-red-500' : ''
                  } ${isToday ? 'border-l-4 border-yellow-500' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {/* Informações da Pessoa */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{pessoa.nome}</h3>
                          <p className="text-sm text-gray-600">CPF: {pessoa.cpf}</p>
                        </div>
                      </div>

                      {/* Processo */}
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">Processo: {pessoa.processo}</span>
                      </div>

                      {/* Status */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          pessoa.status === 'em conformidade' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {pessoa.status === 'em conformidade' ? 'Em Conformidade' : 'Inadimplente'}
                        </span>

                        {isToday && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                            Comparecimento Hoje
                          </span>
                        )}

                        {isOverdue && !isToday && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            Em Atraso
                          </span>
                        )}
                      </div>

                      {/* Data do Próximo Comparecimento */}
                      <div className="mt-3 text-sm text-gray-600">
                        <span className="font-medium">Próximo comparecimento:</span>{' '}
                        {new Date(pessoa.proximoComparecimento).toLocaleDateString('pt-BR')}
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-gray-400 md:hidden" />
                  </div>

                  {/* Botão de Ação */}
                  <button
                    onClick={() => handleConfirmarPresenca(pessoa.processo)}
                    className={`w-full mt-4 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-all font-medium flex items-center justify-center gap-2 ${
                      (isToday || isOverdue) ? 'animate-pulse' : ''
                    }`}
                  >
                    Confirmar Comparecimento
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Estado Vazio */}
        {!loading && busca && resultados.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-700 mb-2">Nenhum resultado encontrado</h3>
            <p className="text-gray-500">
              Tente buscar por outro nome, CPF ou processo
            </p>
          </div>
        )}

        {/* Dicas para Mobile */}
        <div className="md:hidden bg-blue-50 rounded-xl p-4 mt-6">
          <h3 className="font-semibold text-blue-900 mb-2">Dicas de busca:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Digite o nome completo ou parcial</li>
            <li>• Use o CPF sem pontos ou traços</li>
            <li>• Digite o número do processo completo</li>
          </ul>
        </div>
      </div>
    </div>
  );
}