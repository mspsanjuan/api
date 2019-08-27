import { model as Prestacion } from '../../rup/schemas/prestacion';
import { buscarPaciente } from '../../../core/mpi/controller/paciente';
import moment = require('moment');
import { join } from 'path';
import { readFile } from 'fs';
import { promisify } from 'util';
import handlebars = require('handlebars');
import { templates } from '../descargas.config';
import { Organizacion } from '../../../core/tm/schemas/organizacion';

const read = promisify(readFile);
export async function generarInformeColono(idPrestacion, idOrganizacion, usuario) {
    let prestacion: any = await Prestacion.findById(idPrestacion).exec();
    if (!prestacion.ejecucion.registros.length) {
        throw new Error('Formato incorrecto');  // TODO evaluar comportamiento acá.
    }
    let { paciente }: any = await buscarPaciente(prestacion.paciente.id);
    let edad = paciente.fechaNacimiento ? moment().diff(moment(paciente.fechaNacimiento), 'years') + ' años' : '';
    let carpeta = paciente.carpetaEfectores.find(x => x.organizacion.id === idOrganizacion);
    carpeta = (carpeta && carpeta.nroCarpeta ? carpeta.nroCarpeta : 'sin número de carpeta');
    let organizacion: any = await Organizacion.findById(idOrganizacion).exec();

    let nombreLogo = organizacion.nombre.toLocaleLowerCase().replace(/-|\./g, '').replace(/ {2,}| /g, '-');
    let logoEfector = await read(join(__dirname, templates.efectores + nombreLogo + '.png'));
    let logoAdicional = await read(join(__dirname, templates.logoAdicional));
    let logoAndes = await read(join(__dirname, templates.logoAndes));
    let header = await read(join(__dirname, '../../../templates/rup/informes/html/includes/header.html'), 'utf8');
    handlebars.registerPartial('header', header);

    let datosInforme = filtroColonoscopia(prestacion.ejecucion.registros[0].registros);
    let datos = {
        nombreCompleto: paciente.apellido + ', ' + paciente.nombre,
        fechaActual: moment().format('DD/MM/YYYY HH:mm') + ' hs',
        datosRapidosPaciente: `${paciente.sexo} | ${edad} | ${paciente.documento}`,
        logoEfector, logoAdicional, logoAndes
    }
    let html = await read(join(__dirname, '../../../templates/rup/informes/html/informe-v2.html'), 'utf8');
    const template = handlebars.compile(html);
    html = template(datos);
    return (html);
}


function filtroColonoscopia(registros: any[]) {
    let data = {
        seccionPpal: null,
        preparacion: null,
        procedimientoCecal: null,
        informeFinal: null,
        resultados: null,
        tratamientoComplementario: null,
        adjuntos: null
    };
    registros.forEach(reg => {
        switch (reg.concepto.conceptId) {
            case '422843007':
                data.seccionPpal = reg;
                break;
            case '443425001':
                data.preparacion = reg;
                break;
            case '440588003':
                data.procedimientoCecal = reg;
                break;
            case '445665009':
                data.informeFinal = reg;
                break;
            case '423100009':
                data.resultados = reg;
                break;
            case '225423004':
                data.tratamientoComplementario = reg;
                break;
            case '1921000013108':
                data.adjuntos = reg;
                break;
        }
    });
    return data;
}
