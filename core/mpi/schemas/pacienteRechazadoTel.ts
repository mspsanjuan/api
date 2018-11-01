

import * as mongoose from 'mongoose';

import * as contactoSchema from '../../tm/schemas/contacto';

export let pacienteRechazadoTelSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    documento: String,

    contacto: [contactoSchema]


});

export let pacienteRechazadoTel = mongoose.model('pacienteRechazadoTel', pacienteRechazadoTelSchema, 'pacienteRechazadoTel');
