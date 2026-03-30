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
    const fileContent = readFileSync(path.join(__dirname, '..', '..', 'data', 'video_game_cheaters_dataset_en.csv'), 'utf-8');
    csvContent = parse(fileContent, {
        columns: true,
        cast: (value, context) => {
            if (context.column === 'year') return Number(value);
            if (context.column === 'cheater_reports') return Number(value);
            if (context.column === 'confirmed_bans') return Number(value);
            if (context.column === 'estimated_cheater_percentage') return Number(value);
            if (context.column === 'suspended_accounts') return Number(value);
            if (context.column === 'repeat_offenders') return Number(value);
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
    filename: path.join(__dirname, '..', '..', 'data', 'cheaters.db'),
    autoload: true
});

dbV1.ensureIndex({ fieldName: 'country' });
dbV1.ensureIndex({ fieldName: 'year' });

// CARGA AUTOMÁTICA DE DATOS V1
dbV1.count({}, (err, count) => {
    if (err) {
        console.error("Error al verificar base de datos v1:", err);
        return;
    }
    
    if (count === 0) {
        const initialData = csvContent.slice(0, 15).map(item => ({
            year: item.year,
            country: item.country,
            cheater_reports: item.cheater_reports,
            confirmed_bans: item.confirmed_bans,
            estimated_cheater_percentage: item.estimated_cheater_percentage,
            suspended_accounts: item.suspended_accounts,
            repeat_offenders: item.repeat_offenders
        }));
        
        dbV1.insert(initialData, (err, newDocs) => {
            if (err) {
                console.error("Error al insertar datos iniciales v1:", err);
           
                
            }
        });
   
    }
});

const routerV1 = express.Router();

// Documentación v1
routerV1.get("/docs", (req, res) => {
    res.redirect("https://documenter.getpostman.com/view/52768258/2sBXigNZg8");
});

// Carga inicial v1 (solo si está vacía)
routerV1.get("/loadInitialData", (req, res) => {
    dbV1.count({}, (err, count) => {
        if (err) return res.status(500).json({ error: "Error al comprobar la base de datos" });
        
        if (count === 0) {
            const initialData = csvContent.slice(0, 15).map(item => ({
                year: item.year,
                country: item.country,
                cheater_reports: item.cheater_reports,
                confirmed_bans: item.confirmed_bans,
                estimated_cheater_percentage: item.estimated_cheater_percentage,
                suspended_accounts: item.suspended_accounts,
                repeat_offenders: item.repeat_offenders
            }));
            
            dbV1.insert(initialData, (err, newDocs) => {
                if (err) return res.status(500).json({ error: "Error al insertar datos iniciales" });
                
                
                dbV1.find({}).sort({ country: 1, year: 1 }).exec((err, data) => {
                    if (err) return res.status(500).json({ error: "Error al recuperar datos" });
                    const resultado = data.map(({ _id, ...rest }) => rest);
                    res.status(200).json(resultado);
                });
            });
        } else {
            dbV1.find({}).sort({ country: 1, year: 1 }).limit(15).exec((err, data) => {
                if (err) return res.status(500).json({ error: "Error al recuperar datos" });
                const resultado = data.map(({ _id, ...rest }) => rest);
                res.status(200).json(resultado);
            });
        }
    });
});

// Colección principal v1 (SOLO LECTURA)
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
    res.status(405).json({ message: "La versión 1 es solo lectura. No se pueden crear nuevos registros." });
});

// Deshabilitar PUT en v1 (inmutable)
routerV1.put("/", (req, res) => {
    res.status(405).json({ message: "La versión 1 es solo lectura. No se puede modificar la lista." });
});

// Deshabilitar DELETE en v1 (inmutable)
routerV1.delete("/", (req, res) => {
    res.status(405).json({ message: "La versión 1 es solo lectura. No se pueden borrar todos los registros." });
});

// LISTAS v1 (solo lectura)
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

// Búsqueda por país con rango de años (v1)
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
                    return res.status(404).json({ message: `No existen registros para el país "${countryParam}"` });
                }
                
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

// Recurso exacto v1 (solo lectura)
routerV1.get("/:country/:year", (req, res) => {
    const countryParam = req.params.country;
    const yearParam = parseInt(req.params.year);
    
    dbV1.findOne({ 
        country: { $regex: new RegExp(`^${countryParam}$`, 'i') }, 
        year: yearParam 
    }, (err, recurso) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        if (!recurso) return res.status(404).json({ message: "Resource not found" });
        const { _id, ...result } = recurso;
        res.status(200).json(result);
    });
});

// Deshabilitar POST, PUT, DELETE en recursos concretos de v1
routerV1.post("/:country/:year", (req, res) => {
    res.status(405).json({ message: "La versión 1 es solo lectura. No se pueden crear registros." });
});

routerV1.put("/:country/:year", (req, res) => {
    res.status(405).json({ message: "La versión 1 es solo lectura. No se puede modificar registros." });
});

routerV1.delete("/:country/:year", (req, res) => {
    res.status(405).json({ message: "La versión 1 es solo lectura. No se puede eliminar registros." });
});

// ============================================
// VERSIÓN 2 - BASE DE DATOS PROPIA (MODIFICABLE)
// ============================================
const dbV2 = new Datastore({
    filename: path.join(__dirname, '..', '..', 'data', 'cheaters-v2.db'),
    autoload: true
});

dbV2.ensureIndex({ fieldName: 'country' });
dbV2.ensureIndex({ fieldName: 'year' });
dbV2.ensureIndex({ fieldName: 'cheater_report' });
dbV2.ensureIndex({ fieldName: 'confirmed_ban' });

// CARGA AUTOMÁTICA DE DATOS V2
dbV2.count({}, (err, count) => {
    if (err) {
        console.error("Error al verificar base de datos v2:", err);
        return;
    }
    
    if (count === 0) {
        const initialData = csvContent.slice(0, 15).map(item => ({
            year: item.year,
            country: item.country,
            cheater_report: item.cheater_reports,
            confirmed_ban: item.confirmed_bans,
            estimated_cheater: item.estimated_cheater_percentage,
            suspended_account: item.suspended_accounts,
            repeat_offender: item.repeat_offenders
        }));
        
        dbV2.insert(initialData, (err, newDocs) => {
            if (err) {
                console.error("Error al insertar datos iniciales v2:", err);
            
            }
        });
   
    }
});

const routerV2 = express.Router();

// Documentación v2
routerV2.get("/docs", (req, res) => {
    res.redirect("https://documenter.getpostman.com/view/52706289/2sBXihqYD5");
});

// Carga inicial v2
routerV2.get("/loadInitialData", (req, res) => {
    dbV2.count({}, (err, count) => {
        if (err) return res.status(500).json({ error: "Error al comprobar la base de datos" });
        
        if (count === 0) {
            const initialData = csvContent.slice(0, 15).map(item => ({
                year: item.year,
                country: item.country,
                cheater_report: item.cheater_reports,
                confirmed_ban: item.confirmed_bans,
                estimated_cheater: item.estimated_cheater_percentage,
                suspended_account: item.suspended_accounts,
                repeat_offender: item.repeat_offenders
            }));
            
            dbV2.insert(initialData, (err, newDocs) => {
                if (err) return res.status(500).json({ error: "Error al insertar datos iniciales" });
                
                
                dbV2.find({}).sort({ country: 1, year: 1 }).exec((err, data) => {
                    if (err) return res.status(500).json({ error: "Error al recuperar datos" });
                    const resultado = data.map(({ _id, ...rest }) => rest);
                    res.status(200).json(resultado);
                });
            });
        } else {
            dbV2.find({}).sort({ country: 1, year: 1 }).limit(15).exec((err, data) => {
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
        country, year, cheater_report, confirmed_ban, 
        estimated_cheater, suspended_account, repeat_offender,
        from, to,
        page = 1, limit = 20,
        sort = 'country', order = 'asc'
    } = req.query;
    
    let query = {};
    
    if (country) query.country = { $regex: new RegExp(country, 'i') };
    
    if (year) {
        query.year = parseInt(year);
    } else if (from || to) {
        query.year = {};
        if (from) query.year.$gte = parseInt(from);
        if (to) query.year.$lte = parseInt(to);
    }
    
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

// POST v2 - Crear nuevo recurso
// CORRECCIÓN: devuelve 201 con el objeto creado (sin _id)
routerV2.post("/", (req, res) => {
    const newData = req.body;
    
    if (!newData || !newData.country || !newData.year || !newData.cheater_report || !newData.confirmed_ban) {
        return res.status(400).json({ message: "Bad Request: Missing required fields (country, year, cheater_report, confirmed_ban)" });
    }

    dbV2.findOne({ 
        country: { $regex: new RegExp(`^${newData.country}$`, 'i') }, 
        year: newData.year 
    }, (err, existe) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        if (existe) return res.status(409).json({ message: "Resource already exists for this country and year" });

        dbV2.insert(newData, (err, newDoc) => {
            if (err) return res.status(500).json({ error: "Error al insertar el dato" });
            const { _id, ...result } = newDoc;
            res.status(201).json(result);
        });
    });
});

// PUT no permitido en colección v2
routerV2.put("/", (req, res) => {
    res.status(405).json({ message: "Method Not Allowed: Cannot update the entire list" });
});

// CORRECCIÓN: DELETE todos v2 — acepta tanto con ?confirm=true como sin parámetro
// para que funcione correctamente desde el frontend y desde los tests
routerV2.delete("/", (req, res) => {
    const { confirm } = req.query;
    
    // Si viene confirm=false explícito, rechazar. En cualquier otro caso (true o ausente) proceder.
    if (confirm === 'false') {
        return res.status(400).json({ 
            message: "Bad Request: Deletion cancelled." 
        });
    }
    
    dbV2.remove({}, { multi: true }, (err, numRemoved) => {
        if (err) return res.status(500).json({ error: "Error al borrar los datos" });
        res.status(200).json({ message: "All data deleted successfully", count: numRemoved });
    });
});

// LISTAS v2
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

// Búsqueda por país con rango de años y filtros numéricos (v2)
routerV2.get("/country/:country", (req, res) => {
    const countryParam = req.params.country;
    const { 
        from, to, 
        cheater_report, confirmed_ban,
        estimated_cheater, suspended_account, repeat_offender,
        page = 1, limit = 20 
    } = req.query;
    
    let query = { country: { $regex: new RegExp(`^${countryParam}$`, 'i') } };
    
    if (from || to) {
        query.year = {};
        if (from) query.year.$gte = parseInt(from);
        if (to) query.year.$lte = parseInt(to);
    }
    
    if (cheater_report) query.cheater_report = parseInt(cheater_report);
    if (confirmed_ban) query.confirmed_ban = parseInt(confirmed_ban);
    if (estimated_cheater) query.estimated_cheater = parseInt(estimated_cheater);
    if (suspended_account) query.suspended_account = parseInt(suspended_account);
    if (repeat_offender) query.repeat_offender = parseInt(repeat_offender);

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
                
                if (data.length === 0 && !from && !to && !cheater_report && !confirmed_ban && page === 1) {
                    return res.status(404).json({ message: `No existen registros para el país "${countryParam}"` });
                }
                
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

// Recurso exacto v2 (país/año)
routerV2.get("/country/:country/year/:year", (req, res) => {
    const countryParam = req.params.country;
    const yearParam = parseInt(req.params.year);
    
    dbV2.findOne({ 
        country: { $regex: new RegExp(`^${countryParam}$`, 'i') }, 
        year: yearParam 
    }, (err, recurso) => {
        if (err) return res.status(500).json({ error: "Error al acceder a la base de datos" });
        if (!recurso) return res.status(404).json({ message: "Resource not found" });
        const { _id, ...result } = recurso;
        res.status(200).json(result);
    });
});

// POST no permitido en recurso exacto
routerV2.post("/country/:country/year/:year", (req, res) => {
    res.status(405).json({ message: "Method Not Allowed: Cannot POST to a specific resource. Use POST to /api/v2/cheaters-stats to create new resources." });
});

// PUT en recurso exacto v2
routerV2.put("/country/:country/year/:year", (req, res) => {
    const countryParam = req.params.country;
    const yearParam = parseInt(req.params.year);
    const body = req.body;

    if (!body) return res.status(400).json({ message: "Bad Request: No data provided" });
    
    if ((body.country && body.country.toLowerCase() !== countryParam.toLowerCase()) || 
        (body.year && parseInt(body.year) !== yearParam)) {
        return res.status(400).json({ message: "Bad Request: IDs in URL and body do not match" });
    }

    dbV2.update(
        { country: { $regex: new RegExp(`^${countryParam}$`, 'i') }, year: yearParam },
        { $set: body },
        { returnUpdatedDocs: true },
        (err, numReplaced, affectedDoc) => {
            if (err) return res.status(500).json({ error: "Error al actualizar" });
            if (numReplaced === 0) return res.status(404).json({ message: "Resource not found" });
            const { _id, ...result } = affectedDoc;
            res.status(200).json(result);
        }
    );
});

// PATCH en recurso exacto v2
routerV2.patch("/country/:country/year/:year", (req, res) => {
    const countryParam = req.params.country;
    const yearParam = parseInt(req.params.year);
    const updates = req.body;

    if (updates.country || updates.year) {
        return res.status(400).json({ 
            message: "Bad Request: Cannot update identifiers (country, year) via PATCH" 
        });
    }

    dbV2.update(
        { country: { $regex: new RegExp(`^${countryParam}$`, 'i') }, year: yearParam },
        { $set: updates },
        { returnUpdatedDocs: true },
        (err, numReplaced, affectedDoc) => {
            if (err) return res.status(500).json({ error: "Error al actualizar" });
            if (numReplaced === 0) return res.status(404).json({ message: "Resource not found" });
            const { _id, ...result } = affectedDoc;
            res.status(200).json(result);
        }
    );
});

// DELETE en recurso exacto v2
routerV2.delete("/country/:country/year/:year", (req, res) => {
    const countryParam = req.params.country;
    const yearParam = parseInt(req.params.year);
    
    dbV2.remove(
        { country: { $regex: new RegExp(`^${countryParam}$`, 'i') }, year: yearParam },
        {},
        (err, numRemoved) => {
            if (err) return res.status(500).json({ error: "Error al eliminar" });
            if (numRemoved === 0) return res.status(404).json({ message: "Resource not found" });
            res.sendStatus(204);
        }
    );
});

// ============================================
// EXPORTAMOS
// ============================================
export default function loadBackendFMGP(app) {
    app.use('/api/v1/cheaters-stats', routerV1);
    app.use('/api/v2/cheaters-stats', routerV2);
    

}