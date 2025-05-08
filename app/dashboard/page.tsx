'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Em Conformidade', value: 72 },
  { name: 'Inadimplentes', value: 28 },
];

const COLORS = ['#7ED6A7', '#E57373'];

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-10">
      <h2 className="text-2xl font-semibold text-primary">Visão Geral</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Gráfico de Pizza */}
        <div className="bg-white p-6 rounded-xl shadow">
          <h3 className="text-lg font-medium text-primary-dark mb-4">Distribuição de Comparecimentos</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Resumo Rápido */}
        <div className="bg-white p-6 rounded-xl shadow space-y-4">
          <h3 className="text-lg font-medium text-primary-dark mb-4">Resumo dos Dados</h3>
          <div className="text-sm text-text-base space-y-2">
            <p><strong>Total de Submetidos:</strong> 125</p>
            <p><strong>Em Conformidade:</strong> 90</p>
            <p><strong>Inadimplentes:</strong> 35</p>
            <p><strong>Média de Atraso:</strong> 4 dias</p>
          </div>
        </div>
      </div>
    </div>
  );
}
