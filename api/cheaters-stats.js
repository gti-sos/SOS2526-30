// api/cheaters-stats.js - VERSIÓN CON COLECCIONES EN SINGULAR

const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');

const cheaters_csv = path.join(__dirname, "../data/video_game_cheaters_dataset_en.csv");

let datos = [];

// ============================================
// CARGA INICIAL - SIEMPRE 200 OK
// ============================================
router.get("/loadInitialData", (req, res) => {
    if (datos.length === 0) {
        csv().fromFile(cheaters_csv).then((datosCSV) => {
            datos = datosCSV.slice(0, 15);
            console.log(`✅ Datos de FMGP cargados: ${datos.length} registros`);
            res.status(200).json(datos);
        }).catch(() => {
            res.status(500).json({ error: "Error al cargar CSV" });
        });
    } else {
        res.status(200).json(datos);
    }
});

// ============================================
// COLECCIÓN PRINCIPAL (con filtros)
// ============================================
router.get("/", (req, res) => {
    const { country, year, from, to } = req.query;
    let filtrados = [...datos];

    if (country) {
        filtrados = filtrados.filter(d => 
            d.country && d.country.toLowerCase() === country.toLowerCase()
        );
    }
    if (year) {
        filtrados = filtrados.filter(d => d.year == year);
    }
    if (from && to) {
        filtrados = filtrados.filter(d => d.year >= parseInt(from) && d.year <= parseInt(to));
    } else if (from) {
        filtrados = filtrados.filter(d => d.year >= parseInt(from));
    } else if (to) {
        filtrados = filtrados.filter(d => d.year <= parseInt(to));
    }

    res.status(200).json(filtrados);
});

// ============================================
// POST - Crear nuevo registro
// ============================================
router.post("/", (req, res) => {
    const newData = req.body;

    if (!newData.country || !newData.year) {
        return res.status(400).json({ error: "country y year son obligatorios" });
    }

    const existe = datos.find(d => 
        d.country && d.country.toLowerCase() === newData.country.toLowerCase() && 
        d.year == newData.year
    );

    if (existe) {
        return res.status(409).json({ error: "Ya existe un registro para ese país y año" });
    }

    datos.push(newData);
    res.status(201).json(newData);
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
    datos = [];
    res.status(200).json({ message: "Todos los datos borrados" });
});

// ============================================
// LISTAS EN SINGULAR
// ============================================

// GET /country - Lista de países (SINGULAR)
router.get("/country", (req, res) => {
    const paises = [...new Set(datos.map(d => d.country).filter(Boolean))];
    res.status(200).json(paises.sort());
});

// POST /country - Crear nuevo país (nuevo registro)
router.post("/country", (req, res) => {
    const newData = req.body;

    if (!newData.country || !newData.year) {
        return res.status(400).json({ error: "country y year son obligatorios" });
    }

    const existe = datos.find(d => 
        d.country && d.country.toLowerCase() === newData.country.toLowerCase() && 
        d.year == newData.year
    );

    if (existe) {
        return res.status(409).json({ error: "Ya existe un registro para ese país y año" });
    }

    datos.push(newData);
    res.status(201).json(newData);
});

// DELETE /country - Borrar todos los países
router.delete("/country", (req, res) => {
    datos = [];
    res.status(200).json({ message: "Todos los países borrados" });
});

// PUT no permitido en /country
router.put("/country", (req, res) => {
    res.status(405).json({ error: "Método no permitido sobre la lista de países" });
});

// GET /year - Lista de años (SINGULAR)
router.get("/year", (req, res) => {
    const años = [...new Set(datos.map(d => d.year).filter(a => a))];
    res.status(200).json(años.sort((a,b) => a - b));
});

// POST /year - Crear nuevo año (nuevo registro)
router.post("/year", (req, res) => {
    const newData = req.body;

    if (!newData.country || !newData.year) {
        return res.status(400).json({ error: "country y year son obligatorios" });
    }

    const existe = datos.find(d => 
        d.country && d.country.toLowerCase() === newData.country.toLowerCase() && 
        d.year == newData.year
    );

    if (existe) {
        return res.status(409).json({ error: "Ya existe un registro para ese país y año" });
    }

    datos.push(newData);
    res.status(201).json(newData);
});

// DELETE /year - Borrar todos los años
router.delete("/year", (req, res) => {
    datos = [];
    res.status(200).json({ message: "Todos los años borrados" });
});

// PUT no permitido en /year
router.put("/year", (req, res) => {
    res.status(405).json({ error: "Método no permitido sobre la lista de años" });
});

// ============================================
// RECURSOS CONCRETOS (SIN PREFIJOS)
// ============================================

// GET /:country - Ver todos los registros de un país
router.get("/:country", (req, res) => {
    const countryParam = req.params.country;
    const { from, to } = req.query;

    let filtrados = datos.filter(d => 
        d.country && d.country.toLowerCase() === countryParam.toLowerCase()
    );

    if (from && to) {
        filtrados = filtrados.filter(d => d.year >= parseInt(from) && d.year <= parseInt(to));
    } else if (from) {
        filtrados = filtrados.filter(d => d.year >= parseInt(from));
    } else if (to) {
        filtrados = filtrados.filter(d => d.year <= parseInt(to));
    }

    if (filtrados.length === 0 && !from && !to) {
        res.status(404).json({ error: "País no encontrado" });
    } else {
        res.status(200).json(filtrados);
    }
});

// PUT /:country - Actualizar todos los registros de un país
router.put("/:country", (req, res) => {
    const countryParam = req.params.country;
    const nuevosDatos = req.body;

    if (nuevosDatos.country && nuevosDatos.country.toLowerCase() !== countryParam.toLowerCase()) {
        return res.status(400).json({ error: "El país en el body no coincide con la URL" });
    }

    let actualizados = 0;
    datos = datos.map(d => {
        if (d.country && d.country.toLowerCase() === countryParam.toLowerCase()) {
            actualizados++;
            return { ...d, ...nuevosDatos, country: d.country };
        }
        return d;
    });

    if (actualizados > 0) {
        res.status(200).json({ message: "Registros actualizados", count: actualizados });
    } else {
        res.status(404).json({ error: "País no encontrado" });
    }
});

// DELETE /:country - Borrar todos los registros de un país
router.delete("/:country", (req, res) => {
    const countryParam = req.params.country;
    const longitud = datos.length;

    datos = datos.filter(d => 
        !(d.country && d.country.toLowerCase() === countryParam.toLowerCase())
    );

    if (datos.length < longitud) {
        res.status(200).json({ message: "Registros eliminados", count: longitud - datos.length });
    } else {
        res.status(404).json({ error: "País no encontrado" });
    }
});

// POST no permitido en /:country
router.post("/:country", (req, res) => {
    res.status(405).json({ error: "Método no permitido sobre un recurso concreto" });
});

// ============================================
// RECURSO EXACTO (país/año)
// ============================================

// GET /:country/:year - Recurso exacto
router.get("/:country/:year", (req, res) => {
    const countryParam = req.params.country;
    const yearParam = parseInt(req.params.year);

    const recurso = datos.find(d => 
        d.country && d.country.toLowerCase() === countryParam.toLowerCase() && 
        d.year == yearParam
    );

    if (recurso) {
        res.status(200).json(recurso);
    } else {
        res.status(404).json({ error: "Registro no encontrado" });
    }
});

// POST no permitido en /:country/:year
router.post("/:country/:year", (req, res) => {
    res.status(405).json({ error: "Método no permitido: Use POST /country para crear" });
});

// PUT /:country/:year - Actualizar registro exacto
router.put("/:country/:year", (req, res) => {
    const countryParam = req.params.country;
    const yearParam = parseInt(req.params.year);
    const nuevosDatos = req.body;

    if (nuevosDatos.country && nuevosDatos.country.toLowerCase() !== countryParam.toLowerCase()) {
        return res.status(400).json({ error: "El país en el body no coincide con la URL" });
    }
    if (nuevosDatos.year && nuevosDatos.year != yearParam) {
        return res.status(400).json({ error: "El año en el body no coincide con la URL" });
    }

    const index = datos.findIndex(d => 
        d.country && d.country.toLowerCase() === countryParam.toLowerCase() && 
        d.year == yearParam
    );

    if (index !== -1) {
        datos[index] = { ...nuevosDatos, country: datos[index].country, year: datos[index].year };
        res.status(200).json(datos[index]);
    } else {
        res.status(404).json({ error: "Registro no encontrado" });
    }
});

// DELETE /:country/:year - Borrar registro exacto
router.delete("/:country/:year", (req, res) => {
    const countryParam = req.params.country;
    const yearParam = parseInt(req.params.year);
    const index = datos.findIndex(d => 
        d.country && d.country.toLowerCase() === countryParam.toLowerCase() && 
        d.year == yearParam
    );

    if (index !== -1) {
        const eliminado = datos.splice(index, 1)[0];
        res.status(200).json({ message: "Registro eliminado", data: eliminado });
    } else {
        res.status(404).json({ error: "Registro no encontrado" });
    }
});

module.exports = router;