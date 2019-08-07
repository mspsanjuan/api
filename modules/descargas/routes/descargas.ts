import * as express from 'express';
import { Documento } from './../controller/descargas';
import { Auth } from '../../../auth/auth.class';
import { DocumentoCenso } from './../controller/descargaCenso';
import { DocumentoCensoMensual } from './../controller/descargaCensoMensual';
import { exportarInternacionesAnielo } from '../../../jobs/scriptTemporalAñelo';

const router = express.Router();


/**
 * Se usa POST para generar la descarga porque se envían datos
 * que van a ser parte del archivo
 */
router.post('/censo', (req: any, res, next) => {
    let docCenso = new DocumentoCenso();
    docCenso.descargar(req, res, next).then(archivo => {
        res.download((archivo as string), (err) => {
            if (err) {
                next(err);
            } else {
                next();
            }
        });
    }).catch(e => {
        return next(e);
    });
});

router.post('/censoMensual', (req: any, res, next) => {
    let docCenso = new DocumentoCensoMensual();
    docCenso.descargar(req, res, next).then(archivo => {
        res.download((archivo as string), (err) => {
            if (err) {
                next(err);
            } else {
                next();
            }
        });
    }).catch(e => {
        return next(e);
    });
});

/**
 * Se usa POST para generar la descarga porque se envían datos
 * que van a ser parte del archivo
 */
router.post('/:tipo?', Auth.authenticate(), (req: any, res, next) => {
    Documento.descargar(req, res, next).then(archivo => {
        res.download((archivo as string), (err) => {
            if (err) {
                next(err);
            } else {
                next();
            }
        });
    }).catch(e => {
        return next(e);
    });
});


router.post('/constanciaPuco/:tipo?', (req: any, res, next) => {
    Documento.descargarDocPuco(req, res, next).then(archivo => {
        res.download((archivo as string), (err) => {
            if (err) {
                next(err);
            } else {
                next();
            }
        });
    }).catch(e => {
        return next(e);
    });
});


router.post('/internaciones/Csv', async (req, res, next) => {
    const csv = require('fast-csv');
    const fs = require('fs');
    let ws = fs.createWriteStream('/tmp/internaciones.csv', { encoding: 'utf8' });

    try {
        let data = await exportarInternacionesAnielo();
        csv
            .write(data, {
                headers: true, transform: (row) => {
                    return {
                        AnioInfor: row.AnioInfor,
                        Estab: row.Estab,
                        HistClin: row.HistClin,
                        Apellido: row.Apellido,
                        Nombre: row.Nombre,
                        CodDocum: row.CodDocum,
                        NumDocum: row.NumDocum,
                        NacDia: row.NacDia,
                        NacMes: row.NacMes,
                        NacAnio: row.NacAnio,
                        CodUniEdad: row.CodUniEdad,
                        UniEdad: row.UniEdad,
                        EdadIng: row.EdadIng,
                        LocRes: row.LocRes,
                        ProvRes: row.ProvRes,
                        PaisRes: row.PaisRes,
                        CodSexo: row.CodSexo,
                        Sexo: row.Sexo,
                        CodAsoc: row.CodAsoc,
                        Osoc: row.Osoc,
                        CodNivelI: row.CodNivelI,
                        NivelInst: row.NivelInst,
                        CodSitLab: row.CodSitLab,
                        SitLab: row.SitLab,
                        //   CodOcupac: row.CodOcupac,
                        Ocupac: row.Ocupac,
                        CodHospPor: row.CodHospPor,
                        HospPor: row.HospPor,
                        // Origen: row.Origen,
                        FecIngreso: row.FecIngreso,
                        FecEgreso: row.FecEgreso,
                        ServEgre: row.ServEgre,
                        EspecEgre: row.EspecEgre,
                        DiasTotEst: row.DiasTotEst,
                        CodEgresP: row.CodEgresP,
                        EgresP: row.EgresP,
                        Lugar_Trasl: row.Lugar_Trasl,
                        CodDiagPr: row.CodDiagPr,
                        OtDiag1: row.OtDiag1,
                        CodCauExtT: row.CodCauExtT,
                        CauExtT: row.CauExtT,
                        CodCauExtL: row.CodCauExtL,
                        CauExtL: row.CauExtL
                    };
                }
            })
            .pipe(ws)
            .on('finish', () => {
                res.download(('/tmp/internaciones.csv' as string), (err) => {
                    if (err) {
                        next(err);
                        // fs.unlink('/tmp/my.csv');
                    } else {
                        next();
                        // fs.unlink('/tmp/my.csv');
                    }
                });
            });
    } catch (err) {
        return next(err);
    }
});

export = router;
