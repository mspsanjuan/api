import * as carpetaPaciente from '../../carpetas/schemas/carpetaPaciente';
import * as mongoose from 'mongoose';

export async function buscarCarpeta(req) {
    let carpeta;
    if (req.params.id) {
        carpeta = carpetaPaciente.findById(req.params.id);
    } else {
        if (req.query.documento && req.query.organizacion) {
            carpeta = carpetaPaciente.find({ documento: req.query.documento });
            carpeta.where('carpetaEfectores.organizacion._id').equals(req.query.organizacion);
        }
    }
    return await carpeta;
}

export async function actualizarCarpetaHHH(pac) {
    console.log('buscando paciente', pac);
    const carpetaNueva = {
        organizacion: {
            _id: mongoose.Types.ObjectId('57fcf038326e73143fb48dac'),
            nombre: 'HOSPITAL DR. HORACIO HELLER'
        },
        idPaciente: pac.HC,
        nroCarpeta: pac.HC
    };
    const carpeta: any = await carpetaPaciente.findOne({ documento: pac.documento });
    if (carpeta) {
        // console.log('carpeta encontrada', carpeta);
        const idCarpeta = carpeta.carpetaEfectores.findIndex(c => {
            return (String(c.organizacion._id) === '57fcf038326e73143fb48dac');
        });
        console.log('idCarpeta', idCarpeta);
        if (idCarpeta >= 0) {
            carpeta.carpetaEfectores[idCarpeta] = carpetaNueva;
        } else {
            carpeta.carpetaEfectores.push(carpetaNueva);
        }

        if (carpeta._id) {
            console.log('actualizando carpeta', carpeta.carpetaEfectores);
            return carpetaPaciente.update({ _id: carpeta._id }, { $set: { carpetaEfectores: carpeta.carpetaEfectores } });
        }
    } else {
        // El dni no existe en la colección carpetaPaciente
        // Se guarda el documento en la colección carpetaPaciente

        const nuevo = new carpetaPaciente({
            documento: pac.documento,
            carpetaEfectores: [carpetaNueva]
        });
        console.log('creando carpeta', nuevo);
        return nuevo.save();
    }
}

exports.buscarCarpeta = buscarCarpeta;
