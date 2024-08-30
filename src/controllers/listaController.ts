import { Request, Response } from 'express';
import client from '../servicios/db';
import moment from 'moment-timezone';

interface ListaParticipantes {
  actividad_id: number;
  nombre: string;
  slug_actividad: string;
  numero_cuenta: string;
  carrera_id: number;
  fecha: Date;
  carrera_nombre: string; // Añadido
}


// Obtener todas las participaciones
export const getListaParticipacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const resultado = await client.execute(`
      SELECT 
        lp.actividad_id, 
        lp.nombre, 
        lp.slug_actividad, 
        lp.numero_cuenta, 
        lp.carrera_id, 
        lp.fecha, 
        c.nombre AS carrera_nombre
      FROM 
        lista_participantes lp
      JOIN 
        carrera c ON lp.carrera_id = c.id
      ORDER BY 
        lp.actividad_id ASC;
    `);

    if (Array.isArray(resultado.rows)) {
      const formattedData: ListaParticipantes[] = resultado.rows.map((row: any) => ({
        actividad_id: row.actividad_id,
        nombre: row.nombre,
        slug_actividad: row.slug_actividad,
        numero_cuenta: row.numero_cuenta,
        carrera_id: row.carrera_id,
        fecha: new Date(row.fecha),
        carrera_nombre: row.carrera_nombre // Añadido el nombre de la carrera
      }));
      res.status(200).json(formattedData);
    } else {
      res.status(500).json({ error: 'Unexpected data format from database' });
    }
  } catch (error) {
    console.error('Error fetching lista de participación:', error);
    res.status(500).json({ error: 'Error fetching lista de participación' });
  }
};

// Obtener una participación por ID o slug_actividad
export const getParticipacionByIdOrSlug = async (req: Request, res: Response): Promise<void> => {
  const { idOrSlug } = req.params;

  try {
    // Determinar si idOrSlug es un número o un string
    const isId = !isNaN(Number(idOrSlug));
    const query = isId
      ? `
        SELECT 
          lp.actividad_id, 
          lp.nombre, 
          lp.slug_actividad, 
          lp.numero_cuenta, 
          lp.carrera_id, 
          lp.fecha, 
          c.nombre AS carrera_nombre
        FROM 
          lista_participantes lp
        JOIN 
          carrera c ON lp.carrera_id = c.id
        WHERE 
          lp.actividad_id = ?
        `
      : `
        SELECT 
          lp.actividad_id, 
          lp.nombre, 
          lp.slug_actividad, 
          lp.numero_cuenta, 
          lp.carrera_id, 
          lp.fecha, 
          c.nombre AS carrera_nombre
        FROM 
          lista_participantes lp
        JOIN 
          carrera c ON lp.carrera_id = c.id
        WHERE 
          lp.slug_actividad = ?
        `;

    const resultado = await client.execute({
      sql: query,
      args: [idOrSlug]
    });

    if (Array.isArray(resultado.rows) && resultado.rows.length > 0) {
      const formattedData: ListaParticipantes[] = resultado.rows.map((row: any) => ({
        actividad_id: row.actividad_id,
        nombre: row.nombre,
        slug_actividad: row.slug_actividad,
        numero_cuenta: row.numero_cuenta,
        carrera_id: row.carrera_id,
        fecha: new Date(row.fecha),
        carrera_nombre: row.carrera_nombre // Añadido el nombre de la carrera
      }));
      res.status(200).json(formattedData);
    } else {
      res.status(404).json({ error: 'Participación no encontrada' });
    }
  } catch (error) {
    console.error('Error fetching participación by id or slug:', error);
    res.status(500).json({ error: 'Error fetching participación' });
  }
};


// Crear una nueva participación
export const createParticipacion = async (req: Request, res: Response): Promise<void> => {
    try {
    const { nombre, slug_actividad, numero_cuenta, carrera_id } = req.body;
    const timezone = 'America/Tegucigalpa'; // Ajusta la zona horaria según tu ubicación
    const fecha = moment().tz(timezone).format();

    await client.execute({
      sql: "INSERT INTO lista_participantes (nombre, slug_actividad, numero_cuenta, carrera_id, fecha) VALUES ( ?, ?, ?, ?, ?)",
      args: [nombre, slug_actividad, numero_cuenta, carrera_id, fecha]
    });

    res.status(200).json({ message: 'Participación creada exitosamente' });
  } catch (error) {
    console.error('Error creating participación:', error);
    res.status(500).json({ error: 'Error al crear la participación' });
  }
};
