import { listadoInternacion } from '../modules/rup/controllers/internacion';
import { buscarPaciente } from '../core/mpi/controller/paciente';
import { ObjectId } from 'bson';
import moment = require('moment');

const CodSexo = {
    masculino: 1,
    femenino: 2,
    indeterminado: 3
};

const CodNivelI = {
    'Nunca asistió': 1,
    'Primario completo': 2,
    'Primario incompleto': 3,
    'Secundario completo': 4,
    'Secundario incompleto': 5,
    'Superior o Universitario completo': 6,
    'Superior o Universitario incompleto': 7,
    'Ciclo EGB (1o y 2o)  completo': 11,
    'Ciclo EGB (1o y 2o)  incompleto': 12,
    'Ciclo EGB 3o completo': 13,
    'Ciclo EGB 3o incompleto': 14,
    'Polimodal completo': 15,
    'Polimodal incompleto': 16
};

const CodSitLab = {
    'Trabaja o está de licencia': 1,
    'No trabaja y busca trabajo': 2,
    'No trabaja y no busca trabajo': 3
};

const CodHospPor = {
    'Consultorio Externo': 1,
    Emergencia: 2,
    Traslado: 3,
    'Sala de Parto': 4,
    Otros: 5
};

const CodEgresP = {
    'Alta médica': 1,
    Traslado: 2,
    Defunción: 3,
    'Retiro Voluntario': 4,
    Otro: 5
};

const CodCauExtT = {
    Accidente: 1,
    'Lesión autoinflingida': 2,
    Agresión: 3,
    'Se ignora': 9
};

const CodCauExtL = {
    'Domicilio particular': 1,
    'Vía pública': 2,
    'Lugar de trabajo': 3,
    Otro: 4,
    'Se ignora': 9
};

const filtros = {
    fechaIngresoDesde: new Date('01/01/2019'),
    fechaIngresoHasta: new Date('12/31/2019')
};
const idOrganizacion = '57fcf037326e73143fb48c55';     // hospital añelo

export async function exportarInternacionesAnielo() {
    try {
        let internaciones: any[] = await listadoInternacion(filtros, idOrganizacion);
        let internacionResp = [];

        internaciones.forEach((documento: any) => {
            let datosIngreso = documento.ejecucion.registros[0];    // para chequear si existen registros
            let datosEgreso = documento.ejecucion.registros[1];
            let informeDeIngreso = documento.ejecucion.registros[0].valor.informeIngreso;   // para acceder a informes
            let informeDeEgreso = (datosEgreso) ? documento.ejecucion.registros[1].valor.InformeEgreso : null;

            if (datosIngreso) {
                let resp: any = {
                    AnioInfor: (datosEgreso) ? moment(informeDeEgreso.fechaEgreso).format('DD/MM/YYYY') : '',
                    Estab: 'HOSPITAL AÑELO',
                    HistClin: informeDeIngreso.nroCarpeta,
                    Apellido: documento.paciente.apellido,
                    Nombre: documento.paciente.nombre,
                    CodDocum: 1,
                    NumDocum: documento.paciente.documento,
                    NacDia: moment(documento.paciente.fechaNacimiento).day() + 1,
                    NacMes: moment(documento.paciente.fechaNacimiento).month() + 1,
                    NacAnio: moment(documento.paciente.fechaNacimiento).year(),
                    CodUniEdad: 1,
                    UniEdad: 'años',
                    EdadIng: moment().diff(documento.paciente.fechaNacimiento, 'years', false),
                    LocRes: 'Añelo',
                    ProvRes: 'Neuquen',
                    PaisRes: 'Argentina',
                    CodSexo: CodSexo[documento.paciente.sexo],
                    Sexo: documento.paciente.sexo,
                    CodAsoc: (informeDeIngreso.obraSocial !== null) ? 1 : 5,
                    Osoc: (informeDeIngreso.obraSocial !== null) ? informeDeIngreso.obraSocial.nombre : '',
                    CodNivelI: CodNivelI[informeDeIngreso.nivelInstruccion],
                    NivelInst: informeDeIngreso.nivelInstruccion,
                    CodSitLab: CodSitLab[informeDeIngreso.situacionLaboral],
                    SitLab: informeDeIngreso.situacionLaboral,
                    //        CodOcupac: '', // VER !!! (NO HAY CODIGO)  ********************************
                    Ocupac: informeDeIngreso.ocupacionHabitual,
                    CodHospPor: CodHospPor[informeDeIngreso.origen],
                    HospPor: informeDeIngreso.origen,
                    //  Origen: 'ver!!!',
                    FecIngreso: moment(informeDeIngreso.fechaIngreso).format('DD/MM/YYYY'),
                    FecEgreso: (datosEgreso) ? moment(informeDeEgreso.fechaEgreso).format('DD/MM/YYYY') : '',
                    ServEgre: (informeDeIngreso.especialidades) ? informeDeIngreso.especialidades.term : '',
                    EspecEgre: (informeDeIngreso.especialidades) ? informeDeIngreso.especialidades.term : '',
                    DiasTotEst: (datosEgreso) ? informeDeEgreso.diasDeEstada : '',
                    CodEgresP: CodEgresP[(datosEgreso && informeDeEgreso.tipoEgreso) ? informeDeEgreso.tipoEgreso.nombre : 'Otro'],
                    EgresP: (datosEgreso && informeDeEgreso.tipoEgreso) ? informeDeEgreso.tipoEgreso.nombre : '',
                    Lugar_Trasl: (datosEgreso && informeDeEgreso.UnidadOrganizativaDestino) ? informeDeEgreso.UnidadOrganizativaDestino.nombre : '',
                    CodDiagPr: (datosEgreso && informeDeEgreso.diagnosticoPrincipal) ? informeDeEgreso.diagnosticoPrincipal.codigo : '',
                    OtDiag1: (datosEgreso && informeDeEgreso.otrasCircunstancias) ? informeDeEgreso.otrasCircunstancias.nombre : '',
                    CodCauExtT: (datosEgreso && informeDeEgreso.causaExterna.producidaPor !== null) ? CodCauExtT[informeDeEgreso.causaExterna.producidaPor] : CodCauExtT['Se ignora'],
                    CauExtT: (datosEgreso && informeDeEgreso.causaExterna.producidaPor !== null) ? informeDeEgreso.causaExterna.producidaPor : '',
                    CodCauExtL: (datosEgreso && informeDeEgreso.causaExterna.lugar !== null) ? informeDeEgreso.causaExterna.lugar : CodCauExtL['Se ignora'],
                    CauExtL: (datosEgreso && informeDeEgreso.causaExterna.lugar !== null) ? informeDeEgreso.causaExterna.lugar : ''
                };
                if (datosEgreso && informeDeEgreso.nacimientos && informeDeEgreso.nacimientos[0].pesoAlNacer) {
                    let nacimientos = informeDeEgreso.nacimientos;
                    for (let j = 0; j < nacimientos.length; j++) {
                        resp['PesoNacerRN' + (j + 1)] = nacimientos[j].pesoAlNacer;
                        resp['CondNacRN' + (j + 1)] = nacimientos[j].condicionAlNacer;
                        resp['TermRN' + (j + 1)] = nacimientos[j].terminacion;
                        resp['SexoRN' + (j + 1)] = nacimientos[j].sexo;
                        resp['CodSexoRN' + (j + 1)] = CodSexo[nacimientos[j].sexo];
                    }
                }
                internacionResp.push(resp);
            }
        });
        return internacionResp;
    } catch (err) {
        console.log('error!');
        return null;
    }
}
