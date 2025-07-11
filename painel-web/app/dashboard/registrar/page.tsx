'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatCPF, formatRG, formatProcesso, formatContato } from '@/lib/utils/formatting';
import { CheckCircle, User, FileText, Calendar } from 'lucide-react';

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
  const [salvando, setSalvando] = useState(false);

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
    setSalvando(true);
    
    try {
      // Simular salvamento no backend
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aqui você salvaria os dados no banco
      console.log('Dados do formulário:', formData);
      
      // Ir para etapa de sucesso
      setEtapa(3);
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar os dados. Tente novamente.');
    } finally {
      setSalvando(false);
    }
  };

  const resetarFormulario = () => {
    setFormData({
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
    setEtapa(1);
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
            Finalização
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Etapa 1: Dados Pessoais */}
        {etapa === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold">Dados Pessoais</h2>
            </div>
            
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
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-semibold">Informações do Processo</h2>
            </div>
            
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
                type="submit"
                disabled={!validarEtapa2() || salvando}
                className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-semibold flex items-center gap-2"
              >
                {salvando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Finalizar Cadastro
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Etapa 3: Sucesso */}
        {etapa === 3 && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-green-700 mb-4">
              ✅ Cadastro Realizado com Sucesso!
            </h2>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800 font-medium">
                A pessoa foi cadastrada no sistema com sucesso.
              </p>
              <p className="text-green-700 text-sm mt-2">
                <strong>{formData.nome}</strong> - Processo: {formData.processo}
              </p>
              <p className="text-green-600 text-sm mt-1">
                Próximo comparecimento: {new Date(formData.dataComparecimentoInicial).toLocaleDateString('pt-BR')}
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                A partir de agora, você pode gerenciar os comparecimentos desta pessoa através do painel geral.
              </p>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={resetarFormulario}
                  className="bg-secondary text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-all"
                >
                  Cadastrar Outra Pessoa
                </button>
                
                <button
                  onClick={() => router.push('/dashboard/geral')}
                  className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary-dark transition-all"
                >
                  Ir para o Painel Geral
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}