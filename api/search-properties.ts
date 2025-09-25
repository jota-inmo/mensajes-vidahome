// Vercel Serverless Function: /api/search-properties.ts

// Define a type for the expected API response for a property for better mapping
interface ApinmoProperty {
    id: number;
    referencia: string;
    tipo_inmueble_text: string;
    zona_text: string;
    poblacion_text: string;
    fotos: { url_250: string; }[];
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
    
    const query = typeof searchTerm === 'string' ? searchTerm : '';

    // Correct endpoint for Apinmo API
    const crmApiUrl = `${CRM_API_BASE_URL}/inmuebles?q=${encodeURIComponent(query)}`;

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

        const data: ApinmoProperty[] = await crmResponse.json();
        
        // Adapt the Apinmo API response to the format the frontend expects (Property type)
        const adaptedProperties = data.map(p => ({
            id: String(p.id),
            ref: p.referencia,
            title: `${p.tipo_inmueble_text} en ${p.zona_text || p.poblacion_text}`,
            zone: p.zona_text || '',
            city: p.poblacion_text || '',
            link: `https://www.vidahome.es/inmuebles/${p.referencia}`, // Placeholder link, can be adjusted
            imageUrl: p.fotos && p.fotos.length > 0 ? p.fotos[0].url_250 : undefined,
        }));
        
        res.status(200).json(adaptedProperties);

    } catch (error) {
        console.error('Error al hacer fetch a la API de propiedades del CRM:', error);
        res.status(500).json({ error: 'Error interno del servidor al buscar propiedades.' });
    }
}
