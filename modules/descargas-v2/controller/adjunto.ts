import * as rupStore from '../../../modules/rup/controllers/rupStore';
import { templates } from '../descargas.config';


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
            archivo.stream.on('end', () => {
                adjuntos = `<img class="adjunto" src="data:image/${documento.ext};base64,${Buffer.concat(file).toString('base64')}">`;
                const template = Handlebars.compile(templates.adjuntos);
                templateParcial = template({ adjuntos });
                resolve(templateParcial);
            });
        });
    });
    return Promise.all(filePromises);
}
