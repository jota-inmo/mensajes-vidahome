// Vercel Serverless Function: /api/search-properties.ts

// Define a type for the expected API response for a property for better mapping
interface InmovillaProperty {
    cod_ofer: number;
    ref: string;
    calle?: string;
    // These fields are not directly in the GET response but might be inferred or from other endpoints.
    // We keep the logic from before for a richer UI, but it will handle missing fields gracefully.
    tipo_inmueble_text?: string; 
    zona_text?: string;
    poblacion_text?: string;
    fotos?: { url_250: string; }[];
}

export default async function handler(req: any, res: any) {
    try {
        if (req.method !== 'GET') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }
        
        console.log("SEARCH-PROPERTIES: Function started.");

        const { searchTerm } = req.query;
        console.log(`SEARCH-PROPERTIES: Received searchTerm: "${searchTerm}"`);

        const CRM_API_KEY = process.env.CRM_API_KEY;
        const CRM_API_BASE_URL = process.env.CRM_API_BASE_URL;

        if (!CRM_API_KEY || !CRM_API_BASE_URL) {
            console.error("SEARCH-PROPERTIES: Missing CRM environment variables.");
            return res.status(500).json({ error: 'La configuración del CRM no está completa en el servidor.' });
        }
        
        console.log("SEARCH-PROPERTIES: CRM environment variables are present.");

        const query = typeof searchTerm === 'string' ? searchTerm.trim() : '';

        if (!query) {
            console.log("SEARCH-PROPERTIES: Search term is empty, returning empty array.");
            return res.status(200).json([]);
        }

        let crmApiUrl = `${CRM_API_BASE_URL}/propiedades/`;
        const params = new URLSearchParams();

        // If it's all digits, assume it's cod_ofer. Otherwise, assume ref.
        if (/^\d+$/.test(query)) {
            params.append('cod_ofer', query);
        } else {
            params.append('ref', query);
        }
        crmApiUrl += `?${params.toString()}`;
        console.log(`SEARCH-PROPERTIES: Fetching from CRM URL: ${crmApiUrl}`);

        const crmResponse = await fetch(crmApiUrl, {
            headers: {
                'Token': CRM_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log(`SEARCH-PROPERTIES: CRM response status: ${crmResponse.status}`);

        if (crmResponse.status === 404) {
             console.log("SEARCH-PROPERTIES: CRM returned 404, returning empty array.");
             return res.status(200).json([]);
        }

        if (!crmResponse.ok) {
            const errorText = await crmResponse.text();
            console.error(`SEARCH-PROPERTIES: CRM returned non-OK status. Status: ${crmResponse.status}. Body: ${errorText}`);
            return res.status(crmResponse.status).json({ error: 'Error al comunicarse con el CRM.' });
        }

        const data: InmovillaProperty = await crmResponse.json();
        
        // Adapt the Inmovilla API response to the format the frontend expects (Property type)
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
        
        console.log("SEARCH-PROPERTIES: Successfully adapted property. Sending response.");
        res.status(200).json([adaptedProperty]);

    } catch (error: any) {
        console.error('SEARCH-PROPERTIES: Unhandled error in handler:', error.message, error.stack);
        res.status(500).json({ error: 'Error interno del servidor al buscar propiedades.' });
    }
}
