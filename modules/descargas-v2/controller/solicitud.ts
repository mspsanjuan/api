import { ucaseFirst } from '../utils';
import { promisify } from 'util';
import { join } from 'path';
import { readFile } from 'fs';
import { templates } from '../descargas.config';

const read = promisify(readFile);

export async function generarRegistroSolicitudHTML(plan: any): Promise<any> {
    let template = await read(join(__dirname, templates.solicitudes), 'utf8');
    return template
        .replace('<!--plan-->', ucaseFirst(plan.concepto.term))
        .replace('<!--motivo-->', plan.valor.solicitudPrestacion.motivo)
        .replace('<!--indicaciones-->', plan.valor.solicitudPrestacion.indicaciones)
        .replace('<!--organizacionDestino-->', (plan.valor.solicitudPrestacion.organizacionDestino ? plan.valor.solicitudPrestacion.organizacionDestino.nombre : ''))
        .replace('<!--profesionalesDestino-->', plan.valor.solicitudPrestacion.profesionalesDestino ? plan.valor.solicitudPrestacion.profesionalesDestino.map(y => y.nombreCompleto).join(' ') : '');

}
