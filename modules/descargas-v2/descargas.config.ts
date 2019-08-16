import { CreateOptions } from 'html-pdf';


// PhantomJS PDF rendering options
// https://www.npmjs.com/package/html-pdf
// http://phantomjs.org/api/webpage/property/paper-size.html
export const phantomPDFOptions: CreateOptions = {
    // phantomPath: './node_modules/phantomjs-prebuilt/bin/phantomjs',
    format: 'A4',
    border: {
        // default is 0, units: mm, cm, in, px
        top: '.25cm',
        right: '0cm',
        bottom: '3cm',
        left: '0cm'
    },
    header: {
        height: '5.75cm',
    },
    footer: {
        height: '1cm',
        contents: {

        }
    }
};

// paths relativos a los archivos que la utilizan
export const templates = {
    mainScss: '../../../templates/rup/informes/sass/main.scss',
    insumos: '../../../templates/rup/informes/html/includes/insumo.html',
    procedimientos: '../../../templates/rup/informes/html/includes/procedimiento.html',
    solicitudes: '../../../templates/rup/informes/html/includes/hallazgo.html',
    adjuntos: '../../../templates/rup/informes/html/includes/adjunto.html',
    informes: '../../../templates/rup/informes/html/informe.html',
    efectores: '../../../templates/rup/informes/img/efectores/',
    hallazgos: '../../../templates/rup/informes/html/includes/hallazgo.html',
    logoAdicional: '../../../templates/rup/informes/img/logo-adicional.png',
    logoAndes: '../../../templates/rup/informes/img/logo-andes-h.png',
    logoPDP: '../../../templates/rup/informes/img/logo-pdp.png',
    logoPDP2: '../../../templates/rup/informes/img/logo-pdp-h.png'
};

export const semanticTags = {
    //  Motivos Principales de Consulta (MPC) posibles
    mpc: [
        'entidad observable',
        'regimen/tratamiento',
        'procedimiento',
        'hallazgo',
        'trastorno'
    ],

    hallazgos: [
        'hallazgo',
        'situacion',
        'trastorno',
        'objeto físico',
        'medicamento clínico',
    ],

    procedimientos: [
        'procedimiento',
        'entidad observable',
        'régimen/tratamiento',
        'elemento de registro',
        'situación',
    ],

    solicitudes: [
        'procedimiento',
        'entidad observable',
        'régimen/tratamiento',
        'elemento de registro'
    ],

    insumos: [
        'producto',
    ]
};