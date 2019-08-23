import { ucaseFirst } from '../utils';
import { templates } from '../descargas.config';


export async function generarRegistroHallazgoHTML(hallazgo: any): Promise<any> {
    const concepto = hallazgo.nombre ? hallazgo.nombre : ucaseFirst(hallazgo.concepto.term);
    const evolucion = (hallazgo.valor && hallazgo.valor.evolucion) ? `<p><b>Evolución</b>: ${hallazgo.valor.evolucion}` : ``;
    const motivoPrincipalDeConsulta = hallazgo.esDiagnosticoPrincipal === true ? 'PROCEDIMIENTO / DIAGNÓSTICO PRINCIPAL' : '';

    const datos = {
        concepto,
        evolucion,
        motivoPrincipalDeConsulta
    };

    const template = Handlebars.compile(templates.hallazgos);
    return template(datos);
}
