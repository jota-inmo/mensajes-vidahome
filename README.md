# Centro de Mensajes de WhatsApp

Esta es una aplicación full-stack para crear, almacenar y enviar rápidamente mensajes de presentación predefinidos a través de WhatsApp. Utiliza React en el frontend, Firebase para la autenticación y base de datos, y Serverless Functions en Vercel como backend para comunicarse de forma segura con la API de Gemini y un CRM externo.

## Arquitectura

- **Frontend**: React con TypeScript.
- **Autenticación y Base de Datos**: Firebase (Autenticación de Google y Firestore).
- **Backend**: Serverless Functions (desplegadas en Vercel) escritas en TypeScript.
- **Generación de IA**: API de Google Gemini, llamada de forma segura desde el backend.
- **CRM**: Integración con un CRM externo a través de un backend seguro que actúa como proxy.

## Despliegue en Vercel

Sigue estos pasos para desplegar tu aplicación:

1.  **Sube tu código a un repositorio de GitHub.**
2.  **Crea un nuevo proyecto en Vercel.**
    -   Inicia sesión en tu cuenta de [Vercel](https://vercel.com).
    -   Haz clic en "Add New..." -> "Project".
    -   Importa el repositorio de GitHub que acabas de crear.
3.  **Configura el proyecto.**
    -   Vercel debería detectar automáticamente que es un proyecto sin un framework específico (`Other`). No se necesita ninguna configuración especial de build.
4.  **Configura las Variables de Entorno (¡MUY IMPORTANTE!).**
    -   Dentro de la configuración de tu proyecto en Vercel, ve a la pestaña "Settings" y luego a "Environment Variables".
    -   Añade las siguientes variables. Estas son las claves secretas que tu backend necesita para funcionar. **Nunca las compartas ni las escribas directamente en el código.**

| Nombre de la Variable  | Valor                                                                  | Descripción                                                   |
| ---------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------- |
| `API_KEY`              | `AIza...` (Tu clave de la API de Google Gemini)                        | Para que el generador de mensajes con IA funcione.            |
| `CRM_API_KEY`          | `AAF0...` (Tu clave de la API de tu CRM)                               | Para que la búsqueda de clientes y propiedades funcione.      |
| `CRM_API_BASE_URL`     | `https://api.tu-crm.com/v1` (La URL base de la API de tu CRM)          | La URL principal a la que el backend hará las peticiones.     |

5.  **Despliega.**
    -   Haz clic en el botón "Deploy". Vercel construirá y desplegará tu aplicación. Una vez finalizado, te proporcionará una URL pública.

¡Y eso es todo! Tu Centro de Mensajes estará online y funcionando de forma segura.
