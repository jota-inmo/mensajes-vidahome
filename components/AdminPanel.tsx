import React from 'react';
import { Agent } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { EditIcon, UserCircleIcon } from './ui/Icons';

interface AdminPanelProps {
  agents: Agent[];
  onEditAgent: (agent: Agent) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ agents, onEditAgent }) => {
  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Panel de Administración: Gestionar Agentes</h2>
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
  );
};

// FIX: Removed redundant local declaration of UserCircleIcon as it is already correctly imported from ./ui/Icons. This resolves the conflict.

export default AdminPanel;
