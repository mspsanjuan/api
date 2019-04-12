import * as express from 'express';
import { IPS } from '../controller/ips';
import { SaludDigitalClient } from '../controller/autenticacion';
const router = express.Router();
router.get('/:id', async (req, res, next) => {
    try {
        const bundle = await IPS(req.params.id);
        return res.json(bundle);
    } catch (err) {
        return next(err);
    }
});

router.get('/dominios/:id', async (req, res, next) => {
    try {
        const saludDigital = new SaludDigitalClient(null, null);
        const bundle = await saludDigital.getDominios(req.params.id);
        return res.json(bundle);
    } catch (err) {
        return next(err);
    }
});


export = router;

