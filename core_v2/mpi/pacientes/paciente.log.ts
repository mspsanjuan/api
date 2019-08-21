import { Connections } from '../../../connections';
import { Logger } from '@andes/log';

export const pacienteLog = new Logger({ connection: Connections.logs, module: 'mpi', type: 'paciente', application: 'andes' });
