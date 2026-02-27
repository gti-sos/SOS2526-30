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
            res.status(201).json(athletes); // Devuelve el array
        }).catch(() => {
            res.status(500).json({ error: "Error al cargar CSV" });
        });
    } else {
        res.status(200).json(athletes);
    }
});

/* ================================
    2. COLECCIÓN
================================ */
router.get("/", (req, res) => {
    let results = [...athletes];
    
    // Filtrar por país (como ?town= seville)
    if (req.query.country) {
        results = results.filter(a => 
            a.team && a.team.toLowerCase() === req.query.country.toLowerCase()
        );
    }
    
    // Filtrar por año
    if (req.query.year) {
        results = results.filter(a => a.year == req.query.year);
    }
    
    // Filtrar por rango de años
    if (req.query.from) {
        results = results.filter(a => a.year >= parseInt(req.query.from));
    }
    if (req.query.to) {
        results = results.filter(a => a.year <= parseInt(req.query.to));
    }
    
    // Siempre array (vacío si no hay datos)
    res.status(200).json(results);
});

router.post("/", (req, res) => {
    const nuevo = req.body;

    // Validar campos obligatorios (análogo a town y year)
    if (!nuevo.name || !nuevo.year) {
        return res.status(400).json({ error: "name y year son obligatorios" });
    }
    
    // Comprobar si ya existe (como town+year)
    const existe = athletes.find(a => 
        a.name === nuevo.name && a.year == nuevo.year
    );
    
    if (existe) {
        return res.status(409).json({ error: "Ya existe" });
    }
    
    athletes.push(nuevo);
    res.status(201).send(); // 201 CREATED sin datos
});

router.delete("/", (req, res) => {
    athletes = [];
    res.status(200).json({ message: "Colección borrada" });
});

/* ================================
    3. RECURSO ÚNICO (nombre/año)
================================ */
router.get("/:name/:year", (req, res) => {
    const recurso = athletes.find(a => 
        a.name === req.params.name && a.year == req.params.year
    );
    
    if (recurso) {
        res.status(200).json(recurso); // OBJETO, no array
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
        res.status(200).send(); // 200 OK sin datos
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
        res.status(200).send(); // 200 OK sin datos
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

/* ================================
    4. BÚSQUEDA POR NOMBRE CON RANGO
     (como /seville?from=2014&to=2016)
================================ */
router.get("/:name", (req, res) => {
    let results = athletes.filter(a => a.name === req.params.name);
    
    if (req.query.from) {
        results = results.filter(a => a.year >= parseInt(req.query.from));
    }
    if (req.query.to) {
        results = results.filter(a => a.year <= parseInt(req.query.to));
    }
    
    res.status(200).json(results); // Siempre array
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