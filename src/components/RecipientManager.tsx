
import React, { useState, useEffect } from 'react';
import { Recipient, Client } from '../types';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { TrashIcon, UserPlusIcon } from './ui/Icons';
import { fetchClients } from '../services/crmService';

interface RecipientManagerProps {
  recipients: Recipient[];
  selectedRecipientId: string | null;
  onAddRecipient: (recipient: Omit<Recipient, 'id' | 'createdAt'>) => void;
  onDeleteRecipient: (id: string) => void;
  onSelectRecipient: (id: string) => void;
  stepNumber: number;
}

const RecipientManager: React.FC<RecipientManagerProps> = ({
  recipients,
  selectedRecipientId,
  onAddRecipient,
  onDeleteRecipient,
  onSelectRecipient,
  stepNumber,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Client[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(() => {
      fetchClients(searchTerm).then(results => {
        setSearchResults(results);
        setIsSearching(false);
      });
    }, 500); // Debounce search

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && phone) {
      onAddRecipient({ name, phone });
      setName('');
      setPhone('');
      setIsAdding(false);
    }
  };

  const handleSelectSearchedClient = (client: Client) => {
    onAddRecipient({ name: client.name, phone: client.phone });
    setSearchTerm('');
    setSearchResults([]);
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Paso {stepNumber}: Elige un Destinatario</h2>
        {!isAdding && (
            <Button variant="ghost" size="sm" onClick={() => setIsAdding(true)}>
                <UserPlusIcon className="w-5 h-5 mr-2"/>
                Añadir Manual
            </Button>
        )}
      </div>

      {isAdding && (
         <form onSubmit={handleSubmit} className="space-y-4 p-4 mb-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <h3 className="font-semibold text-white">Añadir Nuevo Destinatario</h3>
            <div>
                <label htmlFor="recipient-name" className="block text-sm font-medium text-slate-400 mb-1">Nombre</label>
                <Input id="recipient-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Ana Pérez" required />
            </div>
            <div>
                <label htmlFor="recipient-phone" className="block text-sm font-medium text-slate-400 mb-1">Número de Teléfono</label>
                <Input id="recipient-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Ej: 34600123456" required />
            </div>
            <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
            </div>
        </form>
      )}

      <div className="space-y-4">
        <div>
          <label htmlFor="search-client" className="block text-sm font-medium text-slate-400 mb-1">Buscar Cliente en CRM</label>
          <Input 
            id="search-client"
            placeholder="Buscar por teléfono o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {(isSearching || searchResults.length > 0 || searchTerm.length >= 2) && (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2 border-t border-slate-700 pt-3">
              {isSearching && <p className="text-slate-500 text-center px-3 py-2">Buscando...</p>}
              {!isSearching && searchTerm && searchResults.length === 0 && <p className="text-slate-500 text-center px-3 py-2">No se encontraron clientes.</p>}
              {searchResults.map((client, index) => (
                  <div key={index} onClick={() => handleSelectSearchedClient(client)} className="flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 hover:bg-slate-700/50">
                      <div>
                          <p className="font-semibold text-emerald-300">{client.name}</p>
                          <p className="text-sm text-slate-400">{client.phone}</p>
                      </div>
                  </div>
              ))}
            </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <h3 className="text-md font-semibold text-slate-300 mb-2">Destinatarios Guardados</h3>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {recipients.length > 0 ? (
            recipients.map((recipient) => (
                <div
                key={recipient.id}
                onClick={() => onSelectRecipient(recipient.id)}
                className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                    selectedRecipientId === recipient.id
                    ? 'bg-emerald-500/20 ring-1 ring-emerald-400'
                    : 'hover:bg-slate-700/50'
                }`}
                >
                <div>
                    <p className="font-semibold text-white">{recipient.name}</p>
                    <p className="text-sm text-slate-400">{recipient.phone}</p>
                </div>
                <button
                    onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRecipient(recipient.id);
                    }}
                    className="p-1.5 rounded-full text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
                >
                    <TrashIcon className="h-4 w-4" />
                </button>
                </div>
            ))
            ) : (
            <p className="text-slate-500 text-center py-4">No hay destinatarios guardados.</p>
            )}
        </div>
      </div>
    </Card>
  );
};

export default RecipientManager;