import { profesional as profesionalModel } from './../../tm/schemas/profesional';
import * as agendaModel from '../../../modules/turnos/schemas/agenda';
import { log } from '@andes/log';
import * as debugFactory from 'debug';
import { paciente as pacienteModel } from '../../mpi/schemas/paciente';
const debug = debugFactory('huds');

/**
 * Controla si el usuario tiene acceso a la información del paciente
 * Tiene acceso cuando el propio paciente busca su información o
 * cuando el usuario es un profesional que ha atendido al paciente
 * @export
 * @param {Express.Request} req Request
 * @param {string} paciente ID del paciente
 * @returns {Promise<boolean>} Indica si tiene acceso a los datos de la HUDS
 */
export async function hudsCheckPaciente(req: Express.Request, paciente: string): Promise<boolean> {
    let check = false;
    if (paciente) {
        let pacienteBuscado = await pacienteModel.findById(paciente);
        if (pacienteBuscado && (pacienteBuscado as any).documento.toString() === (req as any).user.usuario.documento.toString()) { // TODO: en algún momento la vinculación del usuario con el paciente o profesional se debe hacer de otra forma que con el documento
            check = true;
        } else {
            let profesional = await profesionalModel.findOne({ documento: (req as any).user.usuario.documento }, { _id: 1 });
            if (profesional) {
                let agenda = await agendaModel.findOne({
                    'profesionales._id': (profesional as any)._id,
                    // 'bloques.turnos': { // comentamos esto para considerar agendas futuras
                    //     $elemMatch: {
                    //         'paciente.id': paciente,
                    //         asistencia: 'asistio'
                    //     }
                    // }
                    'bloques.turnos.paciente.id': paciente
                });
                check = agenda ? true : false;
            }
        }
        try {
            if (check) {
                await log(req, 'huds:access', paciente, (req as any).url, null);
            }
        } catch (err) {
            check = false;
        }
    }
    debug(`hudsCheckPaciente ${paciente} check=${check}`);
    return check;
}

/**
 * Controla si el usuario tiene acceso al conjunto de prestaciones
 *
 * @export
 * @param {Express.Request} req Request
 * @param {any[]} prestaciones Conjunto de pretaciones
 * @returns {Promise<boolean>} Indica si tiene acceso a los datos de la HUDS
 */
export async function hudsCheckPrestaciones(req: Express.Request, prestaciones: any[]): Promise<boolean> {
    let check = true;
    if (prestaciones && prestaciones.length) {
        if (prestaciones.length === 1 && prestaciones[0].createdBy.username.toString() === (req as any).user.usuario.username.toString()) { // si es una sola prestación y fue creada por mí, tiene permiso. Es la primera vez que se atiende, no es paciente mío, pero debo poder ver la prestación que le estoy creando
            check = true;
        } else {
            // Obtiene pacientes únicos
            let pacientes = [...new Set(prestaciones.filter(i => i.paciente).map(i => i.paciente.id.toString()))];

            // TODO: hacer las consultas más eficientes (múltiples a la vez?)
            for (let i = 0; i < pacientes.length; i++) {
                if (!await hudsCheckPaciente(req, pacientes[i])) {
                    check = false;
                    break;
                }
            }
        }
    }
    debug(`hudsCheckPrestaciones check=${check}`);
    return check;
}
