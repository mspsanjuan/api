import { ucaseFirst } from '../utils';
import { promisify } from 'util';
import { join } from 'path';
import { readFile } from 'fs';
import { templates } from '../descargas.config';
import { compile } from 'handlebars';
const read = promisify(readFile);

export async function generarRegistroInsumoHTML(producto: any): Promise<any> {
    const concepto = ucaseFirst(producto.concepto.term);
    const motivoPrincipalDeConsulta = producto.esDiagnosticoPrincipal === true ? 'PROCEDIMIENTO / DIAGNÓSTICO PRINCIPAL' : '';
    const recetable = producto.valor.recetable ? '(recetable)' : '(no recetable)';
    const estado = producto.valor.estado ? producto.valor.estado : '';
    const cantidad = producto.valor.cantidad ? producto.valor.cantidad : '(sin valor)';
    const unidad = producto.valor.unidad ? producto.valor.unidad : '(unidades sin especificar)';
    const cantidadDuracion = (producto.valor.duracion && producto.valor.duracion.cantidad) ? producto.valor.duracion.cantidad : '(sin valor)';
    const unidadDuracion = (producto.valor.duracion && producto.valor.duracion.unidad) ? producto.valor.duracion.unidad : '(sin valor)';
    const indicacion = (producto.valor.indicacion && typeof producto.valor.indicacion !== 'undefined') ? `<b>Indicación:</b> ${producto.valor.indicacion}` : '';

    const datos = {
        concepto,
        recetable,
        estado,
        cantidad,
        unidad,
        cantidadDuracion,
        unidadDuracion,
        indicacion,
        motivoPrincipalDeConsulta
    };

    const template = compile(await read(join(__dirname, templates.insumos), 'utf8'));
    return template(datos);
}
