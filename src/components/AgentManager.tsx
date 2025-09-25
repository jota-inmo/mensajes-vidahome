
import React from 'react';
import { Agent } from '../types';
import { Card } from './ui/Card';
import { UserPlusIcon } from './ui/Icons'; // Re-using an icon, could be a more specific one

interface AgentManagerProps {
  agents: Agent[];
  selectedAgentId: string | null;
  onSelectAgent: (agentId: string) => void;
  stepNumber: number;
}

const AgentManager: React.FC<AgentManagerProps> = ({
  agents,
  selectedAgentId,
  onSelectAgent,
  stepNumber,
}) => {
  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Paso {stepNumber}: Elige un Agente</h2>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {agents.length > 0 ? (
          agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => onSelectAgent(agent.id)}
              className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                selectedAgentId === agent.id
                  ? 'bg-emerald-500/20 ring-1 ring-emerald-400'
                  : 'hover:bg-slate-700/50'
              }`}
            >
              <div>
                <p className="font-semibold text-white">{agent.name}</p>
                <p className="text-sm text-slate-400">{agent.phone}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-slate-500 text-center py-4">No hay agentes registrados.</p>
        )}
      </div>
    </Card>
  );
};

export default AgentManager;