// Vercel Serverless Function: /api/search-properties.ts

interface InmovillaProperty {
    cod_ofer: number;
    ref: string;
    calle?: string;
    tipo_inmueble_text?: string; 
    zona_text?: string;
    poblacion_text?: string;
    fotos?: { url_250: string; }[];
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
            console.error("SEARCH-PROPERTIES: Missing CRM environment variables.");
            return res.status(500).json({ error: 'La configuración del CRM no está completa en el servidor.' });
        }

        const query = typeof searchTerm === 'string' ? searchTerm.trim() : '';
        
        // CORRECCIÓN: Usar el endpoint y la construcción de URL correctos
        const endpointPath = `${CRM_API_BASE_URL}/propiedades/`;
        const params = new URLSearchParams();

        if (query) {
            if (/^\d+$/.test(query)) {
                params.append('cod_ofer', query);
            } else {
                params.append('ref', query);
            }
        }
        
        const crmApiUrl = `${endpointPath}?${params.toString()}`;
        
        const crmResponse = await fetch(crmApiUrl, {
            method: 'GET',
            headers: {
                // CORRECCIÓN: Usar 'Token' en lugar de 'Authorization'
                'Token': CRM_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        if (crmResponse.status === 404) {
             return res.status(200).json([]); // No encontrado, devolver array vacío
        }

        if (!crmResponse.ok) {
            const errorText = await crmResponse.text();
            console.error(`SEARCH-PROPERTIES: CRM Error: ${crmResponse.status} - ${errorText}`);
            return res.status(crmResponse.status).json({ error: 'Error al comunicarse con el CRM.' });
        }

        const data = await crmResponse.json();
        
        const propertiesArray: InmovillaProperty[] = Array.isArray(data) ? data : (data ? [data] : []);

        const adaptedProperties = propertiesArray.map(p => {
            const title = p.tipo_inmueble_text 
                ? `${p.tipo_inmueble_text} en ${p.zona_text || p.poblacion_text || p.calle || 'ubicación desconocida'}`
                : `Propiedad en ${p.calle || p.zona_text || p.poblacion_text || 'ubicación desconocida'}`;

            return {
                id: String(p.cod_ofer),
                ref: p.ref,
                title: title.replace(/ en ubicación desconocida$/, ''),
                zone: p.zona_text || p.calle || '',
                city: p.poblacion_text || '',
                link: `https://www.vidahome.es/inmuebles/${p.ref}`,
                imageUrl: p.fotos && p.fotos.length > 0 ? p.fotos[0].url_250 : undefined,
            };
        });
        
        res.status(200).json(adaptedProperties);

    } catch (error: any) {
        console.error('SEARCH-PROPERTIES: Unhandled error:', error.message);
        res.status(500).json({ error: 'Error interno del servidor al buscar propiedades.' });
    }
}
