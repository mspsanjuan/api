import { paciente } from '../schemas/paciente';
import moment = require('moment');
import { userScheduler } from '../../../config.private';
import { buscarPacienteWithcondition, createPaciente, updatePaciente, validarPaciente } from '../controller/paciente';
import { Types } from 'mongoose';
import debug = require('debug');
import { registroProvincialData } from '../../../config.private';
import { handleHttpRequest } from '../../../utils/requestHandler';

const deb = debug('nacimientosJob');

/**
 * Obtiene todos los bebes nacidos a partir de la fecha pasada por parámetro.
 * Fuente: Registro provincial de las personas
 *
 * @param {string} fecha
 * @returns Promise<{}>
 */
async function getInfoNacimientos(fecha: string = null) {
    if (!fecha) {
        fecha = moment().format('YYYY-MM-DD');
    }
    let queryFechaPath = registroProvincialData.queryFechaPath + fecha;
    try {
        let dataNacimientos = await handleHttpRequest(queryFechaPath);
        deb('Response query Nacimientos -->', dataNacimientos[0]);
        deb('INFO NACIMIENTOS-->', dataNacimientos[1]);

        // Transformamos la respuesta en un array JSON correcto
        let lastChar = dataNacimientos[1].lastIndexOf(',');
        dataNacimientos[1] = dataNacimientos[1].substring(0, lastChar);
        dataNacimientos[1] = '[' + dataNacimientos[1] + ']';
        dataNacimientos[1] = JSON.parse(dataNacimientos[1]);
        return (dataNacimientos[1]);
    } catch (error) {
        return error;
    }
}


async function relacionar(mama, bebe) {
    // Insertamos al bebé en ANDES
    bebe.relaciones = [{
        relacion: {
            _id: new Types.ObjectId('59247be21ebf0273353b23bf'),
            nombre: 'progenitor/a',
            opuesto: 'hijo/a'
        },
        referencia: mama._id,
        nombre: mama.nombre,
        apellido: mama.apellido,
        documento: mama.documento,
    }];
    try {
        let bebeAndes: any = await createPaciente(bebe, userScheduler);
        if (mama.relaciones) {
            let resultado = mama.relaciones.filter(elem => {
                return elem.nombre.trim() === bebeAndes.nombre && elem.apellido.trim() === bebeAndes.apellido;
            });
            deb('RESULTADOO --->', resultado);
            if (resultado.length === 0) {
                mama.relaciones.push({
                    relacion: {
                        _id: new Types.ObjectId('59247c391ebf0273353b23c0'),
                        nombre: 'hijo/a',
                        opuesto: 'progenitor/a'
                    },
                    referencia: bebeAndes._id,
                    nombre: bebeAndes.nombre,
                    apellido: bebeAndes.apellido,
                    documento: bebeAndes.documento,
                });
            }
        } else {
            mama.relaciones = [{
                relacion: {
                    _id: new Types.ObjectId('59247c391ebf0273353b23c0'),
                    nombre: 'hijo/a',
                    opuesto: 'progenitor/a'
                },
                referencia: bebeAndes._id,
                nombre: bebeAndes.nombre,
                apellido: bebeAndes.apellido,
                documento: bebeAndes.documento,
            }];
        }

        let updateMama = {
            estado: mama.estado,
            foto: mama.foto ? mama.foto : '',
            relaciones: mama.relaciones
        };

        // deb('UPDATE MAMA--->', updateMama);
        await updatePaciente(mama, updateMama, userScheduler);
    } catch (error) {
        return error;
    }

}

function parsearPacientes(importedData) {
    let parsedData = {
        bebe: {
            nombre: importedData.nnombres.trim(),
            apellido: importedData.napellidos.trim(),
            estado: 'temporal',
            documento: '', // Los bebés no tienen DNI
            certificadoRenaper: importedData.nrocertificado.trim(),
            fechaNacimiento: moment(importedData.nfechanac.trim(), 'YYYY-MM-DD', 'ar', true),
            horaNacimiento: importedData.nhoranac.trim(),
            sexo: (importedData.ntiposexo === '1' ? 'masculino' : 'femenino'),
            genero: (importedData.ntiposexo === '1' ? 'masculino' : 'femenino'),
            contacto: [],
            direccion: []
        },
        mama: {
            estado: 'temporal',
            nombre: importedData.nombres.trim(),
            apellido: importedData.apellidos.trim(),
            documento: importedData.nrodoc.trim(),
            fechaNacimiento: moment(importedData.fechanac.trim(), 'YYYY-MM-DD', 'ar', true),
            sexo: 'femenino',
            genero: 'femenino',
            contacto: [],
            direccion: []
        }
    };

    if (importedData.mail.trim() !== '') {
        parsedData.mama.contacto.push({
            tipo: 'email',
            valor: importedData.mail.trim(),
            ultimaActualizacion: moment()
        });
        parsedData.bebe.contacto.push({
            tipo: 'email',
            valor: importedData.mail.trim(),
            ultimaActualizacion: moment()
        });
    }
    if (importedData.telefono.trim() !== '') {
        parsedData.mama.contacto.push({
            tipo: 'fijo',
            valor: importedData.telefono.trim(),
            ultimaActualizacion: moment()
        });
        parsedData.bebe.contacto.push({
            tipo: 'fijo',
            valor: importedData.telefono.trim(),
            ultimaActualizacion: moment()
        });
    }

    parsedData.mama.direccion = parsedData.bebe.direccion = null;
    let bebe = new paciente(parsedData.bebe);
    let mama = new paciente(parsedData.mama);
    return { bebe, mama };
}

async function procesarDataNacimientos(nacimiento) {
    let resultadoParse: any = parsearPacientes(nacimiento);
    deb('PARSER RESULT--->', resultadoParse);
    try {
        let resultadoBusqueda: any = await buscarPacienteWithcondition({ documento: resultadoParse.mama.documento, sexo: 'femenino' });
        // Existe en ANDES? Si existe no se hace nada.
        deb('Resultado Busqueda --> ', resultadoBusqueda.db);
    } catch (error) {
        // No existe en ANDES, la función buscarPacienteWithcondition hace un reject cuando no encuentra al paciente
        // entonces tenemos que seguir la ejecución en este catch
        // --> Obtener paciente de Fuentas auténticas
        let nuevaMama = await validarPaciente(resultadoParse.mama);
        let mamaAndes = await createPaciente(nuevaMama, userScheduler);
        await relacionar(mamaAndes, resultadoParse.bebe);
    }
}

export async function agregarDocumentosFaltantes() {
    try {
        // Buscamos en andes los bebes que aún no tienen nro de documento
        let resultadoBusqueda: any = await paciente.find({ documento: '', certificadoRenaper: { $exists: true } });
        for (let pacienteBebe of resultadoBusqueda) {
            let bebe: any = await handleHttpRequest(registroProvincialData.queryNacidoByCertificado + pacienteBebe.certificadoRenaper);

            // Transformamos la respuesta en un array JSON correcto
            let lastChar = bebe[1].lastIndexOf(',');
            bebe[1] = bebe[1].substring(0, lastChar);
            bebe = JSON.parse(bebe[1]);

            if (bebe.nnrodoc !== '0') {
                let updateBebe = {
                    documento: bebe.nnrodoc
                };
                updatePaciente(pacienteBebe, updateBebe, userScheduler);
            }
        }
    } catch (error) {
        return error;
    }
}

export async function obtenerModificaciones(fecha: string = null) {
    if (!fecha) {
        fecha = moment().format('YYYY-MM-DD');
    }
    try {
        // importamos todos los bebes que fueron modificados desde la fecha requerida
        let resultadoBusqueda: any = await handleHttpRequest(registroProvincialData.queryNacidoByFechaModificacion + fecha);

        // Transformamos la respuesta en un array JSON correcto
        let lastChar = resultadoBusqueda[1].lastIndexOf(',');
        resultadoBusqueda[1] = resultadoBusqueda[1].substring(0, lastChar);
        resultadoBusqueda[1] = '[' + resultadoBusqueda[1] + ']';
        resultadoBusqueda = JSON.parse(resultadoBusqueda[1]);

        for (let bebeMod of resultadoBusqueda) {
            let bebe: any = await buscarPacienteWithcondition({ certificadoRenaper: bebeMod.nrocertificado });
            if (bebe.paciente._id) {
                // Se actualizan sólo los siguientes datos del bebé
                let updateBebe = {
                    nombre: bebeMod.nnombres,
                    apellido: bebeMod.napellidos,
                    documento: bebeMod.nnrodoc,
                    fechaNacimiento: moment(bebeMod.nfechanac.trim(), 'YYYY-MM-DD', 'ar', true),
                    sexo: (bebeMod.ntiposexo === '1' ? 'masculino' : 'femenino'),
                    genero: (bebeMod.ntiposexo === '1' ? 'masculino' : 'femenino'),
                };
                await updatePaciente(bebe.paciente, updateBebe, userScheduler);
            }
        }
    } catch (error) {
        return error;
    }
}

export async function importarNacimientos(fecha: string = null) {
    try {
        let infoNacimientosArray = await getInfoNacimientos(fecha);
        for (let nacimiento of infoNacimientosArray) {
            deb('Elemento ----->', nacimiento);
            await procesarDataNacimientos(nacimiento);
        }
    } catch (error) {
        return error;
    }
}
