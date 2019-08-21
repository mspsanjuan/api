import { sisa as SisaConfig } from '../../config.private';
import { requestHttp } from './request';
import { to_json } from 'xmljson';

async function xmlToJson(xml) {
    return new Promise((resolve, reject) => {
        to_json(xml, (error, data) => {
            if (error) {
                return reject(error);
            } else {
                return resolve(data);
            }
        });
    });
}

export async function sisa(persona: any, formatter = null) {
    const sexo = persona.sexo === 'masculino' ? 'M' : 'F';
    const documento = persona.documento;
    const req = {
        url: `${SisaConfig.host}/sisa/services/rest/cmdb/obtener`,
        qs: {
            nrodoc: documento,
            sexo,
            usuario: SisaConfig.username,
            clave: SisaConfig.password
        },
        rejectUnauthorized: false
    };

    let [status, body] = await requestHttp(req);
    if (status >= 200 && status < 400) {
        const resp: any = await xmlToJson(body);
        if (resp.Ciudadano && resp.Ciudadano.resultado === 'OK') {
            return formatter ? formatter(resp.Ciudadano) : resp.Ciudadano;
        }
    }
    return null;
}

export function sisaToAndes(ciudadano) {
    let paciente;
    let fecha;
    paciente = {};
    if (ciudadano.nroDocumento) {
        paciente.documento = ciudadano.nroDocumento;
    }
    if (ciudadano.nombre) {
        paciente.nombre = ciudadano.nombre;
    }
    if (ciudadano.apellido) {
        paciente.apellido = ciudadano.apellido;
    }
    // Se arma un objeto de dirección
    paciente.direccion = [];
    let domicilio;
    domicilio = {};
    if (ciudadano.domicilio) {
        if (ciudadano.pisoDpto && ciudadano.pisoDpto !== '0 0') {
            domicilio.valor = ciudadano.domicilio + ' ' + ciudadano.pisoDpto;
        }
        domicilio.valor = ciudadano.domicilio;
    }

    if (ciudadano.codigoPostal) {
        domicilio.codigoPostal = ciudadano.codigoPostal;
    }
    let ubicacion;
    ubicacion = {};
    ubicacion.localidad = {};
    ubicacion.provincia = {};
    if (ciudadano.localidad) {
        ubicacion.localidad.nombre = ciudadano.localidad;
    }

    if (ciudadano.provincia) {
        ubicacion.provincia.nombre = ciudadano.provincia;
    }

    // Ver el pais de la ubicación
    domicilio.ranking = 1;
    domicilio.activo = true;
    domicilio.ubicacion = ubicacion;
    paciente.direccion.push(domicilio);

    if (ciudadano.sexo) {
        if (ciudadano.sexo === 'F') {
            paciente.sexo = 'femenino';
            paciente.genero = 'femenino';
        } else {
            paciente.sexo = 'masculino';
            paciente.genero = 'masculino';

        }
    }
    if (ciudadano.fechaNacimiento) {
        fecha = ciudadano.fechaNacimiento.split('-');
        paciente.fechaNacimiento = new Date(fecha[2].substr(0, 4), fecha[1] - 1, fecha[0]);
    }

    if (ciudadano.fallecido !== 'NO') {
        if (ciudadano.fechaFallecimiento) {
            fecha = ciudadano.fechaFallecimiento.split('-');
            paciente.fechaFallecimiento = new Date(fecha[2].substr(0, 4), fecha[1], fecha[0]);
        }
    }
    return paciente;
}
