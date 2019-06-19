import { consultaPesoTalla } from '../modules/rup/jobs/consultaPesoTalla';

function run(done) {
    console.log("READY....")
    consultaPesoTalla(done);
}

export = run;
