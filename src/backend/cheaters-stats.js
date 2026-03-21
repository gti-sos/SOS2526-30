import express from 'express';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';
import Datastore from 'nedb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CONFIGURACIÓN BASES DE DATOS
// ============================================
// Base de datos v1
const dbV1 = new Datastore({
    filename: path.join(__dirname, '..', '..', 'data', 'cheaters.db'),
    autoload: true
});

// Base de datos v2 (separada para no interferir)
const dbV2 = new Datastore({
    filename: path.join(__dirname, '..', '..', 'data', 'cheaters-v2.db'),
    autoload: true
});

// Crear índices
dbV1.ensureIndex({ fieldName: 'country' });
dbV1.ensureIndex({ fieldName: 'year' });
dbV2.ensureIndex({ fieldName: 'country' });
dbV2.ensureIndex({ fieldName: 'year' });
dbV2.ensureIndex({ fieldName: 'game' }); // Nuevo campo en v2

// Cargar datos del CSV
const cheaters_csv = path.join(__dirname, '..', '..', 'data', 'video_game_cheaters_dataset_en.csv');

let csvContent = [];
try {
    const fileContent = readFileSync(cheaters_csv, 'utf-8');
    csvContent = parse(fileContent, {
        columns: true,
        cast: (value, context) => {
            if (context.column === 'year') return Number(value);
            if (context.column === 'cheater_report') return Number(value);
            if (context.column === 'confirmed_ban') return Number(value);
            if (context.column === 'estimated_cheater') return Number(value);
            if (context.column === 'suspended_account') return Number(value);
            if (context.column === 'repeat_offender') return Number(value);
            return value;
        }
    });
} catch (err) {
    console.error("Error leyendo CSV:", err.message);
}

// ============================================
// MIDDLEWARE COMÚN: Eliminar _id de respuestas
// ============================================
const removeIdMiddleware = (req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (item && item._id) delete item._id;
            });
        } else if (data && typeof data === 'object') {
            if (data._id) delete data._id;
            if (data.data && Array.isArray(data.data)) {
                data.data.forEach(item => {
                    if (item && item._id) delete item._id;
                });
            }
        }
        originalJson.call(this, data);
    };
    next();
};

function loadBackendFMGP(app) {
    // ============================================
    // API v1 - SOLO LECTURA (inmutable)
    // ============================================
    const routerV1 = express.Router();
    routerV1.use(removeIdMiddleware);

    // Documentación v1
    routerV1.get("/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52768258/2sBXigNZg8");
    });

    // ============================================
    // Carga inicial - SOLO LECTURA (no modifica datos, solo muestra)
    // ============================================
    routerV1.get("/loadInitialData", (req, res) => {
        dbV1.count({}, (err, count) => {
            if (err) return res.status(500).json({ error: "Error al comprobar la base de datos" });
            
            // SOLO LECTURA: devuelve los datos existentes o vacío si no hay
            dbV1.find({}).sort({ country: 1, year: 1 }).limit(15).exec((err, data) => {
                if (err) return res.status(500).json({ error: "Error al recuperar datos" });
                res.status(200).json(data);
            });
        });
    });

    // ============================================
    // GET - Colección con búsquedas y paginación (SOLO LECTURA)
    // ============================================
    routerV1.get("/", (req, res) => {
        const { country, year, from, to, page = 1, limit = 20 } = req.query;
        
        let query = {};
        
        if (country) query.country = { $regex: new RegExp(`^${country}$`, 'i') };
        if (year) query.year = parseInt(year);
        
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
                .sort({ country: 1, year: 1 })
                .skip(skipNum)
                .limit(limitNum)
                .exec((err, data) => {
                    if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
                    
                    res.status(200).json({
                        data: data,
                        pagination: {
                            total: totalCount,
                            page: pageNum,
                            limit: limitNum,
                            totalPages: Math.ceil(totalCount / limitNum)
                        }
                    });
                });
        });
    });

    // ============================================
    // OPERACIONES DE ESCRITURA EN v1 - NO PERMITIDAS (v1 es SOLO LECTURA)
    // ============================================
    
    // POST no permitido en v1 (colección)
    routerV1.post("/", (req, res) => {
        res.status(405).json({ 
            message: "Method Not Allowed: v1 is read-only. Use POST to /api/v2/cheaters-stats to create resources",
            hint: "This API version is immutable. Please use v2 for write operations."
        });
    });

    // POST no permitido en v1 (recurso por país)
    routerV1.post("/:country", (req, res) => {
        res.status(405).json({ 
            message: "Method Not Allowed: v1 is read-only. Use POST to /api/v2/cheaters-stats to create resources",
            hint: "This API version is immutable. Please use v2 for write operations."
        });
    });
    
    // POST no permitido en v1 (recurso exacto)
    routerV1.post("/:country/:year", (req, res) => {
        res.status(405).json({ 
            message: "Method Not Allowed: v1 is read-only. Use POST to /api/v2/cheaters-stats to create resources",
            hint: "This API version is immutable. Please use v2 for write operations."
        });
    });

    // PUT no permitido en v1 (colección)
    routerV1.put("/", (req, res) => {
        res.status(405).json({ 
            message: "Method Not Allowed: v1 is read-only. Use PUT to /api/v2/cheaters-stats/country/:country/year/:year/game/:game to update resources",
            hint: "This API version is immutable. Please use v2 for write operations."
        });
    });

    // PUT no permitido en v1 (recurso exacto)
    routerV1.put("/:country/:year", (req, res) => {
        res.status(405).json({ 
            message: "Method Not Allowed: v1 is read-only. Use PUT to /api/v2/cheaters-stats/country/:country/year/:year/game/:game to update resources",
            hint: "This API version is immutable. Please use v2 for write operations."
        });
    });

    // DELETE no permitido en v1 (colección)
    routerV1.delete("/", (req, res) => {
        res.status(405).json({ 
            message: "Method Not Allowed: v1 is read-only. Use DELETE with ?confirm=true to /api/v2/cheaters-stats to delete all resources",
            hint: "This API version is immutable. Please use v2 for write operations."
        });
    });

    // DELETE no permitido en v1 (recurso exacto)
    routerV1.delete("/:country/:year", (req, res) => {
        res.status(405).json({ 
            message: "Method Not Allowed: v1 is read-only. Use DELETE to /api/v2/cheaters-stats/country/:country/year/:year/game/:game to delete specific resources",
            hint: "This API version is immutable. Please use v2 for write operations."
        });
    });

    // ============================================
    // LISTAS - SOLO LECTURA (permitidas)
    // ============================================
    routerV1.get("/country", (req, res) => {
        dbV1.find({}).exec((err, data) => {
            if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
            const paises = [...new Set(data.map(d => d.country).filter(Boolean))];
            res.status(200).json(paises.sort());
        });
    });

    routerV1.get("/year", (req, res) => {
        dbV1.find({}).exec((err, data) => {
            if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
            const años = [...new Set(data.map(d => d.year).filter(a => a))];
            res.status(200).json(años.sort((a, b) => a - b));
        });
    });

    // ============================================
    // Búsqueda por país (SOLO LECTURA)
    // ============================================
    routerV1.get("/:country", (req, res) => {
        const countryParam = req.params.country;
        const { from, to, page = 1, limit = 20 } = req.query;
        
        let query = { country: { $regex: new RegExp(`^${countryParam}$`, 'i') } };
        
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
                .sort({ year: 1 })
                .skip(skipNum)
                .limit(limitNum)
                .exec((err, data) => {
                    if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
                    
                    if (data.length === 0 && !from && !to && page === 1) {
                        return res.status(404).json({ message: "Country not found" });
                    }
                    
                    res.status(200).json({
                        data: data,
                        pagination: {
                            total: totalCount,
                            page: pageNum,
                            limit: limitNum,
                            totalPages: Math.ceil(totalCount / limitNum)
                        }
                    });
                });
        });
    });

    // ============================================
    // Recurso exacto país/año (SOLO LECTURA)
    // ============================================
    routerV1.get("/:country/:year", (req, res) => {
        const countryParam = req.params.country;
        const yearParam = parseInt(req.params.year);

        dbV1.findOne({ 
            country: { $regex: new RegExp(`^${countryParam}$`, 'i') }, 
            year: yearParam 
        }, (err, recurso) => {
            if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
            if (!recurso) return res.status(404).json({ message: "Resource not found" });
            res.status(200).json(recurso);
        });
    });

    // ============================================
    // API v2 - COMPLETA (LECTURA Y ESCRITURA)
    // ============================================
    const routerV2 = express.Router();
    routerV2.use(removeIdMiddleware);

    // Documentación v2
    routerV2.get("/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52706289/2sBXihqYD5");
    });

    // Carga inicial v2 (solo si la BD está vacía)
    routerV2.get("/loadInitialData", (req, res) => {
        dbV2.count({}, (err, count) => {
            if (err) return res.status(500).json({ error: "Error al comprobar la base de datos" });
            
            if (count === 0) {
                const initialData = csvContent.slice(0, 15);
                dbV2.insert(initialData, (err, newDocs) => {
                    if (err) return res.status(500).json({ error: "Error al insertar datos iniciales" });
                    console.log(`✅ Datos iniciales de cheaters-stats v2 cargados: ${newDocs.length} registros`);
                    
                    dbV2.find({}).sort({ country: 1, year: 1 }).exec((err, data) => {
                        if (err) return res.status(500).json({ error: "Error al recuperar datos" });
                        res.status(200).json(data);
                    });
                });
            } else {
                dbV2.find({}).sort({ country: 1, year: 1 }).limit(15).exec((err, data) => {
                    if (err) return res.status(500).json({ error: "Error al recuperar datos" });
                    res.status(200).json(data);
                });
            }
        });
    });

    // GET v2 - Búsqueda por TODOS los campos + paginación mejorada
    routerV2.get("/", (req, res) => {
        const { 
            country, year, game, cheater_report, confirmed_ban, 
            estimated_cheater, suspended_account, repeat_offender,
            from, to,
            page = 1, limit = 20,
            sort = 'country', order = 'asc'
        } = req.query;
        
        let query = {};
        
        // Búsqueda por texto (case insensitive)
        if (country) query.country = { $regex: new RegExp(country, 'i') };
        if (game) query.game = { $regex: new RegExp(game, 'i') };
        
        // Búsqueda por año exacto o rango
        if (year && !from && !to) {
            query.year = parseInt(year);
        }
        
        if (from || to) {
            query.year = {};
            if (from) query.year.$gte = parseInt(from);
            if (to) query.year.$lte = parseInt(to);
        }
        
        // Búsqueda por valores numéricos exactos
        if (cheater_report) query.cheater_report = parseInt(cheater_report);
        if (confirmed_ban) query.confirmed_ban = parseInt(confirmed_ban);
        if (estimated_cheater) query.estimated_cheater = parseInt(estimated_cheater);
        if (suspended_account) query.suspended_account = parseInt(suspended_account);
        if (repeat_offender) query.repeat_offender = parseInt(repeat_offender);

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, parseInt(limit) || 20);
        const skipNum = (pageNum - 1) * limitNum;

        const sortOrder = {};
        sortOrder[sort] = order === 'desc' ? -1 : 1;

        dbV2.count(query, (err, totalCount) => {
            if (err) return res.status(500).json({ error: "Error al contar resultados" });

            dbV2.find(query)
                .sort(sortOrder)
                .skip(skipNum)
                .limit(limitNum)
                .exec((err, data) => {
                    if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
                    
                    res.status(200).json({
                        data: data,
                        pagination: {
                            total: totalCount,
                            page: pageNum,
                            limit: limitNum,
                            totalPages: Math.ceil(totalCount / limitNum),
                            next: skipNum + limitNum < totalCount ? 
                                `/api/v2/cheaters-stats?page=${pageNum + 1}&limit=${limitNum}` : null,
                            prev: pageNum > 1 ? 
                                `/api/v2/cheaters-stats?page=${pageNum - 1}&limit=${limitNum}` : null
                        }
                    });
                });
        });
    });

    // POST v2 - Crear nuevo recurso (ESCRITURA)
    routerV2.post("/", (req, res) => {
        const newData = req.body;

        // 1. Validar que existe
        if (!newData) {
            return res.status(400).json({ message: "Bad Request: No data provided" });
        }

        // 2. Validar campos requeridos
        const requiredFields = ['country', 'year', 'game', 'cheater_report', 'confirmed_ban'];
        const missingFields = requiredFields.filter(field => !newData.hasOwnProperty(field));
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                message: "Bad Request: Missing required fields",
                required: requiredFields,
                missing: missingFields
            });
        }

        // 3. Validar tipos de datos
        if (typeof newData.country !== 'string') {
            return res.status(400).json({ message: "Bad Request: 'country' must be a string" });
        }
        if (typeof newData.year !== 'number') {
            return res.status(400).json({ message: "Bad Request: 'year' must be a number" });
        }
        if (typeof newData.game !== 'string') {
            return res.status(400).json({ message: "Bad Request: 'game' must be a string" });
        }

        // 4. Validar que no tenga campos extra
        const allowedFields = [
            'country', 'year', 'game', 'cheater_report', 'confirmed_ban', 
            'estimated_cheater', 'suspended_account', 'repeat_offender'
        ];
        const extraFields = Object.keys(newData).filter(key => !allowedFields.includes(key));
        
        if (extraFields.length > 0) {
            return res.status(400).json({ 
                message: "Bad Request: Extra fields not allowed",
                extra: extraFields
            });
        }

        // 5. Verificar si ya existe (país + año + juego como identificador compuesto)
        dbV2.findOne({ 
            country: { $regex: new RegExp(`^${newData.country}$`, 'i') }, 
            year: newData.year,
            game: { $regex: new RegExp(`^${newData.game}$`, 'i') }
        }, (err, existe) => {
            if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
            
            if (existe) {
                return res.status(409).json({ 
                    message: "Resource already exists for this country, year and game" 
                });
            }

            dbV2.insert(newData, (err, newDoc) => {
                if (err) return res.status(500).json({ error: "Error al insertar el dato" });
                res.status(201).json(newDoc);
            });
        });
    });

    // DELETE v2 - Eliminar todos (requiere confirmación)
    routerV2.delete("/", (req, res) => {
        const { confirm } = req.query;
        
        if (confirm !== 'true') {
            return res.status(400).json({ 
                message: "Bad Request: To delete all data, add ?confirm=true to the URL" 
            });
        }
        
        dbV2.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) return res.status(500).json({ error: "Error al borrar los datos" });
            res.status(200).json({ message: "All data deleted successfully", count: numRemoved });
        });
    });

    // PUT no permitido en colección v2
    routerV2.put("/", (req, res) => {
        res.status(405).json({ message: "Method Not Allowed: Cannot update collection" });
    });

    // Listas v2 (más endpoints)
    routerV2.get("/countries", (req, res) => {
        dbV2.find({}).exec((err, data) => {
            if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
            const paises = [...new Set(data.map(d => d.country).filter(Boolean))];
            res.status(200).json(paises.sort());
        });
    });

    routerV2.get("/years", (req, res) => {
        dbV2.find({}).exec((err, data) => {
            if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
            const años = [...new Set(data.map(d => d.year).filter(a => a))];
            res.status(200).json(años.sort((a, b) => a - b));
        });
    });

    routerV2.get("/games", (req, res) => {
        dbV2.find({}).exec((err, data) => {
            if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
            const juegos = [...new Set(data.map(d => d.game).filter(Boolean))];
            res.status(200).json(juegos.sort());
        });
    });

    // ============================================
    // RUTAS CON IDENTIFICADOR COMPUESTO v2
    // ============================================
    
    // Por país (con filtros)
    routerV2.get("/country/:country", (req, res) => {
        const countryParam = req.params.country;
        const { from, to, game, page = 1, limit = 20 } = req.query;
        
        let query = { country: { $regex: new RegExp(`^${countryParam}$`, 'i') } };
        
        if (from || to) {
            query.year = {};
            if (from) query.year.$gte = parseInt(from);
            if (to) query.year.$lte = parseInt(to);
        }
        
        if (game) {
            query.game = { $regex: new RegExp(game, 'i') };
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, parseInt(limit) || 20);
        const skipNum = (pageNum - 1) * limitNum;

        dbV2.count(query, (err, totalCount) => {
            if (err) return res.status(500).json({ error: "Error al contar resultados" });

            dbV2.find(query)
                .sort({ year: 1 })
                .skip(skipNum)
                .limit(limitNum)
                .exec((err, data) => {
                    if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
                    
                    if (data.length === 0 && !from && !to && page === 1) {
                        return res.status(404).json({ message: "Country not found" });
                    }
                    
                    res.status(200).json({
                        data: data,
                        pagination: {
                            total: totalCount,
                            page: pageNum,
                            limit: limitNum,
                            totalPages: Math.ceil(totalCount / limitNum)
                        }
                    });
                });
        });
    });

    // Por país y año (puede devolver múltiples juegos)
    routerV2.get("/country/:country/year/:year", (req, res) => {
        const countryParam = req.params.country;
        const yearParam = parseInt(req.params.year);
        const { game } = req.query;

        let query = { 
            country: { $regex: new RegExp(`^${countryParam}$`, 'i') }, 
            year: yearParam 
        };
        
        if (game) {
            query.game = { $regex: new RegExp(game, 'i') };
        }

        dbV2.find(query).sort({ game: 1 }).exec((err, data) => {
            if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
            if (data.length === 0) {
                return res.status(404).json({ message: "No resources found for this country and year" });
            }
            
            // Si es un solo juego y no hay filtro, devolver objeto
            if (data.length === 1 && !game) {
                res.status(200).json(data[0]);
            } else {
                res.status(200).json(data);
            }
        });
    });

    // ============================================
    // RECURSO EXACTO: país/año/juego (identificador compuesto)
    // ============================================
    
    // GET recurso exacto
    routerV2.get("/country/:country/year/:year/game/:game", (req, res) => {
        const countryParam = req.params.country;
        const yearParam = parseInt(req.params.year);
        const gameParam = req.params.game;

        dbV2.findOne({ 
            country: { $regex: new RegExp(`^${countryParam}$`, 'i') }, 
            year: yearParam,
            game: { $regex: new RegExp(`^${gameParam}$`, 'i') }
        }, (err, recurso) => {
            if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
            if (!recurso) return res.status(404).json({ message: "Resource not found" });
            res.status(200).json(recurso);
        });
    });

    // PUT recurso exacto (reemplazo completo) - ESCRITURA
    routerV2.put("/country/:country/year/:year/game/:game", (req, res) => {
        const countryParam = req.params.country;
        const yearParam = parseInt(req.params.year);
        const gameParam = req.params.game;
        const body = req.body;

        if (!body) return res.status(400).json({ message: "Bad Request: No data provided" });

        // Validar que los IDs coinciden
        if (body.country && body.country.toLowerCase() !== countryParam.toLowerCase()) {
            return res.status(400).json({ message: "Bad Request: Country in URL and body do not match" });
        }
        if (body.year && parseInt(body.year) !== yearParam) {
            return res.status(400).json({ message: "Bad Request: Year in URL and body do not match" });
        }
        if (body.game && body.game.toLowerCase() !== gameParam.toLowerCase()) {
            return res.status(400).json({ message: "Bad Request: Game in URL and body do not match" });
        }

        dbV2.update(
            { 
                country: { $regex: new RegExp(`^${countryParam}$`, 'i') }, 
                year: yearParam,
                game: { $regex: new RegExp(`^${gameParam}$`, 'i') }
            },
            { $set: body },
            { returnUpdatedDocs: true },
            (err, numReplaced, affectedDoc) => {
                if (err) return res.status(500).json({ error: "Error al actualizar" });
                if (numReplaced === 0) return res.status(404).json({ message: "Resource not found" });
                res.status(200).json(affectedDoc);
            }
        );
    });

    // PATCH recurso exacto (actualización parcial) - ESCRITURA
    routerV2.patch("/country/:country/year/:year/game/:game", (req, res) => {
        const countryParam = req.params.country;
        const yearParam = parseInt(req.params.year);
        const gameParam = req.params.game;
        const updates = req.body;

        // No permitir cambiar los identificadores
        if (updates.country || updates.year || updates.game) {
            return res.status(400).json({ 
                message: "Bad Request: Cannot update identifiers (country, year, game) via PATCH" 
            });
        }

        dbV2.update(
            { 
                country: { $regex: new RegExp(`^${countryParam}$`, 'i') }, 
                year: yearParam,
                game: { $regex: new RegExp(`^${gameParam}$`, 'i') }
            },
            { $set: updates },
            { returnUpdatedDocs: true },
            (err, numReplaced, affectedDoc) => {
                if (err) return res.status(500).json({ error: "Error al actualizar" });
                if (numReplaced === 0) return res.status(404).json({ message: "Resource not found" });
                res.status(200).json(affectedDoc);
            }
        );
    });

    // DELETE recurso exacto - ESCRITURA
    routerV2.delete("/country/:country/year/:year/game/:game", (req, res) => {
        const countryParam = req.params.country;
        const yearParam = parseInt(req.params.year);
        const gameParam = req.params.game;

        dbV2.remove(
            { 
                country: { $regex: new RegExp(`^${countryParam}$`, 'i') }, 
                year: yearParam,
                game: { $regex: new RegExp(`^${gameParam}$`, 'i') }
            },
            {},
            (err, numRemoved) => {
                if (err) return res.status(500).json({ error: "Error al eliminar" });
                if (numRemoved === 0) return res.status(404).json({ message: "Resource not found" });
                res.sendStatus(204);
            }
        );
    });

    // ============================================
    // POST no permitido en recurso exacto (debe devolver 405)
    // ============================================
    routerV2.post("/country/:country/year/:year/game/:game", (req, res) => {
        res.status(405).json({ 
            message: "Method Not Allowed: Cannot POST to a specific resource. Use POST to /api/v2/cheaters-stats to create new resources.",
            hint: "To create a new resource, send POST request to /api/v2/cheaters-stats"
        });
    });

    // ============================================
    // REGISTRAR RUTAS EN LA APP
    // ============================================
    app.use('/api/v1/cheaters-stats', routerV1);
    app.use('/api/v2/cheaters-stats', routerV2);
    
}

export default loadBackendFMGP;