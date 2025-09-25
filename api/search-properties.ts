// Vercel Serverless Function: /api/search-properties.ts

// Define a type for the expected API response for a property for better mapping
// UPDATED: Based on new documentation for fetching a single property.
// Assuming some fields from the old response might still be present for a richer UI.
interface ApinmoProperty {
    cod_ofer: number;
    ref: string;
    tipo_inmueble_text?: string; // Optional for graceful degradation
    zona_text?: string;
    poblacion_text?: string;
    calle?: string;
    fotos?: { url_250: string; }[];
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
    
    const query = typeof searchTerm === 'string' ? searchTerm.trim() : '';

    if (!query) {
        // A lookup needs a term. If it's empty, we return empty results.
        return res.status(200).json([]);
    }

    // UPDATED: Use the '/propiedades/' endpoint and determine if searching by 'cod_ofer' or 'ref'.
    let crmApiUrl = `${CRM_API_BASE_URL}/propiedades/`;
    const params = new URLSearchParams();

    // A simple check: if it's all digits, assume it's cod_ofer. Otherwise, assume ref.
    if (/^\d+$/.test(query)) {
        params.append('cod_ofer', query);
    } else {
        params.append('ref', query);
    }
    crmApiUrl += `?${params.toString()}`;

    try {
        const crmResponse = await fetch(crmApiUrl, {
            headers: {
                'Authorization': `Token ${CRM_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        // The API for a single item might return 404 if not found. Treat as empty result.
        if (crmResponse.status === 404) {
             return res.status(200).json([]);
        }

        if (!crmResponse.ok) {
            const errorText = await crmResponse.text();
            console.error(`Error del CRM: ${crmResponse.status} ${crmResponse.statusText}`, errorText);
            return res.status(crmResponse.status).json({ error: 'Error al comunicarse con el CRM.' });
        }

        // The response is a single property object, not an array.
        const data: ApinmoProperty = await crmResponse.json();
        
        // Adapt the Apinmo API response to the format the frontend expects (Property type)
        const title = data.tipo_inmueble_text 
            ? `${data.tipo_inmueble_text} en ${data.zona_text || data.poblacion_text || data.calle || 'ubicación desconocida'}`
            : `Propiedad en ${data.calle || data.zona_text || data.poblacion_text || 'ubicación desconocida'}`;

        const adaptedProperty = {
            id: String(data.cod_ofer),
            ref: data.ref,
            title: title.replace(/ en ubicación desconocida$/, ''), // Clean up if no location found
            zone: data.zona_text || data.calle || '',
            city: data.poblacion_text || '',
            link: `https://www.vidahome.es/inmuebles/${data.ref}`,
            imageUrl: data.fotos && data.fotos.length > 0 ? data.fotos[0].url_250 : undefined,
        };
        
        // The frontend expects an array, so wrap the single result in an array.
        res.status(200).json([adaptedProperty]);

    } catch (error) {
        console.error('Error al hacer fetch a la API de propiedades del CRM:', error);
        res.status(500).json({ error: 'Error interno del servidor al buscar propiedades.' });
    }
}
