import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Scissors, Crown, User, ArrowLeft, Check, Sparkles, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { createUser, getUser } from '@/lib/storage';

type AuthMode = 'select' | 'login-client' | 'login-owner' | 'register-client' | 'login-admin';

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (role: 'client' | 'owner' | 'super_admin') => {
    setError('');
    if (!email || !password) { setError('Preencha todos os campos'); return; }
    const user = getUser(email);
    if (!user) { setError('Usuário não encontrado'); return; }
    if (user.role !== role) { setError(`Esta conta não é de ${role === 'client' ? 'cliente' : role === 'owner' ? 'proprietário' : 'administrador'}`); return; }
    if (login(email, password)) {
      navigate(role === 'client' ? '/client' : role === 'owner' ? '/owner' : '/admin');
    } else {
      setError('Senha incorreta');
    }
  };

  const handleRegisterClient = () => {
    setError('');
    if (!name || !email || !password) { setError('Preencha todos os campos'); return; }
    if (getUser(email)) { setError('Email já cadastrado'); return; }
    createUser({ email, password, name, role: 'client' });
    if (login(email, password)) navigate('/client');
  };

  const fadeVariant = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  const renderLoginForm = (role: 'client' | 'owner' | 'super_admin', title: string, subtitle: string) => (
    <motion.div key={mode} {...fadeVariant} transition={{ duration: 0.3 }} className="space-y-6">
      <button onClick={() => { setMode('select'); setError(''); }} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-serif font-bold text-foreground">{title}</h2>
        <p className="text-muted-foreground text-sm">{subtitle}</p>
      </div>
      <div className="glass-card p-6 space-y-4">
        {error && <p className="text-destructive text-sm text-center">{error}</p>}
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
        </div>
        <div>
          <label className="text-sm text-muted-foreground mb-1 block">Senha</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
        </div>
        <button onClick={() => handleLogin(role)}
          className="w-full gold-gradient text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 transition-all">
          Entrar
        </button>
        {role === 'client' && (
          <button onClick={() => { setMode('register-client'); setError(''); }}
            className="w-full text-center text-sm text-primary hover:underline transition-all">
            Não tem conta? Criar conta de cliente
          </button>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/3 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <AnimatePresence mode="wait">
          {mode === 'select' && (
            <motion.div key="select" {...fadeVariant} transition={{ duration: 0.3 }} className="space-y-8">
              <div className="text-center space-y-3">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
                  <Scissors className="w-12 h-12 text-primary mx-auto" />
                </motion.div>
                <h1 className="text-4xl font-serif font-bold">
                  <span className="gold-text">BarberPro</span>
                </h1>
                <p className="text-muted-foreground">Plataforma premium para barbearias</p>
              </div>

              <div className="space-y-3">
                <button onClick={() => setMode('login-client')} className="glass-card w-full p-5 flex items-center gap-4 hover:gold-border transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Sou Cliente</p>
                    <p className="text-sm text-muted-foreground">Agendar serviço</p>
                  </div>
                </button>

                <button onClick={() => setMode('login-owner')} className="glass-card w-full p-5 flex items-center gap-4 hover:gold-border transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Crown className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Sou Proprietário</p>
                    <p className="text-sm text-muted-foreground">Gerenciar minha barbearia</p>
                  </div>
                </button>

                <button onClick={() => setMode('login-admin')} className="glass-card w-full p-5 flex items-center gap-4 hover:gold-border transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-foreground">Administrador</p>
                    <p className="text-sm text-muted-foreground">Painel de controle da plataforma</p>
                  </div>
                </button>
              </div>
            </motion.div>
          )}

          {mode === 'login-client' && renderLoginForm('client', 'Entrar como Cliente', 'Acesse sua conta')}
          {mode === 'login-owner' && renderLoginForm('owner', 'Entrar como Proprietário', 'Acesse sua conta')}
          {mode === 'login-admin' && renderLoginForm('super_admin', 'Administrador', 'Acesso restrito à plataforma')}

          {mode === 'register-client' && (
            <motion.div key="register-client" {...fadeVariant} transition={{ duration: 0.3 }} className="space-y-6">
              <button onClick={() => { setMode('login-client'); setError(''); }} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-4 h-4" /> Voltar ao Login
              </button>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-serif font-bold text-foreground">Criar Conta</h2>
                <p className="text-muted-foreground text-sm">Cadastre-se para agendar serviços</p>
              </div>
              <div className="glass-card p-6 space-y-4">
                {error && <p className="text-destructive text-sm text-center">{error}</p>}
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Nome completo</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome"
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Senha</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
                </div>
                <button onClick={handleRegisterClient}
                  className="w-full gold-gradient text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 transition-all">
                  Criar Conta
                </button>
                <button onClick={() => { setMode('login-client'); setError(''); }}
                  className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-all">
                  Já tem conta? Entrar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Auth;
