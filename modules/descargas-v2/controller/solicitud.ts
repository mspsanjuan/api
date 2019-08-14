import { ucaseFirst } from '../utils';
import { promisify } from 'util';
import { join } from 'path';
import { readFile } from 'fs';

const read = promisify(readFile);
const solicitudes = [
    'procedimiento',
    'entidad observable',
    'régimen/tratamiento',
    'elemento de registro'
];

export function esSolicitud(st, esSolicitud) {
    return (solicitudes.findIndex(x => x === st) > -1) && esSolicitud;
}

export async function generarRegistroSolicitudHTML(plan: any): Promise<any> {
    let template = await read(join(__dirname, '../../../templates/rup/informes/html/includes/hallazgo.html'), 'utf8');
    return template
        .replace('<!--plan-->', ucaseFirst(plan.concepto.term))
        .replace('<!--motivo-->', plan.valor.solicitudPrestacion.motivo)
        .replace('<!--indicaciones-->', plan.valor.solicitudPrestacion.indicaciones)
        .replace('<!--organizacionDestino-->', (plan.valor.solicitudPrestacion.organizacionDestino ? plan.valor.solicitudPrestacion.organizacionDestino.nombre : ''))
        .replace('<!--profesionalesDestino-->', plan.valor.solicitudPrestacion.profesionalesDestino ? plan.valor.solicitudPrestacion.profesionalesDestino.map(y => y.nombreCompleto).join(' ') : '');

}
