const express = require("express");
const router = express.Router();
const { readFileSync } = require('fs');
const { parse } = require('csv-parse/sync');
const path = require('path');

let datos = [];

// Cargar datos iniciales del CSV
let csvContent = [];
try {
    const fileContent = readFileSync(path.join(__dirname, '..', 'data', 'athlete_events.csv'), 'utf-8');
    csvContent = parse(fileContent, {
        columns: true,
        cast: (value, context) => {
            if (context.column == 'id') return Number(value);
            if (context.column == 'age') return value === 'NA' ? null : Number(value);
            if (context.column == 'height') return value === 'NA' ? null : Number(value);
            if (context.column == 'weight') return value === 'NA' ? null : Number(value);
            if (context.column == 'year') return Number(value);
            return value;
        }
    });
    console.log(`✅ CSV cargado: ${csvContent.length} atletas totales`);
} catch (err) {
    console.error("❌ Error leyendo CSV:", err.message);
}

// CARGA INICIAL
router.get("/loadInitialData", (req, res) => {
    if (datos.length === 0) {
        datos = csvContent.slice(0, 15);
        console.log(`✅ Datos iniciales cargados: ${datos.length} registros`);
    }
    res.status(200).json(datos);
});

// COLECCIÓN PRINCIPAL 
router.get("/", (req, res) => {
    const { name, team, country, year, from, to, sport, season, city, id } = req.query;
    let filtrados = [...datos];
    if (name) {
        filtrados = filtrados.filter(d => d.name && d.name.toLowerCase().includes(name.toLowerCase()));
    }
    if (team || country) {
        const teamFilter = team || country;
        filtrados = filtrados.filter(d => d.team && d.team.toLowerCase() === teamFilter.toLowerCase());
    }
    if (year) {
        filtrados = filtrados.filter(d => d.year === parseInt(year));
    }
    if (sport) {
        filtrados = filtrados.filter(d => d.sport && d.sport.toLowerCase().includes(sport.toLowerCase()));
    }
    if (season) {
        filtrados = filtrados.filter(d => d.season && d.season.toLowerCase() === season.toLowerCase());
    }
    if (city) {
        filtrados = filtrados.filter(d => d.city && d.city.toLowerCase().includes(city.toLowerCase()));
    }
    if (id) {
        filtrados = filtrados.filter(d => d.id == id);
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

// POST - Crear nuevo atleta
router.post("/", (req, res) => {
    const newData = req.body;
    if (!newData.name || !newData.year) {
        return res.status(400).json({ message: "Bad Request: Missing name or year" });
    }
    const existe = datos.find(d => 
        d.name === newData.name && 
        d.year === newData.year && 
        d.event === newData.event
    );
    if (existe) {
        res.status(409).json({ message: "Resource already exists" });
    } else {
        datos.push(newData);
        res.status(201).json(newData);
    }
});

router.put("/", (req, res) => {
    res.status(405).json({ message: "Method Not Allowed: Cannot update the entire list" });
});


// DELETE - Borrar todos
router.delete("/", (req, res) => {
    datos = [];
    res.status(200).json({ message: "All data deleted successfully" });
});

// LISTAS 
router.get("/team", (req, res) => {
    const equipos = [...new Set(datos.map(d => d.team).filter(Boolean))];
    res.status(200).json(equipos.sort());
});

router.get("/sport", (req, res) => {
    const deportes = [...new Set(datos.map(d => d.sport).filter(Boolean))];
    res.status(200).json(deportes.sort());
});

router.get("/city", (req, res) => {
    const ciudades = [...new Set(datos.map(d => d.city).filter(Boolean))];
    res.status(200).json(ciudades.sort());
});

router.get("/year", (req, res) => {
    const años = [...new Set(datos.map(d => d.year).filter(a => a))];
    res.status(200).json(años.sort((a,b) => a - b));
});

router.get("/season", (req, res) => {
    const temporadas = [...new Set(datos.map(d => d.season).filter(Boolean))];
    res.status(200).json(temporadas.sort());
});

// BÚSQUEDA POR NOMBRE 
router.get("/:name", (req, res) => {
    const name = req.params.name;
    const { from, to } = req.query;
    
    let filtrados = datos.filter(d => d.name && d.name.toLowerCase().includes(name.toLowerCase()));

    if (from && to) {
        filtrados = filtrados.filter(d => d.year >= parseInt(from) && d.year <= parseInt(to));
    } else if (from) {
        filtrados = filtrados.filter(d => d.year >= parseInt(from));
    } else if (to) {
        filtrados = filtrados.filter(d => d.year <= parseInt(to));
    }

    if (filtrados.length === 0 && !from && !to) {
        res.status(404).json({ message: "Atleta no encontrado" });
    } else {
        res.status(200).json(filtrados);
    }
});


// RECURSO EXACTO
router.get("/:name/:year", (req, res) => {
    const name = req.params.name;
    const year = parseInt(req.params.year);
    
    const recurso = datos.find(d => d.name === name && d.year === year);
    
    if (recurso) {
        res.status(200).json(recurso);
    } else {
        res.status(404).json({ message: "Resource not found" });
    }
});
router.post("/:name/:year", (req, res) => {
    res.status(405).json({ message: "Method Not Allowed: Cannot create a specific resource like this. Use POST / instead." });
});
router.put("/:name/:year", (req, res) => {
    const name = req.params.name;
    const year = parseInt(req.params.year);
    const body = req.body;

    if (name !== body.name || year !== parseInt(body.year)) {
        return res.status(400).json({ message: "Bad Request: IDs in URL and body do not match" });
    }

    const index = datos.findIndex(d => d.name === name && d.year === year);
    
    if (index !== -1) {
        datos[index] = body;
        res.status(200).json(datos[index]);
    } else {
        res.status(404).json({ message: "Resource not found" });
    }
});

// DELETE
router.delete("/:name/:year", (req, res) => {
    const name = req.params.name;
    const year = parseInt(req.params.year);
    const index = datos.findIndex(d => d.name === name && d.year === year);
    
    if (index !== -1) {
        datos.splice(index, 1);
        res.status(200).json({ message: "Resource deleted successfully" });
    } else {
        res.status(404).json({ message: "Resource not found" });
    }
});

module.exports = router;