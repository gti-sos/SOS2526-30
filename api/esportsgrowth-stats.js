import express from "express";
import Datastore from "nedb";

const router = express.Router();
let db = new Datastore();

const datosIniciales = [
  { year: 2010, country: "United States", active_player_no: 11, viewership: 17.9, top_genre: "Sports", top_platform: "Console", tournament_no: 104, pro_player_no: 15912, internet_penetration: 82.5, company_no: 395 },
  { year: 2011, country: "United States", active_player_no: 32.4, viewership: 76.7, top_genre: "Strategy", top_platform: "Mobile", tournament_no: 63, pro_player_no: 13797, internet_penetration: 70.5, company_no: 60 },
  { year: 2010, country: "China", active_player_no: 59.7, viewership: 110.5, top_genre: "Sports", top_platform: "Console", tournament_no: 18, pro_player_no: 1260, internet_penetration: 63.9, company_no: 452 },
  { year: 2011, country: "China", active_player_no: 58.4, viewership: 133.6, top_genre: "MOBA", top_platform: "Mobile", tournament_no: 31, pro_player_no: 2356, internet_penetration: 72.2, company_no: 326 },
  { year: 2010, country: "Japan", active_player_no: 41, viewership: 123.2, top_genre: "MOBA", top_platform: "Mobile", tournament_no: 61, pro_player_no: 5368, internet_penetration: 93.1, company_no: 142 },
  { year: 2011, country: "Japan", active_player_no: 58.2, viewership: 167.3, top_genre: "Strategy", top_platform: "Mobile", tournament_no: 21, pro_player_no: 5859, internet_penetration: 52.6, company_no: 203 },
  { year: 2010, country: "South Korea", active_player_no: 30.1, viewership: 82.4, top_genre: "RPG", top_platform: "Console", tournament_no: 92, pro_player_no: 16468, internet_penetration: 82.1, company_no: 247 },
  { year: 2011, country: "South Korea", active_player_no: 8.1, viewership: 24, top_genre: "Sports", top_platform: "Mobile", tournament_no: 43, pro_player_no: 10062, internet_penetration: 55.4, company_no: 221 },
  { year: 2010, country: "Spain", active_player_no: 16, viewership: 53.3, top_genre: "RPG", top_platform: "PC", tournament_no: 85, pro_player_no: 12665, internet_penetration: 83.1, company_no: 277 },
  { year: 2019, country: "Spain", active_player_no: 27.3, viewership: 73.5, top_genre: "FPS", top_platform: "PC", tournament_no: 86, pro_player_no: 17458, internet_penetration: 82.9, company_no: 282 }
];

db.insert(datosIniciales);

const camposEsperados = [
    "year", "country", "active_player_no", "viewership", 
    "top_genre", "top_platform", "tournament_no", 
    "pro_player_no", "internet_penetration", "company_no"
];

function cleanId(doc) {
    if (doc) delete doc._id;
    return doc;
}

router.get("/docs", (req, res) => {
    res.redirect("https://documenter.getpostman.com/view/52302165/2sBXieqtYQ");
});


router.get("/loadInitialData", (req, res) => {
    db.find({}, (err, docs) => {
        if (docs.length === 0) {
            db.insert(datosIniciales, (err, newDocs) => {
                res.status(201).json(newDocs.map(cleanId));
            });
        } else {
            res.status(200).json({ message: "Data is already loaded" });
        }
    });
});

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
        if (err) {
            return res.status(500).json({ message: "Internal Server Error" });
        }
        res.status(200).json(docs.map(cleanId));
    });
});

router.post("/", (req, res) => {
    const newData = req.body;
    
    const tieneTodosLosCampos = camposEsperados.every(campo => newData.hasOwnProperty(campo));
    const tieneLongitudExacta = Object.keys(newData).length === camposEsperados.length;

    if (!tieneTodosLosCampos || !tieneLongitudExacta) {
        return res.status(400).json({ message: "Bad Request: Missing or incorrect fields" });
    }

    db.find({ country: newData.country, year: parseInt(newData.year) }, (err, docs) => {
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
    res.status(405).json({ message: "Method Not Allowed: Cannot update the entire list" });
});

router.delete("/", (req, res) => {
    db.remove({}, { multi: true }, (err, numRemoved) => {
        res.status(200).json({ message: "All data deleted successfully" });
    });
});

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

router.get("/:country/:year", (req, res) => {
    const country = req.params.country;
    const year = parseInt(req.params.year); 
    
    db.find({ country: country, year: year }, (err, docs) => {
        if (docs.length > 0) {
            res.status(200).json(cleanId(docs[0]));
        } else {
            res.status(404).json({ message: "Resource not found" });
        }
    });
});

router.post("/:country/:year", (req, res) => {
    res.status(405).json({ message: "Method Not Allowed" });
});

router.put("/:country/:year", (req, res) => {
    const country = req.params.country;
    const year = parseInt(req.params.year);
    const body = req.body;

    if (country !== body.country || year !== parseInt(body.year)) {
        return res.status(400).json({ message: "Bad Request: IDs in URL and body do not match" });
    }

    const tieneTodosLosCampos = camposEsperados.every(campo => body.hasOwnProperty(campo));
    const tieneLongitudExacta = Object.keys(body).length === camposEsperados.length;

    if (!tieneTodosLosCampos || !tieneLongitudExacta) {
        return res.status(400).json({ message: "Bad Request: Missing or incorrect fields" });
    }

    db.find({ country: country, year: year }, (err, docs) => {
        if (docs.length > 0) {
            db.update({ country: country, year: year }, body, {}, (err, numReplaced) => {
                res.status(200).json(body);
            });
        } else {
            res.status(404).json({ message: "Resource not found" });
        }
    });
});

router.delete("/:country/:year", (req, res) => {
    const country = req.params.country;
    const year = parseInt(req.params.year);
    
    db.remove({ country: country, year: year }, {}, (err, numRemoved) => {
        if (numRemoved > 0) {
            res.status(200).json({ message: "Resource deleted successfully" });
        } else {
            res.status(404).json({ message: "Resource not found" });
        }
    });
});

export default router;
