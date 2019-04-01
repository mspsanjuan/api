import * as moment from 'moment';

export function encode(ID, resources) {
    return {
        resourceType : 'Bundle',
        id : ID,
        meta : {
            lastUpdated : moment().format()
        },
        language : 'es-AR',
        entry : resources,
        type : 'document',
        identifier : {
            system : 'http://andes.gob.ar/Bundle',
            value : ID
        }
    };
}
