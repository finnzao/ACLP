'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CadastroFacial from '@/components/CadastroFacial';
import { formatCPF, formatRG, formatProcesso, formatContato } from '@/lib/utils/formatting';
import { CheckCircle } from 'lucide-react';

interface FormData {
  nome: string;
  cpf: string;
  rg: string;
  contato: string;
  processo: string;
  vara: string;
  comarca: string;
  decisao: string;
  periodicidade: 'mensal' | 'bimensal';
  dataComparecimentoInicial: string;
}

export default function RegistrarPage() {
  const router = useRouter();
  const [etapa, setEtapa] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    cpf: '',
    rg: '',
    contato: '',
    processo: '',
    vara: '',
    comarca: '',
    decisao: '',
    periodicidade: 'mensal',
    dataComparecimentoInicial: ''
  });
  const [fotoSalva, setFotoSalva] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Aplicar formatação conforme o campo
    let formattedValue = value;
    if (name === 'cpf') formattedValue = formatCPF(value);
    else if (name === 'rg') formattedValue = formatRG(value);
    else if (name === 'processo') formattedValue = formatProcesso(value);
    else if (name === 'contato') formattedValue = formatContato(value);

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
  };

  const validarEtapa1 = () => {
    return formData.nome && formData.cpf && formData.rg && formData.contato;
  };

  const validarEtapa2 = () => {
    return formData.processo && formData.vara && formData.comarca && 
           formData.decisao && formData.dataComparecimentoInicial;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Aqui você salvaria os dados no banco
    console.log('Dados do formulário:', formData);
    console.log('Foto facial salva:', fotoSalva);
    
    // Redirecionar para a página geral
    router.push('/dashboard/geral');
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-primary-dark mb-8">
        Cadastrar Nova Pessoa
      </h1>

      {/* Indicador de Progresso */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex-1 h-2 rounded-full ${etapa >= 1 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className="w-4" />
          <div className={`flex-1 h-2 rounded-full ${etapa >= 2 ? 'bg-primary' : 'bg-gray-200'}`} />
          <div className="w-4" />
          <div className={`flex-1 h-2 rounded-full ${etapa >= 3 ? 'bg-primary' : 'bg-gray-200'}`} />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className={etapa === 1 ? 'font-bold text-primary' : 'text-gray-500'}>
            Dados Pessoais
          </span>
          <span className={etapa === 2 ? 'font-bold text-primary' : 'text-gray-500'}>
            Informações do Processo
          </span>
          <span className={etapa === 3 ? 'font-bold text-primary' : 'text-gray-500'}>
            Cadastro Facial
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Etapa 1: Dados Pessoais */}
        {etapa === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Dados Pessoais</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome Completo *
              </label>
              <input
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Digite o nome completo"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  CPF *
                </label>
                <input
                  type="text"
                  name="cpf"
                  value={formData.cpf}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="000.000.000-00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RG *
                </label>
                <input
                  type="text"
                  name="rg"
                  value={formData.rg}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="00.000.000-0"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefone de Contato *
              </label>
              <input
                type="text"
                name="contato"
                value={formData.contato}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="(00) 00000-0000"
                required
              />
            </div>

            <div className="flex justify-end mt-6">
              <button
                type="button"
                onClick={() => validarEtapa1() && setEtapa(2)}
                disabled={!validarEtapa1()}
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
              >
                Próxima Etapa
              </button>
            </div>
          </div>
        )}

        {/* Etapa 2: Informações do Processo */}
        {etapa === 2 && (
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">Informações do Processo</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número do Processo *
              </label>
              <input
                type="text"
                name="processo"
                value={formData.processo}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="0000000-00.0000.0.00.0000"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vara *
                </label>
                <input
                  type="text"
                  name="vara"
                  value={formData.vara}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ex: 1ª Vara Criminal"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comarca *
                </label>
                <input
                  type="text"
                  name="comarca"
                  value={formData.comarca}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ex: Salvador"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data da Decisão *
                </label>
                <input
                  type="date"
                  name="decisao"
                  value={formData.decisao}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Periodicidade *
                </label>
                <select
                  name="periodicidade"
                  value={formData.periodicidade}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="mensal">Mensal</option>
                  <option value="bimensal">Bimensal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data do 1º Comparecimento *
                </label>
                <input
                  type="date"
                  name="dataComparecimentoInicial"
                  value={formData.dataComparecimentoInicial}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={() => setEtapa(1)}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => validarEtapa2() && setEtapa(3)}
                disabled={!validarEtapa2()}
                className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
              >
                Próxima Etapa
              </button>
            </div>
          </div>
        )}

        {/* Etapa 3: Cadastro Facial */}
        {etapa === 3 && (
          <div className="space-y-6">
            <CadastroFacial
              processo={formData.processo}
              onSuccess={() => setFotoSalva(true)}
              onError={(error) => console.error('Erro no cadastro facial:', error)}
            />

            {fotoSalva && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-green-800 font-medium">
                  Foto facial cadastrada com sucesso!
                </span>
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setEtapa(2)}
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-all"
              >
                Voltar
              </button>
              <button
                type="submit"
                disabled={!fotoSalva}
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-semibold"
              >
                Finalizar Cadastro
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}