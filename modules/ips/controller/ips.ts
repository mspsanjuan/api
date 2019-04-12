import { buscarPaciente } from '../../../core/mpi/controller/paciente';
import { getVacunas } from '../../vacunas/controller/VacunaController';
import { getPrestaciones, filtrarRegistros } from '../../rup/controllers/rup';
import { Patient, Organization, Immunization, Condition, Composition, Bundle } from '@andes/fhir';
import { Organizacion } from '../../../core/tm/schemas/organizacion';
import { Types } from 'mongoose';
import { handleHttpRequest } from '../../../utils/requestHandler';
import { SaludDigitalClient } from '../../ips/controller/autenticacion';
const request = require('request');

const DOMAIN = 'http://neuquen.gob.ar';
export async function IPS(pacienteID) {
    const { db, paciente } = await buscarPaciente(pacienteID);
    if (paciente) {
        // Recuperar datos de la historia clinica
        const organizacion = await Organizacion.findOne({ 'codigo.sisa': 0 });
        const prestaciones = await getPrestaciones(paciente, {});
        const semanticTags = ['trastorno', /* 'hallazgo', 'evento', 'situacion' */]; // [TODO] Revisar listado de semtags
        const registros: any = filtrarRegistros(prestaciones, { semanticTags });
        const vacunas: any = await getVacunas(paciente);

        // Armar documento
        const FHIRPatient = Patient.encode(paciente);
        const FHIRDevice = device; // [TODO] ver que hacer
        const FHIRCustodian = Organization.encode(organizacion);

        const FHIRImmunization = vacunas.map((vacuna) => {
            return Immunization.encode(fullurl(FHIRPatient), vacuna);
        });


        const FHIRCondition = registros.map((registro) => {
            return Condition.encode(fullurl(FHIRPatient), registro);
        });

        const CompositionID = String(new Types.ObjectId());
        const FHIRComposition = Composition.encode(CompositionID, fullurl(FHIRPatient), fullurl(FHIRCustodian), fullurl(FHIRDevice), FHIRImmunization.map(fullurl), FHIRCondition.map(fullurl));

        const BundleID = String(new Types.ObjectId());
        const FHIRBundle = Bundle.encode(BundleID, [
            createResource(FHIRComposition),
            createResource(FHIRPatient),
            ...FHIRCondition.map(createResource),
            ...FHIRImmunization.map(createResource),
            createResource(FHIRDevice),
            createResource(FHIRCustodian)
        ]);

        return FHIRBundle;

    }
    return null;
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

