import * as agendaModel from '../schemas/agenda';
import { model as prestacionModel } from '../../rup/schemas/prestacion';
import { toArray } from '../../../utils/utils';
import * as mongoose from 'mongoose';

export async function getResumenDiarioMensual(params: any) {

    let pipeline = [];
    let y = params['anio'];
    let m = params['mes'] - 1;
    let firstDay = new Date(y, m, 1);
    let lastDay = new Date(y, m + 1, 0);

    pipeline = [
        {
            $match: {
                horaInicio: {
                    $gte: firstDay,
                    $lte: lastDay
                },
                'organizacion._id': new mongoose.Types.ObjectId(params['organizacion']),
                'tipoPrestaciones._id': new mongoose.Types.ObjectId(params['prestacion']),
                estado: { $nin: ['borrada', 'suspendida'] }
            }
        },
        {
            $unwind: {
                path: '$tipoPrestaciones'
            }
        },
        {
            $match: {
                'organizacion._id': new mongoose.Types.ObjectId(params['organizacion']),
                'tipoPrestaciones._id': new mongoose.Types.ObjectId(params['prestacion']),
                estado: { $nin: ['borrada', 'suspendida'] }
            }
        },
        {
            $unwind: {
                path: '$bloques'
            }
        },
        {
            $unwind: {
                path: '$bloques.turnos'
            }
        },
        {
            $match: {
                'bloques.turnos.estado': 'asignado',

                'bloques.turnos.asistencia': 'asistio'
            }
        },
        {
            $project: {
                _id: 0,
                fecha: '$horaInicio',
                turnoEstado: '$bloques.turnos.estado',
                pacienteSexo: '$bloques.turnos.paciente.sexo',
                pacienteEdad: {
                    $trunc: {
                        $divide: [
                            {
                                $subtract: [
                                    '$horaInicio',
                                    '$bloques.turnos.paciente.fechaNacimiento'
                                ]
                            },
                            86400000
                        ]
                    }
                }
            }
        },
        {
            $group: {
                _id: {
                    fecha: '$fecha',
                    sexo: '$pacienteSexo',
                    edad: {
                        $switch: {
                            branches: [
                                { case: { $lt: ['$pacienteEdad', 30] }, then: 30 }, // menores de 30 dias
                                {
                                    case: {
                                        $and: [
                                            { $lt: ['$pacienteEdad', 365] },
                                            { $gte: ['$pacienteEdad', 30] }
                                        ]
                                    },
                                    then: 1
                                }, // mayore de 30 dias hasta 1(365) año
                                {
                                    case: {
                                        $and: [
                                            { $lt: ['$pacienteEdad', 1825] },
                                            { $gte: ['$pacienteEdad', 365] }
                                        ]
                                    },
                                    then: 5
                                }, // mayore de 1(365) años hasta 5(1825) años
                                {
                                    case: {
                                        $and: [
                                            { $lt: ['$pacienteEdad', 5475] },
                                            { $gte: ['$pacienteEdad', 1825] }
                                        ]
                                    },
                                    then: 15
                                }, // mayore de 5(1825) años hasta 15(5475) años
                                {
                                    case: {
                                        $and: [
                                            { $lt: ['$pacienteEdad', 7300] },
                                            { $gte: ['$pacienteEdad', 5475] }
                                        ]
                                    },
                                    then: 20
                                }, // mayore de 15(5475) años hasta 20(7300) años
                                {
                                    case: {
                                        $and: [
                                            { $lt: ['$pacienteEdad', 14600] },
                                            { $gte: ['$pacienteEdad', 7300] }
                                        ]
                                    },
                                    then: 40
                                }, // mayore de 20(7300) años hasta 40(14600) años
                                {
                                    case: {
                                        $and: [
                                            { $lt: ['$pacienteEdad', 25550] },
                                            { $gte: ['$pacienteEdad', 14600] }
                                        ]
                                    },
                                    then: 70
                                }, // mayore de 40(14600) años hasta 70(25550) años
                                {
                                    case: { $and: [{ $gte: ['$pacienteEdad', 25550] }] },
                                    then: 100
                                } // mayore de 70(25550) años
                            ]
                        }
                    }
                },
                total: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                fechaISO:  '$_id.fecha',
                fecha: { $dateToString: { format: '%d-%m-%G', date: '$_id.fecha' } },
                sexo: '$_id.sexo',
                edad: '$_id.edad',
                total: '$total'
            }
        },
        {
            $sort: {
                fechaISO: 1,
                edad: 1
            }
        }
    ];

    let data = await agendaModel.aggregate(pipeline);

    let formatedData = formatData(data, y, m);

    return formatedData;
}

function formatData(data: any, anio: number, mes: number) {
    let res = [];

    const numOfDays = new Date(anio, mes + 1, 0).getDate();

    for (let i = 0; i < numOfDays; i++) {
        let reg = new Linea();
        let strDia = '';
        reg.dia = new Date(anio, mes, i + 1);
        strDia = reg.dia.getDate().toString().padStart(2, '0') + '-' + (reg.dia.getMonth() + 1).toString().padStart(2, '0') + '-' + reg.dia.getFullYear().toString();

        // Filtro solo los del dia correspondiente
        let currData = data.filter(r => r.fecha === strDia);

        // Mapeo con rango eteario y sexo correspondiente
        if (currData.length > 0) {
            reg['30'].m = sumar(currData, 'masculino', 30);
            reg['30'].f = sumar(currData, 'femenino', 30);

            reg['0_1'].m = sumar(currData, 'masculino', 1);
            reg['0_1'].f = sumar(currData, 'femenino', 1);

            reg['1_4'].m = sumar(currData, 'masculino', 5);
            reg['1_4'].f = sumar(currData, 'femenino', 5);

            reg['5_14'].m = sumar(currData, 'masculino', 15);
            reg['5_14'].f = sumar(currData, 'femenino', 15);

            reg['15_19'].m = sumar(currData, 'masculino', 20);
            reg['15_19'].f = sumar(currData, 'femenino', 20);

            reg['20_39'].m = sumar(currData, 'masculino', 40);
            reg['20_39'].f = sumar(currData, 'femenino', 40);

            reg['40_69'].m = sumar(currData, 'masculino', 70);
            reg['40_69'].f = sumar(currData, 'femenino', 70);

            reg['70'].m = sumar(currData, 'masculino', 100);
            reg['70'].f = sumar(currData, 'femenino', 100);

            reg.total.m = sumarTotal(currData, 'masculino');
            reg.total.f = sumarTotal(currData, 'femenino');
            reg.total.total = currData.map(r => { return r.total; }).reduce((a, b) => { return a + b; });
        }
        res.push(reg);
    }

    let totalMes: any;
    totalMes = {
        ['30']: {
            m: res.map(r => { return r['30'].m; }).reduce((a, b) => { return a + b; }),
            f: res.map(r => { return r['30'].f; }).reduce((a, b) => { return a + b; }),
            total: res.map(r => { return r['30'].m + r['30'].f; }).reduce((a, b) => { return a + b; })
        },
        ['0_1']: {
            m: res.map(r => { return r['0_1'].m; }).reduce((a, b) => { return a + b; }),
            f: res.map(r => { return r['0_1'].f; }).reduce((a, b) => { return a + b; }),
            total: res.map(r => { return r['0_1'].m + r['0_1'].f; }).reduce((a, b) => { return a + b; })
        },
        ['1_4']: {
            m: res.map(r => { return r['1_4'].m; }).reduce((a, b) => { return a + b; }),
            f: res.map(r => { return r['1_4'].f; }).reduce((a, b) => { return a + b; }),
            total: res.map(r => { return r['1_4'].m + r['1_4'].f; }).reduce((a, b) => { return a + b; })
        },
        ['5_14']: {
            m: res.map(r => { return r['5_14'].m; }).reduce((a, b) => { return a + b; }),
            f: res.map(r => { return r['5_14'].f; }).reduce((a, b) => { return a + b; }),
            total: res.map(r => { return r['5_14'].m + r['5_14'].f; }).reduce((a, b) => { return a + b; })
        },
        ['15_19']: {
            m: res.map(r => { return r['15_19'].m; }).reduce((a, b) => { return a + b; }),
            f: res.map(r => { return r['15_19'].f; }).reduce((a, b) => { return a + b; }),
            total: res.map(r => { return r['15_19'].m + r['15_19'].f; }).reduce((a, b) => { return a + b; })
        },
        ['20_39']: {
            m: res.map(r => { return r['20_39'].m; }).reduce((a, b) => { return a + b; }),
            f: res.map(r => { return r['20_39'].f; }).reduce((a, b) => { return a + b; }),
            total: res.map(r => { return r['20_39'].m + r['20_39'].f; }).reduce((a, b) => { return a + b; })
        },
        ['40_69']: {
            m: res.map(r => { return r['40_69'].m; }).reduce((a, b) => { return a + b; }),
            f: res.map(r => { return r['40_69'].f; }).reduce((a, b) => { return a + b; }),
            total: res.map(r => { return r['40_69'].m + r['40_69'].f; }).reduce((a, b) => { return a + b; })
        },
        ['70']: {
            m: res.map(r => { return r['70'].m; }).reduce((a, b) => { return a + b; }),
            f: res.map(r => { return r['70'].f; }).reduce((a, b) => { return a + b; }),
            total: res.map(r => { return r['70'].m + r['70'].f; }).reduce((a, b) => { return a + b; })
        },
        totales: {
            m: res.map(r => { return (r['30'].m + r['0_1'].m + r['1_4'].m + r['5_14'].m + r['15_19'].m + r['20_39'].m + r['40_69'].m + r['70'].m); }).reduce((a, b) => { return a + b; }),
            f: res.map(r => { return (r['30'].f + r['0_1'].f + r['1_4'].f + r['5_14'].f + r['15_19'].f + r['20_39'].f + r['40_69'].f + r['70'].f); }).reduce((a, b) => { return a + b; })
        }
    };

    return { dias: res, totalMes };
}

class Linea {
    dia: Date;
    '30' = { m: 0, f: 0 };
    '0_1' = { m: 0, f: 0 };
    '1_4' = { m: 0, f: 0 };
    '5_14' = { m: 0, f: 0 };
    '15_19' = { m: 0, f: 0 };
    '20_39' = { m: 0, f: 0 };
    '40_69' = { m: 0, f: 0 };
    '70' = { m: 0, f: 0 };
    total = { m: 0, f: 0, total: 0 };
}

function sumar(currData, sexo, edad) {
    let cantidad = currData.filter(r => r.sexo === sexo && r.edad === edad);
    return cantidad.length > 0 ? cantidad[0]['total'] : 0;
}

function sumarTotal(currData, sexo) {
    let cantidad = currData.filter(r => r.sexo === sexo);
    return cantidad.length > 0 ? cantidad.map(r => { return r.total; }).reduce((a, b) => { return a + b; }) : 0;
}

export async function getPlanillaC1(params: any) {
    let pipeline = [];
    let paramFecha = params['fecha'];
    let fechaDesde = new Date(paramFecha);
    let fechaHasta;
    fechaDesde.setHours(0);
    fechaDesde.setMinutes(0);
    fechaDesde.setSeconds(0);
    fechaDesde.setMilliseconds(0);
    fechaHasta = new Date(fechaDesde.getFullYear(), fechaDesde.getMonth(), fechaDesde.getDate() + 1);

    pipeline = [
        {
            $match: {
                'ejecucion.fecha': {
                    $gte: fechaDesde,
                    $lt: fechaHasta
                },
                'ejecucion.organizacion.id': new mongoose.Types.ObjectId(params['organizacion']),
                'solicitud.tipoPrestacion.id': new mongoose.Types.ObjectId(params['prestacion'])
            }
        },
        {
            $unwind: {
                path: '$ejecucion.registros'
            }
        },
        {
            $match: {
                'ejecucion.registros.esDiagnosticoPrincipal': true
            }
        },
        {
            $lookup: {
                from: 'agenda',
                localField: 'solicitud.turno',
                foreignField: 'bloques.turnos._id',
                as: 'agenda'
            }
        },
        {
            $unwind: {
                path: '$agenda'
            }
        },
        {
            $unwind: {
                path: '$agenda.bloques'
            }
        },
        {
            $unwind: {
                path: '$agenda.bloques.turnos'
            }
        },
        {
            $match: {
                $expr: {
                    $eq: ['$agenda.bloques.turnos._id', '$solicitud.turno']
                }
            }
        },
        {
            $project: {
                organizacion: '$ejecucion.organizacion.nombre',
                pacienteApellido: '$paciente.apellido',
                pacienteNombre: '$paciente.nombre',
                pacienteDNI: '$paciente.documento',
                pacienteSexo: '$paciente.sexo',
                pacienteFechaNacimiento: '$paciente.fechaNacimiento',
                pacienteEdad: {
                    $trunc: {
                        $divide: [
                            {
                                $subtract: ['$ejecucion.fecha', '$paciente.fechaNacimiento']
                            },
                            365 * 24 * 60 * 60 * 1000
                        ]
                    }
                },
                pacienteObraSocial:
                    '$agenda.bloques.turnos.paciente.obraSocial.financiador',
                prestacionHora: '$ejecucion.fecha',
                prestacionTipo: '$solicitud.tipoPrestacion.term',
                prestacionConceptoPrincipal: '$ejecucion.registros.concepto.term',
                prestacionEsPrimeraVez: '$ejecucion.registros.esPrimeraVez',
                profesionalApellido: '$solicitud.profesional.apellido',
                profesionalNombre: '$solicitud.profesional.nombre'
            }
        }
    ];

    let data = await toArray(
        prestacionModel
            .aggregate(pipeline)
            .cursor({})
            .exec()
    );

    return data;

}
