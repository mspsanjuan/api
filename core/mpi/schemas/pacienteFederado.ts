

import * as mongoose from 'mongoose';

export let pacienteFederadoSchema = new mongoose.Schema({
    id: mongoose.Schema.Types.ObjectId,
    documento: String,
    respuesta: String,
    body: {
        resourceType: String,
        issue: [
            {
                severity: String,
                code: String,
                diagnostics: String
            }
        ]

    }
});

export let pacienteFederado = mongoose.model('pacienteFederado', pacienteFederadoSchema, 'pacienteFederado');
