import React, { useState } from 'react';
import { Agent } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { EditIcon, UserCircleIcon, UserPlusIcon, CloseIcon, MailIcon, LockClosedIcon } from './ui/Icons';

// Modal para crear un nuevo agente
const CreateAgentModal: React.FC<{
  onClose: () => void;
  onCreateAgent: (data: { name: string, email: string, password: string }) => Promise<string | null>;
}> = ({ onClose, onCreateAgent }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        const result = await onCreateAgent({ name, email, password });
        if (result) {
            setError(result);
        } else {
            onClose(); // Cerrar el modal si la creación fue exitosa
        }
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md border border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-xl font-semibold text-white">Crear Nuevo Agente</h2>
                        <button onClick={onClose} className="-mt-2 -mr-2 p-2 rounded-full text-slate-400 hover:bg-slate-700">
                            <CloseIcon className="h-5 w-5" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                          <UserCircleIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <Input id="new-agent-name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nombre completo" className="pl-10"/>
                        </div>
                        <div className="relative">
                          <MailIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <Input id="new-agent-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="correo@vidahome.es" className="pl-10"/>
                        </div>
                        <div className="relative">
                          <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                          <Input id="new-agent-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Contraseña (mín. 6 caracteres)" className="pl-10"/>
                        </div>
                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? 'Creando...' : 'Crear Agente'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};


interface AdminPanelProps {
  agents: Agent[];
  onEditAgent: (agent: Agent) => void;
  onCreateAgent: (data: { name: string, email: string, password: string }) => Promise<string | null>;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ agents, onEditAgent, onCreateAgent }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  return (
    <>
        <Card>
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-white">Panel de Administración: Gestionar Agentes</h2>
            <Button onClick={() => setIsCreateModalOpen(true)}>
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Crear Nuevo Agente
            </Button>
        </div>
        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {agents.length > 0 ? (
            agents.map((agent) => (
                <div
                key={agent.id}
                className="flex justify-between items-center p-3 rounded-lg bg-slate-700/50"
                >
                <div className="flex items-center gap-3">
                    <UserCircleIcon className="h-8 w-8 text-slate-400" />
                    <div>
                        <p className="font-semibold text-white">{agent.name}</p>
                        <p className="text-sm text-slate-400">{agent.email} - {agent.phone || 'Sin teléfono'}</p>
                    </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => onEditAgent(agent)}>
                    <EditIcon className="h-4 w-4 mr-1"/> Editar Perfil
                </Button>
                </div>
            ))
            ) : (
            <p className="text-slate-500 text-center py-4">No hay agentes para mostrar.</p>
            )}
        </div>
        </Card>
        {isCreateModalOpen && (
            <CreateAgentModal 
                onClose={() => setIsCreateModalOpen(false)}
                onCreateAgent={onCreateAgent}
            />
      )}
    </>
  );
};

export default AdminPanel;