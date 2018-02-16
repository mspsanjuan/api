
import * as fs from 'fs';
import * as scss from 'node-sass';
import * as pdf from 'html-pdf';
import { Auth } from '../../../auth/auth.class';

export class Documento {

    /**
     * Opciones de Geolocalización
     */
    private locale = 'es-ES';
    private timeZone = 'America/Argentina/Buenos_Aires';

    /**
     * Opciones default de PDF rendering
     */
    private options = {};

    constructor(options) {
        this.options = {
            format: 'A4',
            border: {
                // default is 0, units: mm, cm, in, px
                top: '0.5cm',
                right: '0.5cm',
                bottom: '1.5cm',
                left: '1.5cm'
            },
            header: {
                height: '2.5cm',
            },
            footer: {
                height: '10mm',
                contents: {
                }
            },
            settings: {
                resourceTimeout: 30
            },
        };
    }

    private async cargarAssets(modulo) {
        return new Promise((resolve, reject) => {
            // Se cargan logos
            let logoAndes: Buffer = fs.readFileSync('./templates/andes/logo-andes.png');
            let logotipoAndes: Buffer = fs.readFileSync('./templates/andes/logotipo-andes-blue.png');
            let logoPDP: Buffer = fs.readFileSync('./templates/andes/logo-pdp.png');

            let header = fs.readFileSync(`./templates/${modulo}/header.html`).toString();
            let footer = fs.readFileSync(`./templates/${modulo}/footer.html`).toString();

            if (!logoAndes || !logotipoAndes || !logoPDP || !header || !footer) {
                reject('Error al cargar archivo.');
            }

            resolve({ header: header, footer: footer, logos: { logoAndes: logoAndes, logotipoAndes: logotipoAndes, logoPDP: logoPDP } });
        });
    }

    /**
     *
     * @param req ExpressJS request
     * TODO: Extender
     */
    private async generarHTML(req) {
        return new Promise(async (resolve, reject) => {

            // Se genera HTML para ser transformado en PDF
            let html = await Buffer.from(req.body.html, 'base64').toString();

            // Se agregan los estilos CSS
            html += await this.generarCSS(req.body.modulo);

            let assets: any = await this.cargarAssets(req.body.modulo);

            // Se reemplazan ciertos <!--placeholders--> por diferentes assets y datos
            let header = assets.header.replace('<!--placeholderLogoAndes-->', `<img src="data:image/png;base64,${assets.logos.logoAndes.toString('base64')}" style="float: left;">`);
            header = header.replace('<!--placeholderLogotipoAndes-->', `<img src="data:image/png;base64,${assets.logos.logotipoAndes.toString('base64')}" style="width: 80px; margin-right: 10px;">`);
            header = header.replace('<!--placeholderOrganizacion-->', Auth.getOrganization(req, 'nombre'));

            html += header;

            let footer = assets.footer.replace('<!--placeholderLogoPDP-->', `<img src="data:image/png;base64,${assets.logos.logoPDP.toString('base64')}" style="width: 100px; float: right;">`);
            footer = footer.replace('<!--placeholderSessionData-->', `${JSON.stringify(Auth.getUserName(req))} - ${new Date().toLocaleString('locale', { timeZone: this.timeZone })}`);

            html += footer;

            resolve(html);

        });

    }

    /**
     * Genera CSS de RUP
     * TODO: Extender
     */
    private async generarCSS(modulo) {
        return new Promise((resolve, reject) => {
            fs.stat(`./templates/${modulo}/styles.scss`, (err, stats) => {

                if (err) {
                    reject(err);
                }

                // Se agregan los estilos
                let css = '<style>\n\n';

                // SCSS => CSS
                css += scss.renderSync({
                    file: `./templates/${modulo}/styles.scss`,
                    includePaths: [
                        './templates/${modulo}/'
                    ]
                }).css;

                css += '</style>';
                resolve(css);

            });
        });
    }

    /**
     *
     * @param req ExpressJS request
     * @param res ExpressJS response
     * @param next ExpressJS next
     * @param options html-pdf/PhantonJS rendering options
     * TODO: extender
     */
    private async generar(req, next, options = null) {
        return new Promise(async (resolve, reject) => {

            // PhantomJS PDF rendering options
            // https://www.npmjs.com/package/html-pdf
            // http://phantomjs.org/api/webpage/property/paper-size.html
            if (options) {
                this.options = options;
            }

            let html = await this.generarHTML(req);

            // Tipo de archivo a descargar (html|pdf)
            switch (req.params.tipo) {
                case 'html':
                    resolve(html);
                    break;
                case 'pdf':
                default:
                    pdf.create(html.toString(), this.options).toFile((err2, file) => {
                        if (err2) {
                            reject(err2);
                        }
                        resolve(file.filename);
                    });
                    break;
            }
        });
    }

    public async descargar(req, res, next) {
        return new Promise(async (resolve, reject) => {
            let file = await this.generar(req, next);
            res.download(file, (err) => {
                if (err) {
                    reject(err);
                }
                resolve(true);
            });
        });
    }
}
