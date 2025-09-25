import { Property, Client } from '../types';

// ===================================================================================
// NOTA IMPORTANTE
// ===================================================================================
// Estas funciones ahora llaman a nuestro propio backend seguro (Serverless Functions),
// que a su vez llama a la API del CRM. Esto protege la clave de API del CRM.
// El backend se encuentra en el directorio /api.
// ===================================================================================

export const fetchProperties = async (searchTerm: string = ''): Promise<Property[]> => {
  try {
    const response = await fetch(`/api/search-properties?searchTerm=${encodeURIComponent(searchTerm)}`);
    if (!response.ok) {
      throw new Error('Error al obtener las propiedades del CRM');
    }
    const data: Property[] = await response.json();
    // Añadimos una URL de imagen de placeholder si no viene del API
    return data.map(p => ({ ...p, imageUrl: p.imageUrl || `https://picsum.photos/seed/${p.id}/100/80` }));
  } catch (error) {
    console.error('Error en fetchProperties:', error);
    return []; // Devuelve un array vacío en caso de error para no romper la UI
  }
};

export const fetchClients = async (searchTerm: string): Promise<Client[]> => {
  if (!searchTerm || searchTerm.trim().length < 2) {
    return [];
  }
  try {
    const response = await fetch(`/api/search-clients?searchTerm=${encodeURIComponent(searchTerm)}`);
    if (!response.ok) {
      throw new Error('Error al obtener los clientes del CRM');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en fetchClients:', error);
    return []; // Devuelve un array vacío en caso de error
  }
};