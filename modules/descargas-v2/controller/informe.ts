import { ucaseFirst } from '../utils';
import { generarRegistroHallazgoHTML } from './hallazgo';
import { generarRegistroSolicitudHTML } from './solicitud';
import { generarRegistroProcedimientoHTML } from './procedimiento';
import { generarArchivoAdjuntoHTML } from './adjunto';
import { generarRegistroInsumoHTML } from './insumo';
import { semanticTags } from '../descargas.config';


let nivelPadre = 0;

export async function generarInforme(registros, informeRegistros, solicitudPrestacionConceptId) {
    for (let i = 0; i < registros.length; i++) {
        if (registros[i]) {
            // Es resumen de la internación o colono o ...
            nivelPadre = (registros[0].concepto.conceptId === '3571000013102' || registros[0].concepto.conceptId === '32780001' || registros[i].registros.length > 0) ? 1 : 2;
            if (registros[i].valor) {
                informeRegistros = await generarRegistro(informeRegistros, registros[i], nivelPadre);
            } else if (!registros[i].valor && registros[i].nombre && solicitudPrestacionConceptId !== '73761001' && registros[0].concepto.conceptId === '310634005') {
                informeRegistros = [...informeRegistros, {
                    concepto: { term: registros[i].nombre, semanticTag: registros[i].concepto.semanticTag },
                    valor: `<div class="nivel-${nivelPadre}"><h3>${ucaseFirst(registros[i].nombre)}</h3><p>${registros[i].valor ? registros[i].valor : ''}</p></div>`
                }];
            }
            if (registros[i].registros && registros[i].registros.length > 0) {
                nivelPadre = 0;
                await generarInforme(registros[i].registros, informeRegistros, solicitudPrestacionConceptId);
            }
        }
    }
    return informeRegistros;
}


function getTipoRegistro(registro) {
    if (registro.valor && registro.valor.descripcion) {
        return 'descripcion';
    } else if (semanticTags.hallazgos.findIndex(x => x === registro.concepto.semanticTag) > -1) {
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

async function generarRegistro(informeRegistros, registro, nivelSup) {
    switch (getTipoRegistro(registro)) {
        case 'descripcion':
            informeRegistros = [...informeRegistros, ({
                concepto: { term: registro.nombre, semanticTag: registro.concepto.semanticTag },
                valor: `<div class="nivel-${nivelSup}"><span>${ucaseFirst(registro.nombre)}</span><p>${ucaseFirst(registro.valor.descripcion)}</p></div>`
            })];
            break;
        case 'hallazgo':
            informeRegistros = [...informeRegistros, ({
                concepto: { term: registro.concepto.term, semanticTag: registro.concepto.semanticTag },
                valor: `<div class="nivel-${nivelSup}">${await generarRegistroHallazgoHTML(registro)}</div>`
            })];
            break;
        case 'solicitud':
            informeRegistros = [...informeRegistros, ({
                concepto: { term: registro.concepto.term, semanticTag: registro.concepto.semanticTag },
                valor: `<div class="nivel-${nivelSup}">${await generarRegistroSolicitudHTML(registro)}</div>`
            })];
            break;
        case 'procedimiento':
            informeRegistros = [...informeRegistros, ({
                concepto: { term: registro.concepto.term, semanticTag: registro.concepto.semanticTag },
                valor: `<div class="nivel-${nivelSup}">${await generarRegistroProcedimientoHTML(registro)}</div>`
            })];
            break;
        case 'insumo':
            informeRegistros = [...informeRegistros, ({
                concepto: { term: registro.concepto.term, semanticTag: registro.concepto.semanticTag },
                valor: `<div class="nivel-${nivelSup}">${await generarRegistroInsumoHTML(registro)}</div>`
            })];
            break;
        case 'adjunto':
            let adjuntos = await generarArchivoAdjuntoHTML(registro);
            informeRegistros = [...informeRegistros, ({
                concepto: '',
                valor: `<div class="contenedor-adjunto nivel-1"><h3>Documentos adjuntos</h3>${adjuntos + ('<br>')}</div>`
            })];
            break;
        default:
            if (typeof registro.valor !== 'string') {
                registro.valor = registro.valor.evolucion ? registro.valor.evolucion : (registro.valor.estado ? registro.valor.estado : 'sin datos');
            }
            informeRegistros = [...informeRegistros, {
                concepto: { term: registro.nombre, semanticTag: registro.concepto.semanticTag },
                valor: `<div class="nivel-${nivelSup}"><span>${ucaseFirst(registro.nombre)}</span><p>${registro.valor}</p></div>`
            }];
            break;

    }
    return informeRegistros;
}
