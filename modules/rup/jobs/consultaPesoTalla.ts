import { model as Prestacion } from '../schemas/prestacion';
import { matchConcepts } from '../controllers/rup';
import * as debug from 'debug';
const dbg = debug('cpt');
export async function consultaPesoTalla(done) {
    dbg(' GO! ...');
    const query = {
        $and: [
            {
                $or: [
                    { 'solicitud.tipoPrestacion.conceptId': '401000013105' },
                    { 'solicitud.tipoPrestacion.conceptId': '511000013109' },
                    { 'solicitud.tipoPrestacion.conceptId': '391000013108' },
                    { 'solicitud.tipoPrestacion.conceptId': '410620009' },
                ]
            },
            { 'estados.tipo': 'validada' }
        ]
    };
    const conceptosAltura = [{ fsn: 'altura corporal (entidad observable)', term: 'altura corporal', conceptId: '50373000', semanticTag: 'entidad observable' }, { fsn: 'altura de pie (entidad observable)', term: 'altura de pie', conceptId: '248333004', semanticTag: 'entidad observable' }, { fsn: 'altura del piso al pubis (entidad observable)', term: 'altura del piso al pubis', conceptId: '248336007', semanticTag: 'entidad observable' }, { fsn: 'altura en posición sedente (entidad observable)', term: 'altura en posición sedente', conceptId: '248335006', semanticTag: 'entidad observable' }, { fsn: 'estatura corporal estimada a partir de la medición de la longitud entre la escotadura esternal y el dedo medio de la mano (entidad observable)', term: 'estatura corporal estimada a partir de la medición de la longitud entre la escotadura esternal y el dedo medio de la mano', conceptId: '248337003', semanticTag: 'entidad observable' }, { fsn: 'longitud cabeza-talón (entidad observable)', term: 'longitud cabeza-talón', conceptId: '276353004', semanticTag: 'entidad observable' }, { fsn: 'longitud cefalocaudal (entidad observable)', term: 'longitud cefalocaudal', conceptId: '276352009', semanticTag: 'entidad observable' }, { fsn: 'longitud del cuerpo (entidad observable)', term: 'longitud del cuerpo', conceptId: '248334005', semanticTag: 'entidad observable' }, { fsn: 'longitud subisquial de pierna (entidad observable)', term: 'longitud subisquial de pierna', conceptId: '276350001', semanticTag: 'entidad observable' }, { fsn: 'medir la altura del paciente (procedimiento)', term: 'medir la altura del paciente', conceptId: '14456009', semanticTag: 'procedimiento' }, { fsn: 'método para medir la estatura (entidad observable)', term: 'método para medir la estatura', conceptId: '422769007', semanticTag: 'entidad observable' }, { fsn: 'talla del lactante (entidad observable)', term: 'talla del lactante', conceptId: '276351002', semanticTag: 'entidad observable' }];
    const conceptosPeso = [{ fsn: 'percentilo de peso al nacimiento (entidad observable)', term: 'percentilo de peso al nacimiento', conceptId: '301334000', semanticTag: 'entidad observable' }, { fsn: 'peso al nacer (entidad observable)', term: 'peso al nacer', conceptId: '364589006', semanticTag: 'entidad observable' }, { fsn: 'peso basal (entidad observable)', term: 'peso basal', conceptId: '400967004', semanticTag: 'entidad observable' }, { fsn: 'peso buscado (entidad observable)', term: 'peso buscado', conceptId: '390734006', semanticTag: 'entidad observable' }, { fsn: 'peso corporal (entidad observable)', term: 'peso corporal', conceptId: '27113001', semanticTag: 'entidad observable' }, { fsn: 'peso corporal con calzado (entidad observable)', term: 'peso corporal con calzado', conceptId: '424927000', semanticTag: 'entidad observable' }, { fsn: 'peso corporal habitual (entidad observable)', term: 'peso corporal habitual', conceptId: '363809009', semanticTag: 'entidad observable' }, { fsn: 'peso corporal ideal (entidad observable)', term: 'peso corporal ideal', conceptId: '170804003', semanticTag: 'entidad observable' }, { fsn: 'peso corporal seco (entidad observable)', term: 'peso corporal seco', conceptId: '445541000', semanticTag: 'entidad observable' }, { fsn: 'peso corporal sin calzado (entidad observable)', term: 'peso corporal sin calzado', conceptId: '425024002', semanticTag: 'entidad observable' }, { fsn: 'peso de referencia (entidad observable)', term: 'peso de referencia', conceptId: '248350002', semanticTag: 'entidad observable' }, { fsn: 'peso previo (entidad observable)', term: 'peso previo', conceptId: '248351003', semanticTag: 'entidad observable' }];

    let prestaciones = await Prestacion.find(query).exec();
    let data = [];
    dbg('comenzando a recorrer ', prestaciones.length, ' prestaciones');
    // recorremos prestaciones
    prestaciones.forEach((prestacion: any) => {
        // recorremos los registros de cada prestacion
        prestacion.ejecucion.registros.forEach(unRegistro => {
            let registroPeso;
            let registroAltura;
            // verificamos que el concepto coincida con alguno de los elementos enviados en los conceptos
            if (unRegistro.concepto && unRegistro.concepto.conceptId && conceptosAltura.find(c => c.conceptId === unRegistro.concepto.conceptId)) {
                let registroAltura = {
                    efector: prestacion.ejecucion.organizacion.nombre,
                    // tipoPrestacion: prestacion.solicitud.tipoPrestacion,
                    documento: prestacion.paciente.documento,
                    apellido: prestacion.paciente.apellido,
                    nombre: prestacion.paciente.nombre,
                    sexo: prestacion.paciente.sexo,
                    fechaNacimiento: prestacion.paciente.fechaNacimiento,
                    fecha: unRegistro.createdAt,
                    // profesional: unRegistro.createdBy,
                    registro: unRegistro
                };
            }
            if (unRegistro.concepto && unRegistro.concepto.conceptId && conceptosPeso.find(c => c.conceptId === unRegistro.concepto.conceptId)) {
                let registroPeso = {
                    efector: prestacion.ejecucion.organizacion.nombre,
                    // tipoPrestacion: prestacion.solicitud.tipoPrestacion,
                    documento: prestacion.paciente.documento,
                    apellido: prestacion.paciente.apellido,
                    nombre: prestacion.paciente.nombre,
                    sexo: prestacion.paciente.sexo,
                    fechaNacimiento: prestacion.paciente.fechaNacimiento,
                    fecha: unRegistro.createdAt,
                    // profesional: unRegistro.createdBy,
                    registro: unRegistro
                };
            }
            if (registroPeso && registroAltura) {
                data.push({

                })
                dbg({
                    efector: prestacion.ejecucion.organizacion.nombre,
                    // tipoPrestacion: prestacion.solicitud.tipoPrestacion,
                    documento: prestacion.paciente.documento,
                    apellido: prestacion.paciente.apellido,
                    nombre: prestacion.paciente.nombre,
                    sexo: prestacion.paciente.sexo,
                    fechaNacimiento: prestacion.paciente.fechaNacimiento,
                    fecha: unRegistro.createdAt,
                    // profesional: unRegistro.createdBy,
                    conceptoAltura: registroAltura.nombre,
                    valorAltura: registroAltura.valor,
                    conceptoPeso: registroPeso.nombre,
                    valorPeso: registroPeso.valor
                });
            }


        });
    });

}
