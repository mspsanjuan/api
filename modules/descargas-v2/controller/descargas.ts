import { create, CreateOptions } from 'html-pdf';
import { renderSync } from 'node-sass';
import { join } from 'path';
import { promisify } from 'util';
import { readFile } from 'fs';
import { model as Prestacion } from '../../rup/schemas/prestacion';
import moment = require('moment');
import { compile } from 'handlebars';
import { buscarPaciente } from '../../../core/mpi/controller/paciente';
import { getChildren } from '../../../core/term/controller/snomedCtr';
import { ISnomedConcept } from '../../../modules/rup/schemas/snomed-concept';
import { Organizacion } from '../../../core/tm/schemas/organizacion';
import { generarInforme } from './informe';
import * as conceptoTurneable from '../../../core/tm/schemas/tipoPrestacion';
import * as rup from '../../../modules/rup/schemas/elementoRUP';
import { makeFsFirma } from '../../../core/tm/schemas/firmaProf';
import { streamToBase64 } from '../utils';
import { Auth } from 'auth/auth.class';

/**
 *
 * @param req ExpressJS request
 * @param res ExpressJS response
 * @param next ExpressJS next
 * @param options html-pdf/PhantonJS rendering options
 */
export async function descargarPDF(idPrestacion, idOrganizacion, usuario, options = null) {
    // PhantomJS PDF rendering options
    // https://www.npmjs.com/package/html-pdf
    // http://phantomjs.org/api/webpage/property/paper-size.html
    let phantomPDFOptions: CreateOptions = {
        // phantomPath: './node_modules/phantomjs-prebuilt/bin/phantomjs',
        format: 'A4',
        border: {
            // default is 0, units: mm, cm, in, px
            top: '.25cm',
            right: '0cm',
            bottom: '3cm',
            left: '0cm'
        },
        header: {
            height: '5.75cm',
        },
        footer: {
            height: '1cm',
            contents: {

            }
        }
    };
    options = options || phantomPDFOptions;
    let htmlPDF = await generarHTML(idPrestacion, idOrganizacion, usuario);
    const htmlCssPDF = htmlPDF + generarCSS();

    let newPDF = await crearPDF(htmlCssPDF, options);
    return newPDF;
}


function crearPDF(htmlCssPDF: string, options): Promise<string> {
    return new Promise((resolve, reject) => {
        create(htmlCssPDF, options).toFile((error, file): any => {
            if (error) {
                reject(error);
            }
            resolve(file.filename);
        });
    });
}

function generarCSS() {
    // Se agregan los estilos CSS
    let scssFile = join(__dirname, '../../../templates/rup/informes/sass/main.scss');

    // Se agregan los estilos
    let css = '<style>\n\n';

    // SCSS => CSS
    css += renderSync({
        file: scssFile
    }).css;
    css += '</style>';
    return css;
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
    let mpc = [
        'entidad observable',
        'regimen/tratamiento',
        'procedimiento',
        'hallazgo',
        'trastorno'
    ];
    return mpc.findIndex(x => x === st) > -1;
}

async function generarHTML(idPrestacion, idOrganizacion, usuario) {
    let informeRegistros: any[] = [];

    const read = promisify(readFile);


    // Prestación
    let prestacion: any = await Prestacion.findById(idPrestacion).exec();

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

    let registros = prestacion.ejecucion.registros[0].registros.length ? prestacion.ejecucion.registros[0].registros : prestacion.ejecucion.registros;

    // SE ARMA TODO EL HTML PARA GENERAR EL PDF:
    let informe = await generarInforme(registros, informeRegistros, prestacion.solicitud.tipoPrestacion.conceptId);
    // Si no hay configuración de informe o si se configura "registrosDefault" en true, se genera el informe por defecto (default)
    if (!config.informe || config.informe.registrosDefault) {
        contenidoInforme = informe.filter(x => x !== undefined ? x : null);
    } else {
        contenidoInforme = informe;
    }
    // Se leen header y footer (si se le pasa un encoding, devuelve un string)
    let html = await read(join(__dirname, '../../../templates/rup/informes/html/informe.html'), 'utf8');

    let nombreCompleto = paciente.apellido + ', ' + paciente.nombre;
    let fechaNacimiento = paciente.fechaNacimiento ? moment(paciente.fechaNacimiento).format('DD/MM/YYYY') : 's/d';
    let hoy = moment();
    let edad = paciente.fechaNacimiento ? hoy.diff(moment(paciente.fechaNacimiento), 'years') + ' años' : '';
    let datosRapidosPaciente = `${paciente.sexo} | ${edad} | ${paciente.documento}`;

    let idOrg = idOrganizacion;
    let organizacion: any = await Organizacion.findById(idOrg).exec();

    let carpeta = paciente.carpetaEfectores.find(x => x.organizacion.id === idOrg);

    const firmaProfesional = await getFirma(prestacion.solicitud.profesional);
    let profesionalSolicitud = prestacion.solicitud.profesional.apellido + ', ' + prestacion.solicitud.profesional.nombre;
    const profesionalValidacion = prestacion.updatedBy ? prestacion.updatedBy.nombreCompleto : prestacion.createdBy.nombreCompleto;

    profesionalSolicitud += '<br>' + prestacion.solicitud.organizacion.nombre.substring(0, prestacion.solicitud.organizacion.nombre.indexOf('-'));


    let orgacionacionDireccionSolicitud = organizacion.direccion.valor + ', ' + organizacion.direccion.ubicacion.localidad.nombre;

    // HEADER
    html = html
        .replace('<!--paciente-->', nombreCompleto)
        .replace('<!--datosRapidosPaciente-->', datosRapidosPaciente)
        .replace('<!--fechaNacimiento-->', fechaNacimiento)
        .replace('<!--nroCarpeta-->', (carpeta && carpeta.nroCarpeta ? carpeta.nroCarpeta : 'sin número de carpeta'))
        .replace(/(<!--organizacionNombreSolicitud-->)/g, prestacion.solicitud.organizacion.nombre.replace(' - ', '<br>'))
        .replace('<!--orgacionacionDireccionSolicitud-->', orgacionacionDireccionSolicitud)
        .replace('<!--fechaSolicitud-->', moment(prestacion.solicitud.fecha).format('DD/MM/YYYY'))
        .replace('<!--profesionalSolicitud-->', profesionalSolicitud);

    let fechaEjecucion = new Date(prestacion.estados.find(x => x.tipo === 'ejecucion').createdAt);
    let fechaValidacion = new Date(prestacion.estados.find(x => x.tipo === 'validada').createdAt);

    // BODY

    if (prestacion.solicitud.tipoPrestacion.conceptId === '2341000013106') {
        const valor = prestacion.ejecucion.registros[0].valor;
        const fechaIngreso = valor && valor.fechaDesde ? moment(valor.fechaDesde).format('DD/MM/YYYY') : null;
        const fechaEgreso = valor && valor.fechaHasta ? moment(valor.fechaHasta).format('DD/MM/YYYY') : null;
        const unidadOrganizativa = valor && valor.unidadOrganizativa ? valor.unidadOrganizativa.term : null;
        if (fechaIngreso) {
            html = html.replace('<!--fechaIngreso-->', '<b> Ingreso: </b>' + fechaIngreso + '&nbsp;&nbsp;&nbsp;');
        }
        if (fechaEgreso) {
            html = html.replace('<!--fechaEgreso-->', '<b> Egreso: </b>' + fechaEgreso + '&nbsp;&nbsp;&nbsp;');
        }
        if (unidadOrganizativa) {
            html = html.replace('<!--unidadOrganizativa-->', '<b> Servicio: </b>' + unidadOrganizativa + '&nbsp;&nbsp;&nbsp;');
        }

    }


    html = html.replace('<!--tipoPrestacion-->', tipoPrestacion)
        .replace('<!--fechaSolicitud-->', moment(prestacion.solicitud.fecha).format('DD/MM/YYYY HH:mm') + ' hs')
        .replace('<!--tituloFechaEjecucion-->', tituloFechaEjecucion)
        .replace('<!--tituloFechaValidacion-->', tituloFechaValidacion)
        .replace('<!--fechaEjecucion-->', moment(fechaEjecucion).format('DD/MM/YYYY HH:mm') + ' hs')
        .replace('<!--fechaValidacion-->', moment(fechaValidacion).format('DD/MM/YYYY HH:mm') + ' hs')
        .replace('<!--tituloInforme-->', tituloInforme ? tituloInforme : '')
        // .replace('<!--contenidoInforme-->', contenidoInforme ? contenidoInforme : '')
        .replace('<!--registros-->', (contenidoInforme && contenidoInforme.length) ? contenidoInforme.map(x => typeof x.valor === 'string' ? x.valor : JSON.stringify(x.valor)).join('') : informe);
    // FOOTER
    html = html
        .replace('<!--profesionalFirmante1-->', profesionalSolicitud)
        .replace('<!--usuario-->', usuario)
        .replace(/(<!--fechaActual-->)/g, moment().format('DD/MM/YYYY HH:mm') + ' hs')
        .replace('<!--profesionalValidacion-->', profesionalValidacion)
        .replace('<!--fechaValidacion-->', moment(fechaValidacion).format('DD/MM/YYYY HH:mm') + ' hs')
        .replace('<!--organizacionNombreSolicitud-->', prestacion.solicitud.organizacion.nombre)
        .replace('<!--orgacionacionDireccionSolicitud-->', organizacion.direccion.valor + ', ' + organizacion.direccion.ubicacion.localidad.nombre)
        .replace('<!--fechaSolicitud-->', moment(prestacion.solicitud.fecha).format('DD/MM/YYYY'));

    if (firmaProfesional) {
        html = html.replace('<!--firma1-->', `<img src="data:image/png;base64,${firmaProfesional}">`);
    }

    if (config.informe && motivoPrincipalDeConsulta) {
        html = html.replace('<!--motivoPrincipalDeConsulta-->', motivoPrincipalDeConsulta);
    }

    // Se carga logo del efector, si no existe se muestra el nombre del efector como texto
    let nombreLogo = prestacion.solicitud.organizacion.nombre.toLocaleLowerCase().replace(/-|\./g, '').replace(/ {2,}| /g, '-');
    try {
        let logoEfector;
        logoEfector = await read(join(__dirname, '../../../templates/rup/informes/img/efectores/' + nombreLogo + '.png'));
        html = html.replace('<!--logoOrganizacion-->', `<img class="logo-efector" src="data:image/png;base64,${logoEfector.toString('base64')}">`);
    } catch (fileError) {
        html = html.replace('<!--logoOrganizacion-->', `<b class="no-logo-efector">${prestacion.solicitud.organizacion.nombre}</b>`);
    }

    // Logos comunes a todos los informes
    let logoAdicional = await read(join(__dirname, '../../../templates/rup/informes/img/logo-adicional.png'));
    let logoAndes = await read(join(__dirname, '../../../templates/rup/informes/img/logo-andes-h.png'));
    let logoPDP = await read(join(__dirname, '../../../templates/rup/informes/img/logo-pdp.png'));
    let logoPDP2 = await read(join(__dirname, '../../../templates/rup/informes/img/logo-pdp-h.png'));

    // Firmas
    html = html
        .replace('<!--logoAdicional-->', `<img class="logo-adicional" src="data:image/png;base64,${logoAdicional.toString('base64')}">`)
        .replace('<!--logoAndes-->', `<img class="logo-andes" src="data:image/png;base64,${logoAndes.toString('base64')}">`)
        .replace('<!--logoPDP-->', `<img class="logo-pdp" src="data:image/png;base64,${logoPDP.toString('base64')}">`)
        .replace('<!--logoPDP2-->', `<img class="logo-pdp-h" src="data:image/png;base64,${logoPDP2.toString('base64')}">`);

    return (html);
}
