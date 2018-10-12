
import { Connections } from '../connections';


Connections.initialize();
import { paciente } from '../core/mpi/schemas/paciente';

import * as xlsx from 'node-xlsx';
// tslint:disable-next-line:no-implicit-dependencies
import { Auth } from '../auth/auth.class';
import { getServicioRenaper } from './servicioRenaper';
import { matchSisa } from './servicioSisa';
import moment = require('moment');
// const Auth = require('../auth/auth.class');
const Config = require('../config.private');
const userScheduler = Config.userScheduler;
const regtest = /[^a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ ']+/;

juandesImport();


export async function juandesImport() {
    let padron: any = xlsx.parse('/andes/api/padron.xlsx', { sheetRows: 13804 });
    let datos: any = padron[0].data;
    let count = 0;
    for (let pacienteSanJuan of datos) {
        let sexoSanJuan = pacienteSanJuan[4] ? pacienteSanJuan[4].toString().toLowerCase() : null;
        sexoSanJuan = sexoSanJuan === 'indeterminado' ? 'otro' : sexoSanJuan;
        let cuilSanJuan = pacienteSanJuan[5] !== 'NULL' ? pacienteSanJuan[5] : '';
        let estadoCivilSanJuan = '';
        switch (pacienteSanJuan[7]) {
            case 'Soltero/a':
                estadoCivilSanJuan = 'soltero';
                break;
            case 'Casado/a':
                estadoCivilSanJuan = 'casado';
                break;
            case 'Unión Convivencial':
                estadoCivilSanJuan = 'concubino';
                break;
            case 'Divorciado':
                estadoCivilSanJuan = 'divorciado';
                break;
            case 'Viudo/a':
                estadoCivilSanJuan = 'viudo';
                break;
            default:
                estadoCivilSanJuan = null;
                break;

        }
        let calleNumero = ((pacienteSanJuan[16] && pacienteSanJuan[16] !== '' && pacienteSanJuan[16] !== 'NULL') ? pacienteSanJuan[16].toString().trim() : '');
        if (calleNumero !== '' && pacienteSanJuan[17] !== 'NULL') {
            calleNumero = calleNumero + ' ' + pacienteSanJuan[17];
        }

        let paisSanJuan = null;
        if (pacienteSanJuan[8] !== 'NULL') {
            paisSanJuan = { nombre: pacienteSanJuan[8] };
        }
        let provinciaSanJuan = null;
        if (pacienteSanJuan[9] !== 'NULL') {
            provinciaSanJuan = { nombre: pacienteSanJuan[9] };
        }
        let localidadSanJuan = null;
        if (pacienteSanJuan[11] !== 'NULL') {
            localidadSanJuan = {
                nombre: pacienteSanJuan[11]
            };
        }
        let barrioSanJuan = null;
        if (pacienteSanJuan[12] !== 'NULL') {
            barrioSanJuan = {
                nombre: pacienteSanJuan[12]
            };
        }

        let direccionSanJuan = [{
            valor: calleNumero || '',
            ubicacion: {
                barrio: barrioSanJuan,
                localidad: localidadSanJuan,
                provincia: provinciaSanJuan,
                pais: paisSanJuan
            }
        }];

        let contactoSanJuan = [];
        if (pacienteSanJuan[19] !== 'NULL') {
            let fijo = {
                tipo: 'fijo',
                valor: pacienteSanJuan[19],
                ultimaActualizacion: new Date(),

            };
            contactoSanJuan.push(fijo);
        }
        if (pacienteSanJuan[20] !== 'NULL') {
            let fijo = {
                tipo: 'fijo',
                valor: pacienteSanJuan[20],
                ultimaActualizacion: new Date(),

            };
            contactoSanJuan.push(fijo);
        }
        if (pacienteSanJuan[21] !== 'NULL') {
            let celular = {
                tipo: 'celular',
                valor: pacienteSanJuan[21],
                ultimaActualizacion: new Date(),

            };
            contactoSanJuan.push(celular);
        }
        let carpetaSanJuan = [];
        if (pacienteSanJuan[22] !== 'NULL') {
            let nuevaCarpeta = {
                nroCarpeta: pacienteSanJuan[22],
                organizacion: {
                    nombre: 'San Juan'
                }
            };
            carpetaSanJuan.push(nuevaCarpeta);
        }
        // Ojo, algunos pacientes del SAN JUAN tienen la fecha de nacimiento en 'NULL'
        let fechaNacimientoSanjuan = (pacienteSanJuan[6] !== 'NULL') ? new Date(pacienteSanJuan[6]) : null;
        let newPaciente = {

            documento: pacienteSanJuan[3],
            nombre: pacienteSanJuan[1],
            apellido: pacienteSanJuan[0],
            sexo: sexoSanJuan,
            genero: sexoSanJuan,
            cuil: cuilSanJuan,
            estado: 'temporal',
            fechaNacimiento: fechaNacimientoSanjuan,
            estadoCivil: estadoCivilSanJuan,
            direccion: direccionSanJuan,
            contacto: contactoSanJuan,
            carpetaEfectores: carpetaSanJuan
        };
        try {
            let resRenaper: any = await getServicioRenaper({ newPaciente });

            if (resRenaper && resRenaper.datos.nroError === 0) {
                let pacienteRenaper = resRenaper.dataRenaper;
                let band = regtest.test(pacienteRenaper.nombres);
                band = band || regtest.test(pacienteRenaper.apellido);
                if (!band) {
                    newPaciente.nombre = pacienteRenaper.nombres;
                    newPaciente.apellido = pacienteRenaper.apellido;
                    newPaciente.fechaNacimiento = new Date(pacienteRenaper.fechaNacimiento);
                    newPaciente.cuil = pacienteRenaper.cuil;
                    newPaciente.estado = 'validado';
                } else {
                    try {
                        let resSisa: any = await matchSisa(newPaciente);
                        let porcentajeMatcheo = resSisa.matcheos.matcheo;
                        if (porcentajeMatcheo > 95) {
                            newPaciente.nombre = resSisa.matcheos.datosPaciente.nombre;
                            newPaciente.apellido = resSisa.matcheos.datosPaciente.apellido;
                            newPaciente.fechaNacimiento = resSisa.matcheos.datosPaciente.fechaNacimiento;
                            newPaciente.estado = 'validado';

                        }
                    } catch (error) {
                        console.log('ERROR SISA ---->', error);
                    }

                }

            }
        } catch (error) {
            console.log('ERROR ---->', error);
        }
        if (newPaciente.fechaNacimiento) {
            let nuevopac = new paciente(newPaciente);
            Auth.audit(nuevopac, (userScheduler as any));
            await nuevopac.save();
        } else {
            console.log('PACIENTE SIN FECHA DE NACIMIENTO, NO INSERTADO');
        }
        count++;
    }
    console.log('FIN, cantidad de pacientes migrados: ', count);
}
