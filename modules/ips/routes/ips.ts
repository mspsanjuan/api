import * as express from 'express';
import { IPS, getListaDominios } from '../../rup/controllers/ips';

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

router.get('/DocumentReference', async (req, res, next) => {
    try {
        const subject: String = req.params['subject:Patient.identifier'];
        const [domain, id] = subject.split('|')
        const bundle = await getListaDominios(req.params.id);
        return res.json(bundle);
    } catch (err) {
        return next(err);
    }
});


export = router;

