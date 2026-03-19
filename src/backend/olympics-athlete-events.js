import express from 'express';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';
import Datastore from 'nedb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURACIÓN COMPARTIDA
// ============================================

const db = new Datastore({
    filename: path.join(__dirname, '..', '..', 'data', 'athlete_events.db'),
    autoload: true
});

db.ensureIndex({ fieldName: 'name' });
db.ensureIndex({ fieldName: 'year' });
db.ensureIndex({ fieldName: 'team' });
db.ensureIndex({ fieldName: 'sport' });
db.ensureIndex({ fieldName: 'season' });

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
// VERSIÓN 1 - COMPLETAMENTE CONGELADA (NO TOCAR)
// ============================================
const routerV1 = express.Router();

// 📌 Documentación v1
routerV1.get("/docs", (req, res) => {
    res.redirect("https://documenter.getpostman.com/view/52768258/2sBXiesZR7");
});

// 📌 Carga inicial v1
routerV1.get("/loadInitialData", (req, res) => {
    db.count({}, (err, count) => {
        if (err) return res.status(500).json({ error: "Error al comprobar la base de datos" });
        
        if (count === 0) {
            const initialData = csvContent.slice(0, 15);
            db.insert(initialData, (err, newDocs) => {
                if (err) return res.status(500).json({ error: "Error al insertar datos iniciales" });
                console.log(`✅ Datos iniciales v1 cargados: ${newDocs.length} registros`);
                
                db.find({}).sort({ id: 1 }).exec((err, data) => {
                    if (err) return res.status(500).json({ error: "Error al recuperar datos" });
                    const resultado = data.map(({ _id, ...rest }) => rest);
                    res.status(200).json(resultado);
                });
            });
        } else {
            db.find({}).sort({ id: 1 }).limit(15).exec((err, data) => {
                if (err) return res.status(500).json({ error: "Error al recuperar datos" });
                const resultado = data.map(({ _id, ...rest }) => rest);
                res.status(200).json(resultado);
            });
        }
    });
});

// 📌 Colección principal v1
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

    db.count(query, (err, totalCount) => {
        if (err) return res.status(500).json({ error: "Error al contar resultados" });

        db.find(query)
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

// 📌 POST v1
routerV1.post("/", (req, res) => {
    const newData = req.body;
    if (!newData || !newData.name || !newData.year) {
        return res.status(400).json({ message: "Bad Request: Missing name or year" });
    }

    db.findOne({ name: newData.name, year: newData.year, event: newData.event }, (err, existe) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        if (existe) return res.status(409).json({ message: "Resource already exists" });

        db.insert(newData, (err, newDoc) => {
            if (err) return res.status(500).json({ error: "Error al insertar el dato" });
            const { _id, ...result } = newDoc;
            res.status(201).json(result);
        });
    });
});

// 📌 PUT no permitido en colección v1
routerV1.put("/", (req, res) => {
    res.status(405).json({ message: "Method Not Allowed: Cannot update the entire list" });
});

// 📌 DELETE todos v1
routerV1.delete("/", (req, res) => {
    db.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) return res.status(500).json({ error: "Error al borrar los datos" });
        res.status(200).json({ message: "All data deleted successfully", count: numRemoved });
    });
});

// 📌 LISTAS v1
routerV1.get("/team", (req, res) => {
    db.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const equipos = [...new Set(data.map(d => d.team).filter(Boolean))];
        res.status(200).json(equipos.sort());
    });
});

routerV1.get("/sport", (req, res) => {
    db.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const deportes = [...new Set(data.map(d => d.sport).filter(Boolean))];
        res.status(200).json(deportes.sort());
    });
});

routerV1.get("/city", (req, res) => {
    db.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const ciudades = [...new Set(data.map(d => d.city).filter(Boolean))];
        res.status(200).json(ciudades.sort());
    });
});

routerV1.get("/year", (req, res) => {
    db.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const años = [...new Set(data.map(d => d.year).filter(a => a))];
        res.status(200).json(años.sort((a, b) => a - b));
    });
});

routerV1.get("/season", (req, res) => {
    db.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const temporadas = [...new Set(data.map(d => d.season).filter(Boolean))];
        res.status(200).json(temporadas.sort());
    });
});

// 📌 Búsqueda por nombre v1
routerV1.get("/:name", (req, res) => {
    const name = req.params.name;
    const { from, to } = req.query;
    
    let query = { name: { $regex: new RegExp(name, 'i') } };
    if (from || to) {
        query.year = {};
        if (from) query.year.$gte = parseInt(from);
        if (to) query.year.$lte = parseInt(to);
    }

    db.find(query).sort({ id: 1 }).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        if (data.length === 0 && !from && !to) {
            return res.status(404).json({ message: "Atleta no encontrado" });
        }
        const resultado = data.map(({ _id, ...rest }) => rest);
        res.status(200).json(resultado);
    });
});

// 📌 Recurso exacto v1
routerV1.get("/:name/:year", (req, res) => {
    const name = req.params.name;
    const year = parseInt(req.params.year);
    db.findOne({ name: name, year: year }, (err, recurso) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        if (!recurso) return res.status(404).json({ message: "Resource not found" });
        const { _id, ...result } = recurso;
        res.status(200).json(result);
    });
});

routerV1.post("/:name/:year", (req, res) => {
    res.status(405).json({ message: "Method Not Allowed" });
});

routerV1.put("/:name/:year", (req, res) => {
    const name = req.params.name;
    const year = parseInt(req.params.year);
    const body = req.body;

    if (!body) return res.status(400).json({ message: "Bad Request: No data provided" });
    if ((body.name && body.name !== name) || (body.year && parseInt(body.year) !== year)) {
        return res.status(400).json({ message: "Bad Request: IDs in URL and body do not match" });
    }

    db.update({ name: name, year: year }, { $set: body }, { returnUpdatedDocs: true }, (err, numReplaced, affectedDoc) => {
        if (err) return res.status(500).json({ error: "Error al actualizar" });
        if (numReplaced === 0) return res.status(404).json({ message: "Resource not found" });
        const { _id, ...result } = affectedDoc;
        res.status(200).json(result);
    });
});

routerV1.delete("/:name/:year", (req, res) => {
    const name = req.params.name;
    const year = parseInt(req.params.year);
    db.remove({ name: name, year: year }, {}, (err, numRemoved) => {
        if (err) return res.status(500).json({ error: "Error al eliminar" });
        if (numRemoved === 0) return res.status(404).json({ message: "Resource not found" });
        res.status(200).json({ message: "Resource deleted successfully" });
    });
});

// ============================================
// VERSIÓN 2 - AQUÍ PUEDES HACER TODOS LOS CAMBIOS QUE QUIERAS
// ============================================
const routerV2 = express.Router();

// 📌 Documentación v2 (CAMBIA ESTA URL)
routerV2.get("/docs", (req, res) => {
    res.redirect("https://documenter.getpostman.com/view/52768258/2sBXihqYD4");
});


routerV2.get("/loadInitialData", (req, res) => {
    db.count({}, (err, count) => {
        if (err) return res.status(500).json({ error: "Error al comprobar la base de datos" });
        
        if (count === 0) {
            const initialData = csvContent.slice(0, 15);
            db.insert(initialData, (err, newDocs) => {
                if (err) return res.status(500).json({ error: "Error al insertar datos iniciales" });
                console.log(`✅ Datos iniciales v2 cargados: ${newDocs.length} registros`);
                
                db.find({}).sort({ id: 1 }).exec((err, data) => {
                    if (err) return res.status(500).json({ error: "Error al recuperar datos" });
                    const resultado = data.map(({ _id, ...rest }) => rest);
                    res.status(200).json(resultado);
                });
            });
        } else {
            db.find({}).sort({ id: 1 }).limit(15).exec((err, data) => {
                if (err) return res.status(500).json({ error: "Error al recuperar datos" });
                const resultado = data.map(({ _id, ...rest }) => rest);
                res.status(200).json(resultado);
            });
        }
    });
});

// 📌 Colección principal v2
routerV2.get("/", (req, res) => {
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

    db.count(query, (err, totalCount) => {
        if (err) return res.status(500).json({ error: "Error al contar resultados" });

        db.find(query)
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

// 📌 POST v2
routerV2.post("/", (req, res) => {
    const newData = req.body;
    if (!newData || !newData.name || !newData.year) {
        return res.status(400).json({ message: "Bad Request: Missing name or year" });
    }

    db.findOne({ name: newData.name, year: newData.year, event: newData.event }, (err, existe) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        if (existe) return res.status(409).json({ message: "Resource already exists" });

        db.insert(newData, (err, newDoc) => {
            if (err) return res.status(500).json({ error: "Error al insertar el dato" });
            const { _id, ...result } = newDoc;
            res.status(201).json(result);
        });
    });
});

// 📌 PUT no permitido en colección v2
routerV2.put("/", (req, res) => {
    res.status(405).json({ message: "Method Not Allowed: Cannot update the entire list" });
});

// 📌 DELETE todos v2
routerV2.delete("/", (req, res) => {
    db.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) return res.status(500).json({ error: "Error al borrar los datos" });
        res.status(200).json({ message: "All data deleted successfully", count: numRemoved });
    });
});

// 📌 LISTAS v2 (puedes modificarlas)
routerV2.get("/team", (req, res) => {
    db.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const equipos = [...new Set(data.map(d => d.team).filter(Boolean))];
        res.status(200).json(equipos.sort());
    });
});

routerV2.get("/sport", (req, res) => {
    db.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const deportes = [...new Set(data.map(d => d.sport).filter(Boolean))];
        res.status(200).json(deportes.sort());
    });
});

routerV2.get("/city", (req, res) => {
    db.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const ciudades = [...new Set(data.map(d => d.city).filter(Boolean))];
        res.status(200).json(ciudades.sort());
    });
});

routerV2.get("/year", (req, res) => {
    db.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const años = [...new Set(data.map(d => d.year).filter(a => a))];
        res.status(200).json(años.sort((a, b) => a - b));
    });
});

routerV2.get("/season", (req, res) => {
    db.find({}).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        const temporadas = [...new Set(data.map(d => d.season).filter(Boolean))];
        res.status(200).json(temporadas.sort());
    });
});

// 📌 Búsqueda por nombre v2
routerV2.get("/:name", (req, res) => {
    const name = req.params.name;
    const { from, to } = req.query;
    
    let query = { name: { $regex: new RegExp(name, 'i') } };
    if (from || to) {
        query.year = {};
        if (from) query.year.$gte = parseInt(from);
        if (to) query.year.$lte = parseInt(to);
    }

    db.find(query).sort({ id: 1 }).exec((err, data) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        if (data.length === 0 && !from && !to) {
            return res.status(404).json({ message: "Atleta no encontrado" });
        }
        const resultado = data.map(({ _id, ...rest }) => rest);
        res.status(200).json(resultado);
    });
});

// 📌 Recurso exacto v2
routerV2.get("/:name/:year", (req, res) => {
    const name = req.params.name;
    const year = parseInt(req.params.year);
    db.findOne({ name: name, year: year }, (err, recurso) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        if (!recurso) return res.status(404).json({ message: "Resource not found" });
        const { _id, ...result } = recurso;
        res.status(200).json(result);
    });
});

routerV2.post("/:name/:year", (req, res) => {
    res.status(405).json({ message: "Method Not Allowed" });
});

routerV2.put("/:name/:year", (req, res) => {
    const name = req.params.name;
    const year = parseInt(req.params.year);
    const body = req.body;

    if (!body) return res.status(400).json({ message: "Bad Request: No data provided" });
    if ((body.name && body.name !== name) || (body.year && parseInt(body.year) !== year)) {
        return res.status(400).json({ message: "Bad Request: IDs in URL and body do not match" });
    }

    db.update({ name: name, year: year }, { $set: body }, { returnUpdatedDocs: true }, (err, numReplaced, affectedDoc) => {
        if (err) return res.status(500).json({ error: "Error al actualizar" });
        if (numReplaced === 0) return res.status(404).json({ message: "Resource not found" });
        const { _id, ...result } = affectedDoc;
        res.status(200).json(result);
    });
});

routerV2.delete("/:name/:year", (req, res) => {
    const name = req.params.name;
    const year = parseInt(req.params.year);
    db.remove({ name: name, year: year }, {}, (err, numRemoved) => {
        if (err) return res.status(500).json({ error: "Error al eliminar" });
        if (numRemoved === 0) return res.status(404).json({ message: "Resource not found" });
        res.status(200).json({ message: "Resource deleted successfully" });
    });
});

// ============================================
// EXPORTAMOS - SOLO LA VERSIÓN 2 PUEDE CAMBIARSE
// ============================================
export default function loadBackendGGG(app) {
    app.use('/api/v1/olympics-athlete-events', routerV1);
    app.use('/api/v2/olympics-athlete-events', routerV2);
}