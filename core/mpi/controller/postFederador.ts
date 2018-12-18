import { pacienteMpi } from '../schemas/paciente';
import { pacienteFederado } from '../schemas/pacienteFederado';
import { pacienteRechazadoTel } from '../schemas/pacienteRechazadoTel';
const request = require('request');
import * as Fhir from '../../../packages/fhir/src/patient';
import { log } from '@andes/log';

export async function federadorjob(done) {
    try {
        let cursor = await pacienteMpi.find().skip(976).limit(1000).cursor({ batchSize: 50 });
        await cursor.eachAsync(async (pac: any) => {

            if (pac.estado === 'validado') {
                // Armar Json Fhir
                let paciente_federador = Fhir.encode(pac);
                let identificadores: any = [{
                    system: 'urn:oid:2.16.840.1.113883.2.10.35',
                    value: pac._id // cambiar por _id cuando se resulva
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
                        await post_federador(paciente_federador, pac.documento, pac._id);

                    }


                    //  console.log(JSON.stringify(paciente_federador));


                } else {
                    await post_federador(paciente_federador, pac.documento, pac._id);
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


export function post_federador(data: any, identificador: String, id: String) {
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



            if (error != null) {
                console.log('error', error, 'id', id);
                let fakeRequest = {
                    user: {
                        usuario: 'Federador',
                        app: 'federador',
                        organizacion: 'Nah'
                    },
                    ip: 'localhost',
                    connection: {
                        localAddress: ''
                    }
                };
                log(fakeRequest, 'federador', id, 'postFederador', body, error);
            }
            let bodyResponse = id;
            if (response && response.body) {
                bodyResponse = response.body;
            }

            const pac_federado = new pacienteFederado({
                documento: identificador,
                respuesta,
                body: bodyResponse

            });
            pac_federado.save();

            return resolve(error || body);


            // return resolve(error || body);
        });
    });
}
