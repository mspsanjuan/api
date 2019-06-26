import { model as Prestacion } from '../schemas/prestacion';
import * as debug from 'debug';
import * as mongoose from 'mongoose';
const dbg = debug('cpt');
let consultapesotalla = new mongoose.Schema({}, { strict: false });
let Consulta = mongoose.model('Consulta', consultapesotalla);

const conceptosAltura = [{ fsn: 'altura corporal (entidad observable)', term: 'altura corporal', conceptId: '50373000', semanticTag: 'entidad observable' }, { fsn: 'altura de pie (entidad observable)', term: 'altura de pie', conceptId: '248333004', semanticTag: 'entidad observable' }, { fsn: 'altura del piso al pubis (entidad observable)', term: 'altura del piso al pubis', conceptId: '248336007', semanticTag: 'entidad observable' }, { fsn: 'altura en posición sedente (entidad observable)', term: 'altura en posición sedente', conceptId: '248335006', semanticTag: 'entidad observable' }, { fsn: 'estatura corporal estimada a partir de la medición de la longitud entre la escotadura esternal y el dedo medio de la mano (entidad observable)', term: 'estatura corporal estimada a partir de la medición de la longitud entre la escotadura esternal y el dedo medio de la mano', conceptId: '248337003', semanticTag: 'entidad observable' }, { fsn: 'longitud cabeza-talón (entidad observable)', term: 'longitud cabeza-talón', conceptId: '276353004', semanticTag: 'entidad observable' }, { fsn: 'longitud cefalocaudal (entidad observable)', term: 'longitud cefalocaudal', conceptId: '276352009', semanticTag: 'entidad observable' }, { fsn: 'longitud del cuerpo (entidad observable)', term: 'longitud del cuerpo', conceptId: '248334005', semanticTag: 'entidad observable' }, { fsn: 'longitud subisquial de pierna (entidad observable)', term: 'longitud subisquial de pierna', conceptId: '276350001', semanticTag: 'entidad observable' }, { fsn: 'medir la altura del paciente (procedimiento)', term: 'medir la altura del paciente', conceptId: '14456009', semanticTag: 'procedimiento' }, { fsn: 'método para medir la estatura (entidad observable)', term: 'método para medir la estatura', conceptId: '422769007', semanticTag: 'entidad observable' }, { fsn: 'talla del lactante (entidad observable)', term: 'talla del lactante', conceptId: '276351002', semanticTag: 'entidad observable' }];
const conceptosPeso = [{ fsn: 'percentilo de peso al nacimiento (entidad observable)', term: 'percentilo de peso al nacimiento', conceptId: '301334000', semanticTag: 'entidad observable' }, { fsn: 'peso al nacer (entidad observable)', term: 'peso al nacer', conceptId: '364589006', semanticTag: 'entidad observable' }, { fsn: 'peso basal (entidad observable)', term: 'peso basal', conceptId: '400967004', semanticTag: 'entidad observable' }, { fsn: 'peso buscado (entidad observable)', term: 'peso buscado', conceptId: '390734006', semanticTag: 'entidad observable' }, { fsn: 'peso corporal (entidad observable)', term: 'peso corporal', conceptId: '27113001', semanticTag: 'entidad observable' }, { fsn: 'peso corporal con calzado (entidad observable)', term: 'peso corporal con calzado', conceptId: '424927000', semanticTag: 'entidad observable' }, { fsn: 'peso corporal habitual (entidad observable)', term: 'peso corporal habitual', conceptId: '363809009', semanticTag: 'entidad observable' }, { fsn: 'peso corporal ideal (entidad observable)', term: 'peso corporal ideal', conceptId: '170804003', semanticTag: 'entidad observable' }, { fsn: 'peso corporal seco (entidad observable)', term: 'peso corporal seco', conceptId: '445541000', semanticTag: 'entidad observable' }, { fsn: 'peso corporal sin calzado (entidad observable)', term: 'peso corporal sin calzado', conceptId: '425024002', semanticTag: 'entidad observable' }, { fsn: 'peso de referencia (entidad observable)', term: 'peso de referencia', conceptId: '248350002', semanticTag: 'entidad observable' }, { fsn: 'peso previo (entidad observable)', term: 'peso previo', conceptId: '248351003', semanticTag: 'entidad observable' }];
const conceptosPC = [{ fsn: 'medición del perímetro cefálico (entidad observable)', term: 'medición del perímetro cefálico', conceptId: '363811000', semanticTag: 'entidad observable' }, { fsn: 'percentilo de circunferencia cefálica del niño (entidad observable)', term: 'percentilo de circunferencia cefálica del niño', conceptId: '170061009', semanticTag: 'entidad observable' }, { fsn: 'percentilo de perímetro cefálico (entidad observable)', term: 'percentilo de perímetro cefálico', conceptId: '248397001', semanticTag: 'entidad observable' }, { fsn: 'perímetro cefálico (entidad observable)', term: 'perímetro cefálico', conceptId: '363812007', semanticTag: 'entidad observable' }, { fsn: 'perímetro cefálico al nacimiento (entidad observable)', term: 'perímetro cefálico al nacimiento', conceptId: '169876006', semanticTag: 'entidad observable' }, { fsn: 'perímetro cefálico con caput (entidad observable)', term: 'perímetro cefálico con caput', conceptId: '248396005', semanticTag: 'entidad observable' }];
const conceptosTA = [{ fsn: 'medición de la tensión arterial con el método del manguito (procedimiento)', term: 'medición de la tensión arterial con el método del manguito', conceptId: '371911009', semanticTag: 'procedimiento' }, { fsn: 'medición de presión sanguínea a nivel del pulso tibial anterior con Doppler (procedimiento)', term: 'medición de presión sanguínea a nivel del pulso tibial anterior con Doppler', conceptId: '446695008', semanticTag: 'procedimiento' }, { fsn: 'medición posoperatoria dela presión sanguínea (procedimiento)', term: 'medición posoperatoria dela presión sanguínea', conceptId: '722502005', semanticTag: 'procedimiento' }, { fsn: 'medición preoperatoria de la presión sanguínea (procedimiento)', term: 'medición preoperatoria de la presión sanguínea', conceptId: '722500002', semanticTag: 'procedimiento' }, { fsn: 'medir la presión arterial (procedimiento)', term: 'medir la presión arterial', conceptId: '46973005', semanticTag: 'procedimiento' }, { fsn: 'medir la tension arterial de paciente pediatrico (procedimiento)', term: 'medir la tension arterial de paciente pediatrico', conceptId: '2511000013101', semanticTag: 'procedimiento' }, { fsn: 'presión arterial media (entidad observable)', term: 'presión arterial media', conceptId: '6797001', semanticTag: 'entidad observable' }, { fsn: 'presión arterial media invasiva (entidad observable)', term: 'presión arterial media invasiva', conceptId: '251075007', semanticTag: 'entidad observable' }, { fsn: 'presión arterial media no invasiva (entidad observable)', term: 'presión arterial media no invasiva', conceptId: '251074006', semanticTag: 'entidad observable' }, { fsn: 'presión auricular derecha media (entidad observable)', term: 'presión auricular derecha media', conceptId: '276775004', semanticTag: 'entidad observable' }, { fsn: 'presión auricular izquierda directa media (entidad observable)', term: 'presión auricular izquierda directa media', conceptId: '276783005', semanticTag: 'entidad observable' }, { fsn: 'presión de enclavamiento media (entidad observable)', term: 'presión de enclavamiento media', conceptId: '276763009', semanticTag: 'entidad observable' }, { fsn: 'presión media de enclavamiento de la vena pulmonar (entidad observable)', term: 'presión media de enclavamiento de la vena pulmonar', conceptId: '371830008', semanticTag: 'entidad observable' }, { fsn: 'presión venosa media (entidad observable)', term: 'presión venosa media', conceptId: '252077001', semanticTag: 'entidad observable' }, { fsn: 'registro ambulatorio de la tensión arterial (procedimiento)', term: 'registro ambulatorio de la tensión arterial', conceptId: '164783007', semanticTag: 'procedimiento' }, { fsn: 'tensión arterial registrada por el paciente en su hogar (procedimiento)', term: 'tensión arterial registrada por el paciente en su hogar', conceptId: '413153004', semanticTag: 'procedimiento' }, { fsn: 'tomar la presión sanguínea arterial del paciente (procedimiento)', term: 'tomar la presión sanguínea arterial del paciente', conceptId: '40594005', semanticTag: 'procedimiento' }];
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
            }
            count++;
        });
        dbg('Prestaciones procesadas = ', count);
        done();
    } catch (error) {
        dbg('ERROR', error);
        done();
    }
}

function matchConcepts(prestacion, registro): Promise<any> {
    return new Promise(async (resolve, reject) => {
        // almacenamos la variable de matcheo para devolver el resultado
        let regs = registro['registros'];
        if (regs) {
            if ((!Array.isArray(regs) || regs.length <= 0)) {
                // verificamos que el concepto coincida con alguno de los elementos enviados en los conceptos
                await checkNSave(registro, prestacion);
            } else {
                for (let i = 0; i < regs.length; i++) {
                    matchConcepts(prestacion, regs[i]);
                }
            }
        }
        resolve();
    });
}

async function checkNSave(registro: any, prestacion: any) {
    let nuevoRegistro;
    nuevoRegistro = new Object();

    if (registro.concepto && registro.concepto.conceptId) {
        nuevoRegistro.idPrestacion = prestacion._id;
        nuevoRegistro.prestacion = prestacion.solicitud.tipoPrestacion;
        nuevoRegistro.estados = prestacion.estados;
        nuevoRegistro.efector = prestacion.ejecucion.organizacion.nombre;
        nuevoRegistro.documento = prestacion.paciente.documento;
        nuevoRegistro.apellido = prestacion.paciente.apellido;
        nuevoRegistro.nombre = prestacion.paciente.nombre;
        nuevoRegistro.sexo = prestacion.paciente.sexo;
        nuevoRegistro.fechaNacimiento = prestacion.paciente.fechaNacimiento;
        nuevoRegistro.fecha = prestacion.ejecucion.fecha;

        const query = {
            idPrestacion: prestacion._id,
        };

        if ((conceptosAltura.find(c => c.conceptId === registro.concepto.conceptId)) && (registro.nombre && registro.valor)) {
            delete nuevoRegistro._id;
            nuevoRegistro.registroAltura = registro.nombre;
            nuevoRegistro.valorAltura = registro.valor;
            await Consulta.findOneAndUpdate(query, nuevoRegistro, { upsert: true });
        }

        if ((conceptosPeso.find(c => c.conceptId === registro.concepto.conceptId)) && (registro.nombre && registro.valor)) {
            delete nuevoRegistro._id;
            nuevoRegistro.registroPeso = registro.nombre;
            nuevoRegistro.valorPeso = registro.valor;
            await Consulta.findOneAndUpdate(query, nuevoRegistro, { upsert: true });
        }

        if ((conceptosPC.find(c => c.conceptId === registro.concepto.conceptId)) && (registro.nombre && registro.valor)) {
            delete nuevoRegistro._id;
            nuevoRegistro.registroPC = registro.nombre;
            nuevoRegistro.valorPC = registro.valor;
            await Consulta.findOneAndUpdate(query, nuevoRegistro, { upsert: true });
        }

        if ((conceptosTA.find(c => c.conceptId === registro.concepto.conceptId)) && (registro.nombre && registro.valor)) {
            delete nuevoRegistro._id;
            nuevoRegistro.registroTA = registro.nombre;
            nuevoRegistro.valorTA = registro.valor;
            await Consulta.findOneAndUpdate(query, nuevoRegistro, { upsert: true });
        }

    }
}

