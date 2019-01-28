import * as pecasCtrl from './../modules/estadistica/pecas/controller/agenda';
import * as moment from 'moment';

function run(done) {
    // let start = moment(new Date(2018, 9, 31).setHours(0, 0, 0, 0)).format('YYYY-MM-DD HH:mm:ss');
    // let end = moment(new Date(2018, 10, 2).setHours(23, 59, 0, 0)).format('YYYY-MM-DD HH:mm:ss');
    let start = moment(new Date().setHours(0, 0, 0, 0)).subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss');
    let end = moment(new Date().setHours(23, 59, 0, 0)).subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss');
    pecasCtrl.consultaPecas(start, end, done);
}

export = run;
