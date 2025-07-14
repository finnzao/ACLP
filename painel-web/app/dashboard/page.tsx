'use client';

import { useEffect, useState } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  LineChart,
  Line
} from 'recharts';
import { 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  TrendingUp,
  UserCheck,
  Clock,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Comparecimento } from '@/types';
import usuarios from '@/db/usuarios_mock.json';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface DashboardStats {
  total: number;
  emConformidade: number;
  inadimplentes: number;
  proximosPrazos: number;
  comparecimentosHoje: number;
  percentualConformidade: number;
}

interface TendenciaData {
  mes: string;
  conformidade: number;
  inadimplencia: number;
}

const COLORS = ['#7ED6A7', '#E57373', '#F6D365'];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    emConformidade: 0,
    inadimplentes: 0,
    proximosPrazos: 0,
    comparecimentosHoje: 0,
    percentualConformidade: 0
  });

  const [proximosComparecimentos, setProximosComparecimentos] = useState<Comparecimento[]>([]);
  const [alertasUrgentes, setAlertasUrgentes] = useState<Comparecimento[]>([]);
  const [tendenciaData, setTendenciaData] = useState<TendenciaData[]>([]);
  const [loading, setLoading] = useState(true);

  // Utilitários de data
  const dateUtils = {
    formatToBR: (date: string | Date): string => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return dateObj.toLocaleDateString('pt-BR');
    },
    getCurrentDate: (): string => {
      return new Date().toISOString().split('T')[0];
    },
    getDaysUntil: (date: string): number => {
      const today = new Date();
      const targetDate = new Date(date);
      const diffTime = targetDate.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },
    isToday: (date: string): boolean => {
      return date === dateUtils.getCurrentDate();
    },
    isOverdue: (date: string): boolean => {
      return dateUtils.getDaysUntil(date) < 0;
    }
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      
      // Simular carregamento de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      calcularEstatisticas();
      obterProximosComparecimentos();
      obterAlertasUrgentes();
      gerarDadosTendencia();
      
      setLoading(false);
    };

    loadDashboardData();
  }, []);

  const calcularEstatisticas = () => {
    const dados = usuarios.map(item => ({
      ...item,
      status: item.status as Comparecimento['status'],
      periodicidade: item.periodicidade as Comparecimento['periodicidade']
    }));

    const hoje = dateUtils.getCurrentDate();
    const proximaSemana = new Date();
    proximaSemana.setDate(proximaSemana.getDate() + 7);
    const proximaSemanaTxt = proximaSemana.toISOString().split('T')[0];

    const total = dados.length;
    const emConformidade = dados.filter(d => d.status === 'em conformidade').length;
    const inadimplentes = dados.filter(d => d.status === 'inadimplente').length;
    const proximosPrazos = dados.filter(d => 
      d.proximoComparecimento >= hoje && d.proximoComparecimento <= proximaSemanaTxt
    ).length;
    const comparecimentosHoje = dados.filter(d => dateUtils.isToday(d.proximoComparecimento)).length;
    const percentualConformidade = Math.round((emConformidade / total) * 100);

    setStats({
      total,
      emConformidade,
      inadimplentes,
      proximosPrazos,
      comparecimentosHoje,
      percentualConformidade
    });
  };

  const obterProximosComparecimentos = () => {
    const dados = usuarios.map(item => ({
      ...item,
      status: item.status as Comparecimento['status'],
      periodicidade: item.periodicidade as Comparecimento['periodicidade']
    }));

    const hoje = new Date();
    const proximos7Dias = new Date();
    proximos7Dias.setDate(hoje.getDate() + 7);

    const proximosComparecimentos = dados
      .filter(d => {
        const dataComparecimento = new Date(d.proximoComparecimento);
        return dataComparecimento >= hoje && dataComparecimento <= proximos7Dias;
      })
      .sort((a, b) => new Date(a.proximoComparecimento).getTime() - new Date(b.proximoComparecimento).getTime())
      .slice(0, 5);

    setProximosComparecimentos(proximosComparecimentos);
  };

  const obterAlertasUrgentes = () => {
    const dados = usuarios.map(item => ({
      ...item,
      status: item.status as Comparecimento['status'],
      periodicidade: item.periodicidade as Comparecimento['periodicidade']
    }));

    const hoje = new Date();
    const alertas = dados.filter(d => {
      const dataComparecimento = new Date(d.proximoComparecimento);
      return dataComparecimento < hoje && d.status === 'inadimplente';
    }).slice(0, 3);

    setAlertasUrgentes(alertas);
  };

  const gerarDadosTendencia = () => {
    // Simulação de dados de tendência dos últimos 6 meses
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const tendencia = meses.map(mes => ({
      mes,
      conformidade: Math.floor(Math.random() * 20) + 70, // 70-90%
      inadimplencia: Math.floor(Math.random() * 20) + 10  // 10-30%
    }));
    setTendenciaData(tendencia);
  };

  const data = [
    { name: 'Em Conformidade', value: stats.emConformidade },
    { name: 'Inadimplentes', value: stats.inadimplentes },
  ];

  const dataComparecimentos = [
    { name: 'Segunda', comparecimentos: 12 },
    { name: 'Terça', comparecimentos: 8 },
    { name: 'Quarta', comparecimentos: 15 },
    { name: 'Quinta', comparecimentos: 10 },
    { name: 'Sexta', comparecimentos: 18 },
  ];

  // Função para criar links com filtros
  const createFilterLink = (params: Record<string, string>) => {
    const searchParams = new URLSearchParams(params);
    return `/dashboard/geral?${searchParams.toString()}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark">Dashboard</h1>
          <p className="text-text-muted mt-1">Visão geral do sistema de comparecimentos</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-text-muted">Última atualização</p>
          <p className="font-semibold">{new Date().toLocaleString('pt-BR')}</p>
        </div>
      </div>

      {/* Alertas Urgentes */}
      {alertasUrgentes.length > 0 && (
        <Alert 
          type="error" 
          message={
            <div className="flex items-center justify-between w-full">
              <span>{alertasUrgentes.length} pessoa(s) com comparecimento em atraso necessitam atenção urgente!</span>
              <Link 
                href={createFilterLink({ urgencia: 'atrasados' })}
                className="ml-4 bg-white text-red-600 px-3 py-1 rounded font-medium hover:bg-red-50 transition-colors"
              >
                Ver Atrasados
              </Link>
            </div>
          } 
        />
      )}

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/dashboard/geral">
          <Card className="p-6 border-l-4 border-l-primary hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm font-medium">Total de Custodiados</p>
                <p className="text-3xl font-bold text-primary-dark">{stats.total}</p>
              </div>
              <div className="flex items-center">
                <Users className="w-12 h-12 text-primary opacity-80" />
                <ArrowRight className="w-4 h-4 text-primary ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href={createFilterLink({ status: 'em conformidade' })}>
          <Card className="p-6 border-l-4 border-l-secondary hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm font-medium">Em Conformidade</p>
                <p className="text-3xl font-bold text-secondary">{stats.emConformidade}</p>
                <p className="text-sm text-secondary font-medium">{stats.percentualConformidade}% do total</p>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-12 h-12 text-secondary opacity-80" />
                <ArrowRight className="w-4 h-4 text-secondary ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href={createFilterLink({ status: 'inadimplente' })}>
          <Card className="p-6 border-l-4 border-l-danger hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm font-medium">Inadimplentes</p>
                <p className="text-3xl font-bold text-danger">{stats.inadimplentes}</p>
                <p className="text-sm text-danger font-medium">{Math.round((stats.inadimplentes / stats.total) * 100)}% do total</p>
              </div>
              <div className="flex items-center">
                <AlertTriangle className="w-12 h-12 text-danger opacity-80" />
                <ArrowRight className="w-4 h-4 text-danger ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Card>
        </Link>

        <Link href={createFilterLink({ urgencia: 'hoje' })}>
          <Card className="p-6 border-l-4 border-l-warning hover:shadow-lg transition-all cursor-pointer group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-text-muted text-sm font-medium">Comparecimentos Hoje</p>
                <p className="text-3xl font-bold text-warning">{stats.comparecimentosHoje}</p>
                <p className="text-sm text-text-muted">Próximos 7 dias: {stats.proximosPrazos}</p>
              </div>
              <div className="flex items-center">
                <Calendar className="w-12 h-12 text-warning opacity-80" />
                <ArrowRight className="w-4 h-4 text-warning ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Pizza - Distribuição */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-primary-dark mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Distribuição de Status
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Gráfico de Barras - Comparecimentos por Dia */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-primary-dark mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Comparecimentos por Dia (Esta Semana)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dataComparecimentos}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="comparecimentos" fill="#4A90E2" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Tendência de Conformidade */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-primary-dark mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Tendência de Conformidade (Últimos 6 Meses)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tendenciaData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="conformidade" 
              stroke="#7ED6A7" 
              strokeWidth={3}
              name="Conformidade (%)"
            />
            <Line 
              type="monotone" 
              dataKey="inadimplencia" 
              stroke="#E57373" 
              strokeWidth={3}
              name="Inadimplência (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Seção de Ações e Próximos Comparecimentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Comparecimentos */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-primary-dark mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Próximos Comparecimentos (7 dias)
          </h3>
          <div className="space-y-3">
            {proximosComparecimentos.length > 0 ? (
              proximosComparecimentos.map((item, index) => {
                const diasRestantes = dateUtils.getDaysUntil(item.proximoComparecimento);
                const isHoje = dateUtils.isToday(item.proximoComparecimento);
                return (
                  <Link 
                    key={index}
                    href={createFilterLink({ busca: item.processo })}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:shadow-md transition-all cursor-pointer group">
                      <div className="flex-1">
                        <p className="font-medium text-text-base group-hover:text-primary transition-colors">{item.nome}</p>
                        <p className="text-sm text-text-muted">Processo: {item.processo}</p>
                        <p className="text-sm text-text-muted">Data: {dateUtils.formatToBR(item.proximoComparecimento)}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          isHoje ? 'bg-danger text-white' :
                          diasRestantes === 1 ? 'bg-warning text-text-base' :
                          'bg-secondary text-white'
                        }`}>
                          {isHoje ? 'Hoje' : 
                           diasRestantes === 1 ? 'Amanhã' : 
                           `${diasRestantes} dias`}
                        </span>
                        <ArrowRight className="w-4 h-4 text-primary mt-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                );
              })
            ) : (
              <p className="text-text-muted text-center py-4">Nenhum comparecimento nos próximos 7 dias</p>
            )}
          </div>
          <Link 
            href={createFilterLink({ urgencia: 'proximos' })}
            className="block w-full mt-4 bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition-colors text-center"
          >
            Ver Todos os Próximos Comparecimentos
          </Link>
        </Card>

        {/* Ações Rápidas */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-primary-dark mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Ações Rápidas
          </h3>
          <div className="space-y-3">
            <Link 
              href="/dashboard/registrar"
              className="block w-full bg-secondary text-white py-3 rounded-lg hover:bg-green-600 transition-colors text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-5 h-5" />
                Cadastrar Nova Pessoa
              </div>
            </Link>
            
            <Link 
              href="/dashboard/geral"
              className="block w-full bg-primary text-white py-3 rounded-lg hover:bg-primary-dark transition-colors text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <UserCheck className="w-5 h-5" />
                Validação de Presença
              </div>
            </Link>
            
            <Link 
              href={createFilterLink({ urgencia: 'hoje' })}
              className="block w-full bg-warning text-text-base py-3 rounded-lg hover:opacity-90 transition-colors text-center"
            >
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5" />
                Comparecimentos de Hoje ({stats.comparecimentosHoje})
              </div>
            </Link>
            
            <Link 
              href="/dashboard/configuracoes"
              className="block w-full bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors text-center"
            >
              Configurações do Sistema
            </Link>
          </div>

          {/* Alertas de Inadimplência */}
          {alertasUrgentes.length > 0 && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Atenção Urgente Necessária
              </h4>
              <div className="space-y-2">
                {alertasUrgentes.map((item, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium text-red-700">{item.nome}</p>
                    <p className="text-red-600">Comparecimento em atraso: {dateUtils.formatToBR(item.proximoComparecimento)}</p>
                  </div>
                ))}
              </div>
              <Link 
                href={createFilterLink({ urgencia: 'atrasados' })}
                className="block mt-3 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition-colors text-sm text-center"
              >
                Gerenciar Inadimplentes
              </Link>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}