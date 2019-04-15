import * as express from 'express';
import { IPS, getPaciente } from '../controller/ips';
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
        const saludDigital = new SaludDigitalClient('http://neuquen.gob.ar', 'https://testapp.hospitalitaliano.org.ar');
        //  const paciente = await getPaciente(saludDigital, req.params.id);
        const bundle = await saludDigital.getDominios(req.params.id);
        return res.json(bundle);
    } catch (err) {
        return next(err);
    }
});

router.get('/document/:id', async (req, res, next) => {
    try {
        const saludDigital = new SaludDigitalClient('http://neuquen.gob.ar', 'https://testapp.hospitalitaliano.org.ar');
        const custodian = req.query.custodian;
        const bundle = await saludDigital.solicitud({ patient: req.params.id, custodian, loinc: '60591-5' });
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

