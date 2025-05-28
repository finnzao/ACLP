'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

function formatCpf(value: string): string {
  const numeric = value.replace(/\D/g, '').slice(0, 11); 
  return numeric
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function formatRg(value: string) {
  return value
    .replace(/\D/g, '')
    .slice(0, 9)
    .replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
}

function formatContato(value: string) {
  return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
}

function formatProcesso(value: string) {
  return value.replace(/\D/g, '').replace(/(\d{7})(\d{2})(\d{4})(\d)(\d{2})(\d{4})/, '$1-$2.$3.$4.$5.$6').slice(0, 25);
}

export default function CriarComparecimento() {
  const [form, setForm] = useState({
    nome: '',
    cpf: '',
    rg: '',
    contato: '',
    processo: '',
    vara: '',
    comarca: '',
    decisao: '',
    periodicidade: 'mensal',
    dataComparecimentoInicial: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cpf') formattedValue = formatCpf(value);
    if (name === 'rg') formattedValue = formatRg(value);
    if (name === 'contato') formattedValue = formatContato(value);
    if (name === 'processo') formattedValue = formatProcesso(value);

    setForm({ ...form, [name]: formattedValue });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log('Dados enviados:', form);
    // TODO: enviar para API
  }

  return (
    <div className="max-w-2xl mx-auto bg-card-bg p-6 rounded-lg shadow-md">
      <h2 className="text-h2 text-primary mb-4">Cadastro</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nome Completo" name="nome" value={form.nome} onChange={handleChange} required />
        <Input label="CPF" name="cpf" value={form.cpf} onChange={handleChange} required />
        <Input label="RG" name="rg" value={form.rg} onChange={handleChange} />
        <Input label="Contato" name="contato" value={form.contato} onChange={handleChange} />
        <Input label="Nº do Processo" name="processo" value={form.processo} onChange={handleChange} required />
        <Input label="Vara" name="vara" value={form.vara} onChange={handleChange} />
        <Input label="Comarca" name="comarca" value={form.comarca} onChange={handleChange} />
        <Input label="Data da Decisão" name="decisao" type="date" value={form.decisao} onChange={handleChange} />
        <div>
          <label className="block text-sm font-medium text-text-muted">Periodicidade</label>
          <select
            name="periodicidade"
            value={form.periodicidade}
            onChange={handleChange}
            className="mt-1 block w-full border border-border rounded px-3 py-2 bg-white text-text-base"
          >
            <option value="mensal">Mensal</option>
            <option value="bimensal">Bimensal</option>
          </select>
        </div>
        <Input
          label="Data Inicial de Comparecimento"
          name="dataComparecimentoInicial"
          type="date"
          value={form.dataComparecimentoInicial}
          onChange={handleChange}
          required
        />
        <Button type="submit" className="mt-4">Salvar Cadastro</Button>
      </form>
    </div>
  );
}
