import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    if (!email || !password) { setError('Preencha todos os campos'); return; }
    setIsLoading(true);
    const result = await login(email, password);
    setIsLoading(false);
    if (!result.success) {
      setError(result.error === 'Email not confirmed' ? 'Confirme seu email antes de entrar.' : 'Credenciais inválidas');
      return;
    }

    if (result.user?.role !== 'super_admin') {
      setError('Este usuário não possui acesso de administrador.');
    }
    // Navigation handled by App.tsx after auth state changes
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/3 blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="space-y-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="text-center space-y-3">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}>
              <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto">
                <Shield className="w-8 h-8 text-primary-foreground" />
              </div>
            </motion.div>
            <h2 className="text-2xl font-serif font-bold text-foreground">Administrador</h2>
            <p className="text-muted-foreground text-sm">Acesso restrito à plataforma</p>
          </div>
          <div className="glass-card p-6 space-y-4">
            {error && <p className="text-destructive text-sm text-center">{error}</p>}
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@platform.com"
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">Senha</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all" />
            </div>
            <button onClick={handleLogin} disabled={isLoading}
              className="w-full gold-gradient text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90 transition-all disabled:opacity-50">
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;
