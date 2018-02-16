import * as config from '../../../config';
import * as express from 'express';
import * as path from 'path';
import { Auth } from '../../../auth/auth.class';
import { Documento } from './../controller/descargas';

let router = express.Router();

router.post('/:tipo', async (req: any, res, next) => {
    if (!Auth.check(req, 'descargas:' + req.params.tipo)) {
        return next(403);
    }
    try {
        let doc = new Documento(req.body.options);
        await doc.descargar(req, res, next);
    } catch (e) {
        return next(e);
    }
});

export = router;
