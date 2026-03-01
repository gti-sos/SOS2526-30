const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');

// Ruta al CSV de FMGP (ajusta la ruta según donde esté)
const cheaters_csv = path.join(__dirname, "../data/video_game_cheaters_dataset_en.csv");

// Array en memoria
let cheaters = [];

/* ================================
    1. CARGA INICIAL
================================ */
router.get("/loadInitialData", (req, res) => {
    if (cheaters.length === 0) {
        csv().fromFile(cheaters_csv).then((datos) => {
            cheaters = datos.slice(0, 15);
            res.status(201).json(cheaters);
        }).catch(() => {
            res.status(500).json({ error: "Error al cargar CSV" });
        });
    } else {
        res.status(200).json(cheaters);
    }
});

/* ================================
    2. COLECCIÓN (con filtros)
================================ */
router.get("/", (req, res) => {
    let results = [...cheaters];

    // Filtrar por ID (si existiera, pero el CSV no tiene ID)
    if (req.query.id) {
        results = results.filter(a => String(a.id) === String(req.query.id));
    }

    // Filtrar por país (country en el CSV)
    if (req.query.country) {
        results = results.filter(a => 
            a.country && a.country.toLowerCase() === req.query.country.toLowerCase()
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
    
    res.status(200).json(results);
});

router.post("/", (req, res) => {
    const nuevo = req.body;

    if (!nuevo.country || !nuevo.year) {
        return res.status(400).json({ error: "country y year son obligatorios" });
    }
    
    // Comprobar si ya existe (por país y año)
    const existe = cheaters.find(a => 
        a.country === nuevo.country && a.year == nuevo.year
    );
    
    if (existe) {
        return res.status(409).json({ error: "Ya existe un registro para ese país y año" });
    }
    
    cheaters.push(nuevo);
    res.status(201).send();
});

router.delete("/", (req, res) => {
    cheaters = [];
    res.status(200).json({ message: "Colección borrada" });
});

// Nota: El CSV no tiene ID, pero mantenemos las rutas por compatibilidad
// En este caso, como no hay ID, estas rutas siempre devolverán array vacío o 404
router.get("/id/:id", (req, res) => {
    const results = cheaters.filter(a => a.id == req.params.id);
    res.status(200).json(results); // Siempre array vacío
});

router.put("/id/:id", (req, res) => {
    res.status(404).json({ error: "No encontrado - este dataset no tiene IDs" });
});

router.delete("/id/:id", (req, res) => {
    res.status(404).json({ error: "No encontrado - este dataset no tiene IDs" });
});

/* ================================
    3. RECURSO ÚNICO (país/año)
================================ */
router.get("/:country/:year", (req, res) => {
    const recurso = cheaters.find(a => 
        a.country && a.country.toLowerCase() === req.params.country.toLowerCase() && 
        a.year == req.params.year
    );
    
    if (recurso) {
        res.status(200).json(recurso);
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

router.put("/:country/:year", (req, res) => {
    const index = cheaters.findIndex(a => 
        a.country && a.country.toLowerCase() === req.params.country.toLowerCase() && 
        a.year == req.params.year
    );
    
    if (index !== -1) {
        cheaters[index] = req.body;
        res.status(200).send();
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

router.delete("/:country/:year", (req, res) => {
    const longitud = cheaters.length;
    cheaters = cheaters.filter(a => 
        !(a.country && a.country.toLowerCase() === req.params.country.toLowerCase() && 
          a.year == req.params.year)
    );
    
    if (cheaters.length < longitud) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

/* ================================
    4. BÚSQUEDA POR PAÍS
================================ */
router.get("/:country", (req, res) => {
    let results = cheaters.filter(a => 
        a.country && a.country.toLowerCase() === req.params.country.toLowerCase()
    );
    
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
router.post("/:country/:year", (req, res) => 
    res.status(405).json({ error: "Método no permitido" })
);

router.put("/", (req, res) => 
    res.status(405).json({ error: "Método no permitido" })
);

module.exports = router;