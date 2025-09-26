
import { GoogleGenerativeAI } from "@google/generative-ai";

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'El prompt es obligatorio.' });
  }
  
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'La clave de API de Gemini no está configurada en el servidor.' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(`Genera una plantilla de mensaje concisa y profesional para WhatsApp basada en la siguiente situación. El mensaje debe ser amigable, atractivo y listo para enviar. Incluye marcadores de posición como [nombre] o [empresa] donde sea apropiado. Escribe la respuesta en español. Situación: "${prompt}"`);
    
    const response = await result.response;
    const text = response.text();
    
    res.status(200).json({ text });

  } catch (error) {
    console.error("Error en la función de backend para Gemini:", error);
    res.status(500).json({ error: 'Ocurrió un error al generar el mensaje desde el servidor.' });
  }
}
