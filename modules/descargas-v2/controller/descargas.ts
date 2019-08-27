import { join } from 'path';
import { promisify } from 'util';
import { readFile } from 'fs';
import { model as Prestacion } from '../../rup/schemas/prestacion';
import moment = require('moment');
import { buscarPaciente } from '../../../core/mpi/controller/paciente';
import { getChildren } from '../../../core/term/controller/snomedCtr';
import { ISnomedConcept } from '../../../modules/rup/schemas/snomed-concept';
import { Organizacion } from '../../../core/tm/schemas/organizacion';
import { generarInforme } from './informe';
import * as conceptoTurneable from '../../../core/tm/schemas/tipoPrestacion';
import * as rup from '../../../modules/rup/schemas/elementoRUP';
import { makeFsFirma } from '../../../core/tm/schemas/firmaProf';
import { streamToBase64, generarCSS, crearPDF } from '../utils';
import { phantomPDFOptions, templates, semanticTags, } from '../descargas.config';
import { compile } from 'handlebars';
import { generarInformeColono } from './informeColono';
const read = promisify(readFile);

/**
 *
 * @param req ExpressJS request
 * @param res ExpressJS response
 * @param next ExpressJS next
 * @param options html-pdf/PhantonJS rendering options
 */
export async function descargarInformePrestacion(idPrestacion, idRegistro, idOrganizacion, usuario, options = null) {
    options = options || phantomPDFOptions;
    let htmlPDF = await generarHTML(idPrestacion, idRegistro, idOrganizacion, usuario);
    const htmlCssPDF = htmlPDF + generarCSS();
    let newPDF = await crearPDF(htmlCssPDF, options);
    return newPDF;
}
export async function descargarInformeColono(idPrestacion, idOrganizacion, usuario, options = null) {
    options = options || phantomPDFOptions;
    let htmlPDF = await generarInformeColono(idPrestacion, idOrganizacion, usuario);
    const htmlCssPDF = htmlPDF + generarCSS();
    let newPDF = await crearPDF(htmlCssPDF, options);
    return newPDF;
}

async function getConfig(idPrestacion) {
    let config: any = await conceptoTurneable.tipoPrestacion.findOne({ conceptId: idPrestacion }).exec();
    if (!config) {
        config = await rup.elementoRUP.findOne({ 'conceptos.conceptId': idPrestacion }).exec();
    }
    return config;
}

async function getFirma(profesional) {
    const FirmaSchema = makeFsFirma();
    const file = await FirmaSchema.findOne({ 'metadata.idProfesional': String(profesional.id) }, {}, { sort: { _id: -1 } }).exec();
    if (file) {
        const stream = FirmaSchema.readById(file.id);
        const base64 = await streamToBase64(stream);
        return base64;
    }
    return null;
}

function existeSemanticTagMPC(st) {
    return semanticTags.mpc.findIndex(x => x === st) > -1;
}

async function generarHTML(idPrestacion, idRegistro, idOrganizacion, usuario) {
    let informeRegistros: any[] = [];
    // Prestación
    let prestacion: any = await Prestacion.findById(idPrestacion).exec();
    let registro: any = idRegistro ? prestacion.ejecucion.registros.find(y => y.id === idRegistro) : null;
    // Títulos default
    let tituloFechaEjecucion = 'Fecha Ejecución';
    let tituloFechaValidacion = 'Fecha Validación';
    // Configuraciones de informe propios de la prestación
    let config: any = await getConfig(prestacion.solicitud.tipoPrestacion.conceptId);
    // Paciente
    let resultado: any = await buscarPaciente(prestacion.paciente.id);
    let paciente = resultado.paciente;
    if (!paciente.id || !config) {
        return (false);
    }
    let tipoPrestacion;
    let tituloInforme;
    if (config.informe) {
        // Override título "Fecha Ejecución"?
        tituloFechaEjecucion = config.informe.fechaEjecucionOverride ? config.informe.fechaEjecucionOverride : tituloFechaEjecucion;
        // Override título "Fecha Validación"?
        tituloFechaValidacion = config.informe.fechaValidacionOverride ? config.informe.fechaValidacionOverride : tituloFechaValidacion;
    }
    // Vemos si el tipo de prestación tiene registros que son hijos directos (TP: Ecografía; Hijo: Ecografía obstétrica)
    let hijos = await getChildren(prestacion.solicitud.tipoPrestacion.conceptId, { all: true });
    let motivoPrincipalDeConsulta: ISnomedConcept | any;
    let tituloRegistro;
    let contenidoInforme;
    // Override título del primer registro?
    if (config.informe && config.informe.tipoPrestacionTituloOverride) {
        tituloRegistro = hijos.find(x => prestacion.ejecucion.registros.find(y => y.concepto.conceptId === x.conceptId));

        tipoPrestacion = prestacion.ejecucion.registros[0].nombre;
        tituloInforme = config.informe.registroTituloOverride;
        prestacion.ejecucion.registros[0].concepto.term = tituloInforme;
        tituloInforme = tituloInforme[0].toUpperCase() + tituloInforme.slice(1);

        if (prestacion.solicitud.tipoPrestacion.conceptId === '73761001') {
            tipoPrestacion = prestacion.solicitud.tipoPrestacion.term;
            tituloInforme = '';
        }
    } else {
        // Si tiene un hijo directo, usamos su nombre como título de la consulta
        tipoPrestacion = prestacion.solicitud.tipoPrestacion.term[0].toUpperCase() + prestacion.solicitud.tipoPrestacion.term.slice(1);
    }
    // Existe configuración de PROCEDIMIENTO / DIAGNÓSTICO PRINCIPAL?
    if (config.informe && config.informe.motivoPrincipalDeConsultaOverride) {
        if (prestacion.ejecucion.registros.length > 1) {
            let existeConcepto = prestacion.ejecucion.registros.find(x => existeSemanticTagMPC(x.concepto.semanticTag) && x.esDiagnosticoPrincipal);

            if (existeConcepto && existeConcepto.esDiagnosticoPrincipal && tituloRegistro && tituloRegistro.conceptId !== existeConcepto.concepto.conceptId) {
                if (existeConcepto.concepto) {
                    motivoPrincipalDeConsulta = existeConcepto.concepto;
                } else {
                    motivoPrincipalDeConsulta = {};
                }
            }
        }
    }
    let registros = (!registro) ? (prestacion.ejecucion.registros[0].registros.length ? prestacion.ejecucion.registros[0].registros : prestacion.ejecucion.registros) : [registro];
    let informe = await generarInforme(registros, informeRegistros, prestacion.solicitud.tipoPrestacion.conceptId);

    if (!config.informe || config.informe.registrosDefault) {
        contenidoInforme = informe.filter(x => x !== undefined ? x : null);
    } else {
        contenidoInforme = informe;
    }
    let html = await read(join(__dirname, templates.informes), 'utf8');
    let idOrg = idOrganizacion;
    let organizacion: any = await Organizacion.findById(idOrg).exec();
    let hoy = moment();
    let edad = paciente.fechaNacimiento ? hoy.diff(moment(paciente.fechaNacimiento), 'years') + ' años' : '';
    const profesionalSolicitud = prestacion.solicitud.profesional.apellido + ', ' + prestacion.solicitud.profesional.nombre + '<br>' + prestacion.solicitud.organizacion.nombre.substring(0, prestacion.solicitud.organizacion.nombre.indexOf('-'));
    // REGISTROS
    let registrosHTML = (contenidoInforme && contenidoInforme.length)
        ? (contenidoInforme.map(x => typeof x.valor === 'string' ? x.valor : JSON.stringify(x.valor)).join(''))
        : informeRegistros;
    let carpeta = paciente.carpetaEfectores.find(x => x.organizacion.id === idOrg);
    carpeta = (carpeta && carpeta.nroCarpeta ? carpeta.nroCarpeta : 'sin número de carpeta');
    let nombreLogo = organizacion.nombre.toLocaleLowerCase().replace(/-|\./g, '').replace(/ {2,}| /g, '-');
    let logoEfector = await read(join(__dirname, templates.efectores + nombreLogo + '.png'));
    let logoAdicional = await read(join(__dirname, templates.logoAdicional));
    let logoAndes = await read(join(__dirname, templates.logoAndes));
    let logoPDP = await read(join(__dirname, templates.logoPDP));
    let logoPDP2 = await read(join(__dirname, templates.logoPDP2));
    let fechaEjecucion: any = '';
    let fechaValidacion: any = '';
    // Es una Epicrisis?
    if (prestacion.solicitud.tipoPrestacion.conceptId === '2341000013106') {
        fechaEjecucion = '<b>Fecha de Ingreso:</b> <br>' + moment(prestacion.ejecucion.registros[0].valor.fechaDesde).format('DD/MM/YYYY');
        fechaValidacion = '<b>Fecha de Egreso:</b> <br>' + moment(prestacion.ejecucion.registros[0].valor.fechaHasta).format('DD/MM/YYYY');
    } else {
        // HEADER
        fechaEjecucion = new Date(prestacion.estados.find(x => x.tipo === 'ejecucion').createdAt);
        fechaEjecucion = moment(fechaEjecucion).format('DD/MM/YYYY HH:mm') + ' hs';
        fechaValidacion = new Date(prestacion.estados.find(x => x.tipo === 'validada').createdAt);
        fechaValidacion = moment(fechaValidacion).format('DD/MM/YYYY HH:mm') + ' hs';
    }
    let datos = {
        nombreCompleto: paciente.apellido + ', ' + paciente.nombre,
        fechaActual: moment().format('DD/MM/YYYY HH:mm') + ' hs',
        datosRapidosPaciente: `${paciente.sexo} | ${edad} | ${paciente.documento}`,
        fechaNacimiento: paciente.fechaNacimiento ? moment(paciente.fechaNacimiento).format('DD/MM/YYYY') : 's/d',
        carpeta,
        organizacionNombreSolicitud: prestacion.solicitud.organizacion.nombre,
        orgacionacionDireccionSolicitud: organizacion.direccion.valor + ', ' + organizacion.direccion.ubicacion.localidad.nombre,
        profesionalSolicitud,
        fechaSolicitud: moment(prestacion.solicitud.fecha).format('DD/MM/YYYY HH:mm') + ' hs',
        tipoPrestacion,
        tituloFechaEjecucion,
        tituloInforme,
        registrosHTML,
        motivoPrincipalDeConsulta,
        usuario,
        profesionalValidacion: prestacion.updatedBy ? prestacion.updatedBy.nombreCompleto : prestacion.createdBy.nombreCompleto,
        logoEfector,
        logoAdicional,
        logoAndes,
        logoPDP,
        logoPDP2,
        fechaEjecucion,
        fechaValidacion,
    };
    // Limpio el informe
    informeRegistros = [];
    const template = compile(html);
    html = template(datos);
    return (html);
}
