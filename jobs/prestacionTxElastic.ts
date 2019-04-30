import { PrestacionTx, model as Prestacion } from '../modules/rup/schemas/prestacion';
import { Client } from 'elasticsearch';
import * as configPrivate from '../config.private';

import { Types } from 'mongoose';
import * as moment from 'moment';
import { SnomedModel } from '../core/term/schemas/snomed';

const connElastic = new Client({
    host: configPrivate.hosts.elastic_main,
});

function create(data, tags) {
    const body = {
        data, tags
    };
    return new Promise((resolve, reject) => {
        connElastic.index({
            index: 'snomed',
            type: 'doc',
            body
        }, (error, response) => {
            if (error) {
                reject(error);
            }
            resolve(response);
        });
    });
}

async function run(done) {
    let total = 0;
    await PrestacionTx.find({
        valorType: 'string',
        'concepto.conceptId': '371531000'
    }).cursor().eachAsync(async (prestacion: any) => {
        total++;
        if (total % 100 === 0) {
            console.log(total);
        }

        const otros: any[] = await PrestacionTx.find({
            prestacionId: prestacion.prestacionId,
            esPrestacion: false,
            _id: { $ne: prestacion._id },
            'concepto.conceptId': { $ne: '371531000' }
        });

        const concepts = otros.map(o => o.concepto.conceptId);
        // const terms = otros.map(o => o.concepto.term);

        await create(prestacion.valor, concepts);

        return true;
    }, { parallel : 100});

    await PrestacionTx.find({
        'valor.evolucion': { $exists: true }
    }).cursor().eachAsync(async (prestacion: any) => {
        total++;
        if (total % 100 === 0) {
            console.log(total);
        }

        // const otros: any[] = await PrestacionTx.find({
        //     prestacionId: prestacion.prestacionId,
        //     esPrestacion: false,
        //     _id: { $ne: prestacion._id },
        //     'concepto.conceptId': { $ne: '371531000' }
        // });

        // const concepts = otros.map(o => o.concepto.conceptId);
        // const terms = otros.map(o => o.concepto.term);

        await create(prestacion.valor.evolucion, [prestacion.concepto.conceptId]);

        return true;
    }, { parallel : 100});

    done();
}


export = run;
