import { join } from 'path';
import { promisify } from 'util';
import { readFile } from 'fs';
import moment = require('moment');
import { templates, phantomPDFOptions } from '../descargas.config';
import descargas = require('./descargas');
import { generarCSS, crearPDF } from '../utils';
const read = promisify(readFile);

export async function descargarCenso(params, generador, options = null) {
    options = options || phantomPDFOptions;
    let htmlPDF = await generador(params);
    const htmlCssPDF = htmlPDF + generarCSS();
    let newPDF = await crearPDF(htmlCssPDF, options);
    return newPDF;
}

export async function generarHtmlCensoMensual(params) {
    let html = await read(join(__dirname, templates.censoMensual), 'utf8');
    html = await descargas.generarLogos(html, params);
    const fechaCensoDesde = moment(params.fechaDesde).format('DD/MM/YYYY');
    const fechaCensoHasta = moment(params.fechaHasta).format('DD/MM/YYYY');
    const unidadOrganizativa = params.unidad.term;
    let filas = '';
    for (let i = 0; i < params.listadoCenso.length; i++) {
        let censo = params.listadoCenso[i].censo;
        const fecha = moment(params.listadoCenso[i].fecha).format('DD/MM/YYYY');
        filas += `<tr><td>${fecha} </td>
                <td>${censo.existencia0}</td>
                <td>${censo.ingresos}</td>
                 <td>${censo.pasesDe}</td>
                 <td>${censo.egresosAlta}</td>
                <td>${censo.egresosDefuncion}</td>
                 <td>${censo.pasesA}</td>
                 <td>${censo.existencia24}</td>
                 <td>${censo.ingresoEgresoDia}</td>
                 <td>${censo.pacientesDia}</td>
                  <td>${censo.disponibles24}</td>
                  </tr>`;
    }
    let filaTotal = '';
    let censoTot = params.resumenCenso;
    filaTotal = `<tr>
                     <td><strong>Totales</strong></td>
                     <td><strong>${ censoTot.existencia0}</strong></td>
                     <td><strong>${ censoTot.ingresos} </strong></td>
                     <td><strong>${ censoTot.pasesDe}</strong></td>
                     <td><strong>${ censoTot.egresosAlta}</strong></td>
                     <td><strong>${ censoTot.egresosDefuncion}</strong></td>
                     <td><strong>${ censoTot.pasesA}</strong></td>
                     <td><strong>${ censoTot.existencia24}</strong></td>
                     <td><strong>${ censoTot.ingresoEgresoDia}</strong></td>
                     <td><strong>${ censoTot.pacientesDia}</strong></td>
                     <td><strong>${ censoTot.disponibles24}</strong></td>
                 </tr>`;
    let filaResumen = '';
    if (params.datosCenso) {
        let resumen = params.datosCenso;
        filaResumen = `<tr>
                    <td>${ resumen.diasF}</td>
                    <td>${ resumen.promDis}</td>
                    <td>${ resumen.pacDia}</td>
                    <td>${ resumen.mortHosp}</td>
                    <td>${ resumen.promPer}</td>
                    <td>${ resumen.giroCama}</td>
                    </tr>`;
    }
    html = html
        .replace('<!--fechaCensoDesde-->', fechaCensoDesde)
        .replace('<!--fechaCensoHasta-->', fechaCensoHasta)
        .replace('<!--unidadOrganizativa-->', unidadOrganizativa)
        .replace('<!--contenidoCenso-->', filas)
        .replace('<!--contenidoCensoTot-->', filaTotal)
        .replace('<!--ContenidoResumen-->', filaResumen);
    // FOOTER CENSO MENSUAL
    let fechaActual = moment(new Date());
    html = html
        .replace('<!--usuario-->', params.usuario)
        .replace('<!--fechaActual-->', fechaActual.format('DD [de] MMMM [de] YYYY'))
        .replace('<!--organizacionNombreSolicitud-->', params.organizacion.nombre);
    return (html);
}

export async function generarHTMLCensoDiario(params) {
    let html = await read(join(__dirname, templates.censoDiario), 'utf8');
    html = await descargas.generarLogos(html, params);

    const fechaCenso = moment(params.fecha).format('DD/MM/YYYY');
    const unidadOrganizativa = params.unidad.term;

    // vamos a armar la tabla con los datos del censo
    let filas = '';
    for (let i = 0; i < params.listadoCenso.length; i++) {
        let censo = params.listadoCenso[i];
        filas += `<tr><td>${censo.dataCenso.ultimoEstado.paciente.apellido} ${censo.dataCenso.ultimoEstado.paciente.nombre} |
                             ${censo.dataCenso.ultimoEstado.paciente.documento}</td>
                             <td>${censo.dataCenso.cama.nombre}</td>
                             <td>${censo.esIngreso ? 'SI' : 'NO'}</td>
                             <td>${censo.esPaseDe ? censo.esPaseDe.unidadOrganizativa.term : ''}</td>
                             <td>${censo.egreso}</td>
                             <td>${censo.esPaseA ? censo.esPaseA.unidadOrganizativa.term : ''}</td></tr>`;
    }

    let filaResumen = '';
    if (params.resumenCenso) {
        filaResumen = `<tr>
                     <td>${ params.resumenCenso.existencia0}</td>
                    <td>${ params.resumenCenso.ingresos}</td>
                     <td>${ params.resumenCenso.pasesDe}</td>
                     <td>${ params.resumenCenso.egresosAlta}</td>
                    <td>${ params.resumenCenso.egresosDefuncion}</td>
                     <td>${ params.resumenCenso.pasesA}</td>
                     <td>${ params.resumenCenso.existencia24}</td>
                     <td>${ params.resumenCenso.ingresoEgresoDia}</td>
                     <td>${ params.resumenCenso.pacientesDia}</td>
                      <td>${ params.resumenCenso.disponibles24}</td>
                 </tr>`;

    }

    html = html
        .replace('<!--fechaCenso-->', fechaCenso)
        .replace('<!--unidadOrganizativa-->', unidadOrganizativa)
        .replace('<!--contenidoCenso-->', filas)
        .replace('<!--ContenidoResumen-->', filaResumen);

    // FOOTER
    html = html
        .replace('<!--usuario-->', params.usuario)
        .replace(/(<!--fechaActual-->)/g, moment().format('DD/MM/YYYY HH:mm') + ' hs')
        .replace('<!--organizacionNombreSolicitud-->', params.organizacion.nombre);


    return (html);

}
