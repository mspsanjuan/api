
import * as moment from 'moment';
import { makeUrl } from './config';

function getReference(url) {
    return {
        reference: url
    };
}

export function encode(ID, patientReference, custodianReference, deviceReference, ImmunizationReferences, ConditionReferences) {
    const now = moment();
    let Immunization = [];
    let conditions = [];

    if (ImmunizationReferences.length > 0) {
        Immunization = [{
            title : 'Vacunas',
            text : {
                status : 'generated',
                div : '<div xmlns="http:\/\/www.w3.org\/1999\/xhtml">producto que contiene solamente antígeno de virus de la influenza (producto medicinal)<\/div>'
            },
            code : {
                coding : [
                    {
                        system : 'http:\/\/loinc.org',
                        display : 'Immunization record',
                        code : '60484-3'
                    }
                ]
            },
            entry : ImmunizationReferences.map(getReference)
        }];
    }

    if (ConditionReferences.length > 0) {
        conditions = [{
            code : {
                coding : [
                    {
                        system : 'http:\/\/loinc.org',
                        display : 'Problem list',
                        code : '11450-4'
                    }
                ]
            },
            entry : ConditionReferences.map(getReference),
            title : 'Problemas activos',
            text : {
                status : 'generated',
                div : '<div xmlns="http:\/\/www.w3.org\/1999\/xhtml">asma (trastorno)<\/div>'
            }
        }];
    }


    return {
        id : ID,
        subject : {
            reference : patientReference
        },
        section : [
            ...conditions,
            ...Immunization

        ],
        resourceType : 'Composition',
        author : [
            {
                reference : deviceReference
            }
        ],
        confidentiality : 'N',
        type : {
            coding : [
                {
                    system : 'http:\/\/loinc.org',
                    display : 'Patient Summary',
                    code : '60591-5'
                }
            ]
        },
        title : 'Resumen del paciente al ' + now.format('DD [de] MMMM [de] YYYY, HH:mm'),
        identifier : {
            system : makeUrl('Composition'),
            value : ID
        },
        date : now,
        meta : {
            profile : [
                'http:\/\/hl7.org\/fhir\/uv\/ips\/StructureDefinition\/composition-uv-ips'
            ]
        },
        text : {
            status : 'generated',
            div : '<div xmlns="http:\/\/www.w3.org\/1999\/xhtml"><p><b>Generated Narrative with Details<\/b><\/p><p><b>id<\/b>: IPS-examples-Composition-01<\/p><p><b>meta<\/b>: <\/p><p><b>text<\/b>: <\/p><p><b>identifier<\/b>: 10501<\/p><p><b>status<\/b>: FINAL<\/p><p><b>type<\/b>: Patient Summary <span style="background: LightGoldenRodYellow">(Details : {LOINC code \'60591-5\' = \'Patient summary Document\', given as \'Patient Summary\'})<\/span><\/p><p><b>date<\/b>: 26\/01\/2018 14:30:00 PM<\/p><p><b>author<\/b>: <a href="#device_IPS-examples-Device-01">Generated Summary: id: IPS-examples-Device-01; Sistema HCE del Hospital Municipal Dr Angel Pintos <\/a><\/p><p><b>title<\/b>: Patient Summary as of January 26, 2018 14:30<\/p><p><b>confidentiality<\/b>: N<\/p><blockquote><p><b>attester<\/b><\/p><p><b>mode<\/b>: LEGAL<\/p><p><b>time<\/b>: 26\/01\/2018 2:30:00 PM<\/p><p><b>party<\/b>: <a href="#organization_IPS-examples-Organization-01">Generated Summary: id: IPS-examples-Organization-01; 14999912399913; active; Hospital Municipal Hospital Doctor Ángel Pintos <\/a><\/p><\/blockquote><p><b>custodian<\/b>: <a href="#organization_IPS-examples-Organization-01">Generated Summary: id: IPS-examples-Organization-01; http://hospitalPintos.org.ar; active; name: Hospital Municipal Hospital Doctor Ángel Pintos \/ Dominio; ph: +54 02281 43-5200(WORK)<\/a><\/p><\/div>'
        },
        custodian : {
            reference : custodianReference
        },
        attester : [
            {
                mode : 'legal',
                time : now,
                party : {
                    reference : custodianReference
                }
            }
        ],
        status : 'final'
    };
}
