
import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { LogoIcon, MailIcon, LockClosedIcon, UserCircleIcon } from './ui/Icons';

declare var firebase: any;

const Login: React.FC = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const getErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/user-not-found':
        return 'No se encontró ningún usuario con este correo electrónico.';
      case 'auth/wrong-password':
        return 'La contraseña es incorrecta. Por favor, inténtalo de nuevo.';
      case 'auth/invalid-email':
        return 'El formato del correo electrónico no es válido.';
      case 'auth/email-already-in-use':
        return 'Este correo electrónico ya está registrado. Por favor, inicia sesión.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/operation-not-allowed':
          return 'El inicio de sesión con correo y contraseña no está habilitado.';
      default:
        return 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    if (isLoginMode) {
      // --- LOGIN ---
      try {
        await auth.signInWithEmailAndPassword(email, password);
        // onAuthStateChanged in App.tsx will handle navigation
      } catch (err: any) {
        setError(getErrorMessage(err.code));
      }
    } else {
      // --- SIGN UP ---
      const requiredDomain = 'vidahome.es';
      if (!email.endsWith('@' + requiredDomain)) {
          setError(`El registro está restringido a cuentas de @${requiredDomain}.`);
          setIsLoading(false);
          return;
      }
      if (!name.trim()) {
        setError('El nombre es obligatorio para el registro.');
        setIsLoading(false);
        return;
      }
      try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        if (user) {
          // Create user profile in Firestore
          await db.collection('usuarios').doc(user.uid).set({
            nombre: name,
            email: user.email,
            telefono: '', // Phone number can be added later
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
          // onAuthStateChanged will handle the rest
        }
      } catch (err: any) {
        setError(getErrorMessage(err.code));
      }
    }
    setIsLoading(false);
  };
  
  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError(null);
    setEmail('');
    setPassword('');
    setName('');
  }

  return (
    <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-4 mb-8">
        <LogoIcon className="h-12 w-12 text-emerald-400"/>
        <h1 className="text-4xl font-bold text-white tracking-tight">Centro de Mensajes</h1>
      </div>
      <Card className="w-full max-w-sm">
        <h2 className="text-2xl font-bold text-white mb-2 text-center">
          {isLoginMode ? 'Acceso para Agentes' : 'Crear Nueva Cuenta'}
        </h2>
        <p className="text-slate-400 mb-6 text-center">
          {isLoginMode ? 'Introduce tus credenciales para continuar.' : 'Completa el formulario para registrarte.'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLoginMode && (
            <div className="relative">
              <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre completo"
                required
                className="pl-10"
                aria-label="Nombre completo"
              />
            </div>
          )}
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
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Cargando...' : (isLoginMode ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-slate-400">
            {isLoginMode ? '¿No tienes una cuenta? ' : '¿Ya tienes una cuenta? '}
          </span>
          <button onClick={toggleMode} className="font-semibold text-emerald-400 hover:text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-800 rounded-sm">
            {isLoginMode ? 'Regístrate' : 'Inicia Sesión'}
          </button>
        </div>

      </Card>
    </div>
  );
};

export default Login;
