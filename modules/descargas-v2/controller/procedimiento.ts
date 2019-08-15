import { ucaseFirst } from '../utils';
import { join } from 'path';
import { readFile } from 'fs';
import { promisify } from 'util';
import { templates } from '../descargas.config';

const read = promisify(readFile);

export async function generarRegistroProcedimientoHTML(proc: any): Promise<any> {
    let valor;
    if (proc.valor === 1) {
        valor = 'SI';
    } else if (proc.valor === 0) {
        valor = 'NO';
    } else if (proc.concepto.conceptId === '716141001') {
        valor = `${proc.valor.total}/9`;
    } else if (proc.concepto.conceptId === '371767005') {
        const unidad = 'minutos';
        valor = `${proc.valor} ${unidad}`;
    } else if (proc.valor.id !== undefined && proc.valor.label !== undefined) {
        valor = proc.valor.otro ? proc.valor.otro : proc.valor.label;
    } else if (proc.valor.concepto) {
        valor = proc.valor.concepto.term.toString();
    } else {
        valor = proc.valor.toString();
    }
    let template = await read(join(__dirname, templates.procedimientos), 'utf8');
    return template
        .replace('<!--concepto-->', proc.concepto.conceptId !== '716141001' ? ucaseFirst(proc.nombre) : (proc.concepto.term[0].toLocaleUpperCase() + proc.concepto.term.slice(1)))
        .replace('<!--valor-->', valor)
        .replace('<!--motivoPrincipalDeConsulta-->', proc.esDiagnosticoPrincipal === true ? 'PROCEDIMIENTO / DIAGNÓSTICO PRINCIPAL' : '');
}
