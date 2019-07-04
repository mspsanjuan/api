import * as carpetaPaciente from '../../../carpetas/schemas/carpetaPaciente';
import * as configPrivate from '../../../../config.private';
import * as mongoose from 'mongoose';
import * as debug from 'debug';
const logger = debug('carpetasJob');
const Server = require('mongodb').Server;

let organizacion = { _id: { $oid: '57f67d090166fa6aedb2f9fb' }, nombre: 'HOSPITAL CENTENARIO - DR. NATALIO BURD' };
const findUpdateCarpeta = async (carpeta) => {
    if (!carpeta) { return; }
    const documentoPaciente = carpeta.documento;
    const condicion = { documento: documentoPaciente };
    const carpetaNueva = carpeta.carpetaEfectores[0];
    // buscamos en carpetaPaciente los pacientes con documentoPaciente
    try {
        const hcPaciente = await carpetaPaciente.findOne(condicion).exec();
        if (hcPaciente) {
            const carpetas = (hcPaciente as any).carpetaEfectores.filter(c => {
                // logger('c.organizacion: ', c.organizacion._id, 'organizacion._id: ', organizacion._id);
                return (String(c.organizacion._id) === String(organizacion._id));
            });
            // logger('CARPETAS', carpetas.length);
            if (carpetas && carpetas.length) {
                (hcPaciente as any).carpetaEfectores.map(c => {
                    if (c.organizacion._id === organizacion._id) {
                        return c.nroCarpeta = carpeta.nroCarpeta;
                    }
                });
            } else {
                (hcPaciente as any).carpetaEfectores.push(carpetaNueva);
            }

            if (hcPaciente._id) {
                logger('actualizo', documentoPaciente);
                await carpetaPaciente.update({ _id: hcPaciente._id }, {
                    $set:
                        { carpetaEfectores: (hcPaciente as any).carpetaEfectores }
                }).exec();
            }
        } else {
            // El dni no existe en la colección carpetaPaciente
            // Se guarda el documento en la colección carpetaPaciente
            const nuevo = new carpetaPaciente({
                documento: documentoPaciente,
                carpetaEfectores: [carpetaNueva]
            });
            await nuevo.save();
        }
    } catch (err) {
        logger('Error en findUpdateCarpeta', err);
    }
};


export async function migrar(done) {
    try {
        const MongoClient = require('mongodb').MongoClient;
        const assert = require('assert');
        // Connection URL
        const url = 'mongodb://localhost:27017';
        // Database Name
        const dbName = 'andes';
        // Create a new MongoClient
        const client = new MongoClient(url);
        // Use connect method to connect to the Server
        client.connect(async function (err) {
            assert.equal(null, err);
            console.log('Connected successfully to server');
            const db = client.db(dbName);
            logger('CONECTADO');
            if (err) {
                logger('Error Migrando', err);
                return;
            }
            let cursor = db.collection('carpetasLocales').find({});
            while (cursor.hasNext) {
                let doc = await cursor.next();
                await findUpdateCarpeta(doc);
            }
        });
    } catch (err) {
        logger('Error Migrando', err);
    }
}
