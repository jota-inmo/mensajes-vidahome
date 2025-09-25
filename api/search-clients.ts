// Vercel Serverless Function: /api/search-clients.ts

// Define a type for the expected API response for a client
interface InmovillaClient {
    nombre: string;
    apellidos: string;
    telefono1: string;
    telefono2: string;
    // Other fields can be added here if needed
}

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { searchTerm } = req.query;
    const CRM_API_KEY = process.env.CRM_API_KEY;
    // The base URL should be set to "https://procesos.inmovilla.com/api/v1" in Vercel env vars
    const CRM_API_BASE_URL = process.env.CRM_API_BASE_URL;

    if (!CRM_API_KEY || !CRM_API_BASE_URL) {
        return res.status(500).json({ error: 'La configuración del CRM no está completa en el servidor.' });
    }

    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.length < 2) {
        return res.status(200).json([]);
    }

    let crmApiUrl = `${CRM_API_BASE_URL}/clientes/buscar/`;
    const params = new URLSearchParams();

    // Determine if the search term is a phone number or an email.
    if (searchTerm.includes('@')) {
        params.append('email', searchTerm);
    } else if (/^[0-9+\-()\s]+$/.test(searchTerm)) {
        params.append('telefono', searchTerm.replace(/\s/g, ''));
    } else {
        // The documented API endpoint doesn't support searching by name.
        return res.status(200).json([]);
    }
    
    crmApiUrl += `?${params.toString()}`;

    try {
        const crmResponse = await fetch(crmApiUrl, {
            headers: {
                'Token': CRM_API_KEY, // CORRECTED: Use 'Token' header as per documentation
                'Content-Type': 'application/json'
            }
        });

        if (crmResponse.status === 404) {
            return res.status(200).json([]);
        }

        if (!crmResponse.ok) {
            const errorText = await crmResponse.text();
            console.error(`Error del CRM: ${crmResponse.status} ${crmResponse.statusText}`, errorText);
            return res.status(crmResponse.status).json({ error: 'Error al comunicarse con el CRM.' });
        }

        // Handle cases where API might return a single object or an array
        const data: InmovillaClient[] | InmovillaClient = await crmResponse.json();
        const dataArray = Array.isArray(data) ? data : [data];
        
        // Adapt the Inmovilla API response to the format the frontend expects (Client type)
        const adaptedClients = dataArray.map(c => ({
            name: `${c.nombre || ''} ${c.apellidos || ''}`.trim(),
            phone: c.telefono1 || c.telefono2 || '',
        }));
        
        res.status(200).json(adaptedClients);

    } catch (error) {
        console.error('Error al hacer fetch a la API de clientes del CRM:', error);
        res.status(500).json({ error: 'Error interno del servidor al buscar clientes.' });
    }
}
