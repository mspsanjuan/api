import { ucaseFirst } from '../utils';
import { promisify } from 'util';
import { join } from 'path';
import { readFile } from 'fs';

const read = promisify(readFile);
const insumos = [
    'producto',
];


export async function generarRegistroInsumoHTML(producto: any): Promise<any> {
    let template = await read(join(__dirname, '../../../templates/rup/informes/html/includes/insumo.html'), 'utf8');

    return template
        .replace('<!--concepto-->', ucaseFirst(producto.concepto.term))
        .replace('<!--motivoPrincipalDeConsulta-->', producto.esDiagnosticoPrincipal === true ? 'PROCEDIMIENTO / DIAGNÓSTICO PRINCIPAL' : '')
        .replace('<!--recetable-->', producto.valor.recetable ? '(recetable)' : '(no recetable)')
        .replace('<!--estado-->', producto.valor.estado ? producto.valor.estado : '')
        .replace('<!--cantidad-->', producto.valor.cantidad ? producto.valor.cantidad : '(sin valor)')
        .replace('<!--unidad-->', producto.valor.unidad ? producto.valor.unidad : '(unidades sin especificar)')
        .replace('<!--cantidadDuracion-->', (producto.valor.duracion && producto.valor.duracion.cantidad) ? producto.valor.duracion.cantidad : '(sin valor)')
        .replace('<!--unidadDuracion-->', (producto.valor.duracion && producto.valor.duracion.unidad) ? producto.valor.duracion.unidad : '(sin valor)')
        .replace('<!--indicacion-->', (producto.valor.indicacion && typeof producto.valor.indicacion !== 'undefined') ? `<b>Indicación:</b> ${producto.valor.indicacion}` : '');
}

export function esInsumo(st) {
    return insumos.findIndex(x => x === st) > -1;
}
