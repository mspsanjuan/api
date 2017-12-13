import * as config from './../../config.private';
import * as process from 'process';
import * as mongo from 'mongodb';
import * as moment from 'moment';
import * as async from 'async';
import * as fs from 'fs';
import * as child_process from 'child_process';

/**
 * +--------- SOBRE ESTE SCRIPT ---------------------------------+
 * |                                                             |-+
 * |    Devuelve en formato string JSON todos los turnos         | |
 * |    de todas las agendas.                                    | |
 * |    Usa las configuraciones a continuación, respetando       | |
 * |    la estructura del objeto "turno" declarado más abajo.    | |
 * |    Compilar: $ tsc --lib es2015 consultaCitasTurnos.ts      | |
 * |                                                             | |
 * +-------------------------------------------------------------+ |
 *   +-------------------------------------------------------------+
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

const type = 'THIS'; // opciones: DEV (localhost), TEST (d-testing), PROD (andeshpn/andesmpi)
const outputFile = './turnos-agendas-' + type + '.json';
const query_limit = 10000000000;
// const conn_andes = 'mongodb://localhost:27017/andes';
// const conn_mpi = 'mongodb://localhost:27017/andes';
const conn_andes = `${config.hosts.mongoDB_main_PROD.host}?authSource=admin`;
const conn_mpi = `${config.hosts.mongoDB_mpi_PROD.host}?authSource=admin`;

// Clientes Mongo para Andes y MPI
var MongoClient = mongo.MongoClient;
var MongoClientMPI = mongo.MongoClient;

// Cada objeto turno se agrega al array turnos
let turnos = [];

process.on('unhandledRejection', (err) => {
    // console.error(err);
    process.exit(1);
});

function init() {

    console.log('Consulta iniciada...');

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

    // Primera línea contiene los encabezados
    fs.appendFileSync(outputFile, '[' + JSON.stringify(encabezados) + ',', {
        encoding: 'utf8'
    });

    // MAIN ANDES
    MongoClient.connect(conn_andes, (err, db) => {
        console.log('ANDES Conectado');
        if (err) {
            console.log(err);
        }

        // MPI ANDES
        MongoClientMPI.connect(conn_mpi, (err2, mpi) => {
            console.log('MPI Conectado');
            if (err2) {
                console.log(err2);
            }
            let i = 0;

            let cursor = db.collection('agenda').aggregate([

                {
                    $match: {
                        'organizacion._id': new mongo.ObjectID('57e9670e52df311059bc8964'),
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

            cursorArray.then(agendas => {

                let indexAg = 0;
                async.every(agendas, (a, indexA) => {
                    indexAg++;
                    // console.log('a', indexA);
                    async.every(a.bloques, (b: any, indexB) => {
                        // console.log('b', indexB);
                        let indexTU = 0;
                        async.every(b.turnos, async (t: any, indexT) => {
                            indexTU++;
                            // console.log('t', indexT);
                            let pID = (t.paciente && t.paciente.id) ? t.paciente.id : null;
                            // Objeto turno
                            let turno: any = {
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
                                Sin_registrar: true,
                            };

                            let paciente: any = await getPaciente(mpi, db, pID);

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
                            });
                            i++;
                        });
                    });

                    if (a.sobreturnos && a.sobreturnos.length > 0) {
                        async.every(a.sobreturnos, async (t: any, indexT) => {
                            let pID = (t.paciente && t.paciente.id) ? t.paciente.id : null;
                            // Objeto turno
                            let turno: any = {
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
                                Sin_registrar: true,
                            };

                            let paciente: any = await getPaciente(mpi, db, pID);

                            turno.Servicio = (a.espacioFisico && a.espacioFisico.servicio ? a.espacioFisico.servicio.nombre : 'Sin servicio');
                            turno.Profesional = (a.profesionales && a.profesionales[0] && a.profesionales.length > 0 ? a.profesionales.map(pr => pr.apellido + ', ' + pr.nombre).join('; ') : 'Sin profesionales');
                            turno.Fecha = moment(t.horaInicio).format('DD/MM/YYYY').toString();
                            turno.Hora = moment(t.horaInicio).format('H:mm').toString();

                            if (t.tipoPrestacion) {
                                turno.Especialidad = t.tipoPrestacion.term;
                            } else {
                                turno.Especialidad = a.tipoPrestaciones.map(tp => tp.term).join(', ');
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
                            });
                            i++;
                        });
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
        child_process.exec("sed -i '$ s/.$/]/' " + outputFile, () => {
            child_process.exec("< " + outputFile + " jq -r '.[] | [.Servicio,.Especialidad,.Profesional,.Fecha,.Hora,.SobreTurno,.Estado,.Paciente_HC,.Paciente_Nombre,.Paciente_Documento,.Paciente_FechaNacimiento,.Paciente_Edad,.Paciente_Sexo,.ObraSocial_Codigo,.ObraSocial_Nombre,.Domicilio,.Consulta_Obstretica,.Consulta_Embarazo,.Diagnostico1,.Diagnostico1_CIE10_Causa,.Diagnostico1_CIE10_Subcausa,.Diagnostico2,.Diagnostico2_CIE10_Causa,.Diagnostico2_CIE10_Subcausa,.Diagnostico3,.Diagnostico3_CIE10_Causa,.Diagnostico3_CIE10_Subcausa,(if .Sin_registrar == true then \"Sin registrar\" elif .Sin_registrar == false then \"Registrado\" else \"Sin_Registrar\" end)] | @csv' > " + outputFile.replace('.json', '.csv'), () => {
                child_process.exec("iconv -f UTF-8 -t MS-ANSI " + csv + " -o " + csvANSI, (err, stdout, stderr) => {
                    // console.log(stdout);
                    child_process.exec("file " + csvANSI, (err2, stdout2, stderr2) => {
                        console.log('Se generó el archivo: ', stdout2);
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
            if (err) {
                console.log(err);
            }
            if (paciente && paciente._id) {

                resolve(paciente);
            } else {
                db.collection('paciente').findOne({
                    '_id': new mongo.ObjectID(idPaciente)
                }, (err2, pacienteAndes) => {
                    if (err2) {
                        console.log(err2);
                    }
                    if (pacienteAndes && pacienteAndes._id) {
                        resolve(pacienteAndes);
                    } else {
                        resolve(null);
                    }

                });
            }
        });
    });
}

init();
