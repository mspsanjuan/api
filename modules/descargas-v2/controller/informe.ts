import { ucaseFirst } from '../utils';
import { generarRegistroHallazgoHTML } from './hallazgo';
import { generarRegistroSolicitudHTML } from './solicitud';
import { generarRegistroProcedimientoHTML } from './procedimiento';
import { generarArchivoAdjuntoHTML } from './adjunto';
import { generarRegistroInsumoHTML } from './insumo';
import { semanticTags } from '../descargas.config';


let nivelPadre = 0;

export async function generarInforme(registros, informeRegistros, prestacionConceptId) {
    for (let i = 0; i < registros.length; i++) {
        if (registros[i]) {
            // Es resumen de la internación o colono o ...
            nivelPadre = (registros[0].concepto.conceptId === '3571000013102' || registros[0].concepto.conceptId === '32780001' || registros[i].registros.length > 0) ? 1 : 2;
            if (registros[i].valor) {
                if (registros[i].valor.descripcion) {
                    informeRegistros = [...informeRegistros, ({
                        concepto: { term: registros[i].nombre, semanticTag: registros[i].concepto.semanticTag },
                        valor: `<div class="nivel-${nivelPadre}"><span>${ucaseFirst(registros[i].nombre)}</span><p>${ucaseFirst(registros[i].valor.descripcion)}</p></div>`
                    })];
                } else if (registros[i].valor !== null) {
                    switch (getTipoRegistro(registros[i])) {
                        case 'hallazgo':
                            informeRegistros = [...informeRegistros, ({
                                concepto: { term: registros[i].concepto.term, semanticTag: registros[i].concepto.semanticTag },
                                valor: `<div class="nivel-${nivelPadre}">${await generarRegistroHallazgoHTML(registros[i])}</div>`
                            })];
                            break;
                        case 'solicitud':
                            informeRegistros = [...informeRegistros, ({
                                concepto: { term: registros[i].concepto.term, semanticTag: registros[i].concepto.semanticTag },
                                valor: `<div class="nivel-${nivelPadre}">${await generarRegistroSolicitudHTML(registros[i])}</div>`
                            })];
                            break;
                        case 'procedimiento':
                            informeRegistros = [...informeRegistros, ({
                                concepto: { term: registros[i].concepto.term, semanticTag: registros[i].concepto.semanticTag },
                                valor: `<div class="nivel-${nivelPadre}">${await generarRegistroProcedimientoHTML(registros[i])}</div>`
                            })];
                            break;
                        case 'insumo':
                            informeRegistros = [...informeRegistros, ({
                                concepto: { term: registros[i].concepto.term, semanticTag: registros[i].concepto.semanticTag },
                                valor: `<div class="nivel-${nivelPadre}">${await generarRegistroInsumoHTML(registros[i])}</div>`
                            })];
                            break;
                        case 'adjunto':
                            let adjuntos = await generarArchivoAdjuntoHTML(registros[i]);
                            informeRegistros = [...informeRegistros, ({
                                concepto: '',
                                valor: `<div class="contenedor-adjunto nivel-1"><h3>Documentos adjuntos</h3>${adjuntos.join(' ')}</div>`
                            })];
                            break;
                        default:
                            if (typeof registros[i].valor !== 'string') {
                                registros[i].valor = registros[i].valor.evolucion ? registros[i].valor.evolucion : (registros[i].valor.estado ? registros[i].valor.estado : 'sin datos');
                            }
                            informeRegistros = [...informeRegistros, {
                                concepto: { term: registros[i].nombre, semanticTag: registros[i].concepto.semanticTag },
                                valor: `<div class="nivel-${nivelPadre}"><span>${ucaseFirst(registros[i].nombre)}</span><p>${registros[i].valor}</p></div>`
                            }];
                            break;

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


function getTipoRegistro(registro) {
    if (semanticTags.hallazgos.findIndex(x => x === registro.concepto.semanticTag) > -1) {
        return 'hallazgo';
    } else if ((semanticTags.solicitudes.findIndex(x => x === registro.concepto.semanticTag) > -1) && registro.esSolicitud) {
        return 'solicitud';
    } else if (semanticTags.procedimientos.findIndex(x => x === registro.concepto.semanticTag) > -1) {
        return 'procedimiento';
    } else if (semanticTags.insumos.findIndex(x => x === registro.concepto.semanticTag) > -1) {
        return 'insumo';
    } else if (registro.concepto.conceptId === '1921000013108') { // SCTID de "adjunto"?
        return 'adjunto';
    } else {
        return null;
    }
}
