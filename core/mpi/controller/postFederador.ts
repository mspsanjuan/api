import { pacienteMpi } from '../schemas/paciente';
import { pacienteFederado } from '../schemas/pacienteFederado';
const request = require('request');
import * as Fhir from '../../../packages/fhir/src/patient';


export async function federadorjob(done) {
    try {

        let cursor = await pacienteMpi.find({ documento: '25236948' }).cursor({ batchSize: 100 });

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
                delete paciente_federador['deceasedDateTime'];
                delete paciente_federador['address'];
                paciente_federador['birthDate'] = new Date(paciente_federador['birthDate']).toISOString().slice(0, 10);
                let name: any = [
                    {
                        text: pac.nombre + ' ' + pac.apellido,
                        family: pac.apellido,
                        _family: {
                            extension: [
                                {
                                    url: 'http://hl7.org/fhir/StructureDefinition/humanname-fathers-family',
                                    valueString: pac.apellido
                                },
                            ]
                        },
                        given: [
                            pac.nombre
                        ]
                    }
                ];
                paciente_federador['name'] = name;
                // post federador
                await post_federador(paciente_federador, pac.documento);

            }

        }).catch(err => {
            done();
        });
        // console.log('----------------------------------------------------------FIN----------------------------------------------------------', countPacienteError);
        done();

    } catch (err) {

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
            console.log(response.body);
            if (response.statusCode >= 200 && response.statusCode < 300) {
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
            return resolve(error || body);
        });
    });
}
