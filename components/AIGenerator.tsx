
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Textarea } from './ui/Textarea';
import { CloseIcon, SparklesIcon } from './ui/Icons';

interface AIGeneratorProps {
  onGenerate: (prompt: string) => Promise<string>;
  onContentGenerated: (content: string) => void;
  onClose: () => void;
}

const AIGenerator: React.FC<AIGeneratorProps> = ({
  onGenerate,
  onContentGenerated,
  onClose,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateClick = async () => {
    if (!prompt) {
        setError('Por favor, describe la situación para el mensaje.');
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await onGenerate(prompt);
      if (result.startsWith('Error:')) {
          setError(result);
      } else {
        onContentGenerated(result);
      }
    } catch (e) {
      setError('Ocurrió un error inesperado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg p-6 space-y-4 border border-slate-700" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <SparklesIcon className="h-6 w-6 text-emerald-400" />
            Generador de Mensajes con IA
          </h2>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:bg-slate-700">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div>
          <label htmlFor="ai-prompt" className="block text-sm font-medium text-slate-400 mb-1">
            Describe la situación:
          </label>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Ej: Un seguimiento amigable después de una entrevista de trabajo para un puesto de ingeniero de software."
            rows={3}
          />
          {error && <p className="text-red-400 text-sm mt-1">{error}</p>}
        </div>

        <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleGenerateClick} disabled={isLoading}>
              {isLoading ? 'Generando...' : 'Generar Contenido'}
            </Button>
        </div>
      </div>
    </div>
  );
};

export default AIGenerator;
