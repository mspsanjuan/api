
import * as carpetasCtrl from './../modules/turnos/controller/carpetasController/carpetasController';

function run(done) {
    carpetasCtrl.migrar(done);
}

export = run;
