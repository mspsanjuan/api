"use strict";

const hosts = require('./../../config.private').hosts;
const process = require("process");
const mongo = require('mongodb');
const moment = require('moment');
const async = require('async');
const fs = require('fs');
const exec = require('child_process').exec;

/**
 * +--------- SOBRE ESTE SCRIPT --------------------------------------------+
 * |                                                                        |-+
 * |    Devuelve en formato string JSON todos los turnos                    | |
 * |    de todas las agendas.                                               | |
 * |    Usa las configuraciones a continuación, respetando                  | |
 * |    la estructura del objeto "turno" declarado más abajo.               | |
 * |    La versión TS de este script (consultaCitasTurnos.ts)               | |
 * |    se compila con:                                                     | |
 * |    $ tsc --lib es2015 consultaCitasTurnos.ts                           | |
 * |                                                                        | |
 * +------------------------------------------------------------------------+ |
 *   +------------------------------------------------------------------------+
 * 
 * 
 * 
 * +--------- CONFIGURACIONES ----------+
 * |                                    |-+
 * |     limit: límite de agendas       | |
 * |     conn_andes: conexión ANDES     | |  
 * |     conn_mpi: conexión MPI         | |
 * |     type: DEV|TEST|PROD            | |
 * |                                    | |
 * +------------------------------------+ |
 *   +------------------------------------+
 */

// Genera archivos JSON y CSV usando el siguiente string como referencia 
const type = 'TEST'; // opciones: DEV (localhost), TEST (d-testing), PROD (andeshpn/andesmpi)
const outputFile = './turnos-agendas-' + type + '.json';
const query_limit = 10000000000;

const conn_andes = 'mongodb://localhost:27017/andes';
const conn_mpi = 'mongodb://localhost:27017/andes';

// Clientes Mongo para Andes y MPI
var MongoClient = mongo.MongoClient;
var MongoClientMPI = mongo.MongoClient;

// Cada objeto turno se agrega al array turnos
let turnos = [];

process.on('unhandledRejection', (err) => {
    console.error(err);
    process.exit(1);
});

async function init() {

    let encabezados = {
        Servicio: 'Servicio',
        Especialidad: 'Especialidad',
        Profesional: 'Profesional',
        Fecha: 'Fecha',
        Hora: 'Hora',
        SobreTurno: 'SobreTurno',
        Estado: 'Estado',
        Paciente_HC: 'Paciente_HC',
        Paciente_Nombre: 'Paciente_Nombre',
        Paciente_Documento: 'Paciente_Documento',
        Paciente_FechaNacimiento: 'Paciente_FechaNacimiento',
        Paciente_Edad: 'Paciente_Edad',
        Paciente_Sexo: 'Paciente_Sexo',
        ObraSocial_Codigo: 'ObraSocial_Codigo',
        ObraSocial_Nombre: 'ObraSocial_Nombre',
        Domicilio: 'Domicilio',
        Consulta_Obstretica: 'Consulta_Obstretica',
        Consulta_Embarazo: 'Consulta_Embarazo',
        Diagnostico1: 'Diagnostico1',
        Diagnostico1_CIE10_Causa: 'Diagnostico1_CIE10_Causa',
        Diagnostico1_CIE10_Subcausa: 'Diagnostico1_CIE10_Subcausa',
        Diagnostico2: 'Diagnostico2',
        Diagnostico2_CIE10_Causa: 'Diagnostico2_CIE10_Causa',
        Diagnostico2_CIE10_Subcausa: 'Diagnostico2_CIE10_Subcausa',
        Diagnostico3: 'Diagnostico3',
        Diagnostico3_CIE10_Causa: 'Diagnostico3_CIE10_Causa',
        Diagnostico3_CIE10_Subcausa: 'Diagnostico3_CIE10_Subcausa',
        Sin_registrar: 'Sin_registrar'
    };
    await fs.appendFileSync(outputFile, '[' + JSON.stringify(encabezados) + ',', {
        encoding: 'utf8'
    }, (err) => {
        if (err) {
            throw err;
        }
    });

    // MAIN ANDES
    await MongoClient.connect(conn_andes, async(err, db) => {
        console.log('ANDES Conectado');
        if (err) {
            console.log(err);
        }

        // MPI ANDES
        await MongoClientMPI.connect(conn_mpi, async function (err, mpi) {
            console.log('MPI Conectado');

            if (err) {
                console.log(err);
            }
            let i = 0;

            let cursor = db.collection('agenda').aggregate([

                {
                    $match: {
                        'organizacion._id': mongo.ObjectID("57e9670e52df311059bc8964"),
                    }
                },
                {
                    $limit: query_limit
                }

            ], {
                cursor: {
                    batchSize: 1
                }
            });

            let cursorArray = cursor.toArray();

            await cursorArray.then(agendas => {

                let indexAg = 0;
                async.every(agendas, async(a, indexA) => {
                    indexAg++;
                    // console.log('a', indexA);
                    async.every(a.bloques, async(b, indexB) => {
                        // console.log('b', indexB);
                        let indexTU = 0;
                        async.every(b.turnos, async(t, indexT) => {
                            indexTU++;
                            // console.log('t', indexT);
                            let pID = (t.paciente && t.paciente.id) ? t.paciente.id : null;
                            // Objeto turno
                            let turno = {
                                Servicio: '-',
                                Profesional: '-',
                                Especialidad: '-',
                                Fecha: '-',
                                Hora: '-',
                                SobreTurno: '-',
                                Estado: '-',
                                Paciente_HC: '-',
                                Paciente_Nombre: '-',
                                Paciente_Documento: '-',
                                Paciente_FechaNacimiento: '-',
                                Paciente_Edad: '-',
                                Paciente_Sexo: '-',
                                ObraSocial_Codigo: '-',
                                ObraSocial_Nombre: '-',
                                Domicilio: '-',
                                Consulta_Obstretica: '-',
                                Consulta_Embarazo: '-',
                                Diagnostico1: '-',
                                Diagnostico1_CIE10_Causa: '-',
                                Diagnostico1_CIE10_Subcausa: '-',
                                Diagnostico2: '-',
                                Diagnostico2_CIE10_Causa: '-',
                                Diagnostico2_CIE10_Subcausa: '-',
                                Diagnostico3: '-',
                                Diagnostico3_CIE10_Causa: '-',
                                Diagnostico3_CIE10_Subcausa: '-',
                                Sin_registrar: '-',
                            }
                            let paciente = await getPaciente(mpi, db, pID);

                            turno.Servicio = (a.espacioFisico && a.espacioFisico.servicio ? a.espacioFisico.servicio.nombre : 'Sin servicio');
                            turno.Profesional = (a.profesionales && a.profesionales[0] && a.profesionales.length > 0 ? a.profesionales.map(pr => pr.apellido + ', ' + pr.nombre).join('; ') : 'Sin profesionales');
                            turno.Fecha = moment(t.horaInicio).format('DD/MM/YYYY').toString();
                            turno.Hora = moment(t.horaInicio).format('H:mm').toString();

                            if (t.tipoPrestacion) {
                                turno.Especialidad = t.tipoPrestacion.term;
                            } else {
                                turno.Especialidad = b.tipoPrestaciones.map(tp => tp.term).join(', ');
                            }

                            turno.SobreTurno = 'NO';

                            turno.Estado = t.estado;

                            if (paciente !== null) {

                                turno.Estado = turno.Estado + (t.asistencia ? ' (' + (t.asistencia === 'noAsistio' ? 'no asistió' : 'asistió') + ')' : '');
                                turno.Paciente_HC = (paciente && paciente.carpetaEfectores && paciente.carpetaEfectores[0] ? paciente.carpetaEfectores.filter(x => x.organizacion._id === a.organizacion._id).join('') : 'Sin nro carpeta');
                                turno.Paciente_Nombre = (paciente && paciente.apellido ? paciente.apellido + ', ' + paciente.nombre : 'Sin paciente');
                                turno.Paciente_Documento = (paciente && paciente.documento ? paciente.documento : '-');
                                turno.Paciente_FechaNacimiento = (paciente && paciente.fechaNacimiento ? moment(paciente.fechaNacimiento).format('DD/MM/YYYY').toString() : '-');
                                turno.Paciente_Edad = (paciente && paciente.fechaNacimiento ? moment().diff(paciente.fechaNacimiento, 'years') : '-');
                                turno.Paciente_Sexo = (paciente && paciente.sexo ? paciente.sexo : '-');
                                turno.ObraSocial_Codigo = (paciente && paciente.financiador && paciente.financiador[0] ? paciente.financiador.map(x => x.codigo).join(', ') : '-');
                                turno.ObraSocial_Nombre = (paciente && paciente.financiador && paciente.financiador[0] ? paciente.financiador.map(x => x.entidad.nombre).join(', ') : '-');
                                // Read this :joy:
                                turno.Domicilio = (paciente && paciente.direccion && paciente.direccion[0] ?
                                    paciente.direccion.map(x => x.valor + ((x.ubicacion && x.ubicacion.localidad && x.ubicacion.localidad.nombre) ?
                                        ' ' + x.ubicacion.localidad.nombre :
                                        '-')).join(', ') :
                                    '-');

                                // Diagnóstico 1
                                turno.Diagnostico1 = ((t.diagnosticoPrincipal && t.diagnosticoPrincipal.codificacion) ?
                                    (t.diagnosticoPrincipal.ilegible ?
                                        'Ilegible' :
                                        t.diagnosticoPrincipal.codificacion.nombre) :
                                    '-');

                                turno.Diagnostico1_CIE10_Causa = (t.diagnosticoPrincipal && t.diagnosticoPrincipal.codificacion && t.diagnosticoPrincipal.codificacion.nombre ?
                                    t.diagnosticoPrincipal.codificacion.nombre :
                                    '-');
                                turno.Diagnostico1_CIE10_Subcausa = '-'; // TODO

                                // Diagnóstico 2
                                turno.Diagnostico2 = ((t.diagnosticoSecundario && t.diagnosticoSecundario[0] && t.diagnosticoSecundario[0].codificacion) ?
                                    (t.diagnosticoSecundario[0].ilegible ?
                                        'Ilegible' :
                                        t.diagnosticoSecundario[0].codificacion.nombre) :
                                    '-');

                                turno.Diagnostico2_CIE10_Causa = (t.diagnosticoSecundario && t.diagnosticoSecundario[0] && t.diagnosticoSecundario[0].codificacion.nombre ?
                                    t.diagnosticoSecundario[0].codificacion.nombre :
                                    '-');
                                turno.Diagnostico2_CIE10_Subcausa = '-'; // TODO

                                // Diagnóstico 3
                                turno.Diagnostico3 = ((t.diagnosticoSecundario && t.diagnosticoSecundario[1] && t.diagnosticoSecundario[1].codificacion) ?
                                    (t.diagnosticoSecundario[1].ilegible ?
                                        'Ilegible' :
                                        t.diagnosticoSecundario[1].codificacion.nombre) :
                                    '-');

                                turno.Diagnostico3_CIE10_Causa = (t.diagnosticoSecundario && t.diagnosticoSecundario[1] && t.diagnosticoSecundario[1].codificacion.nombre ?
                                    t.diagnosticoSecundario[1].codificacion.nombre :
                                    '-');
                                turno.Diagnostico3_CIE10_Subcausa = '-'; // TODO

                                turno.Sin_registrar = false;
                                turnos.push(turno);

                            } else {

                                turno.Sin_registrar = true;
                                turnos.push(turno);
                            }
                            let jsonWrite = await fs.appendFileSync(outputFile, JSON.stringify(turno) + ',', {
                                encoding: 'utf8'
                            }, (err) => {
                                if (err) {
                                    process.exit(1);
                                }
                            });
                            i++;
                        });
                    });

                    if (a.sobreturnos && a.sobreturnos.length > 0) {
                        let pID = (t.paciente && t.paciente.id) ? t.paciente.id : null;

                        let paciente = await getPaciente(mpi, db, pID);

                        turno.Servicio = (a.espacioFisico && a.espacioFisico.servicio ? a.espacioFisico.servicio.nombre : 'Sin servicio');
                        turno.Profesional = (a.profesionales && a.profesionales[0] && a.profesionales.length > 0 ? a.profesionales.map(pr => pr.apellido + ', ' + pr.nombre).join('; ') : 'Sin profesionales');
                        turno.Fecha = moment(t.horaInicio).format('DD/MM/YYYY').toString();
                        turno.Hora = moment(t.horaInicio).format('H:mm').toString();

                        if (t.tipoPrestacion) {
                            turno.Especialidad = t.tipoPrestacion.term;
                        } else {
                            turno.Especialidad = b.tipoPrestaciones.map(tp => tp.term).join(', ');
                        }

                        turno.SobreTurno = 'NO';
                        turno.Estado = t.estado;

                        if (paciente !== null) {

                            turno.Estado = turno.Estado + (t.asistencia ? ' (' + (t.asistencia === 'noAsistio' ? 'no asistió' : 'asistió') + ')' : '');
                            turno.Paciente_HC = (paciente && paciente.carpetaEfectores && paciente.carpetaEfectores[0] ? paciente.carpetaEfectores.filter(x => x.organizacion._id === a.organizacion._id).join('') : 'Sin nro carpeta');
                            turno.Paciente_Nombre = (paciente && paciente.apellido ? paciente.apellido + ', ' + paciente.nombre : 'Sin paciente');
                            turno.Paciente_Documento = (paciente && paciente.documento ? paciente.documento : '-');
                            turno.Paciente_FechaNacimiento = (paciente && paciente.fechaNacimiento ? moment(paciente.fechaNacimiento).format('DD/MM/YYYY').toString() : '-');
                            turno.Paciente_Edad = (paciente && paciente.fechaNacimiento ? moment().diff(paciente.fechaNacimiento, 'years') : '-');
                            turno.Paciente_Sexo = (paciente && paciente.sexo ? paciente.sexo : '-');
                            turno.ObraSocial_Codigo = (paciente && paciente.financiador && paciente.financiador[0] ? paciente.financiador.map(x => x.codigo).join(', ') : '-');
                            turno.ObraSocial_Nombre = (paciente && paciente.financiador && paciente.financiador[0] ? paciente.financiador.map(x => x.entidad.nombre).join(', ') : '-');
                            // Read this :joy:
                            turno.Domicilio = (paciente && paciente.direccion && paciente.direccion[0] ?
                                paciente.direccion.map(x => x.valor + ((x.ubicacion && x.ubicacion.localidad && x.ubicacion.localidad.nombre) ?
                                    ' ' + x.ubicacion.localidad.nombre :
                                    '-')).join(', ') :
                                '-');

                            // Diagnóstico 1
                            turno.Diagnostico1 = ((t.diagnosticoPrincipal && t.diagnosticoPrincipal.codificacion) ?
                                (t.diagnosticoPrincipal.ilegible ?
                                    'Ilegible' :
                                    t.diagnosticoPrincipal.codificacion.nombre) :
                                '-');

                            turno.Diagnostico1_CIE10_Causa = (t.diagnosticoPrincipal && t.diagnosticoPrincipal.codificacion && t.diagnosticoPrincipal.codificacion.nombre ?
                                t.diagnosticoPrincipal.codificacion.nombre :
                                '-');
                            turno.Diagnostico1_CIE10_Subcausa = '-'; // TODO

                            // Diagnóstico 2
                            turno.Diagnostico2 = ((t.diagnosticoSecundario && t.diagnosticoSecundario[0] && t.diagnosticoSecundario[0].codificacion) ?
                                (t.diagnosticoSecundario[0].ilegible ?
                                    'Ilegible' :
                                    t.diagnosticoSecundario[0].codificacion.nombre) :
                                '-');

                            turno.Diagnostico2_CIE10_Causa = (t.diagnosticoSecundario && t.diagnosticoSecundario[0] && t.diagnosticoSecundario[0].codificacion.nombre ?
                                t.diagnosticoSecundario[0].codificacion.nombre :
                                '-');
                            turno.Diagnostico2_CIE10_Subcausa = '-'; // TODO

                            // Diagnóstico 3
                            turno.Diagnostico3 = ((t.diagnosticoSecundario && t.diagnosticoSecundario[1] && t.diagnosticoSecundario[1].codificacion) ?
                                (t.diagnosticoSecundario[1].ilegible ?
                                    'Ilegible' :
                                    t.diagnosticoSecundario[1].codificacion.nombre) :
                                '-');

                            turno.Diagnostico3_CIE10_Causa = (t.diagnosticoSecundario && t.diagnosticoSecundario[1] && t.diagnosticoSecundario[1].codificacion.nombre ?
                                t.diagnosticoSecundario[1].codificacion.nombre :
                                '-');
                            turno.Diagnostico3_CIE10_Subcausa = '-'; // TODO

                            turno.Sin_registrar = false;
                            turnos.push(turno);

                        } else {

                            turno.Sin_registrar = true;
                            turnos.push(turno);
                        }
                        let jsonWrite = await fs.appendFileSync(outputFile, JSON.stringify(turno) + ',', {
                            encoding: 'utf8'
                        }, (err) => {
                            if (err) {
                                process.exit(1);
                            }
                        });
                        i++;
                    }

                });

            }); // Fin agendas
        }); // FIN MPI
    }); // FIN ANDES
    setTimeout(() => {
        console.log('Fin de consulta.');
        // exec('sed \'$ s/.$//\' ' + outputFile);
        let csv = outputFile.replace('.json', '.csv');
        let csvANSI = csv.replace('.csv', '-ANSI.csv');
        exec("sed -i '$ s/.$/]/' " + outputFile, () => {
            exec("< " + outputFile + " jq -r '.[] | [.Servicio,.Especialidad,.Profesional,.Fecha,.Hora,.SobreTurno,.Estado,.Paciente_HC,.Paciente_Nombre,.Paciente_Documento,.Paciente_FechaNacimiento,.Paciente_Edad,.Paciente_Sexo,.ObraSocial_Codigo,.ObraSocial_Nombre,.Domicilio,.Consulta_Obstretica,.Consulta_Embarazo,.Diagnostico1,.Diagnostico1_CIE10_Causa,.Diagnostico1_CIE10_Subcausa,.Diagnostico2,.Diagnostico2_CIE10_Causa,.Diagnostico2_CIE10_Subcausa,.Diagnostico3,.Diagnostico3_CIE10_Causa,.Diagnostico3_CIE10_Subcausa,(if .Sin_registrar == true then \"Sin registrar\" elif .Sin_registrar == false then \"Registrado\" else \"Sin_Registrar\" end)] | @csv' > " + outputFile.replace('.json', '.csv'), () => {
                exec("iconv -f UTF-8 -t MS-ANSI " + csv + " -o " + csvANSI, (err, stdout, stderr) => {
                    // console.log(stdout);
                    exec("file " + csvANSI, (err, stdout, stderr) => {
                        console.log('Se generó el archivo: ', stdout);
                        process.exit(0);
                    });
                });
            });
        });
    }, 5000);
}

async function getPaciente(mpi, db, idPaciente = null) {
    return new Promise((resolve, reject) => {
        mpi.collection('paciente').findOne({
            '_id': new mongo.ObjectID(idPaciente)
        }, (err, paciente) => {
            if (err) console.log(err);
            if (paciente && paciente._id) {
                resolve(paciente);
            } else {
                db.collection('paciente').findOne({
                    '_id': new mongo.ObjectID(idPaciente)
                }, (err, paciente) => {
                    if (err) console.log(err);
                    if (paciente && paciente._id) {
                        resolve(paciente);
                    } else {
                        resolve(null);
                    }
                });
            }
        });
    });
}

init().then(() => {
    console.log('Consulta iniciada...');
});