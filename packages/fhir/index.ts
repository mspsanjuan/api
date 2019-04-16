import * as Patient from './src/patient';
import * as Practitioner from './src/practitioner';
import * as Organization from './src/organization';
import * as Immunization from './src/immunization';
import * as Condition from './src/condition';
import * as Composition from './src/composition';
import * as Bundle from './src/bundle';
import * as DocumentReference from './src/document-reference';
import * as Device from './src/device';

export { getDominio, initialize } from './src/config';

export {
    Patient,
    Practitioner,
    Organization,
    Immunization,
    Condition,
    Composition,
    Bundle,
    DocumentReference,
    Device
};
