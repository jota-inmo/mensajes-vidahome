
import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { LogoIcon, GoogleIcon } from './ui/Icons';

declare var firebase: any;

const Login: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsLoading(true);
    const provider = new firebase.auth.GoogleAuthProvider();
    const requiredDomain = 'vidahome.es'; // Restringe el acceso a este dominio
    provider.setCustomParameters({
      hd: requiredDomain
    });

    try {
      const result = await auth.signInWithPopup(provider);
      const user = result.user;

      if (user && user.email && user.email.endsWith('@' + requiredDomain)) {
        // El usuario pertenece al dominio correcto, verificamos si su perfil existe
        const userDocRef = db.collection('usuarios').doc(user.uid);
        const doc = await userDocRef.get();

        if (!doc.exists) {
          // El perfil no existe, lo creamos
          await userDocRef.set({
            nombre: user.displayName || 'Agente',
            email: user.email,
            telefono: user.phoneNumber || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
          });
        }
      } else {
        // Si el usuario logró iniciar sesión con otra cuenta, lo deslogueamos
        await auth.signOut();
        setError(`Acceso restringido. Utiliza una cuenta de @${requiredDomain}.`);
      }
    } catch (err: any) {
      // Gestión de errores mejorada
      switch (err.code) {
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
          // El usuario cerró la ventana, no es necesario mostrar un error.
          break;
        case 'auth/popup-blocked-by-browser':
          setError('El navegador bloqueó la ventana de inicio de sesión. Por favor, permite las ventanas emergentes para este sitio.');
          break;
        case 'auth/unauthorized-domain':
            setError('Este dominio no está autorizado para iniciar sesión. Contacta al administrador.');
            break;
        default:
          setError('Ocurrió un error al iniciar sesión. Por favor, inténtalo de nuevo.');
          console.error("Error de inicio de sesión:", err);
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
      <Card className="w-full max-w-md text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Acceso para Agentes
        </h2>
        <p className="text-slate-400 mb-8">Inicia sesión con tu cuenta de Google de la empresa.</p>
        
        <div className="space-y-4">
            <Button 
                onClick={handleGoogleSignIn} 
                className="w-full !bg-white hover:!bg-slate-200 !text-slate-800"
                disabled={isLoading}
            >
                <GoogleIcon className="w-5 h-5 mr-3" />
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión con Google'}
            </Button>
            {error && <p className="text-red-400 text-sm pt-2">{error}</p>}
        </div>

        <div className="mt-6 text-xs text-slate-500 space-y-1">
            <p>Asegúrate de usar tu cuenta @vidahome.es.</p>
            <p>Si la ventana no aparece, revisa que tu navegador no esté bloqueando las ventanas emergentes.</p>
        </div>

      </Card>
    </div>
  );
};

export default Login;
