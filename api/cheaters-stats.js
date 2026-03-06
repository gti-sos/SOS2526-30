// api/cheaters-stats.js - VERSIÓN ADAPTADA AL MODELO DE GGG

const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');

const cheaters_csv = path.join(__dirname, "../data/video_game_cheaters_dataset_en.csv");

let cheaters = [];

// ============================================
// CARGA INICIAL - SIEMPRE 200 OK
// ============================================
router.get("/loadInitialData", (req, res) => {
    if (cheaters.length === 0) {
        csv().fromFile(cheaters_csv).then((datos) => {
            cheaters = datos.slice(0, 15);
            console.log(`✅ Datos de FMGP cargados: ${cheaters.length} registros`);
            res.status(200).json(cheaters);
        }).catch(() => {
            res.status(500).json({ error: "Error al cargar CSV" });
        });
    } else {
        res.status(200).json(cheaters);
    }
});

// ============================================
// COLECCIÓN PRINCIPAL (con filtros)
// ============================================
router.get("/", (req, res) => {
    const { country, year, from, to, id } = req.query;
    let filtrados = [...cheaters];

    if (id) {
        filtrados = filtrados.filter(a => String(a.id) === String(id));
    }
    if (country) {
        filtrados = filtrados.filter(a => 
            a.country && a.country.toLowerCase() === country.toLowerCase()
        );
    }
    if (year) {
        filtrados = filtrados.filter(a => a.year == year);
    }
    if (from && to) {
        filtrados = filtrados.filter(a => a.year >= parseInt(from) && a.year <= parseInt(to));
    } else if (from) {
        filtrados = filtrados.filter(a => a.year >= parseInt(from));
    } else if (to) {
        filtrados = filtrados.filter(a => a.year <= parseInt(to));
    }

    res.status(200).json(filtrados);
});

// ============================================
// POST - Crear nuevo registro
// ============================================
router.post("/", (req, res) => {
    const nuevo = req.body;

    if (!nuevo.country || !nuevo.year) {
        return res.status(400).json({ error: "country y year son obligatorios" });
    }
    
    const existe = cheaters.find(a => 
        a.country && a.country.toLowerCase() === nuevo.country.toLowerCase() && 
        a.year == nuevo.year
    );
    
    if (existe) {
        return res.status(409).json({ error: "Ya existe un registro para ese país y año" });
    }
    
    cheaters.push(nuevo);
    res.status(201).send();
});

// ============================================
// PUT no permitido en colección
// ============================================
router.put("/", (req, res) => {
    res.status(405).json({ error: "Método no permitido sobre la colección" });
});

// ============================================
// DELETE - Borrar todos
// ============================================
router.delete("/", (req, res) => {
    cheaters = [];
    res.status(200).json({ message: "Colección borrada" });
});

// ============================================
// LISTAS EN SINGULAR
// ============================================

// GET /country - Lista de países
router.get("/country", (req, res) => {
    const paises = [...new Set(cheaters.map(c => c.country).filter(Boolean))];
    res.status(200).json(paises.sort());
});

// POST /country - Crear nuevo país (nuevo registro)
router.post("/country", (req, res) => {
    const nuevoPais = req.body;
    
    if (!nuevoPais.country || !nuevoPais.year) {
        return res.status(400).json({ error: "country y year son obligatorios" });
    }
    
    const existe = cheaters.find(a => 
        a.country && a.country.toLowerCase() === nuevoPais.country.toLowerCase() && 
        a.year == nuevoPais.year
    );
    
    if (existe) {
        return res.status(409).json({ error: "Ya existe un registro para ese país y año" });
    }
    
    cheaters.push(nuevoPais);
    res.status(201).send();
});

// DELETE /country - Borrar todos los países
router.delete("/country", (req, res) => {
    cheaters = [];
    res.status(200).json({ message: "Todos los países borrados" });
});

// PUT no permitido en /country
router.put("/country", (req, res) => {
    res.status(405).json({ error: "Método no permitido sobre la lista de países" });
});

// GET /year - Lista de años
router.get("/year", (req, res) => {
    const años = [...new Set(cheaters.map(c => c.year).filter(a => a))];
    res.status(200).json(años.sort((a,b) => a - b));
});

// POST /year - Crear nuevo año
router.post("/year", (req, res) => {
    const nuevoAño = req.body;
    
    if (!nuevoAño.country || !nuevoAño.year) {
        return res.status(400).json({ error: "country y year son obligatorios" });
    }
    
    const existe = cheaters.find(a => 
        a.country && a.country.toLowerCase() === nuevoAño.country.toLowerCase() && 
        a.year == nuevoAño.year
    );
    
    if (existe) {
        return res.status(409).json({ error: "Ya existe un registro para ese país y año" });
    }
    
    cheaters.push(nuevoAño);
    res.status(201).send();
});

// DELETE /year - Borrar todos los años
router.delete("/year", (req, res) => {
    cheaters = [];
    res.status(200).json({ message: "Todos los años borrados" });
});

// PUT no permitido en /year
router.put("/year", (req, res) => {
    res.status(405).json({ error: "Método no permitido sobre la lista de años" });
});

// ============================================
// RECURSOS CONCRETOS
// ============================================

// GET /country/:country - Ver país específico
router.get("/country/:country", (req, res) => {
    const countryParam = req.params.country;
    
    const results = cheaters.filter(a => 
        a.country && a.country.toLowerCase() === countryParam.toLowerCase()
    );
    
    if (results.length === 0) {
        return res.status(404).json({ error: "País no encontrado" });
    }
    
    // Aplicar filtros opcionales de año
    let filtrados = [...results];
    if (req.query.from && req.query.to) {
        filtrados = filtrados.filter(a => a.year >= parseInt(req.query.from) && a.year <= parseInt(req.query.to));
    } else if (req.query.from) {
        filtrados = filtrados.filter(a => a.year >= parseInt(req.query.from));
    } else if (req.query.to) {
        filtrados = filtrados.filter(a => a.year <= parseInt(req.query.to));
    }
    
    res.status(200).json(filtrados);
});

// PUT /country/:country - Actualizar país
router.put("/country/:country", (req, res) => {
    const countryParam = req.params.country;
    const nuevosDatos = req.body;
    
    if (nuevosDatos.country && nuevosDatos.country.toLowerCase() !== countryParam.toLowerCase()) {
        return res.status(400).json({ error: "El país en el body no coincide con la URL" });
    }

    let actualizados = 0;
    cheaters = cheaters.map(c => {
        if (c.country && c.country.toLowerCase() === countryParam.toLowerCase()) {
            actualizados++;
            return { ...c, ...nuevosDatos, country: c.country };
        }
        return c;
    });
    
    if (actualizados > 0) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "País no encontrado" });
    }
});

// DELETE /country/:country - Borrar país específico
router.delete("/country/:country", (req, res) => {
    const countryParam = req.params.country;
    const longitud = cheaters.length;
    
    cheaters = cheaters.filter(c => 
        !(c.country && c.country.toLowerCase() === countryParam.toLowerCase())
    );
    
    if (cheaters.length < longitud) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "País no encontrado" });
    }
});

// POST no permitido en /country/:country
router.post("/country/:country", (req, res) => {
    res.status(405).json({ error: "Método no permitido sobre un recurso concreto" });
});

// GET /year/:year - Ver año específico
router.get("/year/:year", (req, res) => {
    const yearParam = parseInt(req.params.year);
    
    const results = cheaters.filter(c => c.year == yearParam);
    
    if (results.length === 0) {
        return res.status(404).json({ error: "Año no encontrado" });
    }
    
    res.status(200).json(results);
});

// PUT /year/:year - Actualizar año
router.put("/year/:year", (req, res) => {
    const yearParam = parseInt(req.params.year);
    const nuevosDatos = req.body;
    
    if (nuevosDatos.year && nuevosDatos.year != yearParam) {
        return res.status(400).json({ error: "El año en el body no coincide con la URL" });
    }

    let actualizados = 0;
    cheaters = cheaters.map(c => {
        if (c.year == yearParam) {
            actualizados++;
            return { ...c, ...nuevosDatos, year: c.year };
        }
        return c;
    });
    
    if (actualizados > 0) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "Año no encontrado" });
    }
});

// DELETE /year/:year - Borrar año específico
router.delete("/year/:year", (req, res) => {
    const yearParam = parseInt(req.params.year);
    const longitud = cheaters.length;
    
    cheaters = cheaters.filter(c => c.year != yearParam);
    
    if (cheaters.length < longitud) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "Año no encontrado" });
    }
});

// POST no permitido en /year/:year
router.post("/year/:year", (req, res) => {
    res.status(405).json({ error: "Método no permitido sobre un recurso concreto" });
});

// ============================================
// RECURSOS POR PAÍS/AÑO
// ============================================

// GET /country/:country/year/:year - Recurso exacto
router.get("/country/:country/year/:year", (req, res) => {
    const countryParam = req.params.country;
    const yearParam = parseInt(req.params.year);
    
    const recurso = cheaters.find(a => 
        a.country && a.country.toLowerCase() === countryParam.toLowerCase() && 
        a.year == yearParam
    );
    
    if (recurso) {
        res.status(200).json(recurso);
    } else {
        res.status(404).json({ error: "Registro no encontrado" });
    }
});

// PUT /country/:country/year/:year - Actualizar registro exacto
router.put("/country/:country/year/:year", (req, res) => {
    const countryParam = req.params.country;
    const yearParam = parseInt(req.params.year);
    const nuevosDatos = req.body;
    
    if (nuevosDatos.country && nuevosDatos.country.toLowerCase() !== countryParam.toLowerCase()) {
        return res.status(400).json({ error: "El país en el body no coincide con la URL" });
    }
    if (nuevosDatos.year && nuevosDatos.year != yearParam) {
        return res.status(400).json({ error: "El año en el body no coincide con la URL" });
    }

    const index = cheaters.findIndex(a => 
        a.country && a.country.toLowerCase() === countryParam.toLowerCase() && 
        a.year == yearParam
    );
    
    if (index !== -1) {
        cheaters[index] = { ...nuevosDatos, country: cheaters[index].country, year: cheaters[index].year };
        res.status(200).send();
    } else {
        res.status(404).json({ error: "Registro no encontrado" });
    }
});

// DELETE /country/:country/year/:year - Borrar registro exacto
router.delete("/country/:country/year/:year", (req, res) => {
    const countryParam = req.params.country;
    const yearParam = parseInt(req.params.year);
    const longitud = cheaters.length;
    
    cheaters = cheaters.filter(a => 
        !(a.country && a.country.toLowerCase() === countryParam.toLowerCase() && 
          a.year == yearParam)
    );
    
    if (cheaters.length < longitud) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "Registro no encontrado" });
    }
});

// POST no permitido
router.post("/country/:country/year/:year", (req, res) => {
    res.status(405).json({ error: "Método no permitido" });
});


router.get("/id/:id", (req, res) => {
    const results = cheaters.filter(a => a.id == req.params.id);
    if (results.length === 0) {
        return res.status(404).json({ error: "ID no encontrado" });
    }
    res.status(200).json(results);
});

router.put("/id/:id", (req, res) => {
    res.status(404).json({ error: "No encontrado - este dataset no tiene IDs" });
});

router.delete("/id/:id", (req, res) => {
    res.status(404).json({ error: "No encontrado - este dataset no tiene IDs" });
});

router.post("/id/:id", (req, res) => {
    res.status(405).json({ error: "Método no permitido" });
});

module.exports = router;