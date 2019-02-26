import * as express from 'express';
import * as fs from 'fs';
import * as carpetaPaciente from '../schemas/carpetaPaciente';
import * as path from 'path';
import * as carpetaPacienteController from '../controller/carpetaPacienteController';

const router = express.Router();

/**
 * @swagger
 * definition:
 *   carpetaPaciente:
 *     properties:
 *      id:
 *          type: string
 *      documento:
 *          type: string
 *      carpetaEfectores:
 *          type: array
 *          items:
 *              type: object
 *              properties:
 *                  organizacion:
 *                      type: object
 *                      properties:
 *                          nombre:
 *                              type: string
 *                  idPaciente:
 *                      type: string
 *                  nroCarpeta:
 *                      type: string
 */

/**
 * @swagger
 * /carpetasPacientes/{id}:
 *   get:
 *     tags:
 *       - CarpetaPaciente
 *     description: Retorna el numero de Carpeta del Paciente, dependiendo del efector
 *     summary: Numero de Carpeta del Efector
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: documento
 *         in: query
 *         description: El documento del paciente
 *         required: false
 *         type: string
 *       - name: organizacion
 *         in: query
 *         description: El id de la organizacion donde se encuentra la carpeta del Paciente
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: un arreglo de objetos carpetaPaciente
 *         schema:
 *           $ref: '#/definitions/carpetaPaciente'
 */

// router.get('/carpetasPacientes/:id*?', async (req, res, next) => {
//     try {
//         const resultado = await carpetaPacienteController.buscarCarpeta(req);
//         res.json(resultado);
//     } catch (err) {
//         return next(err);
//     }
// });

router.get('/carpetasPacientes/actualizar', async (req, res, next) => {
    let camino = path.join(__dirname, '../../../templates/rup/informes/html/pacientesHellerCSV0.csv');
    let datosPacientes = fs.readFileSync(camino, 'utf8');
    let ListaDatos = datosPacientes.split('\n').map(pac => {
        if (pac !== '') {
            let datos = pac.split(',');
            return {
                HC: datos[0],
                documento: datos[1]
            };
        } else {
            return undefined;
        }
    }).filter(pac => pac !== undefined);
    console.log('ListaDatos', ListaDatos);
    try {
        await Promise.all(ListaDatos.map(c => carpetaPacienteController.actualizarCarpetaHHH(c)));
        res.json(true);
    } catch (err) {
        return next(err);
    }
});


export = router;
