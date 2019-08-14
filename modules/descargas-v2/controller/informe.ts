import { ucaseFirst } from '../utils';
import { generarRegistroHallazgoHTML, esHallazgo } from './hallazgo';
import { esSolicitud, generarRegistroSolicitudHTML } from './solicitud';
import { esProcedimiento, generarRegistroProcedimientoHTML } from './procedimiento';
import { esAdjunto, generarArchivoAdjuntoHTML } from './adjunto';
import { esInsumo, generarRegistroInsumoHTML } from './insumo';


let nivelPadre = 0;

export async function generarInforme(registros, informeRegistros, prestacionConceptId) {
    for (let i = 0; i < registros.length; i++) {
        if (registros[i]) {
            // Es resumen de la internación?
            if (registros[0].concepto.conceptId === '3571000013102') {
                nivelPadre = 1;

                // Es colonoscopia?
            } else if (registros[0].concepto.conceptId === '32780001') {
                nivelPadre = 1;
            } else {
                nivelPadre = (registros[i].registros.length > 0) ? 1 : 2;
            }
            if (registros[i].valor) {
                if (registros[i].valor.descripcion) {
                    informeRegistros = [...informeRegistros, ({
                        concepto: { term: registros[i].nombre, semanticTag: registros[i].concepto.semanticTag },
                        valor: `<div class="nivel-${nivelPadre}"><span>${ucaseFirst(registros[i].nombre)}</span><p>${ucaseFirst(registros[i].valor.descripcion)}</p></div>`
                    })];
                } else if (registros[i].valor !== null) {

                    if (esHallazgo(registros[i].concepto.semanticTag)) {
                        informeRegistros = [...informeRegistros, ({
                            concepto: { term: registros[i].concepto.term, semanticTag: registros[i].concepto.semanticTag },
                            valor: `<div class="nivel-${nivelPadre}">${await generarRegistroHallazgoHTML(registros[i])}</div>`
                        })];
                    } else if (esSolicitud(registros[i].concepto.semanticTag, registros[i].esSolicitud)) {
                        informeRegistros = [...informeRegistros, ({
                            concepto: { term: registros[i].concepto.term, semanticTag: registros[i].concepto.semanticTag },
                            valor: `<div class="nivel-${nivelPadre}">${await generarRegistroSolicitudHTML(registros[i])}</div>`
                        })];
                    } else if (esProcedimiento(registros[i].concepto.semanticTag) && !esAdjunto(registros[i].concepto.conceptId)) {
                        informeRegistros = [...informeRegistros, ({
                            concepto: { term: registros[i].concepto.term, semanticTag: registros[i].concepto.semanticTag },
                            valor: `<div class="nivel-${nivelPadre}">${await generarRegistroProcedimientoHTML(registros[i])}</div>`
                        })];
                    } else if (esInsumo(registros[i].concepto.semanticTag)) {
                        informeRegistros = [...informeRegistros, ({
                            concepto: { term: registros[i].concepto.term, semanticTag: registros[i].concepto.semanticTag },
                            valor: `<div class="nivel-${nivelPadre}">${await generarRegistroInsumoHTML(registros[i])}</div>`
                        })];
                    } else if (esAdjunto(registros[i].concepto.conceptId)) {

                        let adjuntos = await generarArchivoAdjuntoHTML(registros[i]);
                        informeRegistros = [...informeRegistros, ({
                            concepto: '',
                            valor: `<div class="contenedor-adjunto nivel-1"><h3>Documentos adjuntos</h3>${adjuntos.join(' ')}</div>`
                        })];

                    } else {
                        if (typeof registros[i].valor !== 'string') {
                            registros[i].valor = registros[i].valor.evolucion ? registros[i].valor.evolucion : (registros[i].valor.estado ? registros[i].valor.estado : 'sin datos');
                        }
                        informeRegistros = [...informeRegistros, {
                            concepto: { term: registros[i].nombre, semanticTag: registros[i].concepto.semanticTag },
                            valor: `<div class="nivel-${nivelPadre}"><span>${ucaseFirst(registros[i].nombre)}</span><p>${registros[i].valor}</p></div>`
                        }];
                    }
                }
            } else if (registros[i].nombre && prestacionConceptId !== '73761001' && registros[0].concepto.conceptId === '310634005') {
                informeRegistros = [...informeRegistros, {
                    concepto: { term: registros[i].nombre, semanticTag: registros[i].concepto.semanticTag },
                    valor: `<div class="nivel-${nivelPadre}"><h3>${ucaseFirst(registros[i].nombre)}</h3><p>${registros[i].valor ? registros[i].valor : ''}</p></div>`
                }];
            }

            if (registros[i] && registros[i].registros && registros[i].registros.length > 0) {
                nivelPadre = 0;
                await generarInforme(registros[i].registros, informeRegistros, prestacionConceptId);
            }
        }
    }
    return informeRegistros;
}
