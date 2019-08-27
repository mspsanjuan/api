import * as rupStore from '../../../modules/rup/controllers/rupStore';
import { templates } from '../descargas.config';
import { compile } from 'handlebars';
import { promisify } from 'util';
import { readFile } from 'fs';
import { join } from 'path';
const read = promisify(readFile);
export async function generarArchivoAdjuntoHTML(registro: any) {
    let filePromises = [];
    let adjuntos = '';
    let templateParcial = '';

    filePromises = registro.valor.documentos.map((documento) => {
        return new Promise(async (resolve, reject) => {
            let archivo: any = await rupStore.readFile(documento.id);
            let file = [];
            archivo.stream.on('data', (data) => {
                file.push(data);
            });
            archivo.stream.on('end', async () => {
                adjuntos = `<img class="adjunto" src="data:image/${documento.ext};base64,${Buffer.concat(file).toString('base64')}">`;
                const template = compile(await read(join(__dirname, templates.adjuntos), 'utf8'));
                templateParcial = template({ adjuntos });
                resolve(templateParcial);
            });
        });
    });
    return Promise.all(filePromises);
}
