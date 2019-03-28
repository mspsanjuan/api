import { buscarPaciente } from '../../../core/mpi/controller/paciente';
import { getVacunas } from '../../vacunas/controller/VacunaController';
import { getPrestaciones, filtrarRegistros } from './rup';
import { Patient, Organization, Immunization } from '@andes/fhir';
import { Organizacion } from '../../../core/tm/schemas/organizacion';

const DOMAIN = 'http://app.andes.gob.ar';


export async function IPS(pacienteID) {
    const { db, paciente } = await buscarPaciente(pacienteID);
    if (paciente) {
        // Recuperar datos de la historia clinica
        const organizacion = await Organizacion.findOne({ 'codigo.sisa': 0 });
        const prestaciones = await getPrestaciones(paciente, {});
        const semanticTags = ['trastorno', 'hallazgo', 'evento', 'situacion']; // [TODO] Revisar listado de semtags
        const registros = filtrarRegistros(prestaciones, { semanticTags });
        const vacunas: any = await getVacunas(paciente);

        // Armar documento
        const FHIRPatient = Patient.encode(paciente);
        const FHIRDevice = device; // [TODO] ver que hacer
        const FHIRCustodian = Organization.encode(organizacion);

        const FHIRImmunization = vacunas.map((vacuna) => {
            const nv: any = Immunization.encode(vacuna);
            nv.patient = getReference(FHIRPatient);
        });

    }
}

function fullurl(resource) {
    return `http://hapi.fhir.org/baseR4/${resource.resourceType}/${resource.id}`;
}


function getReference(resource) {
    return {
        reference: fullurl(resource)
    };
}
function createResource(resource) {
    return {
        fullUrl: fullurl(resource),
        resource
    };
}


/**
 * HARDCODE DEVICE
 */

const device = {
    resourceType: 'Device',
    id: 'device-01',
    identifier: [
        {
            system: `${DOMAIN}/Device`,
            value: 'device-01'
        }
    ],
    type: {
        coding: [
            {
                system: 'http://snomed.info/sct',
                code: '462894001',
                display: 'software de aplicación de sistema de información de historias clínicas de pacientes (objeto físico)'
            }
        ]
    },
    owner: {
        reference: 'http://argentina.gob.ar/salud/refes/14999912399913'
    },
    deviceName: [
        {
            name: 'Sistema de Aplicaciones Neuquinas de Salud (ANDES)',
            type: 'manufacturer-name'
        }
    ]
};
