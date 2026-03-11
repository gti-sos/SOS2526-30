import express from "express";
//import Datastore from "nedb";
import Datastore from "@seald-io/nedb";

const router = express.Router();
const db = new Datastore();

const datosIniciales = [
    { total_money: 31, game_name: "Acceleration of SUGURI 2", genre: "Fighting Game", player_no: 6, tournament_no: 2, country: "United States", top_country_earnings: 31, year: 2018 },
    { total_money: 149248.951, game_name: "Age of Empires II", genre: "Strategy", player_no: 956, tournament_no: 576, country: "China", top_country_earnings: 17425.244, year: 2004 },
    { total_money: 6811.385, game_name: "Age of Empires II", genre: "Strategy", player_no: 106, tournament_no: 76, country: "United States", top_country_earnings: 1852.352, year: 2005 },
    { total_money: 266.8, game_name: "Age of Empires Online", genre: "Strategy", player_no: 16, tournament_no: 7, country: "Germany", top_country_earnings: 126.4, year: 2011 },
    { total_money: 393978.329, game_name: "Call of Duty: Black Ops III", genre: "First-Person Shooter", player_no: 420, tournament_no: 78, country: "United States", top_country_earnings: 225498.462, year: 2015 },
    { total_money: 1349422.957, game_name: "Counter-Strike", genre: "First-Person Shooter", player_no: 4137, tournament_no: 995, country: "Sweden", top_country_earnings: 283739.801, year: 2000 },
    { total_money: 33798.540, game_name: "Dragon Ball FighterZ", genre: "Fighting Game", player_no: 159, tournament_no: 73, country: "Japan", top_country_earnings: 16611.931, year: 2018 },
    { total_money: 53804.738, game_name: "F1 2019", genre: "Racing", player_no: 25, tournament_no: 2, country: "Italy", top_country_earnings: 13333.332, year: 2019 },
    { total_money: 114467.372, game_name: "FIFA 20", genre: "Sports", player_no: 248, tournament_no: 39, country: "United Kingdom", top_country_earnings: 20561.304, year: 2019 },
    { total_money: 9750842.500, game_name: "Fortnite", genre: "Battle Royale", player_no: 4347, tournament_no: 660, country: "United States", top_country_earnings: 3342275.637, year: 2017 }
];

const camposEsperados = [
    "total_money", "game_name", "genre", "player_no", 
    "tournament_no", "country", "top_country_earnings", "year"
];

function cleanId(doc) {
    if (doc) delete doc._id;
    return doc;
}

// Redirección a documentación (ajusta el link si tienes uno propio)
router.get("/docs", (req, res) => {
    res.redirect("https://documenter.getpostman.com/view/52332561/2sBXiesa6t"); 
});

/* ---------------- LOAD INITIAL DATA ---------------- */
router.get("/loadInitialData", (req, res) => {
    db.find({}, (err, docs) => {
        if (err) {
            return res.status(500).json({ message: "Error interno de la base de datos" });
        }

        if (docs.length === 0) {
            db.insert(datosIniciales, (err, newDocs) => {
                if (err) {
                    return res.status(500).json({ message: "Error al insertar los datos" });
                }
                // Si NeDB no devuelve newDocs, usamos datosIniciales como respaldo
                const datosParaEnviar = newDocs || datosIniciales;
                res.status(201).json(datosParaEnviar.map(cleanId));
            });
        } else {
            res.status(200).json({ message: "Data is already loaded" });
        }
    });
});

/* ---------------- GET GENERAL (Con filtros y paginación) ---------------- */
router.get("/", (req, res) => {
    const { limit, offset, from, to, ...queryFields } = req.query;
    let query = {};

    for (const [campo, valor] of Object.entries(queryFields)) {
        if (!isNaN(valor) && valor.trim() !== "") {
            query[campo] = parseFloat(valor);
        } else {
            query[campo] = valor;
        }
    }

    if (from && to) {
        query.year = { $gte: parseInt(from), $lte: parseInt(to) };
    } else if (from) {
        query.year = { $gte: parseInt(from) };
    } else if (to) {
        query.year = { $lte: parseInt(to) };
    }

    const limitValue = limit ? parseInt(limit) : 0;
    const offsetValue = offset ? parseInt(offset) : 0;

    db.find(query).skip(offsetValue).limit(limitValue).exec((err, docs) => {
        if (err) return res.status(500).json({ message: "Internal Server Error" });
        res.status(200).json(docs.map(cleanId));
    });
});

/* ---------------- POST GENERAL ---------------- */
router.post("/", (req, res) => {
    const newData = req.body;
    const tieneTodosLosCampos = camposEsperados.every(campo => newData.hasOwnProperty(campo));
    const tieneLongitudExacta = Object.keys(newData).length === camposEsperados.length;

    if (!tieneTodosLosCampos || !tieneLongitudExacta) {
        return res.status(400).json({ message: "Bad Request: Missing or incorrect fields" });
    }

    db.find({ game_name: newData.game_name, year: parseInt(newData.year) }, (err, docs) => {
        if (docs.length > 0) {
            res.status(409).json({ message: "Resource already exists" });
        } else {
            newData.year = parseInt(newData.year);
            db.insert(newData, (err, newDoc) => {
                res.status(201).json(cleanId(newDoc));
            });
        }
    });
});

router.put("/", (req, res) => {
    res.status(405).json({ message: "Method Not Allowed" });
});

/* ---------------- DELETE GENERAL ---------------- */
router.delete("/", (req, res) => {
    db.remove({}, { multi: true }, (err, numRemoved) => {
        res.status(200).json({ message: "All data deleted successfully" });
    });
});

/* ---------------- GET POR PAÍS ---------------- */
router.get("/:country", (req, res) => {
    const country = req.params.country;
    const { from, to } = req.query;
    let query = { country: country };

    if (from && to) {
        query.year = { $gte: parseInt(from), $lte: parseInt(to) };
    } else if (from) {
        query.year = { $gte: parseInt(from) };
    } else if (to) {
        query.year = { $lte: parseInt(to) };
    }

    db.find(query, (err, docs) => {
        if (docs.length === 0 && !from && !to) {
            res.status(404).json({ message: "Resource not found" });
        } else {
            res.status(200).json(docs.map(cleanId));
        }
    });
});

/* ---------------- GET POR JUEGO Y AÑO ---------------- */
router.get("/:game_name/:year", (req, res) => {
    const game = req.params.game_name;
    const year = parseInt(req.params.year); 
    
    db.find({ game_name: game, year: year }, (err, docs) => {
        // 1. Manejamos el error interno
        if (err) {
            return res.status(500).json({ message: "Error interno" });
        }
        // 2. Nos aseguramos de que docs existe antes de mirar su length
        if (docs && docs.length > 0) {
            res.status(200).json(cleanId(docs[0]));
        } else {
            res.status(404).json({ message: "Resource not found" });
        }
    });
});

router.post("/:game_name/:year", (req, res) => {
    res.status(405).json({ message: "Method Not Allowed" });
});

/* ---------------- PUT POR JUEGO Y AÑO ---------------- */
router.put("/:game_name/:year", (req, res) => {
    const game = req.params.game_name;
    const year = parseInt(req.params.year);
    const body = req.body;

    if (game !== body.game_name || year !== parseInt(body.year)) {
        return res.status(400).json({ message: "Bad Request: IDs in URL and body do not match" });
    }

    const tieneTodosLosCampos = camposEsperados.every(campo => body.hasOwnProperty(campo));
    const tieneLongitudExacta = Object.keys(body).length === camposEsperados.length;

    if (!tieneTodosLosCampos || !tieneLongitudExacta) {
        return res.status(400).json({ message: "Bad Request: Missing or incorrect fields" });
    }

    db.find({ game_name: game, year: year }, (err, docs) => {
        if (docs.length > 0) {
            db.update({ game_name: game, year: year }, body, {}, (err, numReplaced) => {
                res.status(200).json(body);
            });
        } else {
            res.status(404).json({ message: "Resource not found" });
        }
    });
});

/* ---------------- DELETE POR JUEGO Y AÑO ---------------- */
router.delete("/:game_name/:year", (req, res) => {
    const game = req.params.game_name;
    const year = parseInt(req.params.year);
    
    db.remove({ game_name: game, year: year }, {}, (err, numRemoved) => {
        if (numRemoved > 0) {
            res.status(200).json({ message: "Resource deleted successfully" });
        } else {
            res.status(404).json({ message: "Resource not found" });
        }
    });
});

export default router;
