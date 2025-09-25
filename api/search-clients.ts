// Vercel Serverless Function: /api/search-clients.ts

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

    if (!searchTerm || typeof searchTerm !== 'string' || searchTerm.length < 2) {
        return res.status(200).json([]);
    }

    // Ejemplo de URL, ¡debes adaptarla a la documentación de tu CRM!
    const crmApiUrl = `${CRM_API_BASE_URL}/clients?search=${encodeURIComponent(searchTerm)}`;

    try {
        const crmResponse = await fetch(crmApiUrl, {
            headers: {
                'Authorization': `Bearer ${CRM_API_KEY}`, // Forma común de autenticación
                'Content-Type': 'application/json'
            }
        });

        if (!crmResponse.ok) {
            console.error(`Error del CRM: ${crmResponse.status} ${crmResponse.statusText}`);
            return res.status(crmResponse.status).json({ error: 'Error al comunicarse con el CRM.' });
        }

        const data = await crmResponse.json();
        
        // Aquí puedes adaptar la respuesta del CRM al formato que tu frontend espera, si es necesario.
        // Por ejemplo, si el CRM devuelve { results: [...] }, podrías hacer:
        // res.status(200).json(data.results);
        
        res.status(200).json(data);

    } catch (error) {
        console.error('Error al hacer fetch a la API de clientes del CRM:', error);
        res.status(500).json({ error: 'Error interno del servidor al buscar clientes.' });
    }
}
