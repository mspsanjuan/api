
/**
 * Encode de Vacunas Nomivac from ANDES to FHIR
 * @param {} nomivac
 * [ASK] El code de extension puede ir en vaccineCode?
 * [ASk] Location no se sabe. Solo esta el texto
 */
export function encode(patientReference, nomivac) {
    return {
        resourceType: 'Immunization',
        id: nomivac.idvacuna,
        extension: [
            {
                url: 'http://sisa/fhir/esquema',
                valueCoding: {
                    system: 'http://argentina.gob.ar/salud/NOMIVAC-esquemas',
                    code: '0', // [TODO] Ver que code ponemos acá
                    display: nomivac.vacuna
                }
            },
            {
                url: 'http://sisa/fhir/condicionAplicacion',
                valueCoding: {
                    system: 'http://argentina.gob.ar/salud/NOMIVAC-condicion',
                    code: '17',
                    display: 'Personal de Salud'
                }
            }
        ],
        status: 'completed',
        // notGiven: false,
        // vaccineCode: {
        //     coding: [
        //         {
        //             system: 'https://snomed.info/sct/11000221109/id/228100022110',
        //             code: '46233009',
        //             display: ' producto que contiene vacuna contra el virus Influenza en forma farmacéutica de administración por vía nasal (forma farmacéutica de producto medicinal)'
        //         }
        //     ]
        // },
        patient: {
            reference: patientReference
        },
        date: nomivac.fechaAplicacion,
        primarySource: false,
        // location: {
        //     reference: 'http://argentina.gob.ar/salud/refes/14999912399913'
        // },
        // lotNumber: '00850',
        // vaccinationProtocol: [
        //     {
        //         doseSequence: 1,
        //         doseStatus: {
        //             coding: [
        //                 {
        //                     system: 'http://hl7.org/fhir/vaccination-protocol-dose-status',
        //                     code: 'count'
        //                 }
        //             ]
        //         }
        //     }
        // ]
    };
}
