import * as utils from '../../../utils/utils';
import * as express from 'express';
import { tipoPrestacion } from '../schemas/tipoPrestacion';
import { snomedModel } from '../../term/schemas/snomed';
import { toArray } from '../../../utils/utils';
import { Auth } from '../../../auth/auth.class';

let router = express.Router();

router.get('/tiposPrestaciones/:id*?', function (req, res, next) {
    let query;
    // Búsqueda por un sólo ID
    if (req.params.id) {
        query = tipoPrestacion.findById(req.params.id);
    } else {
        // Búsqueda por tem
        if (req.query.term) {
            query = tipoPrestacion.find({ term: { '$regex': utils.makePattern(req.query.term) } });
        } else {
            // Si no, devuelve todos
            query = tipoPrestacion.find({});
        }

        // Búsqueda por múltiples IDs
        if (req.query.id) {
            query.where('_id').in(req.query.id);
        }
    }

    // Consultar
    query.sort({ 'term': 1 }).exec(function (err, data) {
        if (err) {
            return next(err);
        }
        res.json(data);
    });
});

router.get('/v2/tipoPrestaciones/:id?', async function (req, res, next) {

    // Trae sinónimos
    let pipeline: any[] = [
        { $match: { 'memberships.refset.conceptId': '1661000013109' } },
        { $unwind: '$descriptions' },
        { $match: { 'descriptions.active': true, 'descriptions.languageCode': 'es', 'descriptions.type.conceptId': '900000000000013009' } },

        // { $match: { words: /cardio/ } },
        // { $sort: { 'conceptId': 1, 'acceptability.conceptId': 1 }}
    ];


    if (req.params.id) {
        pipeline = [{ $match: { conceptId: req.params.id } }, ...pipeline];
    } else {
        if (req.query.term) {
            let conditions = { '$and': [] };
            let words = req.query.term.split(' ');
            words.forEach(function (word) {
                word = word.replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').replace(/\x08/g, '\\x08');
                let expWord = '^' + utils.removeDiacritics(word) + '.*';
                conditions['$and'].push({ 'descriptions.words': { '$regex': expWord } });
            });
            pipeline.push({ $match: conditions });
        } else {

        }

        if (req.query.conceptsIds) {
            if (typeof req.query.conceptsIds === 'string') {
                pipeline = [{ $match: { conceptId: { $in: [req.query.conceptsIds] } } }, ...pipeline];
            } else {
                pipeline = [{ $match: { conceptId: { $in: req.query.conceptsIds } } }, ...pipeline];
            }
        }

    }

    pipeline.push({ $sort: { 'conceptId': 1, 'acceptability.conceptId': 1 } });
    pipeline.push({
        $project: {
            fsn: '$fullySpecifiedName', conceptId: 1, 'semanticTag': '$semtag',
            term: '$descriptions.term',
            'acceptability': { '$let': { 'vars': { 'field': { $arrayElemAt: ['$descriptions.acceptability', 0] } }, 'in': '$$field.acceptability' } }
        }
    });

    let data = await toArray(snomedModel.aggregate(pipeline).cursor({}).exec());
    res.json(data);
});

// router.post('/tiposPrestaciones', function (req, res, next) {
//     let tp = new tipoPrestacion(req.body);
//     tp.save((err) => {
//         if (err) {
//             return next(err);
//         }

//         res.json(tp);
//     });
// });

// router.put('/tiposPrestaciones/:id', function (req, res, next) {
//     tipoPrestacion.findByIdAndUpdate(req.params.id, req.body, { new: true }, function (err, data) {
//         if (err) {
//             return next(err);
//         }
//         res.json(data);
//     });
// });

// router.delete('/tiposPrestaciones/:id', function (req, res, next) {
//     tipoPrestacion.findByIdAndRemove(req.params.id, function (err, data) {
//         if (err) {
//             return next(err);
//         }

//         res.json(data);
//     });
// });

export = router;
