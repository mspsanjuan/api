"use strict";
var express = require('express');
var paciente = require('../../schemas/paciente');
var router = express.Router();
router.get('/bloque/:id', function (req, res, next) {
    if (req.params.id) {
        var filtro = "claveBlocking." + req.params.id;
        paciente.aggregate([{
                "$group": {
                    "_id": {
                        "$arrayElemAt": ["$claveBlocking", Number(req.params.id)]
                    },
                    "count": {
                        "$sum": 1
                    }
                } },
            { "$match": { count: { $gt: 1 } } }
        ], function (err, data) {
            if (err) {
                next(err);
            }
            ;
            var claves = data.map(function (elemt) {
                var dato = elemt._id;
                return dato;
            }).filter(function (n) { return (n != undefined && n != null && n != ""); });
            res.json(claves);
        });
    }
});
router.get('/bloque/paciente/:idb/:id', function (req, res, next) {
    var filtro = "claveBlocking." + req.params.idb;
    var query = {};
    query[filtro] = { $eq: req.params.id };
    console.log('Parametros', query);
    paciente.find(query, function (err, data) {
        //console.log(data);
        if (err) {
            next(err);
        }
        ;
        res.json(data);
    });
});
module.exports = router;
//# sourceMappingURL=bloque.js.map