// Vercel Serverless Function: /api/generate-message.ts
import { GoogleGenAI } from "@google/genai";

// Esta función se ejecutará en un entorno de Node.js en Vercel,
// donde 'process.env' puede acceder a las variables de entorno del proyecto.

export default async function handler(req: any, res: any) {
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
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Genera una plantilla de mensaje concisa y profesional para WhatsApp basada en la siguiente situación. El mensaje debe ser amigable, atractivo y listo para enviar. Incluye marcadores de posición como [Nombre] o [Empresa] donde sea apropiado. Escribe la respuesta en español. Situación: "${prompt}"`,
        config: {
          temperature: 0.7,
          topP: 0.95,
        }
    });
    
    res.status(200).json({ text: response.text });

  } catch (error) {
    console.error("Error en la función de backend para Gemini:", error);
    res.status(500).json({ error: 'Ocurrió un error al generar el mensaje desde el servidor.' });
  }
}
