import * as express from 'express';
import { Auth } from '../../../auth/auth.class';
import { descargarInformePrestacion, descargarInformeColono } from '../controller/descargas';
import { descargarCenso, generarHtmlCensoMensual, generarHTMLCensoDiario } from '../controller/censos';
const router = express.Router();
import { model as Prestacion } from '../../rup/schemas/prestacion';




router.post('/censo', async (req: any, res, next) => {
    try {
        let params = req.body;
        params.usuario = Auth.getUserName(req);
        let archivo = await descargarCenso(params, generarHTMLCensoDiario);
        res.download((archivo as string), (err) => {
            if (err) { next(err); }
        });
    } catch (e) {
        return next(e);
    }
});

router.post('/censoMensual', async (req: any, res, next) => {
    try {
        let params = req.body;
        params.usuario = Auth.getUserName(req);
        let archivo = await descargarCenso(params, generarHtmlCensoMensual);
        res.download((archivo as string), (err) => {
            if (err) { next(err); }
        });
    } catch (e) {
        return next(e);
    }
});

/**
 * Se usa POST para generar la descarga porque se envían datos
 * que van a ser parte del archivo
 */
router.post('/:tipo?', Auth.authenticate(), async (req: any, res, next) => {
    try {
        const idRegistro = req.body.idRegistro ? req.body.idRegistro : null;
        const idPrestacion = req.body.idPrestacion;
        const idOrganizacion = (Auth.getOrganization(req, 'id') as any);
        const usuario = Auth.getUserName(req);
        let archivo;
        let prestacion: any = await Prestacion.findById(idPrestacion).exec();

        /* Sección de prueba, sacar y poner dentro de otra función*/
        switch (prestacion.solicitud.tipoPrestacion.conceptId) {
            case '310634005':
            case '73761001':
                archivo = await descargarInformeColono(idPrestacion, idOrganizacion, usuario);
                break;
            default:
                archivo = await descargarInformePrestacion(idPrestacion, idRegistro, idOrganizacion, usuario);
        }
        /* Fin seccion prueba*/


        res.download(archivo, (err) => {
            if (err) { next(err); }
        });
    } catch (e) {
        return next(e);
    }
});


export = router;
