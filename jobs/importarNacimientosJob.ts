import { importarNacimientos } from '../core/mpi/jobs/nacimientosProcess';
import { agregarDocumentosFaltantes } from '../core/mpi/jobs/nacimientosProcess';
import { obtenerModificaciones } from '../core/mpi/jobs/nacimientosProcess';
import debug = require('debug');

const deb = debug('nacimientosJob');

async function run(done) {
    // PARAMETRO FECHA OPCIONAL PARA TESTEAR , el formato debe ser 'yyyy-mm-dd'
    let fecha = '2018/12/06';
    await Promise.all([
        importarNacimientos(fecha), // <-- parametro opcional va aquí
        agregarDocumentosFaltantes(),
        obtenerModificaciones(fecha)
    ]);

    deb('Proceso Finalizado');
    done();
}

export = run;
