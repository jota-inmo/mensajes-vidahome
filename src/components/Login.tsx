
import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { LogoIcon, MailIcon, LockClosedIcon } from './ui/Icons';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  const getErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/invalid-credential':
        return 'Credenciales incorrectas. Verifica tu email y contraseña.';
      case 'auth/wrong-password':
        return 'La contraseña es incorrecta. Por favor, inténtalo de nuevo.';
      case 'auth/invalid-email':
        return 'El formato del correo electrónico no es válido.';
      default:
        return 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetMessage(null);
    setResetError(null);
    setIsLoading(true);

    try {
      await auth.signInWithEmailAndPassword(email, password);
      // onAuthStateChanged in App.tsx will handle navigation
    } catch (err: any) {
      setError(getErrorMessage(err.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setError(null);
    setResetError(null);
    setResetMessage(null);

    if (!email) {
      setResetError("Por favor, introduce tu correo para restablecer la contraseña.");
      return;
    }

    setIsLoading(true);
    try {
      await auth.sendPasswordResetEmail(email);
      setResetMessage("Correo de restablecimiento enviado. Revisa tu bandeja de entrada.");
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        setResetError("No se encontró ningún usuario con ese correo electrónico.");
      } else {
        setResetError("Ocurrió un error al intentar enviar el correo.");
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-4 mb-8">
        <LogoIcon className="h-12 w-12 text-emerald-400"/>
        <h1 className="text-4xl font-bold text-white tracking-tight">Centro de Mensajes</h1>
      </div>
      <Card className="w-full max-w-sm">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          Acceso para Agentes
        </h2>
        <p className="text-slate-400 mb-6 text-center">
          Introduce tus credenciales para continuar.
        </p>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@vidahome.es"
              required
              className="pl-10"
              aria-label="Correo electrónico"
            />
          </div>
          <div className="relative">
            <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              className="pl-10"
              aria-label="Contraseña"
            />
          </div>

          {error && <p role="alert" className="text-red-400 text-sm text-center">{error}</p>}
          {resetError && <p role="alert" className="text-red-400 text-sm text-center">{resetError}</p>}
          {resetMessage && <p role="status" className="text-green-400 text-sm text-center">{resetMessage}</p>}
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Cargando...' : 'Iniciar Sesión'}
          </Button>
        </form>
        <div className="mt-4 text-center">
            <button
                type="button"
                onClick={handlePasswordReset}
                disabled={isLoading}
                className="text-sm text-emerald-400 hover:text-emerald-300 hover:underline focus:outline-none disabled:opacity-50"
            >
                ¿Has olvidado tu contraseña?
            </button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
