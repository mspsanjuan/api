import { pacienteMpi, paciente } from '../core/mpi/schemas/paciente';
import * as xlsx from 'node-xlsx';

juandesImport();

export function juandesImport() {
    let padron: any = xlsx.parse('/andes/api/padron.xlsx', { sheetRows: 13805 });
    let datos: [any] = padron[0].data;
    console.log(datos.shift);

    datos.forEach((pacienteSanJuan: any) => {
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

        let paisSanJuan = { nombre: pacienteSanJuan[8] !== 'NULL' ? pacienteSanJuan[8] : null };
        let provinciaSanJuan = { nombre: pacienteSanJuan[9] !== 'NULL' ? pacienteSanJuan[9] : null };
        let localidadSanJuan = { nombre: pacienteSanJuan[11] !== 'NULL' ? pacienteSanJuan[11] : null };
        let barrioSanJuan = { nombre: pacienteSanJuan[12] !== 'NULL' ? pacienteSanJuan[12] : null };
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

        let newPaciente = {
            documento: pacienteSanJuan[3],
            nombre: pacienteSanJuan[1],
            apellido: pacienteSanJuan[0],
            sexo: sexoSanJuan,
            cuil: cuilSanJuan,
            estado: 'activo',
            fechaNacimiento: new Date(pacienteSanJuan[6]),
            estadoCivil: estadoCivilSanJuan,
            direccion: direccionSanJuan,
            contacto: contactoSanJuan,
            carpetaEfectores: carpetaSanJuan
        };

        console.log(newPaciente);
    });

}
