

export const generateMessage = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/generate-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error en la respuesta del servidor');
    }

    const data = await response.json();
    return data.text;
    
  } catch (error) {
    console.error("Error generando mensaje:", error);
    if (error instanceof Error) {
        return `Error: No se pudo generar el mensaje. ${error.message}`;
    }
    return "Error: Ocurrió un error desconocido al generar el mensaje.";
  }
};
