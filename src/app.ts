import express, { Application, Request, Response } from 'express';
import routes from './routes';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import slowDown from 'express-slow-down';

// Configuración de variables de entorno

dotenv.config(); // Carga las variables de entorno desde un archivo .env para que puedan ser usadas en la aplicación.

const app: Application = express(); // Inicializa la aplicación Express.
const port = process.env.PORT || 3000; // Define el puerto en el que correrá el servidor, utilizando la variable de entorno o el puerto 3000 por defecto.

// Configuración de seguridad con Helmet
app.use(helmet()); // Aplica configuraciones de seguridad recomendadas para Express, como ocultar cabeceras que podrían revelar información del servidor.

// Configuración de limitador de tasa de solicitudes (Rate Limiter)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos de ventana de tiempo.
  max: 150, // Limita cada IP a 150 solicitudes por ventana de tiempo.
  standardHeaders: true, // Informa a los clientes sobre el estado del límite en las cabeceras estándar.
  legacyHeaders: false, // Deshabilita las cabeceras X-Ratelimit, ya que son obsoletas.
});
app.use(limiter); // Aplica el limitador de tasa a todas las solicitudes para proteger contra ataques de denegación de servicio (DoS).


// Configuración de ralentización de tráfico (Slow Down)
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos de ventana de tiempo.
  delayAfter: 50, // Comienza a retrasar respuestas después de 50 solicitudes.
  delayMs: (used, req) => {
    const delayAfter = req.slowDown.limit;
    return (used - delayAfter) * 500; // Retrasa las solicitudes siguientes en 500 ms por cada solicitud adicional.
  },
});
app.use(speedLimiter); // Aplica el limitador de velocidad a todas las solicitudes para ralentizar el tráfico malicioso o abusivo.


// Configuración de CORS
const allowedOrigins = [process.env.URL_FRONTEND, process.env.URL_LOCAL]; // Lista de orígenes permitidos para realizar solicitudes al servidor.

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Permite la solicitud si el origen está en la lista de permitidos.
    } else {
      callback(new Error('No permitido por CORS')); // Rechaza la solicitud si el origen no está permitido.
    }
  },
  allowedHeaders: ['Content-Type', 'Authorization'], // Cabeceras permitidas en las solicitudes.
}));

app.use(express.json()); // Habilita el middleware para analizar solicitudes entrantes con datos JSON.


// Configuración de multer para manejo de archivos
const upload = multer(); // Inicializa multer para manejar la subida de archivos en las rutas donde sea necesario.

app.use('/api/v1', upload.any(), routes); // Aplica el middleware de multer y las rutas personalizadas a todas las solicitudes que comiencen con '/api/v1'.


// Configuración del motor de plantillas EJS
app.set('views', path.join(__dirname, 'views'));// Define el directorio donde están las vistas (templates) de la aplicación.
app.set('view engine', 'ejs');// Establece EJS como el motor de plantillas para renderizar vistas.


// Ruta para la página principal
app.get('/', (req: Request, res: Response) => {
  res.render('index', { title: 'Página Principal', message: 'Bienvenido a la Página Principal' });
});// Define una ruta GET para la página principal que renderiza la vista 'index.ejs' con los datos proporcionados.


// Inicio del servidor
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});// Inicia el servidor en el puerto definido y muestra un mensaje en la consola indicando que el servidor está corriendo.
