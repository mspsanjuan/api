import { ucaseFirst } from '../utils';
import { readFile } from 'fs';
import { promisify } from 'util';
import { join } from 'path';
import { templates } from '../descargas.config';

const read = promisify(readFile);

export async function generarRegistroHallazgoHTML(hallazgo: any): Promise<any> {
    let template = await read(join(__dirname, templates.hallazgos), 'utf8');
    return template
        .replace('<!--concepto-->', hallazgo.nombre ? hallazgo.nombre : ucaseFirst(hallazgo.concepto.term))
        .replace('<!--evolucion-->', (hallazgo.valor && hallazgo.valor.evolucion) ? `<p><b>Evolución</b>: ${hallazgo.valor.evolucion}` : ``)
        .replace('<!--motivoPrincipalDeConsulta-->', hallazgo.esDiagnosticoPrincipal === true ? 'PROCEDIMIENTO / DIAGNÓSTICO PRINCIPAL' : '');
}
