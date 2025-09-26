// Vercel Serverless Function: /api/search-clients.ts

// Define a type for the expected API response for a client
interface InmovillaClient {
    nombre: string;
    apellidos: string;
    telefono1: string;
    telefono2: string;
    email?: string;
}

export default async function handler(req: any, res: any) {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*'); // O un origen específico
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Manejar solicitud pre-vuelo (preflight) de CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { searchTerm } = req.query;
        
        const CRM_API_BASE_URL = process.env.CRM_API_BASE_URL?.replace(/\/$/, '');
        const CRM_API_KEY = process.env.CRM_API_KEY;

        if (!CRM_API_KEY || !CRM_API_BASE_URL) {
            console.error("SEARCH-CLIENTS: Missing CRM environment variables.");
            return res.status(500).json({ error: 'La configuración del CRM no está completa en el servidor.' });
        }

        if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.length < 2) {
            return res.status(200).json([]);
        }

        const params = new URLSearchParams();
        const cleanedSearchTerm = searchTerm.trim();

        // Determinar si el término de búsqueda es un email, un teléfono o un nombre
        if (cleanedSearchTerm.includes('@')) {
            params.append('email', cleanedSearchTerm);
        } else if (/^[0-9+\-()\s]+$/.test(cleanedSearchTerm)) {
            params.append('telefono', cleanedSearchTerm.replace(/\s/g, ''));
        } else {
            // Si no es un email ni un teléfono, asumimos que es un nombre
            params.append('nombre', cleanedSearchTerm);
        }
        
        const crmApiUrl = `${CRM_API_BASE_URL}/clientes/buscar/?${params.toString()}`;

        const crmResponse = await fetch(crmApiUrl, {
            method: 'GET',
            headers: {
                'Token': CRM_API_KEY,
                'Content-Type': 'application/json'
            },
        });

        if (crmResponse.status === 404) {
            return res.status(200).json([]); // No encontrado, devolver array vacío
        }

        if (!crmResponse.ok) {
            const errorText = await crmResponse.text();
            console.error(`SEARCH-CLIENTS: CRM Error: ${crmResponse.status} - ${errorText}`);
            return res.status(crmResponse.status).json({ error: 'Error al comunicarse con el CRM.' });
        }

        const data: InmovillaClient[] | InmovillaClient = await crmResponse.json();
        const dataArray = Array.isArray(data) ? data : (data ? [data] : []);
        
        const adaptedClients = dataArray.map(c => ({
            name: `${c.nombre || ''} ${c.apellidos || ''}`.trim(),
            phone: c.telefono1 || c.telefono2 || '',
        }));
        
        res.status(200).json(adaptedClients);

    } catch (error: any) {
        console.error('SEARCH-CLIENTS: Unhandled error:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al buscar clientes.' });
    }
}