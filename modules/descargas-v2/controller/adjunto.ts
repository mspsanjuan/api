import * as rupStore from '../../../modules/rup/controllers/rupStore';
import { join } from 'path';
import { readFile } from 'fs';
import { promisify } from 'util';
import { templates } from '../descargas.config';

const read = promisify(readFile);

export async function generarArchivoAdjuntoHTML(registro: any) {
    let template = await read(join(__dirname, templates.adjuntos), 'utf8');
    let templateAdjuntos = '';
    let adjuntos = [];
    adjuntos = await obtenerAdjuntosHTML(registro, template);
    adjuntos.forEach(adj => {
        templateAdjuntos += adj;
    });
    templateAdjuntos = template.replace(`<!--adjuntos-->`, templateAdjuntos);
    return templateAdjuntos;
}

async function obtenerAdjuntosHTML(registro: any, template: string) {
    let filePromises = [];
    let adjunto = '';

    filePromises = registro.valor.documentos.map(documento => {
        if (documento.id) {
            return new Promise(async (resolve, reject) => {
                rupStore.readFile(documento.id).then((archivo: any) => {
                    let file = [];
                    archivo.stream.on('data', (data) => {
                        file.push(data);
                    });
                    archivo.stream.on('end', () => {
                        adjunto = `<img src="data:image/${documento.ext};base64,${Buffer.concat(file).toString('base64')}">`;
                        resolve(adjunto);
                    });

                });
            });
        }
    });

    return Promise.all(filePromises);
}