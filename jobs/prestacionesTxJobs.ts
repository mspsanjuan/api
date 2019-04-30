import { PrestacionTx, model as Prestacion } from '../modules/rup/schemas/prestacion';
import { Connections } from '../connections';
import * as mongoose from 'mongoose';
import * as moment from 'moment';
import { SnomedModel } from '../core/term/schemas/snomed';
import { paciente as Paciente } from '../core/mpi/schemas/paciente';

function edadCompleta(paciente, fechaAct) {
    let difAnios: any;
    let difDias: any;
    let difMeses: any;


    const fechaNac = moment(paciente.fechaNacimiento);
    fechaAct = moment(fechaAct);


    difAnios = fechaAct.diff(fechaNac, 'years');
    fechaNac.year(fechaAct.year());

    difMeses = fechaAct.diff(fechaNac, 'months');
    if (difMeses < 0) {
        difMeses = 12 + difMeses;
    }

    fechaNac.month(fechaAct.month());
    difDias = fechaAct.diff(fechaNac, 'd'); // Diferencia en días
    if (difDias < 0) {
        difDias = 30 + difDias;
    }

    return {
        edad: difAnios,
        ano: difAnios,
        mes: difMeses,
        dia: difDias
    };
}

function edad(paciente) {
    if (paciente.fechaNacimiento) {
        const birthDate = new Date(paciente.fechaNacimiento);
        const currentDate = new Date();
        let years = (currentDate.getFullYear() - birthDate.getFullYear());
        if (currentDate.getMonth() < birthDate.getMonth() ||
            currentDate.getMonth() === birthDate.getMonth() && currentDate.getDate() < birthDate.getDate()) {
            years--;
        }
        return years;
    }
    return null;
}

const cacheSnomed = {};

async function findSnomed(ids) {
    const realFind = ids.filter(ctid => {
        return !cacheSnomed[ctid];
    });
    if (realFind.length > 0) {
        // console.log('real find', realFind);
        const concepts: any[] = await SnomedModel.find({ conceptId: { $in: realFind } });
        concepts.forEach(c => cacheSnomed[c.conceptId] = c);
    }
}

function flatPrestacion(prestacion) {
    let res = [];
    for (let r of prestacion.ejecucion.registros) {
        res = [...res, ...flatRegistros(r, [], [])];
    }
    return res;
}

function flatRegistros(registro, ancestorsId, ancestorsSctId): any[] {
    const tx = {
        registroId: registro._id,
        valor: registro.valor,
        concepto: registro.concepto,
        ancestorsId,
        ancestorsSctId
    };
    let res = [tx];
    for (let r of registro.registros) {
        const ancestorsIdTemp = [...ancestorsId, r._id];
        const ancestorsSctIdTemp = [...ancestorsSctId, r.concepto.conceptId];
        res = [...res, ...flatRegistros(r, ancestorsIdTemp, ancestorsSctIdTemp)];
    }
    return res;
}


async function addBucket(item) {
    const inc: any = {
        total: 1
    };
    inc['prestaciones.' + item.tipoPrestacion.conceptId] = 1;
    return await Connections.main.collection('prestaciontx2').update(
        {
            'organizacion.id': item.organizacion.id,
            start: { $lte: item.fecha.ejecucion },
            end: { $gte: item.fecha.ejecucion },
            'concepto.conceptId': item.concepto.conceptId
        },
        {
            $inc: inc,
            $setOnInsert: {
                start: moment(item.fecha.ejecucion).startOf('week').toDate(),
                end: moment(item.fecha.ejecucion).endOf('week').toDate(),
                organizacion: item.organizacion,
                concepto: item.concepto
            },
            $push: {
                registros: {
                    term: item.term,
                    paciente: item.paciente,
                    tipoPrestacion: item.tipoPrestacion,
                    profesional: item.profesional,
                    esPrestacion: item.esPrestacion,
                    valor: item.valor,
                    valorType: item.valorType,
                    fecha: item.fecha.ejecucion
                }
            }
        },
        {
            upsert: true
        }
    );
}

async function getCoordenadas(pac) {
    if (pac && pac.direccion && pac.direccion.length > 0) {
        const d = pac.direccion[0];

        if (d.ubicacion && d.ubicacion.localidad) {
            const localidades = Connections.main.collection('localidades');
            const loc = await localidades.findOne({ nombre: d.ubicacion.localidad.nombre });
            return loc.location;
        }
    }
    return null;
}

function getLocalidad(pac) {
    if (pac && pac.direccion && pac.direccion.length > 0) {
        const d = pac.direccion[0];
        if (d.ubicacion && d.ubicacion.localidad) {
            return d.ubicacion.localidad.nombre;
        }
    }
    return null;
}


async function run(done) {
    let total = 1;
    await Connections.main.createCollection('prestaciontx2');

    await findSnomed(['123980006']);

    await Prestacion.find({
        'estados.tipo': {
            $ne: 'modificada',
            $eq: 'validada'
        },
        'ejecucion.fecha': {
            $gt: moment('2018-01-01 00:13:18.926Z')
        },
        // 'solicitud.organizacion.id': Types.ObjectId('57e9670e52df311059bc8964')
    }).cursor().eachAsync(async (prestacion: any) => {
        total++;
        if (total % 100 === 0) {
            console.log(total);
        }
        const estEjecucion = prestacion.estados.find(i => i.tipo === 'ejecucion');
        const estValidacion = prestacion.estados.find(i => i.tipo === 'validada');
        const tx = {
            prestacionId: prestacion._id,
            paciente: prestacion.paciente.toObject(),
            tipoPrestacion: prestacion.solicitud.tipoPrestacion,
            organizacion: prestacion.solicitud.organizacion,
            profesional: prestacion.solicitud.profesional,
            fecha: {
                ejecucion: estEjecucion ? estEjecucion.createdAt : null,
                validacion: estValidacion ? estValidacion.createdAt : null
            }
        };

        const pac: any = await Paciente.findById(prestacion.paciente.id);

        tx.paciente['edad'] = edadCompleta(tx.paciente, tx.fecha.ejecucion);
        tx.paciente['coordenadas'] = await getCoordenadas(pac);
        tx.paciente['localidad'] = getLocalidad(pac);

        const items = flatPrestacion(prestacion);
        const ids = [...items.map(i => i.concepto.conceptId), prestacion.solicitud.tipoPrestacion.conceptId];

        await findSnomed(ids);

        const mapping = cacheSnomed;

        let tipoPrestacion = prestacion.solicitud.tipoPrestacion.toObject();
        if (mapping[tipoPrestacion.conceptId]) {
            tipoPrestacion.inferredAncestors = mapping[tipoPrestacion.conceptId].inferredAncestors;
            tipoPrestacion.statedAncestors = mapping[tipoPrestacion.conceptId].statedAncestors;
            tipoPrestacion.relationships = mapping[tipoPrestacion.conceptId].relationships.filter(r => r.active);
            const a = await addBucket({
                esPrestacion: true,
                ...tx,
                concepto: tipoPrestacion,
                valor: null,
                term: tipoPrestacion.term
            });
        }

        // Load Edad Osea
        const conceptoEdad = mapping['123980006'].toObject();
        if (mapping['123980006']) {
            conceptoEdad.inferredAncestors = mapping['123980006'].inferredAncestors;
            conceptoEdad.statedAncestors = mapping['123980006'].statedAncestors;
            conceptoEdad.relationships = mapping['123980006'].relationships.filter(r => r.active);
        }

        await addBucket({
            esPrestacion: false,
            concepto: conceptoEdad,
            ...tx,
            valor: tx.paciente['edad'].edad,
            valorType: 'numeric',
            term: 'edad osea'
        });


        for (let item of items) {
            if (mapping[item.concepto.conceptId]) {
                item.concepto.inferredAncestors = mapping[item.concepto.conceptId].inferredAncestors;
                item.concepto.statedAncestors = mapping[item.concepto.conceptId].statedAncestors;
                item.concepto.relationships = mapping[item.concepto.conceptId].relationships.filter(r => r.active);
            }
            let valorType: string = typeof item.valor;
            if (!item.valor) { valorType = 'null'; }
            if (item.valor && Array.isArray(item.valor)) { valorType = 'array'; }
            if (item.valor && item.valor.concepto) { valorType = 'snomed'; }

            await addBucket({
                esPrestacion: false,
                ...tx,
                ...item,
                valorType,
                term: item.concepto.term
            });
        }
        return true;
    }, { parallel: 100 });
    done();
}

export = run;
