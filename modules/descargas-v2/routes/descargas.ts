import * as express from 'express';
import { Auth } from '../../../auth/auth.class';
import { descargarPDF } from '../controller/descargas';

const router = express.Router();


/**
 * Se usa POST para generar la descarga porque se envían datos
 * que van a ser parte del archivo
 */
router.post('/:tipo?', Auth.authenticate(), async (req: any, res, next) => {
    try {
        const idPrestacion = req.body.idPrestacion;
        const idOrganizacion = (Auth.getOrganization(req, 'id') as any);
        const usuario = Auth.getUserName(req);

        let archivo = await descargarPDF(idPrestacion, idOrganizacion, usuario);
        res.download(archivo, (err) => {
            if (err) {
                next(err);
            } else {
                next();
            }
        });
    } catch (e) {
        return next(e);
    }
})

export = router;
