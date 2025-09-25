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
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        console.log("SEARCH-CLIENTS: Function started.");

        const { searchTerm } = req.query;
        console.log(`SEARCH-CLIENTS: Received searchTerm: "${searchTerm}"`);
        
        const CRM_API_KEY = process.env.CRM_API_KEY;
        const CRM_API_BASE_URL = process.env.CRM_API_BASE_URL;

        if (!CRM_API_KEY || !CRM_API_BASE_URL) {
            console.error("SEARCH-CLIENTS: Missing CRM environment variables.");
            return res.status(500).json({ error: 'La configuración del CRM no está completa en el servidor.' });
        }
        
        console.log("SEARCH-CLIENTS: CRM environment variables are present.");

        if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.length < 2) {
            console.log("SEARCH-CLIENTS: Search term is too short, returning empty array.");
            return res.status(200).json([]);
        }

        let crmApiUrl = `${CRM_API_BASE_URL}/clientes/buscar/`;
        const params = new URLSearchParams();

        if (searchTerm.includes('@')) {
            params.append('email', searchTerm);
        } else if (/^[0-9+\-()\s]+$/.test(searchTerm)) {
            params.append('telefono', searchTerm.replace(/\s/g, ''));
        } else {
            // If it's not an email or a phone number, assume it's a name
            params.append('nombre', searchTerm);
        }
        
        crmApiUrl += `?${params.toString()}`;
        console.log(`SEARCH-CLIENTS: Fetching from CRM URL: ${crmApiUrl}`);

        const crmResponse = await fetch(crmApiUrl, {
            headers: {
                'Token': CRM_API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`SEARCH-CLIENTS: CRM response status: ${crmResponse.status}`);

        if (crmResponse.status === 404) {
            console.log("SEARCH-CLIENTS: CRM returned 404, returning empty array.");
            return res.status(200).json([]);
        }

        if (!crmResponse.ok) {
            const errorText = await crmResponse.text();
            console.error(`SEARCH-CLIENTS: CRM returned non-OK status. Status: ${crmResponse.status}. Body: ${errorText}`);
            return res.status(crmResponse.status).json({ error: 'Error al comunicarse con el CRM.' });
        }

        const data: InmovillaClient[] | InmovillaClient = await crmResponse.json();
        const dataArray = Array.isArray(data) ? data : [data];
        
        const adaptedClients = dataArray.map(c => ({
            name: `${c.nombre || ''} ${c.apellidos || ''}`.trim(),
            phone: c.telefono1 || c.telefono2 || '',
        }));
        
        console.log(`SEARCH-CLIENTS: Successfully adapted ${adaptedClients.length} clients. Sending response.`);
        res.status(200).json(adaptedClients);

    } catch (error: any) {
        console.error('SEARCH-CLIENTS: Unhandled error in handler:', error.message, error.stack);
        res.status(500).json({ error: 'Error interno del servidor al buscar clientes.' });
    }
}