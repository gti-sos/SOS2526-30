// IMPORT PARA USAR REQUIRE
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// FUNCIONES PARA LEER Y PARSEAR EL CSV
const { readFileSync } = require('fs');
const { parse } = require('csv-parse/sync');

// IMPORTAMOS LAS FUNCIONES PARA LA BASE DE DATOS
import dataStore from "nedb";
import path from "path";

// LEEMOS EL CSV
const __dirname = path.resolve();
let fileContent = readFileSync(path.join(__dirname, 'data/athlete_events.csv'), 'utf-8');

// PARSEAMOS EL CONTENIDO DEL CSV
let csvContent = parse(fileContent, {
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

const BASE_API = "/api/v1";
const recurso = "/olympics-athlete-events";
const db = new dataStore();

// Cargamos todos los datos al iniciar
db.insert(csvContent, (err, newDocs) => {
    if (err) {
        console.error("Error al insertar los datos:", err);
    } else {
        console.log(`✅ ${newDocs.length} atletas cargados en la BD`);
    }
});

// Función auxiliar para crear rutas de listas (team, sport, city, year, season)
function crearRutasLista(nombre, campo) {
    const ruta = `${BASE_API}${recurso}/${nombre}`;
    
    // GET - Listar todos los valores únicos
    app.get(ruta, (req, res) => {
        db.find({}).exec((err, data) => {
            if (err) return res.status(500).send("Error al acceder a la BD");
            const valores = [...new Set(data.map(a => a[campo]).filter(Boolean))];
            res.status(200).json(valores.sort());
        });
    });

    // POST - Crear nuevo elemento (nuevo atleta)
    app.post(ruta, (req, res) => {
        let { name, year, event } = req.body;
        if (!req.body.name || !req.body.year) {
            return res.sendStatus(400);
        }

        db.findOne({ name: req.body.name, year: req.body.year, event: req.body.event }, (err, existente) => {
            if (err) return res.status(500).send("Error al acceder a la BD");
            if (existente) return res.sendStatus(409);

            db.insert(req.body, (err) => {
                if (err) return res.status(500).send("Error al insertar");
                res.sendStatus(201);
            });
        });
    });

    // DELETE - Borrar todos
    app.delete(ruta, (req, res) => {
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.status(500).send("Error al borrar");
            res.status(200).json({ message: `Todos los ${nombre} borrados` });
        });
    });

    // PUT - No permitido
    app.put(ruta, (req, res) => res.sendStatus(405));

    // GET /:valor - Ver elementos con ese valor
    app.get(`${ruta}/:valor`, (req, res) => {
        let valor = req.params.valor;
        let query = {};
        query[campo] = { $regex: new RegExp(`^${valor}$`, 'i') };

        db.find(query, (err, data) => {
            if (err) return res.status(500).send("Error al acceder a la BD");
            if (data.length === 0) return res.status(404).json({ error: `${nombre} no encontrado` });
            const nuevo = data.map(({_id, ...rest}) => rest);
            res.status(200).json(nuevo);
        });
    });

    // PUT /:valor - Actualizar elementos con ese valor
    app.put(`${ruta}/:valor`, (req, res) => {
        let valor = req.params.valor;
        if (req.body[campo] && req.body[campo].toLowerCase() !== valor.toLowerCase()) {
            return res.sendStatus(400);
        }

        let query = {};
        query[campo] = { $regex: new RegExp(`^${valor}$`, 'i') };

        db.update(query, { $set: req.body }, { multi: true }, (err, numUpdated) => {
            if (err) return res.status(500).send("Error al actualizar");
            if (numUpdated === 0) return res.status(404).json({ error: `${nombre} no encontrado` });
            res.sendStatus(200);
        });
    });

    // DELETE /:valor - Borrar elementos con ese valor
    app.delete(`${ruta}/:valor`, (req, res) => {
        let valor = req.params.valor;
        let query = {};
        query[campo] = { $regex: new RegExp(`^${valor}$`, 'i') };

        db.remove(query, { multi: true }, (err, numRemoved) => {
            if (err) return res.status(500).send("Error al eliminar");
            if (numRemoved === 0) return res.status(404).json({ error: `${nombre} no encontrado` });
            res.sendStatus(200);
        });
    });

    // POST no permitido en /:valor
    app.post(`${ruta}/:valor`, (req, res) => res.sendStatus(405));
}

function loadBackendGGG(app) {
    // ============================================
    // DOCUMENTACIÓN
    // ============================================
    app.get(BASE_API + recurso + "/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/42360434/2sB2cUC3wh");
    });

    // ============================================
    // CARGA INICIAL
    // ============================================
    app.get(BASE_API + recurso + "/loadInitialData", (req, res) => {
        db.count({}, (err, count) => {
            if (err) return res.status(500).send("Error al comprobar la BD");
            
            if (count === 0) {
                let initialData = csvContent.slice(0, 15);
                db.insert(initialData, (err) => {
                    if (err) return res.status(500).send("Error al insertar datos");
                });
            }
            
            db.find({}).limit(15).exec((err, data) => {
                if (err) return res.status(500).send("Error al recuperar datos");
                const nuevo = data.map(({_id, ...rest}) => rest);
                res.status(count === 0 ? 201 : 200).json(nuevo);
            });
        });
    });

    // ============================================
    // COLECCIÓN PRINCIPAL
    // ============================================
    app.get(BASE_API + recurso, (req, res) => {
        let { id, country, team, name, year, from, to, sport, season, city, limit, offset } = req.query;
        let query = {};

        if (id) query.id = Number(id);
        if (country || team) query.team = country || team;
        if (name) query.name = name;
        if (year) query.year = Number(year);
        if (sport) query.sport = sport;
        if (season) query.season = season;
        if (city) query.city = city;
        
        if (from || to) {
            query.year = {};
            if (from) query.year.$gte = Number(from);
            if (to) query.year.$lte = Number(to);
        }

        let d = db.find(query);
        if (offset !== undefined) d = d.skip(Number(offset));
        if (limit !== undefined) d = d.limit(Number(limit));

        d.exec((err, data) => {
            if (err) return res.status(500).send("Error al acceder a la BD");
            const nuevo = data.map(({_id, ...rest}) => rest);
            res.json(nuevo);
        });
    });

    // POST - Crear nuevo atleta
    app.post(BASE_API + recurso, (req, res) => {
        let { name, year, event } = req.body;
        if (!name || !year) return res.sendStatus(400);

        db.findOne({ name, year, event }, (err, existente) => {
            if (err) return res.status(500).send("Error al acceder a la BD");
            if (existente) return res.sendStatus(409);

            db.insert(req.body, (err) => {
                if (err) return res.status(500).send("Error al insertar");
                res.sendStatus(201);
            });
        });
    });

    // PUT no permitido en colección
    app.put(BASE_API + recurso, (req, res) => res.sendStatus(405));

    // DELETE - Borrar todos
    app.delete(BASE_API + recurso, (req, res) => {
        db.remove({}, { multi: true }, (err) => {
            if (err) return res.status(500).send("Error al borrar");
            res.sendStatus(200);
        });
    });

    // ============================================
    // CREAR TODAS LAS LISTAS (5 recursos en 5 líneas)
    // ============================================
    crearRutasLista("team", "team");
    crearRutasLista("sport", "sport");
    crearRutasLista("city", "city");
    crearRutasLista("year", "year");
    crearRutasLista("season", "season");

    // ============================================
    // RECURSOS POR NOMBRE/AÑO
    // ============================================
    const rutaNombreAnio = `${BASE_API}${recurso}/name/:name/year/:year`;
    
    app.get(rutaNombreAnio, (req, res) => {
        db.findOne({ name: req.params.name, year: Number(req.params.year) }, (err, data) => {
            if (err) return res.status(500).send("Error al acceder a la BD");
            if (!data) return res.status(404).json({ error: "Atleta no encontrado" });
            let { _id, ...sinId } = data;
            res.status(200).json(sinId);
        });
    });

    app.put(rutaNombreAnio, (req, res) => {
        if (req.body.name && req.body.name !== req.params.name) return res.sendStatus(400);
        if (req.body.year && req.body.year !== Number(req.params.year)) return res.sendStatus(400);

        db.update({ name: req.params.name, year: Number(req.params.year) }, req.body, {}, (err, numReplaced) => {
            if (err) return res.status(500).send("Error al actualizar");
            if (numReplaced === 0) return res.status(404).json({ error: "Atleta no encontrado" });
            res.sendStatus(200);
        });
    });

    app.delete(rutaNombreAnio, (req, res) => {
        db.remove({ name: req.params.name, year: Number(req.params.year) }, {}, (err, numRemoved) => {
            if (err) return res.status(500).send("Error al eliminar");
            if (numRemoved === 0) return res.status(404).json({ error: "Atleta no encontrado" });
            res.sendStatus(200);
        });
    });

    app.post(rutaNombreAnio, (req, res) => res.sendStatus(405));

    // GET /name/:name - Buscar por nombre
    app.get(`${BASE_API}${recurso}/name/:name`, (req, res) => {
        let query = { name: req.params.name };
        if (req.query.from || req.query.to) {
            query.year = {};
            if (req.query.from) query.year.$gte = Number(req.query.from);
            if (req.query.to) query.year.$lte = Number(req.query.to);
        }

        db.find(query, (err, data) => {
            if (err) return res.status(500).send("Error al acceder a la BD");
            if (data.length === 0) return res.status(404).json({ error: `No hay atletas con nombre: ${req.params.name}` });
            const nuevo = data.map(({_id, ...rest}) => rest);
            res.status(200).json(nuevo);
        });
    });

    // ============================================
    // RECURSOS POR ID
    // ============================================
    const rutaId = `${BASE_API}${recurso}/id/:id`;
    
    app.get(rutaId, (req, res) => {
        db.find({ id: Number(req.params.id) }, (err, data) => {
            if (err) return res.status(500).send("Error al acceder a la BD");
            if (data.length === 0) return res.status(404).json({ error: `No hay atletas con ID: ${req.params.id}` });
            const nuevo = data.map(({_id, ...rest}) => rest);
            res.status(200).json(nuevo);
        });
    });

    app.put(rutaId, (req, res) => {
        if (req.body.id && req.body.id !== Number(req.params.id)) return res.sendStatus(400);

        db.update({ id: Number(req.params.id) }, { $set: req.body }, { multi: true }, (err, numUpdated) => {
            if (err) return res.status(500).send("Error al actualizar");
            if (numUpdated === 0) return res.status(404).json({ error: "ID no encontrado" });
            res.sendStatus(200);
        });
    });

    app.delete(rutaId, (req, res) => {
        db.remove({ id: Number(req.params.id) }, { multi: true }, (err, numRemoved) => {
            if (err) return res.status(500).send("Error al eliminar");
            if (numRemoved === 0) return res.status(404).json({ error: "ID no encontrado" });
            res.sendStatus(200);
        });
    });

    app.post(rutaId, (req, res) => res.sendStatus(405));
}

// EXPORTAMOS
export { loadBackendGGG, csvContent };