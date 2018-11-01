import { pacienteMpi } from '../schemas/paciente';
import { pacienteFederado } from '../schemas/pacienteFederado';
import { pacienteRechazadoTel } from '../schemas/pacienteRechazadoTel';
const request = require('request');
import * as Fhir from '../../../packages/fhir/src/patient';


export async function federadorjob(done) {
    try {

        let cursor = await pacienteMpi.find().cursor({ batchSize: 100 });
        await cursor.eachAsync(async (pac: any) => {

            if (pac.estado === 'validado') {
                // Armar Json Fhir
                let paciente_federador = Fhir.encode(pac);
                let identificadores: any = [{
                    system: 'urn:oid:2.16.840.1.113883.2.10.35',
                    value: pac.documento // cambiar por _id cuando se resulva
                },
                {
                    system: 'http://www.renaper.gob.ar/dni',
                    value: pac.documento
                }];
                paciente_federador['identifier'] = identificadores;
                delete paciente_federador['active'];
                let texto = pac.nombre + ' ' + pac.apellido;
                texto = texto.trim();
                let familia = pac.apellido;
                familia = familia.trim();
                let name: any = [
                    {
                        text: texto,
                        family: familia,
                        _family: {
                            extension: [
                                {
                                    url: 'http://hl7.org/fhir/StructureDefinition/humanname-fathers-family',
                                    valueString: familia
                                },
                            ]
                        },
                        given: [
                            pac.nombre
                        ]
                    }
                ];
                paciente_federador['name'] = name;
                paciente_federador['birthDate'] = new Date(paciente_federador['birthDate']).toISOString().slice(0, 10);
                delete paciente_federador['deceasedDateTime'];
                delete paciente_federador['maritalStatus'];
                delete paciente_federador['photo'];
                delete paciente_federador['address'];
                delete paciente_federador['contact'];
                let contactos = paciente_federador['telecom'] ? paciente_federador['telecom'] : [];
                if (contactos.length > 0) {
                    contactos.splice(1, contactos.length);
                    if (contactos[0].value && contactos[0].value.length > 12) {
                        const pacientesRechazadosTel = new pacienteRechazadoTel({
                            id: pac._id,
                            documento: pac.documento,
                            contacto: pac.contacto

                        });
                        pacientesRechazadosTel.save();
                    } else {
                        await post_federador(paciente_federador, pac.documento);

                    }


                    //  console.log(JSON.stringify(paciente_federador));


                } else {
                    await post_federador(paciente_federador, pac.documento);
                }
            }
        }).catch(err => {
            // console.log('err1', err);
            done();
        });
        console.log('----------------------------------------------------------FIN----------------------------------------------------------');
        done();

    } catch (err) {
        // console.log('err2', err);
        done();
    }
}


export function post_federador(data: any, identificador: String) {
    return new Promise((resolve: any, reject: any) => {
        const url = 'https://testapp.hospitalitaliano.org.ar/masterfile-federacion-service/fhir/Patient/';
        const options = {
            url,
            method: 'POST',
            json: true,
            body: data,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        request(options, (error, response, body) => {
            let respuesta = '';


            if (response && response.statusCode >= 200 && response.statusCode < 300) {
                // console.log(response.caseless.get('cache-control'))
                respuesta = response.caseless.get('location');
                // Se guardan los datos en pacientes_federados
                return resolve(body);
            }
            const pac_federado = new pacienteFederado({
                documento: identificador,
                respuesta,
                body: response.body

            });
            pac_federado.save();
            // console.log("error", error)
            return resolve(error || body);
        });
    });
}
