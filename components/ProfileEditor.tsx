
import React, { useState, useEffect } from 'react';
import { Agent } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { CloseIcon } from './ui/Icons';

interface ProfileEditorProps {
  agent: Agent;
  onClose: () => void;
  onUpdate: (data: { name: string, phone: string }) => Promise<void>;
}

const ProfileEditor: React.FC<ProfileEditorProps> = ({ agent, onClose, onUpdate }) => {
  const [name, setName] = useState(agent.name);
  const [phone, setPhone] = useState(agent.phone);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(agent.name);
    setPhone(agent.phone);
  }, [agent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    try {
      await onUpdate({ name, phone });
      onClose();
    } catch (err) {
      setError('No se pudo guardar el perfil. Inténtalo de nuevo.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700" onClick={e => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold text-white">Editar Perfil</h2>
            <button onClick={onClose} className="-mt-2 -mr-2 p-2 rounded-full text-slate-400 hover:bg-slate-700">
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="profile-name" className="block text-sm font-medium text-slate-400 mb-1">Nombre</label>
              <Input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <label htmlFor="profile-email" className="block text-sm font-medium text-slate-400 mb-1">Email</label>
              <Input id="profile-email" value={agent.email} disabled className="bg-slate-900/50 cursor-not-allowed" />
            </div>
            <div>
              <label htmlFor="profile-phone" className="block text-sm font-medium text-slate-400 mb-1">Teléfono</label>
              <Input id="profile-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Añade tu número de teléfono" />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditor;
