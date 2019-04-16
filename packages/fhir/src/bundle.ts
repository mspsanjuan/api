import * as moment from 'moment';
import { makeUrl } from './config';

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
            system : makeUrl('Bundle'),
            value : ID
        }
    };
}
