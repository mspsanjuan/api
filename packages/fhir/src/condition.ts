import { makeUrl } from './config';

/**
 *
 * @param registro Registro RUP a transformar a FHIR
 */


export function encode(patientReference, registro) {
    return {
        id : registro._id,
        category : [
            {
                coding : [
                    {
                        system : 'http://loinc.org',
                        display : 'Problem',
                        code : '75326-9'
                    }
                ]
            }
        ],
        subject : {
            reference : patientReference
        },
        onsetDateTime : registro.createdAt.getFullYear(), // [TODO] No va solo el año
        resourceType : 'Condition',
        // Por el momento ponemos 'confirmed'
        verificationStatus : {
            coding : [
                {
                    system : 'http://terminology.hl7.org//CodeSystem//condition-ver-status',
                    code : 'confirmed'
                }
            ]
        },
        code : {
            coding : [
                {
                    code : registro.concepto.conceptId,
                    system : 'http://snomed.info/sct',
                    display : registro.concepto.fsn
                }
            ]
        },
        recordedDate : registro.createdAt,
        meta : {
            profile : [
                'http://hl7.org/fhir/uv/ips/StructureDefinition/condition-uv-ips'
            ]
        },
        text : {
            status : 'generated',
            div : '<div xmlns="http://www.w3.org/1999/xhtml"><p><b>Generated Narrative with Details</b></p><p><b>id</b>: IPS-examples-Condition-01</p><p><b>meta</b>: </p><p><b>text</b>: </p><p><b>identifier</b>: c87bf51c-e53c-4bfe-b8b7-aa62bdd93002</p><p><b>clinicalStatus</b>: Active <span style="background: LightGoldenRodYellow">(Details : {http://terminology.hl7.org/CodeSystem/condition-clinical code \'active\' = \'Active)</span></p><p><b>verificationStatus</b>: Confirmed <span style="background: LightGoldenRodYellow">(Details : {http://terminology.hl7.org/CodeSystem/condition-ver-status code \'confirmed\' = \'Confirmed)</span></p><p><b>category</b>: Problem <span style="background: LightGoldenRodYellow">(Details : {LOINC code \'75326-9\' = \'Problem\', given as \'Problem\'})</span></p><p><b>severity</b>: Moderate <span style="background: LightGoldenRodYellow">(Details : {LOINC code \'LA6751-7\' = \'LA6751-7\', given as \'Moderate\'})</span></p><p><b>code</b>: Menopausal flushing (finding) <span style="background: LightGoldenRodYellow">(Details : {SNOMED CT code \'198436008\' = \'Hot flush\', given as \'Menopausal flushing (finding)\'})</span></p><p><b>subject</b>: <a href="#patient_IPS-examples-Patient-01">Generated Summary: id: IPS-examples-Patient-01; 574687583; active; Martha DeLarosa ; ph: +31788700800(HOME); FEMALE; birthDate: 01/05/1972</a></p><p><b>recordedDate</b>: 01/10/2016</p></div>'
        },
        severity : {  // [TODO] Sacar esto porque no lo tenemos todavía. No hay un campo de severidad.
            coding : [
                {
                    system : 'http://loinc.org',
                    display : 'Moderate',
                    code : 'LA6751-7'
                }
            ]
        },
        clinicalStatus : {
            coding : [
                {
                    system : 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                    code : 'active' // [TODO]  Tenemos este dato.
                }
            ]
        }
    };
}

