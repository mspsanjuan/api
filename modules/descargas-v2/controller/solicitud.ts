import { ucaseFirst } from '../utils';
import { templates } from '../descargas.config';
import { compile } from 'handlebars';

export async function generarRegistroSolicitudHTML(plan: any): Promise<any> {
    const datos = {
        plan: ucaseFirst(plan.concepto.term),
        motivo: plan.valor.solicitudPrestacion.motivo,
        indicaciones: plan.valor.solicitudPrestacion.indicaciones,
        organizacionDestino: plan.valor.solicitudPrestacion.organizacionDestino ? plan.valor.solicitudPrestacion.organizacionDestino.nombre : '',
        profesionalesDestino: plan.valor.solicitudPrestacion.profesionalesDestino ? plan.valor.solicitudPrestacion.profesionalesDestino.map(y => y.nombreCompleto).join(' ') : ''
    };

    const template = compile(templates.solicitudes);
    return template(datos);
}
