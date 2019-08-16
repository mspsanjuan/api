import * as rupStore from '../../../modules/rup/controllers/rupStore';
import { join } from 'path';
import { readFile } from 'fs';
import { promisify } from 'util';
import { templates } from '../descargas.config';

const read = promisify(readFile);

export async function generarArchivoAdjuntoHTML(registro: any) {
    let template = await read(join(__dirname, templates.adjuntos), 'utf8');

    let filePromises = [];
    let adjuntos = '';

    let templateAdjuntos = '';
    filePromises = registro.valor.documentos.map(async documento => {
        let archivo: any = await rupStore.readFile(documento.id);
        let file = [];
        archivo.stream.on('data', (data) => {
            file.push(data);
        });
        archivo.stream.on('end', () => {
            adjuntos = `<img src="data:image/${documento.ext};base64,${Buffer.concat(file).toString('base64')}">`;
            templateAdjuntos = template.replace(`<!--adjuntos-->`, adjuntos);
            return (templateAdjuntos);
        });
    });
    return Promise.all(filePromises);
}
