import { ucaseFirst } from '../utils';
import { templates } from '../descargas.config';
import { compile } from 'handlebars';
import { promisify } from 'util';
import { readFile } from 'fs';
import { join } from 'path';
const read = promisify(readFile);

export async function generarRegistroHallazgoHTML(hallazgo: any): Promise<any> {
    const concepto = hallazgo.nombre ? hallazgo.nombre : ucaseFirst(hallazgo.concepto.term);
    const evolucion = (hallazgo.valor && hallazgo.valor.evolucion) ? `<p><b>Evolución</b>: ${hallazgo.valor.evolucion}` : ``;
    const motivoPrincipalDeConsulta = hallazgo.esDiagnosticoPrincipal === true ? 'PROCEDIMIENTO / DIAGNÓSTICO PRINCIPAL' : '';

    const datos = {
        concepto,
        evolucion,
        motivoPrincipalDeConsulta
    };

    const template = compile(await read(join(__dirname, templates.hallazgos), 'utf8'));
    return template(datos);
}
