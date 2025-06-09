// app/configuracoes/page.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { NotificacaoConfig } from '@/types';
import { InputGroup } from '@/components/InputGroup';
import { NotificacaoItem } from '@/components/NotificacaoItem';
import { formatEmail, isValidEmail } from '@/lib/utils/formatting';

const tabs = ['Perfil do Usuário', 'Notificações'] as const;
type Tab = typeof tabs[number];



export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('Perfil do Usuário');
  const [nomeUsuario, setNomeUsuario] = useState('João Silva');
  const [emailUsuario, setEmailUsuario] = useState('joao@tjba.com.br');
  const [erroEmailUsuario, setErroEmailUsuario] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

  const [novoEmail, setNovoEmail] = useState('');
  const [novoDias, setNovoDias] = useState<number>(3);
  const [erroEmail, setErroEmail] = useState('');

  const [editando, setEditando] = useState<number | null>(null);
  const [editandoEmail, setEditandoEmail] = useState('');
  const [editandoDias, setEditandoDias] = useState<number>(3);
  const [erroEdicao, setErroEdicao] = useState('');

  const [notificacoes, setNotificacoes] = useState<NotificacaoConfig[]>([
    { email: 'supervisao@email.com', dias: 3 }
  ]);

  function adicionarEmail() {
    const emailFormatado = formatEmail(novoEmail);
    if (!isValidEmail(emailFormatado)) {
      setErroEmail('E-mail inválido.');
      return;
    }
    setErroEmail('');

    if (!notificacoes.some(n => n.email === emailFormatado)) {
      setNotificacoes(prev => [...prev, { email: emailFormatado, dias: novoDias }]);
      setNovoEmail('');
      setNovoDias(3);
    } else {
      setErroEmail('E-mail já adicionado.');
    }
  }

  function removerEmail(index: number) {
    setNotificacoes(prev => prev.filter((_, i) => i !== index));
    if (editando === index) {
      setEditando(null);
    }
  }

  function iniciarEdicao(index: number) {
    setEditando(index);
    setEditandoEmail(notificacoes[index].email);
    setEditandoDias(notificacoes[index].dias);
    setErroEdicao('');
  }

  function salvarEdicao(index: number) {
    const emailFormatado = formatEmail(editandoEmail);
    if (!isValidEmail(emailFormatado)) {
      setErroEdicao('E-mail inválido.');
      return;
    }
    setErroEdicao('');

    setNotificacoes(prev =>
      prev.map((item, i) => (i === index ? { email: emailFormatado, dias: editandoDias } : item))
    );
    setEditando(null);
    setEditandoEmail('');
    setEditandoDias(3);
  }

  function handleEmailUsuarioChange(e: React.ChangeEvent<HTMLInputElement>) {
    const email = e.target.value;
    setEmailUsuario(email);
    setErroEmailUsuario(isValidEmail(email) ? '' : 'E-mail inválido.');
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h2 className="text-2xl font-semibold text-primary mb-6">Configurações</h2>

      <div className="flex gap-4 mb-8 border-b border-border pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'px-4 py-1 rounded-full text-sm font-medium transition',
              activeTab === tab ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Perfil do Usuário' && (
        <section className="bg-white p-6 rounded-xl shadow space-y-4">
          <h3 className="text-lg font-medium text-primary-dark">Perfil do Usuário</h3>
          <InputGroup value={nomeUsuario} onChange={e => setNomeUsuario(e.target.value)} placeholder="Nome de usuário" />
          <InputGroup
            type="email"
            value={emailUsuario}
            onChange={handleEmailUsuarioChange}
            placeholder="E-mail"
            error={erroEmailUsuario}
          />
          <hr />
          <InputGroup type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} placeholder="Nova senha" />
          <InputGroup type="password" value={confirmarSenha} onChange={e => setConfirmarSenha(e.target.value)} placeholder="Confirmar nova senha" />
          <button className="bg-primary text-white px-5 py-2 rounded hover:bg-primary-dark">Atualizar Perfil</button>
        </section>
      )}

      {activeTab === 'Notificações' && (
        <section className="bg-white p-6 rounded-xl shadow space-y-4">
          <h3 className="text-lg font-medium text-primary-dark">Notificações de Prazo</h3>

          <label className="block font-medium mb-1">Adicionar nova notificação</label>
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <InputGroup
                type="email"
                value={novoEmail}
                onChange={(e) => setNovoEmail(e.target.value)}
                placeholder="E-mail"
                error={erroEmail}
              />
            </div>
            <InputGroup
              type="number"
              value={novoDias}
              onChange={(e) => setNovoDias(Number(e.target.value))}
              placeholder="Dias"
              className="w-28"
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
              <NotificacaoItem
                key={i}
                email={item.email}
                dias={item.dias}
                editando={editando === i}
                editandoEmail={editandoEmail}
                editandoDias={editandoDias}
                error={editando === i ? erroEdicao : ''}
                onChangeEmail={(e) => setEditandoEmail(e.target.value)}
                onChangeDias={(e) => setEditandoDias(Number(e.target.value))}
                onSalvar={() => salvarEdicao(i)}
                onEditar={() => iniciarEdicao(i)}
                onRemover={() => removerEmail(i)}
              />
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
