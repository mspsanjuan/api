import { Number } from 'core-js/library/web/timers';
import * as mongoose from 'mongoose';

 let configFacturacionAutomaticaSchema = new mongoose.Schema({
    nomencladorRecuperoFinanciero: String,
    snomed: [{ term: String, conceptId: String }],
    idServicio: String,
    nomencladorSUMAR: {
        diagnostico: [{ conceptId: String, diagnostico: String, predomina: Boolean}],
        datosReportables: [{ idDatosReportables: String, valores: [{ conceptId: String, valor: String}] }],
        codigo: String,
        id: String
     }
});

let model = mongoose.model('configFacturacionAutomatica', configFacturacionAutomaticaSchema, 'configFacturacionAutomatica');
export = model;
