// index.ts
import { Router } from 'express';
import { createParticipacion, getListaParticipacion, getParticipacionByIdOrSlug } from '../controllers/listaController';

const router: Router = Router();

//Endponit de Actividades
router.get('/lista-participacion', getListaParticipacion);
router.get('/lista-participacion/:idOrSlug', getParticipacionByIdOrSlug);
router.post('/lista-participacion', createParticipacion);

export default router;
