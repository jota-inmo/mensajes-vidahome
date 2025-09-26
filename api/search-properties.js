
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

    const { searchTerm } = req.query;

    const CRM_API_BASE_URL = process.env.CRM_API_BASE_URL?.replace(/\/$/, '');
    const CRM_API_KEY = process.env.CRM_API_KEY;

    if (!CRM_API_KEY || !CRM_API_BASE_URL) {
      console.error("SEARCH-PROPERTIES: Missing CRM environment variables.");
      return res.status(500).json({ error: 'La configuración del CRM no está completa en el servidor.' });
    }
    
    const query = typeof searchTerm === 'string' ? searchTerm.trim() : '';
    const endpointPath = `${CRM_API_BASE_URL}/propiedades/`;
    let crmApiUrl;

    if (query) {
        const params = new URLSearchParams();
        // Según la indicación del usuario, la búsqueda siempre se realiza con el parámetro 'ref'.
        params.append('ref', query);
        crmApiUrl = `${endpointPath}?${params.toString()}`;
    } else {
        crmApiUrl = `${endpointPath}?listado`;
    }

    const crmResponse = await fetch(crmApiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Token': CRM_API_KEY
      }
    });

    if (crmResponse.status === 404) {
      return res.status(200).json([]);
    }

    if (!crmResponse.ok) {
      const errorText = await crmResponse.text();
      console.error(`SEARCH-PROPERTIES: CRM Error: ${crmResponse.status} - ${errorText}`);
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

    res.status(200).json(adaptedProperties);

  } catch (error) {
    console.error('SEARCH-PROPERTIES: Unhandled error in handler:', error.message);
    res.status(500).json({ error: 'Error interno del servidor al buscar propiedades.' });
  }
}
