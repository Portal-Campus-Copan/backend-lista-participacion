import { Request, Response } from 'express';
import client from '../servicios/db';
import moment from 'moment-timezone';

export interface ListaParticipantes {
    actividad_id: number;
    nombre: string;
    slug_actividad: string;
    numero_cuenta: string;
    carrera_id: number;
    fecha: Date;
}

// Obtener todas las participaciones
export const getListaParticipacion = async (req: Request, res: Response): Promise<void> => {
  try {
    const resultado = await client.execute("SELECT * FROM lista_participantes ORDER BY actividad_id ASC;");

    if (Array.isArray(resultado.rows)) {
      const formattedData: ListaParticipantes[] = resultado.rows.map((row: any) => ({
        actividad_id: row[0],
        nombre: row[1],
        slug_actividad: row[2],
        numero_cuenta: row[3],
        carrera_id: row[4],
        fecha: new Date(row[5]),
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
      ? "SELECT * FROM lista_participantes WHERE actividad_id = ?"
      : "SELECT * FROM lista_participantes WHERE slug_actividad = ?";

    const resultado = await client.execute({
      sql: query,
      args: [idOrSlug]
    });

    if (Array.isArray(resultado.rows) && resultado.rows.length > 0) {
      const formattedData: ListaParticipantes[] = resultado.rows.map((row: any) => ({
        actividad_id: row[0],
        nombre: row[1],
        slug_actividad: row[2],
        numero_cuenta: row[3],
        carrera_id: row[4],
        fecha: new Date(row[5]),
      }));
      res.status(200).json(formattedData[0]);
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
      // Obtener las participaciones del cuerpo de la solicitud
      const participaciones = req.body; // Debe ser un array de participaciones

      // Validar que participaciones sea un array
      if (!Array.isArray(participaciones)) {
          res.status(400).json({ error: 'El cuerpo de la solicitud debe ser un array de participaciones' });
          return;
      }

      // Preparar los valores para la inserción en la base de datos
      const fecha = moment().format('YYYY-MM-DD HH:mm:ss');
      const queries = participaciones.map(participacion => {
          const { nombre, slug_actividad, numero_cuenta, carrera_id } = participacion;

          // Validar cada participación
          if (!nombre || !slug_actividad || !numero_cuenta || !carrera_id) {
              throw new Error('Faltan datos requeridos en una de las participaciones');
          }

          // Preparar la consulta de inserción
          return {
              sql: "INSERT INTO lista_participantes (nombre, slug_actividad, numero_cuenta, carrera_id, fecha) VALUES (?, ?, ?, ?, ?)",
              args: [nombre, slug_actividad, numero_cuenta, carrera_id, fecha]
          };
      });

      // Ejecutar todas las consultas de inserción
      for (const query of queries) {
          await client.execute(query);
      }

      res.status(200).json({ message: 'Participaciones creadas exitosamente' });
  } catch (error) {
      console.error('Error creating participaciones:', error);
      res.status(500).json({ error: 'Error al crear las participaciones' });
  }
};