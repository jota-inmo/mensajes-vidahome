
import React, { useState, useEffect } from 'react';
import { Property } from '../types';
import { Card } from './ui/Card';
import { BuildingOfficeIcon } from './ui/Icons';
import { Input } from './ui/Input';
import { fetchProperties } from '../services/crmService';

interface PropertyManagerProps {
  selectedPropertyId: string | null;
  onSelectProperty: (property: Property | null) => void;
  stepNumber: number;
}

const PropertyManager: React.FC<PropertyManagerProps> = ({
  selectedPropertyId,
  onSelectProperty,
  stepNumber,
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // A specific lookup doesn't need a loading state in the same way, but good for debounce
    setIsLoading(true); 
    // Debounce the search to avoid excessive API calls
    const handler = setTimeout(() => {
      // Don't search if the term is too short or empty
      if (searchTerm.trim() === '') {
        setProperties([]);
        setIsLoading(false);
        return;
      }
      fetchProperties(searchTerm).then(fetchedProperties => {
        setProperties(fetchedProperties);
        setIsLoading(false);
      });
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const handleSelect = (property: Property) => {
    // If the same property is clicked again, deselect it
    if (selectedPropertyId === property.id) {
        onSelectProperty(null);
    } else {
        onSelectProperty(property);
    }
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-white">Paso {stepNumber}: Elige una Propiedad</h2>
      </div>
      
      <Input
        placeholder="Buscar por referencia o código..."
        className="mb-4"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        aria-label="Buscar propiedad por referencia o código"
      />

      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {isLoading && searchTerm.trim() ? (
            <p className="text-slate-500 text-center py-4">Buscando propiedad...</p>
        ) : properties.length > 0 ? (
          properties.map((property) => (
            <div
              key={property.id}
              onClick={() => handleSelect(property)}
              className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                selectedPropertyId === property.id
                  ? 'bg-emerald-500/20 ring-1 ring-emerald-400'
                  : 'hover:bg-slate-700/50'
              }`}
            >
              <div className="flex items-center gap-4">
                {property.imageUrl ? (
                    <img src={property.imageUrl} alt={property.title} className="w-16 h-12 object-cover rounded-md bg-slate-700" />
                ) : (
                    <div className="w-16 h-12 flex items-center justify-center bg-slate-700 rounded-md">
                        <BuildingOfficeIcon className="h-6 w-6 text-slate-500" />
                    </div>
                )}
                <div>
                    <p className="font-semibold text-white">{property.title}</p>
                    <p className="text-sm text-slate-400">{property.ref}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          searchTerm.trim() && <p className="text-slate-500 text-center py-4">No se encontró la propiedad.</p>
        )}
      </div>
    </Card>
  );
};

export default PropertyManager;
