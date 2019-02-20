import { log } from '@andes/log';
import * as debugFactory from 'debug';
const debug = debugFactory('huds');

/**
 * Controla si el usuario tiene acceso a la información del paciente
 *
 * @export
 * @param {Express.Request} req Request
 * @param {string} paciente ID del paciente
 * @returns {Promise<boolean>} Indica si tiene acceso a los datos de la HUDS
 */
export async function hudsCheckPaciente(req: Express.Request, paciente: string): Promise<boolean> {
    let check;
    if (!paciente) {
        check = false;
    } else {
        //////////////////////////////////////////////
        // TODO: CONSULTAR BASE DE DATOS PARA VER SI TIENE ACCESO
        check = true;
        //////////////////////////////////////////////
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
    debug(`hudsCheckPrestaciones check=${check}`);
    return check;
}
