import * as express from 'express';
import { IPS, genDocumentReference } from '../../../modules/ips/controller/ips';
// Schemas
const router = express.Router();

router.get('/DocumentReference', async (req, res, next) => {
    try {
        // [TODO] Verificar el domain
        const subject: String = req.query['subject:Patient.identifier'];
        const [domain, id] = subject.split('|');
        const bundle = await genDocumentReference(id);
        return res.json(bundle);
    } catch (err) {
        return next(err);
    }
});

router.get('/Binary/:id', async (req, res, next) => {
    try {
        const bundle = await IPS(req.params.id);
        return res.json(bundle);
    } catch (err) {
        return next(err);
    }
});

export = router;
