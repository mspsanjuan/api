import { endReporteHTML } from './../templates/endReporte';
import { pageBreakHTML } from './../templates/pageBreak';
import { startReporteHTML } from './../templates/startReporte';
import { resultadoPracticaHTML } from './../templates/resultadosPractica';
import { headerHTML } from './../templates/header';
import * as pdf from 'html-pdf';
import * as moment from 'moment';
import { env } from 'process';
import { calcularEdad } from './../../../../utils/utils';
import { datosProtocoloHTML } from '../templates/datosProtocolo';
import { getDatosFormacion } from '../../../../core/tm/controller/profesional';

moment.locale('es');

if (env.NODE_ENV !== 'production') {
    // tslint:disable-next-line:no-console
    process.on('unhandledRejection', r => console.log(r));
    // tslint:disable-next-line:no-console
    // process.on('TypeError', r => console.log(r));
}

export class Documento {

    private static options: pdf.CreateOptions = {};

    /**
     *
     *
     * @static
     * @param {*} req
     * @param {*} res
     * @param {*} next
     * @param {*} [options=null]
     * @returns
     * @memberof Documento
     */
    public static descargarReportesResultados(req, res, next, options = null) {
        return new Promise( async (resolve, reject) => {

            // PhantomJS PDF rendering options
            // https://www.npmjs.com/package/html-pdf
            // http://phantomjs.org/api/webpage/property/paper-size.html
            this.options = pdf.CreateOptions = {
                format: 'A4',
                border: {
                    top: '0.5cm',
                    right: '1cm',
                    bottom: '1cm',
                    left: '1cm'
                },
                header: {
                    top: '0cm',
                    height: '0cm'
                },
                footer: {
                    height: '1cm',
                    contents: {}
                }
            };

            pdf.create(await this.generarReporteResultados(req.body), this.options).toFile((err, file): any => {
                if (err) {
                    reject(err);
                }
                resolve(file.filename);
            });
        });
    }


    /**
     *
     *
     * @private
     * @static
     * @param {*} protocolos
     * @returns
     * @memberof Documento
     */
    private static async generarReporteResultados(protocolos) {
        await cargarDatosProfesionales(protocolos);
        let getHtmlHeader = (organizacionNombre) => {
            return headerHTML.replace('<!-- protocolos[0].solicitud.organizacion.nombre -->', organizacionNombre);
        };

        let getHtmlDatosProtocolo = (protocolo) => {
            let html = datosProtocoloHTML
                .replace('<!-- paciente.apellido, paciente.nombre -->', protocolo.paciente.apellido + ', ' + protocolo.paciente.nombre)
                .replace('<!-- paciente.documento -->', protocolo.paciente.documento)
                .replace('<!-- paciente.fechaNacimiento -->', moment(protocolo.paciente.fechaNacimiento).format('DD-MM-YYYY'))
                .replace('<!-- paciente.edad -->', calcularEdad(protocolo.paciente.fechaNacimiento))
                .replace('<!-- paciente.sexo -->', protocolo.paciente.sexo)
                .replace('<!-- solicitud.registros[0].valor.solicitudPrestacion.numeroProtocolo.numeroCompleto -->',
                    protocolo.solicitud.registros[0].valor.solicitudPrestacion.numeroProtocolo.numeroCompleto)
                .replace('<!-- ejecucion.fecha -->', moment(protocolo.ejecucion.fecha).format('DD-MM-YYYY'))
                .replace('<!-- solicitud.profesional.apellido, solicitud.profesional.nombre -->',
                    protocolo.solicitud.profesional.apellido + ', ' + protocolo.solicitud.profesional.nombre)
                .replace('<!-- solicitud.ambitoOrigen -->', protocolo.solicitud.ambitoOrigen);

            if (protocolo.solicitud.registros[0].valor.solicitudPrestacion.servicio) {
                html.replace('<!-- solicitud.registros[0].valor.solicitudPrestacion.servicio.term -->',
                    protocolo.solicitud.registros[0].valor.solicitudPrestacion.servicio.term);
            }
            return html;
        };

        let getHtmlResultadosPractica = (registro) => {
            let html = resultadoPracticaHTML.replace('<!-- registro.nombre -->', registro.nombre);

            if (registro.valor.resultado.valor) {
                let valor = registro.valor.resultado.valor;
                if (registro.valor.practica.unidadMedida && registro.valor.practica.unidadMedida.nombre) {
                    valor += ' ' + registro.valor.practica.unidadMedida.nombre;
                }
                html = html.replace('<!-- registro.valor.resultado.valor -->', valor);
            }

            if (registro.valor.valoresReferencia) {
                html = html.replace('<!-- registro.valor.valoresReferencia.valorMinimo + " - " + registro.valor.valoresReferencia.valorMaximo -->',
                    registro.valor.valoresReferencia.valorMinimo + ' - ' + registro.valor.valoresReferencia.valorMaximo);
            }

            if(registro.valor.resultado.metodo) {
                html = html.replace('<!-- registro.valor.resultado.metodo -->', registro.valor.resultado.metodo)
            }

            const formacionGrado = registro.valor.estados[registro.valor.estados.length - 1].usuario.formacionGrado;
            const firma = (formacionGrado ? (
                        formacionGrado.profesion.nombre === 'BIOQUÍMICO' ? 'Bioq' : 'Prof.'
                    ) + ' ' : '') +
                    registro.valor.estados[registro.valor.estados.length - 1].usuario.nombreCompleto +
                    (formacionGrado ? ' - MP: ' + formacionGrado.matriculacion[formacionGrado.matriculacion.length - 1].matriculaNumero : '');
            html = html.replace('<!-- registro.valor.resultado.firmaElectronica -->', firma);

            return html;
        };

        let htmlReporte = startReporteHTML;

        for (let i = 0; i < protocolos.length; i++) {
            htmlReporte += getHtmlHeader(protocolos[i].solicitud.organizacion.nombre);
            htmlReporte += getHtmlDatosProtocolo(protocolos[i]);
            for (let registro of protocolos[i].ejecucion.registros) {
                htmlReporte += getHtmlResultadosPractica(registro);
            }

            if (protocolos[i + 1]) {
                htmlReporte += pageBreakHTML;
            }
        }

        htmlReporte += endReporteHTML;
        return htmlReporte;
    }
}

/**
 *
 *
 * @param {*} protocolos
 */
async function cargarDatosProfesionales(protocolos) {
    const codigosProfesiones = [8];
    let estado;
    let documentos: any[]  = [];
    let documento;
    let res;

    protocolos.forEach(p => {
        p.ejecucion.registros.forEach( r => {
            documento = r.valor.estados[r.valor.estados.length - 1].usuario.id;
            if(documentos.indexOf(documento) < 0) {
                documentos.push(documento);
            }
        });
    });

    const datosFormacion: any = await getDatosFormacion(documentos, codigosProfesiones);
    protocolos.forEach(p => {
        p.ejecucion.registros.forEach( r => {
            estado = r.valor.estados[r.valor.estados.length - 1];
            res = datosFormacion.find( d => d._id.toString() === estado.usuario.id);
            estado.usuario.formacionGrado = res ? res.datosProfesion.formacionGrado : null;
        });
    });
}
