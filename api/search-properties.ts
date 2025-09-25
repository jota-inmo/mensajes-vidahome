// Vercel Serverless Function: /api/search-properties.ts

export default async function handler(req: any, res: any) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { searchTerm } = req.query;
    const CRM_API_KEY = process.env.CRM_API_KEY;
    const CRM_API_BASE_URL = process.env.CRM_API_BASE_URL;

    if (!CRM_API_KEY || !CRM_API_BASE_URL) {
        return res.status(500).json({ error: 'La configuración del CRM no está completa en el servidor.' });
    }
    
    // El término de búsqueda puede ser una cadena vacía para obtener todas las propiedades
    const query = typeof searchTerm === 'string' ? searchTerm : '';

    // Ejemplo de URL, ¡debes adaptarla a la documentación de tu CRM!
    const crmApiUrl = `${CRM_API_BASE_URL}/properties?q=${encodeURIComponent(query)}`;

    try {
        const crmResponse = await fetch(crmApiUrl, {
            headers: {
                'Authorization': `Bearer ${CRM_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!crmResponse.ok) {
            console.error(`Error del CRM: ${crmResponse.status} ${crmResponse.statusText}`);
            return res.status(crmResponse.status).json({ error: 'Error al comunicarse con el CRM.' });
        }

        const data = await crmResponse.json();
        
        // Aquí puedes adaptar la respuesta del CRM al formato que tu frontend espera, si es necesario.
        // Por ejemplo, si el CRM devuelve { "data": [...] }, podrías hacer:
        // const adaptedProperties = data.data.map(p => ({ id: p.id, ref: p.reference, title: p.name, ... }));
        // res.status(200).json(adaptedProperties);
        
        res.status(200).json(data);

    } catch (error) {
        console.error('Error al hacer fetch a la API de propiedades del CRM:', error);
        res.status(500).json({ error: 'Error interno del servidor al buscar propiedades.' });
    }
}
