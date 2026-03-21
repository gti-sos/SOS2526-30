import express from 'express';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';
import Datastore from 'nedb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURACIÓN COMPARTIDA (CSV)
// ============================================

let csvContent = [];
try {
    const fileContent = readFileSync(path.join(__dirname, '..', '..', 'data', 'athlete_events.csv'), 'utf-8');
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
} catch (err) {
    console.error("Error leyendo CSV:", err.message);
}

// ============================================
// VERSIÓN 1 - BASE DE DATOS PROPIA (INMUTABLE)
// ============================================
const dbV1 = new Datastore({
    filename: path.join(__dirname, '..', '..', 'data', 'athlete_events-v1.db'),
    autoload: true
});

dbV1.ensureIndex({ fieldName: 'name' });
dbV1.ensureIndex({ fieldName: 'year' });
dbV1.ensureIndex({ fieldName: 'team' });

const routerV1 = express.Router();

// Documentación v1
routerV1.get("/docs", (req, res) => {
    res.redirect("https://documenter.getpostman.com/view/52768258/2sBXiesZR7");
});

// Carga inicial v1 (solo si está vacía)
routerV1.get("/loadInitialData", (req, res) => {
    dbV1.count({}, (err, count) => {
        if (err) return res.status(500).json({ error: "Error al comprobar la base de datos" });
        
        if (count === 0) {
            const initialData = csvContent.slice(0, 15);
            dbV1.insert(initialData, (err, newDocs) => {
                if (err) return res.status(500).json({ error: "Error al insertar datos iniciales" });
                console.log(`Datos iniciales v1 cargados: ${newDocs.length} registros`);
                
                dbV1.find({}).sort({ id: 1 }).exec((err, data) => {
                    if (err) return res.status(500).json({ error: "Error al recuperar datos" });
                    const resultado = data.map(({ _id, ...rest }) => rest);
                    res.status(200).json(resultado);
                });
            });
        } else {
            dbV1.find({}).sort({ id: 1 }).limit(15).exec((err, data) => {
                if (err) return res.status(500).json({ error: "Error al recuperar datos" });
                const resultado = data.map(({ _id, ...rest }) => rest);
                res.status(200).json(resultado);
            });
        }
    });
});

// Colección principal v1 (SOLO LECTURA)
routerV1.get("/", (req, res) => {
    const { name, team, country, year, from, to, sport, season, city, id, page = 1, limit = 20 } = req.query;
    let query = {};
    
    if (name) query.name = { $regex: new RegExp(name, 'i') };
    if (team || country) {
        const teamFilter = (team || country);
        query.team = { $regex: new RegExp(`^${teamFilter}$`, 'i') };
    }
    if (year) query.year = parseInt(year);
    if (sport) query.sport = { $regex: new RegExp(sport, 'i') };
    if (season) query.season = { $regex: new RegExp(`^${season}$`, 'i') };
    if (city) query.city = { $regex: new RegExp(city, 'i') };
    if (id) query.id = parseInt(id);
    
    if (from || to) {
        query.year = {};
        if (from) query.year.$gte = parseInt(from);
        if (to) query.year.$lte = parseInt(to);
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 20);
    const skipNum = (pageNum - 1) * limitNum;

    dbV1.count(query, (err, totalCount) => {
        if (err) return res.status(500).json({ error: "Error al contar resultados" });

        dbV1.find(query)
            .sort({ id: 1 })
            .skip(skipNum)
            .limit(limitNum)
            .exec((err, data) => {
                if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
                
                const resultado = data.map(({ _id, ...rest }) => rest);
                
                res.status(200).json({
                    data: resultado,
                    pagination: {
                        total: totalCount,
                        page: pageNum,
                        limit: limitNum,
                        totalPages: Math.ceil(totalCount / limitNum),
                        nextPage: skipNum + limitNum < totalCount ? pageNum + 1 : null,
                        prevPage: pageNum > 1 ? pageNum - 1 : null
                    }
                });
            });
    });
});

// Deshabilitar POST en v1 (inmutable)
routerV1.post("/", (req, res) => {
    res.status(405).json({ message: "La versión 1 es solo lectura. No se pueden crear nuevos atletas." });
});

// Deshabilitar PUT en v1 (inmutable)
routerV1.put("/", (req, res) => {
    res.status(405).json({ message: "La versión 1 es solo lectura. No se puede modificar la lista." });
});

// Deshabilitar DELETE en v1 (inmutable)
routerV1.delete("/", (req, res) => {
    res.status(405).json({ message: "La versión 1 es solo lectura. No se pueden borrar todos los atletas." });
});

// LISTAS v1 (solo lectura)
routerV1.get("/team", (req, res) => {
    dbV1.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const equipos = [...new Set(data.map(d => d.team).filter(Boolean))];
        res.status(200).json(equipos.sort());
    });
});

routerV1.get("/sport", (req, res) => {
    dbV1.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const deportes = [...new Set(data.map(d => d.sport).filter(Boolean))];
        res.status(200).json(deportes.sort());
    });
});

routerV1.get("/city", (req, res) => {
    dbV1.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const ciudades = [...new Set(data.map(d => d.city).filter(Boolean))];
        res.status(200).json(ciudades.sort());
    });
});

routerV1.get("/year", (req, res) => {
    dbV1.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const años = [...new Set(data.map(d => d.year).filter(a => a))];
        res.status(200).json(años.sort((a, b) => a - b));
    });
});

routerV1.get("/season", (req, res) => {
    dbV1.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const temporadas = [...new Set(data.map(d => d.season).filter(Boolean))];
        res.status(200).json(temporadas.sort());
    });
});

// Búsqueda por nombre con rango de años (v1)
routerV1.get("/:name", (req, res) => {
    const name = req.params.name;
    const { from, to } = req.query;
    
    let query = { name: { $regex: new RegExp(name, 'i') } };
    
    if (from || to) {
        query.year = {};
        if (from) query.year.$gte = parseInt(from);
        if (to) query.year.$lte = parseInt(to);
    }

    dbV1.find(query)
        .sort({ year: 1 })
        .exec((err, data) => {
            if (err) {
                return res.status(500).json({ error: "Error al acceder a la base de datos" });
            }
            
            if (data.length === 0 && !from && !to) {
                return res.status(404).json({ message: `No existe ningún atleta con el nombre "${name}"` });
            }
            
            const resultado = data.map(({ _id, ...rest }) => rest);
            res.status(200).json(resultado);
        });
});

// Recurso exacto v1 (solo lectura)
routerV1.get("/:name/:year", (req, res) => {
    const name = req.params.name;
    const year = parseInt(req.params.year);
    dbV1.findOne({ name: name, year: year }, (err, recurso) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        if (!recurso) return res.status(404).json({ message: "Resource not found" });
        const { _id, ...result } = recurso;
        res.status(200).json(result);
    });
});

// Deshabilitar POST, PUT, DELETE en recursos concretos de v1
routerV1.post("/:name/:year", (req, res) => {
    res.status(405).json({ message: "La versión 1 es solo lectura. No se pueden crear atletas." });
});

routerV1.put("/:name/:year", (req, res) => {
    res.status(405).json({ message: "La versión 1 es solo lectura. No se puede modificar atletas." });
});

routerV1.delete("/:name/:year", (req, res) => {
    res.status(405).json({ message: "La versión 1 es solo lectura. No se puede eliminar atletas." });
});

// ============================================
// VERSIÓN 2 - BASE DE DATOS PROPIA (MODIFICABLE)
// ============================================
const dbV2 = new Datastore({
    filename: path.join(__dirname, '..', '..', 'data', 'athlete_events-v2.db'),
    autoload: true
});

dbV2.ensureIndex({ fieldName: 'name' });
dbV2.ensureIndex({ fieldName: 'year' });
dbV2.ensureIndex({ fieldName: 'team' });
dbV2.ensureIndex({ fieldName: 'age' });
dbV2.ensureIndex({ fieldName: 'height' });
dbV2.ensureIndex({ fieldName: 'weight' });

const routerV2 = express.Router();

// Documentación v2
routerV2.get("/docs", (req, res) => {
    res.redirect("https://documenter.getpostman.com/view/52768258/2sBXihqYD4");
});

// Carga inicial v2
routerV2.get("/loadInitialData", (req, res) => {
    dbV2.count({}, (err, count) => {
        if (err) return res.status(500).json({ error: "Error al comprobar la base de datos" });
        
        if (count === 0) {
            const initialData = csvContent.slice(0, 15);
            dbV2.insert(initialData, (err, newDocs) => {
                if (err) return res.status(500).json({ error: "Error al insertar datos iniciales" });
                console.log(`Datos iniciales v2 cargados: ${newDocs.length} registros`);
                
                dbV2.find({}).sort({ id: 1 }).exec((err, data) => {
                    if (err) return res.status(500).json({ error: "Error al recuperar datos" });
                    const resultado = data.map(({ _id, ...rest }) => rest);
                    res.status(200).json(resultado);
                });
            });
        } else {
            dbV2.find({}).sort({ id: 1 }).limit(15).exec((err, data) => {
                if (err) return res.status(500).json({ error: "Error al recuperar datos" });
                const resultado = data.map(({ _id, ...rest }) => rest);
                res.status(200).json(resultado);
            });
        }
    });
});

// Colección principal v2 CON OPERADORES NUMÉRICOS
routerV2.get("/", (req, res) => {
    const { 
        name, team, country, year, from, to, sport, season, city, id, page = 1, limit = 20,
        age_min, age_max, height_min, height_max, weight_min, weight_max
    } = req.query;
    
    let query = {};
    
    // Filtros de texto
    if (name) query.name = { $regex: new RegExp(name, 'i') };
    if (team || country) {
        const teamFilter = (team || country);
        query.team = { $regex: new RegExp(`^${teamFilter}$`, 'i') };
    }
    if (sport) query.sport = { $regex: new RegExp(sport, 'i') };
    if (season) query.season = { $regex: new RegExp(`^${season}$`, 'i') };
    if (city) query.city = { $regex: new RegExp(city, 'i') };
    if (id) query.id = parseInt(id);
    
    // Filtros de año
    if (year) query.year = parseInt(year);
    if (from || to) {
        query.year = {};
        if (from) query.year.$gte = parseInt(from);
        if (to) query.year.$lte = parseInt(to);
    }
    
    // Filtros numéricos
    if (age_min || age_max) {
        query.age = {};
        if (age_min) query.age.$gte = parseInt(age_min);
        if (age_max) query.age.$lte = parseInt(age_max);
    }
    
    if (height_min || height_max) {
        query.height = {};
        if (height_min) query.height.$gte = parseInt(height_min);
        if (height_max) query.height.$lte = parseInt(height_max);
    }
    
    if (weight_min || weight_max) {
        query.weight = {};
        if (weight_min) query.weight.$gte = parseFloat(weight_min);
        if (weight_max) query.weight.$lte = parseFloat(weight_max);
    }

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 20);
    const skipNum = (pageNum - 1) * limitNum;

    dbV2.count(query, (err, totalCount) => {
        if (err) return res.status(500).json({ error: "Error al contar resultados" });

        dbV2.find(query)
            .sort({ id: 1 })
            .skip(skipNum)
            .limit(limitNum)
            .exec((err, data) => {
                if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
                
                const resultado = data.map(({ _id, ...rest }) => rest);
                
                res.status(200).json({
                    data: resultado,
                    pagination: {
                        total: totalCount,
                        page: pageNum,
                        limit: limitNum,
                        totalPages: Math.ceil(totalCount / limitNum),
                        nextPage: skipNum + limitNum < totalCount ? pageNum + 1 : null,
                        prevPage: pageNum > 1 ? pageNum - 1 : null
                    }
                });
            });
    });
});

// POST v2 - SOLO CÓDIGO 201 (sin datos)
routerV2.post("/", (req, res) => {
    const newData = req.body;
    if (!newData || !newData.name || !newData.year) {
        return res.status(400).json({ message: "Bad Request: Missing name or year" });
    }

    dbV2.findOne({ name: newData.name, year: newData.year, event: newData.event }, (err, existe) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        if (existe) return res.status(409).json({ message: "Resource already exists" });

        dbV2.insert(newData, (err, newDoc) => {
            if (err) return res.status(500).json({ error: "Error al insertar el dato" });
            res.sendStatus(201);
        });
    });
});

// PUT no permitido en colección v2
routerV2.put("/", (req, res) => {
    res.status(405).json({ message: "Method Not Allowed: Cannot update the entire list" });
});

// DELETE todos v2
routerV2.delete("/", (req, res) => {
    dbV2.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) return res.status(500).json({ error: "Error al borrar los datos" });
        res.status(200).json({ message: "All data deleted successfully", count: numRemoved });
    });
});

// LISTAS v2
routerV2.get("/team", (req, res) => {
    dbV2.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const equipos = [...new Set(data.map(d => d.team).filter(Boolean))];
        res.status(200).json(equipos.sort());
    });
});

routerV2.get("/sport", (req, res) => {
    dbV2.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const deportes = [...new Set(data.map(d => d.sport).filter(Boolean))];
        res.status(200).json(deportes.sort());
    });
});

routerV2.get("/city", (req, res) => {
    dbV2.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const ciudades = [...new Set(data.map(d => d.city).filter(Boolean))];
        res.status(200).json(ciudades.sort());
    });
});

routerV2.get("/year", (req, res) => {
    dbV2.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const años = [...new Set(data.map(d => d.year).filter(a => a))];
        res.status(200).json(años.sort((a, b) => a - b));
    });
});

routerV2.get("/season", (req, res) => {
    dbV2.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const temporadas = [...new Set(data.map(d => d.season).filter(Boolean))];
        res.status(200).json(temporadas.sort());
    });
});

// Búsqueda por nombre CON OPERADORES NUMÉRICOS (v2)
routerV2.get("/:name", (req, res) => {
    const name = req.params.name;
    const { 
        from, to,
        age_min, age_max,
        height_min, height_max,
        weight_min, weight_max
    } = req.query;
    
    let query = { name: { $regex: new RegExp(name, 'i') } };
    
    if (from || to) {
        query.year = {};
        if (from) query.year.$gte = parseInt(from);
        if (to) query.year.$lte = parseInt(to);
    }
    
    if (age_min || age_max) {
        query.age = {};
        if (age_min) query.age.$gte = parseInt(age_min);
        if (age_max) query.age.$lte = parseInt(age_max);
    }
    
    if (height_min || height_max) {
        query.height = {};
        if (height_min) query.height.$gte = parseInt(height_min);
        if (height_max) query.height.$lte = parseInt(height_max);
    }
    
    if (weight_min || weight_max) {
        query.weight = {};
        if (weight_min) query.weight.$gte = parseFloat(weight_min);
        if (weight_max) query.weight.$lte = parseFloat(weight_max);
    }

    dbV2.find(query)
        .sort({ year: 1 })
        .exec((err, data) => {
            if (err) {
                return res.status(500).json({ error: "Error al acceder a la base de datos" });
            }
            
            if (data.length === 0 && !from && !to && !age_min && !age_max && !height_min && !height_max && !weight_min && !weight_max) {
                return res.status(404).json({ message: `No existe ningún atleta con el nombre "${name}"` });
            }
            
            const resultado = data.map(({ _id, ...rest }) => rest);
            res.status(200).json(resultado);
        });
});

// Recurso exacto v2
routerV2.get("/:name/:year", (req, res) => {
    const name = req.params.name;
    const year = parseInt(req.params.year);
    dbV2.findOne({ name: name, year: year }, (err, recurso) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        if (!recurso) return res.status(404).json({ message: "Resource not found" });
        const { _id, ...result } = recurso;
        res.status(200).json(result);
    });
});

routerV2.post("/:name/:year", (req, res) => {
    res.status(405).json({ message: "Method Not Allowed" });
});

// PUT en recurso exacto v2 - SOLO CÓDIGO 200 (sin datos)
routerV2.put("/:name/:year", (req, res) => {
    const name = req.params.name;
    const year = parseInt(req.params.year);
    const body = req.body;

    if (!body) return res.status(400).json({ message: "Bad Request: No data provided" });
    if ((body.name && body.name !== name) || (body.year && parseInt(body.year) !== year)) {
        return res.status(400).json({ message: "Bad Request: IDs in URL and body do not match" });
    }

    dbV2.update({ name: name, year: year }, { $set: body }, { returnUpdatedDocs: true }, (err, numReplaced, affectedDoc) => {
        if (err) return res.status(500).json({ error: "Error al actualizar" });
        if (numReplaced === 0) return res.status(404).json({ message: "Resource not found" });
        res.sendStatus(200);
    });
});

// DELETE en recurso exacto v2
routerV2.delete("/:name/:year", (req, res) => {
    const name = req.params.name;
    const year = parseInt(req.params.year);
    dbV2.remove({ name: name, year: year }, {}, (err, numRemoved) => {
        if (err) return res.status(500).json({ error: "Error al eliminar" });
        if (numRemoved === 0) return res.status(404).json({ message: "Resource not found" });
        res.status(200).json({ message: "Resource deleted successfully" });
    });
});

// ============================================
// EXPORTAMOS
// ============================================
export default function loadBackendGGG(app) {
    app.use('/api/v1/olympics-athlete-events', routerV1);
    app.use('/api/v2/olympics-athlete-events', routerV2);
}