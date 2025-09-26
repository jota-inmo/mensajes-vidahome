
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }
    console.log("SEARCH-PROPERTIES: Function started.");

    const { searchTerm } = req.query;
    console.log(`SEARCH-PROPERTIES: Received searchTerm: "${searchTerm}"`);

    const CRM_API_BASE_URL = process.env.CRM_API_BASE_URL?.replace(/\/$/, '');
    const CRM_API_KEY = process.env.CRM_API_KEY;

    if (!CRM_API_KEY || !CRM_API_BASE_URL) {
      console.error("SEARCH-PROPERTIES: Missing CRM environment variables.");
      return res.status(500).json({ error: 'La configuración del CRM no está completa en el servidor.' });
    }
    console.log("SEARCH-PROPERTIES: CRM environment variables are present.");

    const query = typeof searchTerm === 'string' ? searchTerm.trim() : '';
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
    console.log(`SEARCH-PROPERTIES: Fetching from CRM URL: ${crmApiUrl}`);

    const crmResponse = await fetch(crmApiUrl, {
      method: 'GET',
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

    const data = await crmResponse.json();
    const propertiesArray = Array.isArray(data) ? data : (data ? [data] : []);

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

    console.log(`SEARCH-PROPERTIES: Successfully adapted ${adaptedProperties.length} properties. Sending response.`);
    res.status(200).json(adaptedProperties);

  } catch (error) {
    console.error('SEARCH-PROPERTIES: Unhandled error in handler:', error.message, error.stack);
    res.status(500).json({ error: 'Error interno del servidor al buscar propiedades.' });
  }
}
