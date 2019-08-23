import { ucaseFirst } from '../utils';
import { generarRegistroHallazgoHTML } from './hallazgo';
import { generarRegistroSolicitudHTML } from './solicitud';
import { generarRegistroProcedimientoHTML } from './procedimiento';
import { generarArchivoAdjuntoHTML } from './adjunto';
import { generarRegistroInsumoHTML } from './insumo';
import { semanticTags } from '../descargas.config';


let nivelPadre = 0;

export async function generarInforme(registros, informeRegistros, solicitudPrestacionConceptId) {
    let registrosFiltrados = configuracionRegistrosPorPrestacion(registros, solicitudPrestacionConceptId);
    for (let i = 0; i < registrosFiltrados.length; i++) {
        if (registrosFiltrados[i]) {
            // Es resumen de la internación o colono o ...
            nivelPadre = (registrosFiltrados[0].concepto.conceptId === '3571000013102' || registrosFiltrados[0].concepto.conceptId === '32780001' || registrosFiltrados[i].registros.length > 0) ? 1 : 2;
            if (registrosFiltrados[i].valor) {
                informeRegistros = await generarRegistro(informeRegistros, registrosFiltrados[i], nivelPadre);
            } else if (!registrosFiltrados[i].valor && registrosFiltrados[i].nombre && solicitudPrestacionConceptId !== '73761001' && registrosFiltrados[0].concepto.conceptId === '310634005') {
                informeRegistros = [...informeRegistros, {
                    concepto: { term: registrosFiltrados[i].nombre, semanticTag: registrosFiltrados[i].concepto.semanticTag },
                    valor: `<div class="nivel-${nivelPadre}"><h3>${ucaseFirst(registrosFiltrados[i].nombre)}</h3><p>${registrosFiltrados[i].valor ? registrosFiltrados[i].valor : ''}</p></div>`
                }];
            }
            if (registrosFiltrados[i].registros && registrosFiltrados[i].registros.length > 0) {
                nivelPadre = 0;
                await generarInforme(registrosFiltrados[i].registros, informeRegistros, solicitudPrestacionConceptId);
            }
        }
    }
    return informeRegistros;
}

function configuracionRegistrosPorPrestacion(registros, idPrestacion) {
    switch (idPrestacion) {
        case '310634005':
            registros = filtroColonoscopia(registros);
            break;
    }
    return registros;
}

function filtroColonoscopia(registros: any[]) {
    let resp = [];
    registros.forEach(reg => {
        switch (reg.concepto.conceptId) {
            case '422843007':
                resp[0] = reg;
                break;
            case '443425001':
                resp[1] = reg;
                break;
            case '440588003':
                resp[2] = reg;
                break;
            case '445665009':
                resp[3] = reg;
                break;
            case '423100009':
                resp[4] = reg;
                break;
            case '225423004':
                resp[5] = reg;
                break;
            case '1921000013108':
                resp[6] = reg;
                break;
        }
    });
    resp = resp.filter((elem) => (elem));
    return resp;
}

function getTipoRegistro(registro) {
    if (registro.valor && typeof registro.valor === 'string') {
        return 'descripcion';
    } else if (registro.concepto.conceptId === '1921000013108') { // SCTID de "adjunto"?
        return 'adjunto';
    } else if (semanticTags.hallazgos.findIndex(x => x === registro.concepto.semanticTag) > -1) {
        return 'hallazgo';
    } else if ((semanticTags.solicitudes.findIndex(x => x === registro.concepto.semanticTag) > -1) && registro.esSolicitud) {
        return 'solicitud';
    } else if (semanticTags.procedimientos.findIndex(x => x === registro.concepto.semanticTag) > -1) {
        return 'procedimiento';
    } else if (semanticTags.insumos.findIndex(x => x === registro.concepto.semanticTag) > -1) {
        return 'insumo';
    } else {
        return null;
    }
}

async function generarRegistro(informeRegistros, registro, nivelSup) {
    switch (getTipoRegistro(registro)) {
        case 'descripcion':
            let nombreRegistro = ((registro.nombre).replace('<p>', '')).replace('</p>', '');
            let valorRegistro = ((registro.valor).replace('<p>', '')).replace('</p>', '');
            informeRegistros = [...informeRegistros, ({
                concepto: { term: registro.nombre, semanticTag: registro.concepto.semanticTag },
                valor: `<div class="nivel-${nivelSup}"><p>${nombreRegistro}: <small>${valorRegistro}</small></p></div>`
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
