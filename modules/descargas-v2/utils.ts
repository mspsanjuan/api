import { join } from 'path';
import { templates } from './descargas.config';
import { renderSync } from 'node-sass';
import { create } from 'html-pdf';

export function streamToBase64(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => {
            chunks.push(chunk);
        });
        stream.on('end', () => {
            let result = Buffer.concat(chunks);
            return resolve(result.toString('base64'));
        });
        stream.on('error', (err) => {
            return reject(err);
        });
    });
}

export function ucaseFirst(titulo: string) {
    return titulo[0].toLocaleUpperCase() + titulo.slice(1).toLocaleLowerCase();
}

export function generarCSS() {
    // Se agregan los estilos CSS
    let scssFile = join(__dirname, '../../templates/rup/informes/sass/main.scss');
    // Se agregan los estilos
    let css = '<style>\n\n';
    // SCSS => CSS
    css += renderSync({
        file: scssFile
    }).css;
    css += '</style>';
    return css;
}

export function crearPDF(htmlCssPDF: string, options): Promise<string> {
    return new Promise((resolve, reject) => {
        create(htmlCssPDF, options).toFile((error, file): any => {
            if (error) {
                reject(error);
            }
            resolve(file.filename);
        });
    });
}

