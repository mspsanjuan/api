import * as rupStore from '../../../modules/rup/controllers/rupStore';
import { join } from 'path';
import { readFile } from 'fs';
import { promisify } from 'util';

const read = promisify(readFile);

export function esAdjunto(conceptId) {
    // SCTID de "adjunto"?
    return (conceptId === '1921000013108');
}

export async function generarArchivoAdjuntoHTML(registro: any) {
    let template = await read(join(__dirname, '../../../templates/rup/informes/html/includes/adjunto.html'), 'utf8');

    let filePromises = [];
    let adjuntos = '';

    let templateAdjuntos = '';
    filePromises = registro.valor.documentos.filter(doc => doc.ext !== 'pdf').map(async documento => {
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
