import { ucaseFirst } from '../utils';
import { readFile } from 'fs';
import { promisify } from 'util';
import { join } from 'path';

const read = promisify(readFile);
const hallazgos = [
    'hallazgo',
    'situacion',
    'trastorno',
    'objeto físico',
    'medicamento clínico',
];

export function esHallazgo(st) {
    return hallazgos.findIndex(x => x === st) > -1;
}

export async function generarRegistroHallazgoHTML(hallazgo: any): Promise<any> {
    let template = await read(join(__dirname, '../../../templates/rup/informes/html/includes/hallazgo.html'), 'utf8');
    return template
        .replace('<!--concepto-->', hallazgo.nombre ? hallazgo.nombre : ucaseFirst(hallazgo.concepto.term))
        .replace('<!--evolucion-->', (hallazgo.valor && hallazgo.valor.evolucion) ? `<p><b>Evolución</b>: ${hallazgo.valor.evolucion}` : ``)
        .replace('<!--motivoPrincipalDeConsulta-->', hallazgo.esDiagnosticoPrincipal === true ? 'PROCEDIMIENTO / DIAGNÓSTICO PRINCIPAL' : '');
}
