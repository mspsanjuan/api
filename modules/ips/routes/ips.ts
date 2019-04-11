import * as express from 'express';
import { IPS, getListaDominios } from '../controller/ips';

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
        const bundle = await getListaDominios(req.params.id);
        return res.json(bundle);
    } catch (err) {
        return next(err);
    }
});


export = router;

