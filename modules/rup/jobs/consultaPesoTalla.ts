import { model as Prestacion } from '../schemas/prestacion';
import * as debug from 'debug';
import * as mongoose from 'mongoose';
import { userScheduler } from '../../../config.private';
import { Auth } from '../../../auth/auth.class';
const dbg = debug('cpt');
let consultapesotalla = new mongoose.Schema({}, { strict: false });
let Consulta = mongoose.model('Consulta', consultapesotalla);

const conceptosAltura = [{ fsn: 'altura corporal (entidad observable)', term: 'altura corporal', conceptId: '50373000', semanticTag: 'entidad observable' }, { fsn: 'altura de pie (entidad observable)', term: 'altura de pie', conceptId: '248333004', semanticTag: 'entidad observable' }, { fsn: 'altura del piso al pubis (entidad observable)', term: 'altura del piso al pubis', conceptId: '248336007', semanticTag: 'entidad observable' }, { fsn: 'altura en posición sedente (entidad observable)', term: 'altura en posición sedente', conceptId: '248335006', semanticTag: 'entidad observable' }, { fsn: 'estatura corporal estimada a partir de la medición de la longitud entre la escotadura esternal y el dedo medio de la mano (entidad observable)', term: 'estatura corporal estimada a partir de la medición de la longitud entre la escotadura esternal y el dedo medio de la mano', conceptId: '248337003', semanticTag: 'entidad observable' }, { fsn: 'longitud cabeza-talón (entidad observable)', term: 'longitud cabeza-talón', conceptId: '276353004', semanticTag: 'entidad observable' }, { fsn: 'longitud cefalocaudal (entidad observable)', term: 'longitud cefalocaudal', conceptId: '276352009', semanticTag: 'entidad observable' }, { fsn: 'longitud del cuerpo (entidad observable)', term: 'longitud del cuerpo', conceptId: '248334005', semanticTag: 'entidad observable' }, { fsn: 'longitud subisquial de pierna (entidad observable)', term: 'longitud subisquial de pierna', conceptId: '276350001', semanticTag: 'entidad observable' }, { fsn: 'medir la altura del paciente (procedimiento)', term: 'medir la altura del paciente', conceptId: '14456009', semanticTag: 'procedimiento' }, { fsn: 'método para medir la estatura (entidad observable)', term: 'método para medir la estatura', conceptId: '422769007', semanticTag: 'entidad observable' }, { fsn: 'talla del lactante (entidad observable)', term: 'talla del lactante', conceptId: '276351002', semanticTag: 'entidad observable' }];
const conceptosPeso = [{ fsn: 'percentilo de peso al nacimiento (entidad observable)', term: 'percentilo de peso al nacimiento', conceptId: '301334000', semanticTag: 'entidad observable' }, { fsn: 'peso al nacer (entidad observable)', term: 'peso al nacer', conceptId: '364589006', semanticTag: 'entidad observable' }, { fsn: 'peso basal (entidad observable)', term: 'peso basal', conceptId: '400967004', semanticTag: 'entidad observable' }, { fsn: 'peso buscado (entidad observable)', term: 'peso buscado', conceptId: '390734006', semanticTag: 'entidad observable' }, { fsn: 'peso corporal (entidad observable)', term: 'peso corporal', conceptId: '27113001', semanticTag: 'entidad observable' }, { fsn: 'peso corporal con calzado (entidad observable)', term: 'peso corporal con calzado', conceptId: '424927000', semanticTag: 'entidad observable' }, { fsn: 'peso corporal habitual (entidad observable)', term: 'peso corporal habitual', conceptId: '363809009', semanticTag: 'entidad observable' }, { fsn: 'peso corporal ideal (entidad observable)', term: 'peso corporal ideal', conceptId: '170804003', semanticTag: 'entidad observable' }, { fsn: 'peso corporal seco (entidad observable)', term: 'peso corporal seco', conceptId: '445541000', semanticTag: 'entidad observable' }, { fsn: 'peso corporal sin calzado (entidad observable)', term: 'peso corporal sin calzado', conceptId: '425024002', semanticTag: 'entidad observable' }, { fsn: 'peso de referencia (entidad observable)', term: 'peso de referencia', conceptId: '248350002', semanticTag: 'entidad observable' }, { fsn: 'peso previo (entidad observable)', term: 'peso previo', conceptId: '248351003', semanticTag: 'entidad observable' }];
const conceptosPC = [{ fsn: 'medición del perímetro cefálico (entidad observable)', term: 'medición del perímetro cefálico', conceptId: '363811000', semanticTag: 'entidad observable' }, { fsn: 'percentilo de circunferencia cefálica del niño (entidad observable)', term: 'percentilo de circunferencia cefálica del niño', conceptId: '170061009', semanticTag: 'entidad observable' }, { fsn: 'percentilo de perímetro cefálico (entidad observable)', term: 'percentilo de perímetro cefálico', conceptId: '248397001', semanticTag: 'entidad observable' }, { fsn: 'perímetro cefálico (entidad observable)', term: 'perímetro cefálico', conceptId: '363812007', semanticTag: 'entidad observable' }, { fsn: 'perímetro cefálico al nacimiento (entidad observable)', term: 'perímetro cefálico al nacimiento', conceptId: '169876006', semanticTag: 'entidad observable' }, { fsn: 'perímetro cefálico con caput (entidad observable)', term: 'perímetro cefálico con caput', conceptId: '248396005', semanticTag: 'entidad observable' }];
const conceptosTA = [{ fsn: 'medición de la tensión arterial con el método del manguito (procedimiento)', term: 'medición de la tensión arterial con el método del manguito', conceptId: '371911009', semanticTag: 'procedimiento' }, { fsn: 'medición de presión sanguínea a nivel del pulso tibial anterior con Doppler (procedimiento)', term: 'medición de presión sanguínea a nivel del pulso tibial anterior con Doppler', conceptId: '446695008', semanticTag: 'procedimiento' }, { fsn: 'medición posoperatoria dela presión sanguínea (procedimiento)', term: 'medición posoperatoria dela presión sanguínea', conceptId: '722502005', semanticTag: 'procedimiento' }, { fsn: 'medición preoperatoria de la presión sanguínea (procedimiento)', term: 'medición preoperatoria de la presión sanguínea', conceptId: '722500002', semanticTag: 'procedimiento' }, { fsn: 'medir la presión arterial (procedimiento)', term: 'medir la presión arterial', conceptId: '46973005', semanticTag: 'procedimiento' }, { fsn: 'medir la tension arterial de paciente pediatrico (procedimiento)', term: 'medir la tension arterial de paciente pediatrico', conceptId: '2511000013101', semanticTag: 'procedimiento' }, { fsn: 'registro ambulatorio de la tensión arterial (procedimiento)', term: 'registro ambulatorio de la tensión arterial', conceptId: '164783007', semanticTag: 'procedimiento' }, { fsn: 'tensión arterial registrada por el paciente en su hogar (procedimiento)', term: 'tensión arterial registrada por el paciente en su hogar', conceptId: '413153004', semanticTag: 'procedimiento' }, { fsn: 'tomar la presión sanguínea arterial del paciente (procedimiento)', term: 'tomar la presión sanguínea arterial del paciente', conceptId: '40594005', semanticTag: 'procedimiento' }];

export async function consultaPesoTalla(done) {
    dbg(' GO! ...');
    let count = 0;
    try {
        const query = {
            'estados.tipo': 'validada'
        };
        let prestaciones = await Prestacion.find(query).cursor({ batchSize: 100 });
        dbg('>>>>>>>>>>> Comenzando <<<<<<<<<<<');
        await prestaciones.eachAsync(async (prestacion: any) => {
            // recorremos los registros de cada prestacion
            let regs = prestacion.ejecucion.registros;
            for (let i = 0; i < regs.length; i++) {
                // verificamos que el concepto coincida con alguno de los elementos enviados en los conceptos
                await checkNSave(regs[i], prestacion);
                await matchConcepts(prestacion, regs[i]);
                count++;
            }
        });
        console.log("Prestaciones procesadas = ", count)
        done();
    } catch (error) {
        dbg('ERROR', error);
        done();
    }
}

function matchConcepts(prestacion, registro): Promise<any> {
    return new Promise(async (resolve, reject) => {
        // almacenamos la variable de matcheo para devolver el resultado

        if (!Array.isArray(registro['registros']) || registro['registros'].length <= 0) {
            // verificamos que el concepto coincida con alguno de los elementos enviados en los conceptos
            await checkNSave(registro, prestacion);
        } else {
            let regs = registro['registros'];
            let promArray = [];
            for (let reg in regs) {
                promArray.push(matchConcepts(prestacion, reg));
            }
            await Promise.all(promArray);
        }
        resolve();
    });
}

async function checkNSave(unRegistro: any, prestacion: any) {
    let registro;
    registro = new Object();
    if (unRegistro.concepto && unRegistro.concepto.conceptId) {
        registro.idPrestacion = prestacion._id;
        registro.prestacion = prestacion.solicitud.tipoPrestacion;
        registro.estados = prestacion.estados;
        registro.efector = prestacion.ejecucion.organizacion.nombre;
        registro.documento = prestacion.paciente.documento;
        registro.apellido = prestacion.paciente.apellido;
        registro.nombre = prestacion.paciente.nombre;
        registro.sexo = prestacion.paciente.sexo;
        registro.fechaNacimiento = prestacion.paciente.fechaNacimiento;
        registro.fecha = prestacion.ejecucion.fecha;

        const query = {
            'registro.idPrestacion': prestacion._id,
        };
        if (conceptosAltura.find(c => c.conceptId === unRegistro.concepto.conceptId)) {
            if ((unRegistro.nombre && unRegistro.valor)) {
                registro.registroAltura = unRegistro.nombre;
                registro.valorAltura = unRegistro.valor;
                // let reg = await Consulta.findOne(query).exec();
                // if (!reg) {
                await Consulta.findOneAndUpdate(query, registro, { upsert: true });
                // } else {
                // await Consulta.findOneAndUpdate(query, { registroAltura: unRegistro.nombre, valorAltura: unRegistro.valor }, { upsert: true });
                // }
            }
        }
        if (conceptosPeso.find(c => c.conceptId === unRegistro.concepto.conceptId)) {
            if ((unRegistro.nombre && unRegistro.valor)) {
                registro.registroPeso = unRegistro.nombre;
                registro.valorPeso = unRegistro.valor;
                // let reg = await Consulta.findOne(query).exec();
                // if (!reg) {
                await Consulta.findOneAndUpdate(query, registro, { upsert: true });
                // } else {
                // await Consulta.findOneAndUpdate(query, { registroPeso: unRegistro.nombre, valorPeso: unRegistro.valor }, { upsert: true });
                // }
            }
        }
        if (conceptosPC.find(c => c.conceptId === unRegistro.concepto.conceptId)) {
            if ((unRegistro.nombre && unRegistro.valor)) {
                registro.registroPC = unRegistro.nombre;
                registro.valorPC = unRegistro.valor;
                // let reg = await Consulta.findOne(query).exec();
                // if (!reg) {
                //     await Consulta.findOneAndUpdate(query, registro, { upsert: true });
                // } else {
                await Consulta.findOneAndUpdate(query, { registroPerimetroCefalico: unRegistro.nombre, valorPerimetroCefalico: unRegistro.valor }, { upsert: true });
                // }
            }
        }
        if (conceptosTA.find(c => c.conceptId === unRegistro.concepto.conceptId)) {
            if ((unRegistro.nombre && unRegistro.valor)) {
                registro.registroTA = unRegistro.nombre;
                registro.valorTA = unRegistro.valor;
                // let reg = await Consulta.findOne(query).exec();
                // if (!reg) {
                //     await Consulta.findOneAndUpdate(query, registro, { upsert: true });
                // } else {
                await Consulta.findOneAndUpdate(query, { registroTA: unRegistro.nombre, valorTA: unRegistro.valor }, { upsert: true });
                // }
            }
        }

    }
}

