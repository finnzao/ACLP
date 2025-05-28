'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

const tabs = ['Perfil do Usuário', 'Notificações'] as const;
type Tab = typeof tabs[number];

interface NotificacaoConfig {
  email: string;
  dias: number;
}

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Perfil do Usuário');
  const [nomeUsuario, setNomeUsuario] = useState('João Silva');
  const [emailUsuario, setEmailUsuario] = useState('joao@email.com');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [novoEmail, setNovoEmail] = useState('');
  const [novoDias, setNovoDias] = useState<number>(3);
  const [editando, setEditando] = useState<number | null>(null);
  const [notificacoes, setNotificacoes] = useState<NotificacaoConfig[]>([
    { email: 'supervisao@email.com', dias: 3 }
  ]);

  function adicionarEmail() {
    if (novoEmail && !notificacoes.some(n => n.email === novoEmail)) {
      setNotificacoes((prev) => [...prev, { email: novoEmail, dias: novoDias }]);
      setNovoEmail('');
      setNovoDias(3);
    }
  }

  function removerEmail(index: number) {
    setNotificacoes((prev) => prev.filter((_, i) => i !== index));
  }

  function iniciarEdicao(index: number) {
    setEditando(index);
    setNovoEmail(notificacoes[index].email);
    setNovoDias(notificacoes[index].dias);
  }

  function salvarEdicao(index: number) {
    if (novoEmail.trim()) {
      setNotificacoes((prev) =>
        prev.map((item, i) => (i === index ? { email: novoEmail, dias: novoDias } : item))
      );
      setEditando(null);
      setNovoEmail('');
      setNovoDias(3);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-semibold text-primary mb-6">Configurações</h2>

      {/* Abas */}
      <div className="flex gap-4 mb-8 border-b border-border pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-1 rounded-full text-sm font-medium transition',
              activeTab === tab
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Conteúdo da aba */}
      {activeTab === 'Perfil do Usuário' && (
        <section className="bg-white p-6 rounded-xl shadow space-y-4">
          <h3 className="text-lg font-medium text-primary-dark">Perfil do Usuário</h3>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-4 py-2"
            placeholder="Nome de usuário"
            value={nomeUsuario}
            onChange={(e) => setNomeUsuario(e.target.value)}
          />
          <input
            type="email"
            className="w-full border border-gray-300 rounded px-4 py-2"
            placeholder="E-mail"
            value={emailUsuario}
            onChange={(e) => setEmailUsuario(e.target.value)}
          />
          <hr />
          <input
            type="password"
            className="w-full border border-gray-300 rounded px-4 py-2"
            placeholder="Nova senha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
          />
          <input
            type="password"
            className="w-full border border-gray-300 rounded px-4 py-2"
            placeholder="Confirmar nova senha"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
          />
          <button className="bg-primary text-white px-5 py-2 rounded hover:bg-primary-dark">
            Atualizar Perfil
          </button>
        </section>
      )}

      {activeTab === 'Notificações' && (
        <section className="bg-white p-6 rounded-xl shadow space-y-4">
          <h3 className="text-lg font-medium text-primary-dark">Notificações de Prazo</h3>

          <label className="block font-medium mb-1">Adicionar nova notificação</label>
          <div className="flex gap-2 mb-4">
            <input
              type="email"
              className="flex-1 border border-gray-300 rounded px-3 py-2"
              value={novoEmail}
              onChange={(e) => setNovoEmail(e.target.value)}
              placeholder="E-mail"
            />
            <input
              type="number"
              className="w-28 border border-gray-300 rounded px-3 py-2"
              value={novoDias}
              onChange={(e) => setNovoDias(Number(e.target.value))}
              placeholder="Dias"
              min={1}
            />
            <button
              type="button"
              onClick={adicionarEmail}
              className="bg-secondary text-white px-4 rounded hover:bg-green-600"
            >
              Adicionar
            </button>
          </div>

          <ul className="space-y-2 text-sm">
            {notificacoes.map((item, i) => (
              <li key={i} className="flex justify-between items-center border border-gray-200 px-3 py-2 rounded">
                {editando === i ? (
                  <>
                    <input
                      value={novoEmail}
                      onChange={(e) => setNovoEmail(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-2 py-1 mr-2"
                    />
                    <input
                      type="number"
                      value={novoDias}
                      onChange={(e) => setNovoDias(Number(e.target.value))}
                      className="w-20 border border-gray-300 rounded px-2 py-1 mr-2"
                    />
                    <button
                      onClick={() => salvarEdicao(i)}
                      className="text-green-600 text-sm"
                    >
                      Salvar
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1">{item.email} <span className="text-gray-500">(após {item.dias} dias)</span></span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => iniciarEdicao(i)}
                        className="text-blue-600 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => removerEmail(i)}
                        className="text-red-500 text-sm"
                      >
                        Remover
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>

          <button className="bg-primary text-white px-5 py-2 rounded hover:bg-primary-dark">
            Salvar Notificações
          </button>
        </section>
      )}
    </div>
  );
}
