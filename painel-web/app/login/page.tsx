'use client';

import { useState } from 'react';
import { FaUser, FaLock, FaChevronRight } from 'react-icons/fa';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { loginFicticio } from '@/lib/auth/authLogin';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Preencha todos os campos.');
      return;
    }
    try {
      const result = await loginFicticio(email, password);
      if (!result.success) {
        setError(result.message ?? 'Usuário ou senha inválidos.');
        return;
      } else {
        router.push('/dashboard');
      }
      setError('');
    }
    catch (e) {
      console.log(e)
      setError('Usuário ou senha inválidos.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-background to-primary-light font-sans px-4">
      <div className="relative w-[360px] h-[620px] bg-gradient-to-br from-primary-dark to-primary rounded-xl shadow-2xl overflow-hidden">

        <span className="absolute bg-primary h-[520px] w-[520px] top-[-50px] right-[120px] rounded-tr-[72px] rotate-45"></span>
        <span className="absolute bg-primary-light h-[220px] w-[220px] top-[-172px] right-0 rounded-[32px] rotate-45"></span>
        <span className="absolute bg-accent-blue h-[540px] w-[190px] top-[-24px] right-0 rounded-[32px] rotate-45"></span>
        <span className="absolute bg-primary h-[400px] w-[200px] top-[420px] right-[50px] rounded-[60px] rotate-45"></span>

        <div className="relative z-10 h-full flex flex-col justify-center items-center px-6">
          <div className="text-center mb-4">
            <h1 className="text-white text-2xl font-bold drop-shadow-sm">SCC</h1>
            <h3 className="text-white text-sm opacity-80 font-medium">Sistema de Controle de Comparecimento</h3>
            <div className="mt-2 flex justify-center">
              <Image
                src="/img/logo_poderJudiciariodaBahia_transparente.png"
                alt="Logo"
                width={70}
                height={70}
                className="object-contain"
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="w-full space-y-6 pt-4">
            {error && (
              <div className="bg-danger text-white px-4 py-2 text-sm rounded flex items-center gap-2 shadow">
                <span>❗</span>
                <span>{error}</span>
              </div>
            )}

            <div className="relative">
              <FaUser className="absolute top-3 left-3 text-primary-light" />
              <input
                type="email"
                placeholder="User name / Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-white bg-primary-dark/30 border-b-2 border-primary-light placeholder:text-white/70 font-semibold focus:outline-none focus:border-white transition"
              />
            </div>

            <div className="relative">
              <FaLock className="absolute top-3 left-3 text-primary-light" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-white bg-primary-dark/30 border-b-2 border-primary-light placeholder:text-white/70 font-semibold focus:outline-none focus:border-white transition"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-background-deep text-primary-dark font-bold py-3 px-4 rounded-full flex justify-between items-center shadow-md hover:bg-background transition"
            >
              <span className="uppercase text-sm tracking-wide">Login</span>
              <FaChevronRight className="text-primary" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
