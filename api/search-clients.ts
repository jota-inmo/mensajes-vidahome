// Vercel Serverless Function: /api/search-clients.ts

// Define a type for the expected API response for a client
interface ApinmoClient {
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
    // The base URL should be set to "https://procesos.apinmo.com/api/v1" in Vercel env vars
    const CRM_API_BASE_URL = process.env.CRM_API_BASE_URL;

    if (!CRM_API_KEY || !CRM_API_BASE_URL) {
        return res.status(500).json({ error: 'La configuración del CRM no está completa en el servidor.' });
    }

    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.length < 2) {
        return res.status(200).json([]);
    }

    // CORRECTED: Use the 'search' parameter for a general text search as per API documentation.
    const crmApiUrl = `${CRM_API_BASE_URL}/contactos?search=${encodeURIComponent(searchTerm)}`;

    try {
        const crmResponse = await fetch(crmApiUrl, {
            headers: {
                // Correct Authorization header for Apinmo API
                'Authorization': `token ${CRM_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!crmResponse.ok) {
            const errorText = await crmResponse.text();
            console.error(`Error del CRM: ${crmResponse.status} ${crmResponse.statusText}`, errorText);
            return res.status(crmResponse.status).json({ error: 'Error al comunicarse con el CRM.' });
        }

        const data: ApinmoClient[] = await crmResponse.json();
        
        // Adapt the Apinmo API response to the format the frontend expects (Client type)
        const adaptedClients = data.map(c => ({
            name: `${c.nombre || ''} ${c.apellidos || ''}`.trim(),
            phone: c.telefono1 || c.telefono2 || '',
        }));
        
        res.status(200).json(adaptedClients);

    } catch (error) {
        console.error('Error al hacer fetch a la API de clientes del CRM:', error);
        res.status(500).json({ error: 'Error interno del servidor al buscar clientes.' });
    }
}
