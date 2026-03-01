const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');

// Ruta al CSV
const athletes_csv = path.join(__dirname, "../data/athlete_events.csv");

// Array en memoria
let athletes = [];

/* ================================
    1. CARGA INICIAL
================================ */
router.get("/loadInitialData", (req, res) => {
    if (athletes.length === 0) {
        csv().fromFile(athletes_csv).then((datos) => {
            athletes = datos.slice(0, 15);
            res.status(201).json(athletes);
        }).catch(() => {
            res.status(500).json({ error: "Error al cargar CSV" });
        });
    } else {
        res.status(200).json(athletes);
    }
});

/* ================================
    2. COLECCIÓN (con filtros)
================================ */
router.get("/", (req, res) => {
    let results = [...athletes];

    // ✅ FILTRO POR ID AÑADIDO
    if (req.query.id) {
        results = results.filter(a => String(a.id) === String(req.query.id));
    }

    if (req.query.country) {
        results = results.filter(a => 
            a.team && a.team.toLowerCase() === req.query.country.toLowerCase()
        );
    }
    
    if (req.query.year) {
        results = results.filter(a => a.year == req.query.year);
    }

    if (req.query.from) {
        results = results.filter(a => a.year >= parseInt(req.query.from));
    }
    if (req.query.to) {
        results = results.filter(a => a.year <= parseInt(req.query.to));
    }
    
    res.status(200).json(results);
});

router.post("/", (req, res) => {
    const nuevo = req.body;

    if (!nuevo.name || !nuevo.year) {
        return res.status(400).json({ error: "name y year son obligatorios" });
    }
    
    const existe = athletes.find(a => 
        a.name === nuevo.name && a.year == nuevo.year
    );
    
    if (existe) {
        return res.status(409).json({ error: "Ya existe" });
    }
    
    athletes.push(nuevo);
    res.status(201).send();
});

router.delete("/", (req, res) => {
    athletes = [];
    res.status(200).json({ message: "Colección borrada" });
});

router.get("/id/:id", (req, res) => {
    const results = athletes.filter(a => a.id == req.params.id);
    res.status(200).json(results);
});

router.put("/id/:id", (req, res) => {
    const index = athletes.findIndex(a => a.id == req.params.id);
    
    if (index !== -1) {
        athletes[index] = { ...req.body, id: athletes[index].id };
        res.status(200).send();
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

router.delete("/id/:id", (req, res) => {
    const longitud = athletes.length;
    athletes = athletes.filter(a => a.id != req.params.id);
    
    if (athletes.length < longitud) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

/* ================================
    3. RECURSO ÚNICO (nombre/año)
================================ */
router.get("/:name/:year", (req, res) => {
    const recurso = athletes.find(a => 
        a.name === req.params.name && a.year == req.params.year
    );
    
    if (recurso) {
        res.status(200).json(recurso);
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

router.put("/:name/:year", (req, res) => {
    const index = athletes.findIndex(a => 
        a.name === req.params.name && a.year == req.params.year
    );
    
    if (index !== -1) {
        athletes[index] = req.body;
        res.status(200).send();
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

router.delete("/:name/:year", (req, res) => {
    const longitud = athletes.length;
    athletes = athletes.filter(a => 
        !(a.name === req.params.name && a.year == req.params.year)
    );
    
    if (athletes.length < longitud) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

router.get("/:name", (req, res) => {
    let results = athletes.filter(a => a.name === req.params.name);
    
    if (req.query.from) {
        results = results.filter(a => a.year >= parseInt(req.query.from));
    }
    if (req.query.to) {
        results = results.filter(a => a.year <= parseInt(req.query.to));
    }
    
    res.status(200).json(results);
});

/* ================================
    5. MÉTODOS NO PERMITIDOS
================================ */
router.post("/:name/:year", (req, res) => 
    res.status(405).json({ error: "Método no permitido" })
);

router.put("/", (req, res) => 
    res.status(405).json({ error: "Método no permitido" })
);

module.exports = router;