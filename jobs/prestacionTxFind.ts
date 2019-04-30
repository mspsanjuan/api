import { PrestacionTx, model as Prestacion } from '../modules/rup/schemas/prestacion';
import { Client } from 'elasticsearch';
import * as configPrivate from '../config.private';

import { Types } from 'mongoose';
import * as moment from 'moment';
import { SnomedModel } from '../core/term/schemas/snomed';

const connElastic = new Client({
    host: configPrivate.hosts.elastic_main,
});

function create(data, tags) {
    const body = {
        data, tags
    };
    return new Promise((resolve, reject) => {
        connElastic.index({
            index: 'snomed',
            type: 'doc',
            body
        }, (error, response) => {
            if (error) {
                reject(error);
            }
            resolve(response);
        });
    });
}

function search(text) {
    const body = {
        query: {
            more_like_this: {
                fields: [
                    'data',
                    'tags'
                ],
                like: text,
                min_term_freq: 1,
                max_query_terms: 20
            }
        }
    };
    return new Promise((resolve, reject) => {
        connElastic.search({
            index: 'snomed',
            type: 'doc',
            body
        }, (error, response) => {
            if (error) {
                reject(error);
            }
            const datos = response.hits.hits;
            const result = {};
            datos.forEach((item) => {
                const score = item._score;
                const source = item._source;
                source.tags.forEach((tag) => {
                    if (!result[tag]) {
                        result[tag] = 0;
                    }
                    result[tag] += score;
                });
            });
            resolve(result);
        });
    });
}

async function run(done) {
    // const text = '<p>MC: CONTROL SEGUIMIENTO.</p><p>Antec de LSIL (bp) 16/0672016. </p><p>Fecha ultimo PAP 27/03/2018 LSIL</p><p><br></p>';
    // const text = '<p>58 AÑOS.  MED: CLOPIDROGEL, ATORVASTATINA, BISOPROLOL, AAS, ENALAPRIL , SERTRALINA    QX: COLELAP</p><p>BUENA MICCION SIN CONTROLES PREVIOS. REFIERE  HEMOSPERMIA.   EC: RIÑONES S/P  VEJIGA SIN RPM   GP DE 33 GRS. </p><p>urocultivo negativo..  espermocultivo negativo   PSA  0,34 ng/ml </p>';

    // const text = '<p>Espirometría: patrón restrictivo leve, sin respuesta al broncodilatador.</p>';
    // prestacionId: ObjectId("5b88197ca70edc223f282e40") -> sugiere espirometria y no se registro

    // const text = '<p>Antecedentes:</p><p>	HTA </p><p><br></p><p><br></p><p>Tratamiento</p><p>	Enalapril 10 mg dia</p><p>	Hidroclorotiazia 25 mg dia</p><p><br></p><p>Paciente que realiza actividad física diaria sin limitacion por disnea o angor</p><p><br></p><p>EF: TA 120/90 mmHg</p><p><br></p><p>BEAB sin ruidos agregados</p><p>R1 R2 normofonetico sin soplo ritmo regular yugulares planas sin edemas sin soplo carotideo</p><p><br></p><p>ECG Ritmo sinusal frecuencia cardiaca 65 lpm  onda P 0.04 por 0.1 mV PR 0.16 seg QRS 0.10 seg  Eje 45º ST isoelectrico con onda T de morfologia conservada.</p><p><br></p><p>Comentario:</p><p>Paciente con HTA diastolica. Indico:</p><p><br></p><p>Enalapril 5 mg cada 12 hs</p><p>Suspendo hidroclorotiazida</p><p>Inicio amlodipina  5 mg dia.</p><p><br></p><p>Control en 3 semanas. con toma de TA diaria para optimizar dosis.</p><p><br></p><p><br></p><p><br></p>';


    // const text = '<p>Mujer de 61 años. </p><p>Antecedente de esclerodermia. </p><p>Sin antecedentes cardiológicos. Niega angor ni equivalentes. </p><p>TA: 127/94 mm de Hg. </p><p>ECG: ritmo sinusal, sin valor patológico. </p><p>Ecocardiograma con diámetros , motilidad y función sistólica del ventrículo izquierdo conservados. </p><p>Riesgo quirúrgico aumentado por antecedente de eclerodermia. </p><p>Puede operarse, sin indicaciones específicas por cardiología. </p>';
    // prestacionId: ObjectId("5ba232cb2b0d30167caebebb");

    // const text = '<p>paciente embarazada de 33 semanas,que refiere dolor en el vientre... FCF 157 </p>';
    // const text = '<p>paciente con odontalgia </p>';


    // const text = '<p>paciente con colecistitis cronica , doy tratamiento medico, solicito preqx</p>';

    // const text = '<p>Paciente refiere que se callo una pera con gajos en el ojo mietras cosechaba. manifiesta mucho dolor y ardor en el mismo. Paciente no tiene antecedentes de hipertencion, ni alérgico pero si diabetico medicado con metormina 800mg.</p><p>HGT: 1,19</p>';

    // const text = '<p>para el seneca necesita certificado de salud</p><p>G# P 1 AB 2 mac con implante hormonal el segundo (hijo de 5 años </p><p>fuma no toma OH no faso no </p><p>125/75 av 10/10 10 /10 </p>';

    const text = '<p>Mejoro la inflamación solo con reposo. </p>';

    // const text = '<p>EMB 19.1 SEM. TRAE ECO DLN. RESTO DE SEROLOGIA VDRL - TOXO IGG+ IGM -. PCI NEEGATIVA. URO + CEFADROXILO. STO ECO 20/24</p>';


    const response: any = await search(text);

    const concepts: any[] = await SnomedModel.find({ conceptId: { $in: Object.keys(response) } });
    const mapping = {};
    concepts.forEach(c => mapping[c.conceptId] = c);

    const entries = Object.entries(response).sort(([key, value], [key2, value2]) => {
        return value2 - value;
    }).map(([concept, score]) => {
        return {
            term: mapping[concept].preferredTerm,
            score
        };
    });
    entries.forEach(({term, score}) => {
        console.log(term, score);
    });

    done();
}


export = run;

/*

DELETE snomed
PUT snomed
{
  "settings": {
    "analysis": {
      "filter": {
        "spanish_stop": {
          "type":       "stop",
          "stopwords":  "_spanish_"
        },
        "spanish_keywords": {
          "type":       "keyword_marker",
          "keywords":   ["ejemplo"]
        },
        "spanish_stemmer": {
          "type":       "stemmer",
          "language":   "light_spanish"
        }
      },
      "analyzer": {
        "spanish": {
          "tokenizer":  "standard",
          "filter": [
            "lowercase",
            "spanish_stop",
            "spanish_keywords",
            "spanish_stemmer"
          ],
          "char_filter":  [ "html_strip" ]
        }
      }
    }
  },
  "mappings": {
    "doc": {
      "properties": {
        "data": {
          "type": "text",
          "analyzer": "spanish"
        },
        "tags": {
          "type": "text",
          "analyzer": "whitespace"
        }
      }
    }
  }
}

*/
