import { SnomedCIE10Mapping } from './../../../core/term/controller/mapping';
import * as cie10 from './../../../core/term/schemas/cie10';
import { log } from './../../../core/log/schemas/log';
import * as agendaModel from '../../turnos/schemas/agenda';
import * as moment from 'moment';
import { Auth } from '../../../auth/auth.class';
import { userScheduler } from '../../../config.private';
import { Logger } from '../../../utils/logService';
import { load } from 'google-maps';
import { model as Prestacion } from '../../rup/schemas/prestacion';

// Turno
export function darAsistencia(req, data, tid = null) {
    let turno = getTurno(req, data, tid);
    turno.asistencia = 'asistio';
    turno.updatedAt = new Date();
    turno.updatedBy = req.user.usuario || req.user;
    // crearPrestacionVacia(turno, req);
}

// Turno
export function sacarAsistencia(req, data, tid = null) {
    let turno = getTurno(req, data, tid);
    turno.asistencia = undefined;
    turno.updatedAt = new Date();
    turno.updatedBy = req.user.usuario || req.user;
}
// Turno
export function marcarNoAsistio(req, data, tid = null) {
    let turno = getTurno(req, data, tid);
    turno.asistencia = 'noAsistio';
    turno.updatedAt = new Date();
    turno.updatedBy = req.user.usuario || req.user;
}

// Turno
export function quitarTurnoDoble(req, data, tid = null) {
    let turno = getTurno(req, data, tid);
    turno.estado = 'disponible';
    turno.updatedAt = new Date();
    turno.updatedBy = req.user.usuario || req.user;
    let turnoOriginal = getTurnoAnterior(req, data, turno._id);
    let position = getPosition(req, data, turnoOriginal._id);
    switch (turnoOriginal.tipoTurno) {
        case ('delDia'):
            data.bloques[position.indexBloque].restantesDelDia = data.bloques[position.indexBloque].restantesDelDia + 1;
            data.bloques[position.indexBloque].restantesProgramados = 0;
            data.bloques[position.indexBloque].restantesProfesional = 0;
            data.bloques[position.indexBloque].restantesGestion = 0;
            break;
        case ('programado'):
            data.bloques[position.indexBloque].restantesProgramados = data.bloques[position.indexBloque].restantesProgramados + 1;
            break;
        case ('profesional'):
            data.bloques[position.indexBloque].restantesProfesional = data.bloques[position.indexBloque].restantesProfesional + 1;
            break;
        case ('gestion'):
            data.bloques[position.indexBloque].restantesGestion = data.bloques[position.indexBloque].restantesGestion + 1;
            break;
    }
}

// Turno
export function liberarTurno(req, data, turno) {
    let position = getPosition(req, data, turno._id);
    turno.estado = 'disponible';
    turno.paciente = null;
    turno.tipoPrestacion = null;
    turno.nota = null;
    turno.confirmedAt = null;
    turno.updatedAt = new Date();
    turno.updatedBy = req.user.usuario || req.user;

    let cant = 1;

    let turnoDoble = getTurnoSiguiente(req, data, turno._id);
    if (turnoDoble) {
        cant = cant + 1;
        turnoDoble.estado = 'disponible';
        turnoDoble.updatedAt = new Date();
        turnoDoble.updatedBy = req.user.usuario || req.user;
    }

    switch (turno.tipoTurno) {
        case ('delDia'):
            data.bloques[position.indexBloque].restantesDelDia = data.bloques[position.indexBloque].restantesDelDia + cant;
            data.bloques[position.indexBloque].restantesProgramados = 0;
            data.bloques[position.indexBloque].restantesProfesional = 0;
            data.bloques[position.indexBloque].restantesGestion = 0;
            break;
        case ('programado'):
            data.bloques[position.indexBloque].restantesProgramados = data.bloques[position.indexBloque].restantesProgramados + cant;
            break;
        case ('profesional'):
            data.bloques[position.indexBloque].restantesProfesional = data.bloques[position.indexBloque].restantesProfesional + cant;
            break;
        case ('gestion'):
            data.bloques[position.indexBloque].restantesGestion = data.bloques[position.indexBloque].restantesGestion + cant;
            break;
    }
    if (turno.tipoTurno) {
        turno.tipoTurno = undefined;
    }
}


// Turno
export function suspenderTurno(req, data, turno) {
    if (turno.estado !== 'turnoDoble') {
        turno.estado = 'suspendido';
    }
    delete turno.paciente;
    delete turno.tipoPrestacion;
    turno.motivoSuspension = req.body.motivoSuspension;
    turno.updatedAt = new Date();
    turno.updatedBy = req.user.usuario || req.user;


    let cant = 1;
    // Se verifica si tiene un turno doble asociado
    let turnoDoble = getTurnoSiguiente(req, data, turno._id);
    if (turnoDoble) {
        cant = cant + 1;
        // Se deja el estado turnoDoble para detectar este caso en la reasignacion
        // turnoDoble.estado = 'suspendido';
        turnoDoble.motivoSuspension = req.body.motivoSuspension;
        turnoDoble.updatedAt = new Date();
        turnoDoble.updatedBy = req.user.usuario || req.user;
    }

    // El tipo de turno del cual se resta será en el orden : delDia, programado, autocitado, gestion
    let position = getPosition(req, data, turno._id);
    if (!turno.tipoTurno) {
        if (data.bloques[position.indexBloque].restantesDelDia > 0) {
            data.bloques[position.indexBloque].restantesDelDia = data.bloques[position.indexBloque].restantesDelDia - cant;
        } else {
            if (data.bloques[position.indexBloque].restantesProgramados > 0) {
                data.bloques[position.indexBloque].restantesProgramados = data.bloques[position.indexBloque].restantesProgramados - cant;
            } else {
                if (data.bloques[position.indexBloque].restantesProfesional > 0) {
                    data.bloques[position.indexBloque].restantesProfesional = data.bloques[position.indexBloque].restantesProfesional - cant;
                } else {
                    if (data.bloques[position.indexBloque].restantesGestion > 0) {
                        data.bloques[position.indexBloque].restantesGestion = data.bloques[position.indexBloque].restantesGestion - cant;
                    }
                }
            }
        }
    }
}

// Turno
export function codificarTurno(req, data, tid) {
    return new Promise((resolve, reject) => {
        let turno = getTurno(req, data[0], tid);

        let query = Prestacion.find({ $where: 'this.estados[this.estados.length - 1].tipo ==  "validada"' });
        query.where('solicitud.turno').equals(tid);
        query.exec(function (err, data1) {
            if (err) {
                return ({
                    err: 'No se encontro prestacion para el turno'
                });
            }
            let arrPrestacion = data1 as any;
            let codificaciones = [];
            let promises = [];
            if (arrPrestacion.length > 0 && arrPrestacion[0].ejecucion) {
                let prestaciones = arrPrestacion[0].ejecucion.registros.filter(f => {
                    return f.concepto.semanticTag === 'hallazgo' || f.concepto.semanticTag === 'trastorno' || f.concepto.semanticTag === 'situacion';
                });
                prestaciones.forEach(registro => {
                    let parametros = {
                        conceptId: registro.concepto.conceptId,
                        paciente: turno.paciente,
                        secondaryConcepts: prestaciones.map(r => r.concepto.conceptId)
                    };
                    let map = new SnomedCIE10Mapping(parametros.paciente, parametros.secondaryConcepts);
                    map.transform(parametros.conceptId).then(target => {
                        // Buscar en cie10 los primeros 5 digitos
                        cie10.model.findOne({ codigo: (target as String).substring(0, 5) }).then(cie => {
                            if (cie != null) {
                                if (registro.esDiagnosticoPrincipal) {
                                    codificaciones.unshift({ // El diagnostico principal se inserta al comienzo del array
                                        codificacionProfesional: {
                                            causa: (cie as any).causa,
                                            subcausa: (cie as any).subcausa,
                                            codigo: (cie as any).codigo,
                                            nombre: (cie as any).nombre,
                                            sinonimo: (cie as any).sinonimo,
                                            c2: (cie as any).c2,
                                        },
                                        primeraVez: registro.esPrimeraVez,
                                    });

                                } else {
                                    codificaciones.push({
                                        codificacionProfesional: {
                                            causa: (cie as any).causa,
                                            subcausa: (cie as any).subcausa,
                                            codigo: (cie as any).codigo,
                                            nombre: (cie as any).nombre,
                                            sinonimo: (cie as any).sinonimo,
                                            c2: (cie as any).c2,
                                        },
                                        // primeraVez: registro.esPrimeraVez
                                    });
                                }
                            } else {
                                // Todo: En el caso en q no mapea, logearlo
                                codificaciones.push({});
                            }
                            if (prestaciones.length === codificaciones.length) {
                                // console.log('codificaciones ', codificaciones);
                                turno.diagnostico = {
                                    ilegible: false,
                                    codificaciones: codificaciones.filter(cod => Object.keys(cod).length > 0)
                                };
                                turno.asistencia = 'asistio';
                                resolve(data);
                            }

                        }).catch(err1 => {
                            reject(err1);
                        });

                    }).catch(error => {
                        reject(error);
                    });
                });
            } else {
                resolve(null);
            }
        });
    });
}

// Turno
export function guardarNotaTurno(req, data, tid = null) {
    let turno = getTurno(req, data, tid);
    turno.nota = req.body.textoNota;
    turno.updatedAt = new Date();
    turno.updatedBy = req.user.usuario || req.user;
}

// Turno
export function darTurnoDoble(req, data, tid = null) {   // NUEVO
    let position = getPosition(req, data, tid); // Obtiene la posición actual del turno seleccionado
    let agenda = data;
    let turnoAnterior;

    if ((position.indexBloque > -1) && (position.indexTurno > -1)) {
        turnoAnterior = agenda.bloques[position.indexBloque].turnos[position.indexTurno - 1]; // Obtiene el turno anterior

        // Verifico si existen turnos disponibles del tipo correspondiente
        let countBloques = calcularContadoresTipoTurno(position.indexBloque, position.indexTurno, agenda);
        if ((countBloques[turnoAnterior.tipoTurno] as number) === 0) {
            return ({
                err: 'No se puede asignar el turno doble ' + turnoAnterior.tipoTurno
            });
        } else {
            // se controla la disponibilidad de los tipos de turnos
            // el turno doble se otorgara si existe disponibilidad de la cantidad de tipo del turno asociado
            let turno = getTurno(req, data, tid);
            turno.estado = 'turnoDoble';
            switch (turnoAnterior.tipoTurno) {
                case ('delDia'):
                    data.bloques[position.indexBloque].restantesDelDia = countBloques.delDia - 1;
                    data.bloques[position.indexBloque].restantesProgramados = 0;
                    data.bloques[position.indexBloque].restantesProfesional = 0;
                    data.bloques[position.indexBloque].restantesGestion = 0;
                    break;
                case ('programado'):
                    data.bloques[position.indexBloque].restantesProgramados = countBloques.programado - 1;
                    break;
                case ('profesional'):
                    data.bloques[position.indexBloque].restantesProfesional = countBloques.profesional - 1;
                    break;
                case ('gestion'):
                    data.bloques[position.indexBloque].restantesGestion = countBloques.gestion - 1;
                    break;
            }
            return null; // jfgabriel | Revisar esta línea! La agregué porque el compilador tiraba un error TS7030: Not all code paths return a value.
        }

    } else {
        return ({
            err: 'No se puede asignar el turno doble'
        });
    }

}

// Agenda
export function guardarNotaAgenda(req, data) {
    data.nota = req.body.nota;
}

// Agenda
export function editarAgenda(req, data) {
    if (req.body.profesional) {
        data.profesionales = req.body.profesional;
    }
    data.espacioFisico = req.body.espacioFisico;
}

// Agenda
export function agregarSobreturno(req, data) {
    let sobreturno = req.body.sobreturno;
    if (sobreturno) {
        let usuario = (Object as any).assign({}, (req as any).user.usuario || (req as any).user.app);
        // Copia la organización desde el token
        usuario.organizacion = (req as any).user.organizacion;
        sobreturno.updatedAt = new Date();
        sobreturno.updatedBy = usuario;
        data.sobreturnos.push(sobreturno);
    }
}

// Agenda
export function actualizarEstado(req, data) {

    // Si se pasa a estado Pausada, guardamos el estado previo
    if (req.body.estado === 'pausada') {
        data.prePausada = data.estado;
    }

    // Si se pasa a publicada
    if (req.body.estado === 'publicada') {
        let hoy = new Date();
        data.estado = 'publicada';
        if (moment(data.horaInicio).isSame(hoy, 'day')) {
            data.bloques.forEach(bloque => {
                if (bloque.restantesProgramados > 0) {
                    bloque.restantesDelDia += bloque.restantesProgramados;
                    bloque.restantesProgramados = 0;
                }
            });
        }
    }

    // Si se pasa a borrada
    if (req.body.estado === 'borrada') {
        data.estado = 'borrada';
    }

    // Cuando se reanuda de un estado pausada, se setea el estado guardado en prePausa
    if (req.body.estado === 'prePausada') {
        data.estado = data.prePausada;
    } else {
        data.estado = req.body.estado;

        // Si se suspende una agenda, hay que enviar SMS a todos los pacientes
        if (req.body.estado === 'suspendida') {

            data.bloques.forEach(bloque => {
                bloque.turnos.forEach(turno => {
                    if (turno.estado !== 'turnoDoble') {
                        turno.estado = 'suspendido';
                    }
                    turno.motivoSuspension = 'agendaSuspendida';
                    turno.avisoSuspension = 'no enviado';

                });
            });
        }

    }
}

// Dada una Agenda completa + un id de Turno, busca y devuelve el Turno completo
export function getTurno(req, data, idTurno = null) {
    let turno;
    idTurno = String(idTurno) || req.body.idTurno;
    // Loop en los bloques
    for (let x = 0; x < data.bloques.length; x++) {
        // Si existe este bloque...
        if (data.bloques[x] != null) {
            // Buscamos y asignamos el turno con id que coincida (si no coincide "asigna" null)
            turno = (data as any).bloques[x].turnos.id(idTurno);

            // Si encontró el turno dentro de alguno de los bloques, lo devuelve
            if (turno !== null) {
                return turno;
            }
        }
    }
    // sobreturnos
    turno = data.sobreturnos.id(idTurno);
    if (turno !== null) {
        return turno;
    }
    return false;
}

export function getPosition(req, agenda, idTurno = null) {
    idTurno = idTurno || req.body.idTurno;
    let index = -1;
    let turnos;
    let position = { indexBloque: -1, indexTurno: -1 };
    // Loop en los bloques
    for (let x = 0; x < agenda.bloques.length; x++) {
        // Si existe este bloque...
        turnos = agenda.bloques[x].turnos;
        index = turnos.findIndex((t) => t._id.toString() === idTurno.toString());
        if (index > -1) {
            position.indexBloque = x;
            position.indexTurno = index;
        }
    }
    return position;
}

export function agregarAviso(req, agenda) {
    let profesionalId = req.body.profesionalId;
    let estado = req.body.estado;
    let fecha = new Date();

    let index = agenda.avisos.findIndex(item => String(item.profesionalId) === profesionalId);
    if (index < 0) {
        agenda.avisos.push({
            estado,
            profesionalId,
            fecha
        });
        return true;
    }
    return false;

}

export function getTurnoSiguiente(req, agenda, idTurno = null) {
    let position = getPosition(req, agenda, idTurno);
    let index = position.indexTurno;
    let turnos = [];
    if (position.indexBloque > -1) {
        turnos = agenda.bloques[position.indexBloque].turnos;
    }
    if ((index > -1) && (index < turnos.length - 1) && (turnos[index + 1].estado === 'turnoDoble')) {
        return turnos[index + 1];
    }
    return null;
}

export function getTurnoAnterior(req, agenda, idTurno = null) {
    let position = getPosition(req, agenda, idTurno);
    let index = position.indexTurno;
    let turnos = [];
    if (position.indexBloque > -1) {
        turnos = agenda.bloques[position.indexBloque].turnos;
    }
    return turnos[index - 1];
}


export function combinarFechas(fecha1, fecha2) {
    if (fecha1 && fecha2) {
        let horas: number;
        let minutes: number;
        let auxiliar: Date;

        auxiliar = new Date(fecha1);
        horas = fecha2.getHours();
        minutes = fecha2.getMinutes();
        auxiliar.setHours(horas, minutes, 0, 0);
        return auxiliar;
    } else {
        return null;
    }
}

export function calcularContadoresTipoTurno(posBloque, posTurno, agenda) {

    let countBloques;
    let esHoy = false;
    // Ver si el día de la agenda coincide con el día de hoy
    if (agenda.horaInicio >= moment(new Date()).startOf('day').toDate() && agenda.horaInicio <= moment(new Date()).endOf('day').toDate()) {
        esHoy = true;
    }

    countBloques = {
        delDia: esHoy ? (
            (agenda.bloques[posBloque].restantesDelDia as number) +
            (agenda.bloques[posBloque].restantesProgramados as number) +
            (agenda.bloques[posBloque].restantesGestion as number) +
            (agenda.bloques[posBloque].restantesProfesional as number)
        ) : agenda.bloques[posBloque].restantesDelDia,
        programado: esHoy ? 0 : agenda.bloques[posBloque].restantesProgramados,
        gestion: esHoy ? 0 : agenda.bloques[posBloque].restantesGestion,
        profesional: esHoy ? 0 : agenda.bloques[posBloque].restantesProfesional
    };

    return countBloques;
}

export function getBloque(agenda, turno) {
    for (let i = 0; i < agenda.bloques.length; i++) {
        let bloque = agenda.bloques[i];
        for (let j = 0; j < bloque.turnos.length; j++) {
            let turnoTemp = bloque.turnos[j];
            if (turnoTemp._id === turno._id) {
                return bloque;
            }
        }
    }
    return null;
}

export function esPrimerPaciente(agenda: any, idPaciente: string, opciones: any[]) {
    return new Promise<any>((resolve, reject) => {
        let prestacionActual = 'Exámen médico del adulto';
        let profesionalesActuales = ['58f9eae202e4a0f31fcbd846'];

        let primerPrestacion = false;
        let primerProfesional = false;

        agenda.find({}, (err, agendas) => {
            if (err) {
                return err;
            }
            agendas.forEach((ag, iAg) => {
                ag.bloques.forEach((bl, iBl) => {
                    bl.turnos.forEach((tu, iTu) => {
                        if (tu.paciente && tu.paciente.id && tu.paciente.id.toString() === '59834a503ff831451edc5739'.toString()) {
                            primerPrestacion = bl.tipoPrestaciones.map(x => {
                                return x.term === prestacionActual ? true : false;
                            });
                            primerProfesional = ag.profesionales.map(pr => {
                                return profesionalesActuales.find((f, index) => {
                                    return pr._id.toString() === f.toString();
                                });
                            }).length === 0;
                        }
                    });
                });
            });
        });
        resolve({ profesional: primerProfesional, tipoPrestacion: primerPrestacion });
    });

}


/**
 * Actualiza las cantidades de turnos restantes de la agenda antes de su fecha de inicio,
 * se ejecuta una vez al día por el scheduler.
 *
 * @export actualizarTiposDeTurno()
 * @returns resultado
 */
export function actualizarTiposDeTurno() {
    let hsActualizar = 48;
    let cantDias = hsActualizar / 24;
    let fechaActualizar = moment(new Date()).add(cantDias, 'days');

    // actualiza los turnos restantes de las agendas 2 dias antes de su horaInicio.
    let condicion = {
        'estado': 'publicada',
        'horaInicio': {
            $gte: (moment(fechaActualizar).startOf('day').toDate() as any),
            $lte: (moment(fechaActualizar).endOf('day').toDate() as any)
        }
    };
    let cursor = agendaModel.find(condicion).cursor();

    cursor.eachAsync(doc => {
        let agenda: any = doc;
        for (let j = 0; j < agenda.bloques.length; j++) {
            let cantAccesoDirecto = agenda.bloques[j].accesoDirectoDelDia + agenda.bloques[j].accesoDirectoProgramado;

            if (cantAccesoDirecto > 0) {
                agenda.bloques[j].restantesProgramados = agenda.bloques[j].restantesProgramados + agenda.bloques[j].restantesGestion + agenda.bloques[j].restantesProfesional;
                agenda.bloques[j].restantesGestion = 0;
                agenda.bloques[j].restantesProfesional = 0;
            } else {
                if (agenda.bloques[j].reservadoProfesional > 0) {
                    agenda.bloques[j].restantesGestion = agenda.bloques[j].restantesGestion + agenda.bloques[j].restantesProfesional;
                    agenda.bloques[j].restantesProfesional = 0;
                }
            }
        }

        Auth.audit(agenda, (userScheduler as any));
        saveAgenda(agenda).then((nuevaAgenda) => {
            Logger.log(userScheduler, 'citas', 'actualizarTiposDeTurno', {
                idAgenda: agenda._id,
                organizacion: agenda.organizacion,
                horaInicio: agenda.horaInicio,
                updatedAt: agenda.updatedAt,
                updatedBy: agenda.updatedBy

            });
        }).catch(error => {
            return (error);
        });

    });
    return 'Agendas actualizadas';

}

/**
 * Actualiza los estados de las agendas que se ejecutaron el día anterior a Pendiente Asistencia o
 * Pendiente Auditoría según corresponda
 * se ejecuta una vez al día por el scheduler.
 *
 * @export actualizarTiposDeTurno()
 * @returns resultado
 */
export function actualizarEstadoAgendas() {
    // let fechaActualizar = moment(new Date()).subtract(1, 'days');
    let fechaActualizar = moment(new Date());
    // actualiza los agendas en estado disponible o publicada que se hayan ejecutado el día anterior
    let condicion = {
        '$or': [{ estado: 'disponible' }, { estado: 'publicada' }],
        'horaInicio': {
            $lte: (moment(fechaActualizar).endOf('day').toDate() as any)
        }
    };
    let cursor = agendaModel.find(condicion).cursor();

    cursor.eachAsync(doc => {
        let agenda: any = doc;
        let todosAsistencia = true;
        for (let j = 0; j < agenda.bloques.length; j++) {
            let turnos = agenda.bloques[j].turnos;
            // Verifico si al hay al menos un turno asignado sin asistencia
            if (turnos.filter((turno) => {
                return (turno.estado === 'asignado' && !(turno.asistencia));
            }).length > 0) {
                todosAsistencia = false;
            }
        }

        if (todosAsistencia) {
            agenda.estado = 'pendienteAuditoria';
        } else {
            agenda.estado = 'pendienteAsistencia';
        }

        Auth.audit(agenda, (userScheduler as any));
        saveAgenda(agenda).then((nuevaAgenda) => {
            Logger.log(userScheduler, 'citas', 'actualizarEstadoAgendas', {
                idAgenda: agenda._id,
                organizacion: agenda.organizacion,
                horaInicio: agenda.horaInicio,
                updatedAt: agenda.updatedAt,
                updatedBy: agenda.updatedBy

            });
        }).catch(error => {
            return (error);
        });

    });
    return 'Agendas actualizadas';
}

/**
 * Llegado el día de ejecucion de la agenda, los turnos restantesProgramados pasan a restantesDelDia
 *
 * @export actualizarTiposDeTurno()
 * @returns resultado
 */
export function actualizarTurnosDelDia() {
    let fechaActualizar = moment();

    let condicion = {
        '$or': [{ estado: 'disponible' }, { estado: 'publicada' }],
        'horaInicio': {
            $gte: (moment(fechaActualizar).startOf('day').toDate() as any),
            $lte: (moment(fechaActualizar).endOf('day').toDate() as any)
        }
    };
    let cursor = agendaModel.find(condicion).cursor();

    cursor.eachAsync(doc => {
        let agenda: any = doc;
        for (let j = 0; j < agenda.bloques.length; j++) {
            if (agenda.bloques[j].restantesProgramados > 0) {
                agenda.bloques[j].restantesDelDia += agenda.bloques[j].restantesProgramados;
                agenda.bloques[j].restantesProgramados = 0;
            }
        }

        Auth.audit(agenda, (userScheduler as any));
        saveAgenda(agenda).then((nuevaAgenda) => {
            Logger.log(userScheduler, 'citas', 'actualizarTurnosDelDia', {
                idAgenda: agenda._id,
                organizacion: agenda.organizacion,
                horaInicio: agenda.horaInicio,
                updatedAt: agenda.updatedAt,
                updatedBy: agenda.updatedBy

            });
        }).catch(error => {
            return (error);
        });

    });
    return 'Agendas actualizadas';

}

/**
 * Realiza el save de una agenda.
 * El log del cambio debe guardarse luego de ejecutarse esta promise
 *
 * @export
 * @param {any} nuevaAgenda
 * @returns
 */
export function saveAgenda(nuevaAgenda) {
    return new Promise((resolve, reject) => {
        nuevaAgenda.save((err, dataAgenda) => {
            if (err) {
                reject(err);
            }
            if (dataAgenda) {
                resolve(dataAgenda);
            }
        });
    });
}

/**
 * Actualiza el paciente embebido en el turno.
 *
 * @export
 * @param {any} pacienteModified
 * @param {any} turno
 */
export function updatePaciente(pacienteModified, turno) {
    agendaModel.findById(turno.agenda_id, function (err, data, next) {
        if (err) {
            return next(err);
        }
        let bloques: any = data.bloques;
        let indiceTurno = 0;
        let i = 0;
        let j = 0;
        let band = true;
        while (i < bloques.length && band) {
            j = 0;
            while (j < bloques[i].turnos.length && band) {
                if (bloques[i].turnos[j]._id.toString() === turno._id.toString()) {
                    indiceTurno = j;
                    band = false;
                }
                j++;
            }
            if (!band) {
                bloques[i].turnos[indiceTurno].paciente.nombre = pacienteModified.nombre;
                bloques[i].turnos[indiceTurno].paciente.apellido = pacienteModified.apellido;
                bloques[i].turnos[indiceTurno].paciente.documento = pacienteModified.documento;
                if (pacienteModified.contacto && pacienteModified.contacto[0]) {
                    bloques[i].turnos[indiceTurno].paciente.telefono = pacienteModified.contacto[0].valor;
                }
                bloques[i].turnos[indiceTurno].paciente.carpetaEfectores = pacienteModified.carpetaEfectores;
                bloques[i].turnos[indiceTurno].paciente.fechaNacimiento = pacienteModified.fechaNacimiento;
            }
            i++;
        }
        if (!band) {
            try {
                Auth.audit(data, (userScheduler as any));
                saveAgenda(data);
            } catch (error) {
                return error;
            }
        }
    });
}
