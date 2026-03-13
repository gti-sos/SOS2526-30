import express from 'express';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';
import Datastore from 'nedb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar base de datos NeDB
const db = new Datastore({
    filename: path.join(__dirname, '..', '..', 'data', 'cheaters.db'),
    autoload: true
});

// Crear índices para búsquedas eficientes
db.ensureIndex({ fieldName: 'country' });
db.ensureIndex({ fieldName: 'year' });

// Cargar datos iniciales del CSV (solo una vez)
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
    console.error("Error leyendo CSV de FMGP:", err.message);
}

function loadBackendFMGP(app) {
    const router = express.Router();

    // ============================================
    // DOCUMENTACIÓN
    // ============================================
    router.get("/docs", (req, res) => {
        res.redirect("https://documenter.getpostman.com/view/52768258/2sBXiesZR7"); // Cambia por tu URL de documentación
    });

    // ============================================
    // CARGA INICIAL (SOLO SI LA BD ESTÁ VACÍA)
    // ============================================
    router.get("/loadInitialData", (req, res) => {
        db.count({}, (err, count) => {
            if (err) {
                return res.status(500).json({ error: "Error al comprobar la base de datos" });
            }
            
            if (count === 0) {
                const initialData = csvContent.slice(0, 15);
                db.insert(initialData, (err, newDocs) => {
                    if (err) {
                        return res.status(500).json({ error: "Error al insertar datos iniciales" });
                    }
                    console.log(`✅ Datos iniciales de FMGP cargados: ${newDocs.length} registros`);
                    
                    db.find({}).sort({ country: 1, year: 1 }).exec((err, data) => {
                        if (err) {
                            return res.status(500).json({ error: "Error al recuperar datos" });
                        }
                        const resultado = data.map(({ _id, ...rest }) => rest);
                        res.status(200).json(resultado);
                    });
                });
            } else {
                db.find({}).sort({ country: 1, year: 1 }).limit(15).exec((err, data) => {
                    if (err) {
                        return res.status(500).json({ error: "Error al recuperar datos" });
                    }
                    const resultado = data.map(({ _id, ...rest }) => rest);
                    res.status(200).json(resultado);
                });
            }
        });
    });

    // ============================================
    // COLECCIÓN PRINCIPAL CON BÚSQUEDAS Y PAGINACIÓN
    // ============================================
    router.get("/", (req, res) => {
        const { 
            country, year, from, to,
            page = 1, limit = 20
        } = req.query;
        
        let query = {};
        
        // Construir query con búsquedas por todos los campos
        if (country) {
            query.country = { $regex: new RegExp(`^${country}$`, 'i') };
        }
        if (year) {
            query.year = parseInt(year);
        }
        
        // Búsqueda por rango de años
        if (from || to) {
            query.year = {};
            if (from) query.year.$gte = parseInt(from);
            if (to) query.year.$lte = parseInt(to);
        }

        // Paginación
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, parseInt(limit) || 20);
        const skipNum = (pageNum - 1) * limitNum;

        // Contar total para metadatos de paginación
        db.count(query, (err, totalCount) => {
            if (err) {
                return res.status(500).json({ error: "Error al contar resultados" });
            }

            // Ejecutar consulta con paginación
            db.find(query)
                .sort({ country: 1, year: 1 })
                .skip(skipNum)
                .limit(limitNum)
                .exec((err, data) => {
                    if (err) {
                        return res.status(500).json({ error: "Error al acceder a la base de datos" });
                    }
                    
                    const resultado = data.map(({ _id, ...rest }) => rest);
                    
                    // Respuesta con metadatos de paginación
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

    // ============================================
    // POST - Crear nuevo registro
    // ============================================
    router.post("/", (req, res) => {
        const newData = req.body;

        if (!newData || !newData.country || !newData.year) {
            return res.status(400).json({ message: "Bad Request: Missing country or year" });
        }

        // Verificar si ya existe
        db.findOne({ 
            country: { $regex: new RegExp(`^${newData.country}$`, 'i') }, 
            year: newData.year 
        }, (err, existe) => {
            if (err) {
                return res.status(500).json({ error: "Error al acceder a la base de datos" });
            }
            
            if (existe) {
                return res.status(409).json({ message: "Resource already exists for this country and year" });
            }

            // Insertar nuevo registro
            db.insert(newData, (err, newDoc) => {
                if (err) {
                    return res.status(500).json({ error: "Error al insertar el dato" });
                }
                const { _id, ...result } = newDoc;
                res.status(201).json(result);
            });
        });
    });

    // ============================================
    // PUT no permitido en colección
    // ============================================
    router.put("/", (req, res) => {
        res.status(405).json({ message: "Method Not Allowed: Cannot update the entire list" });
    });

    // ============================================
    // DELETE - Borrar todos
    // ============================================
    router.delete("/", (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) {
                return res.status(500).json({ error: "Error al borrar los datos" });
            }
            res.status(200).json({ message: "All data deleted successfully", count: numRemoved });
        });
    });

    // ============================================
    // LISTAS (colecciones de valores únicos)
    // ============================================
    
    // Países
    router.get("/country", (req, res) => {
        db.find({}).exec((err, data) => {
            if (err) {
                return res.status(500).json({ error: "Error al acceder a la base de datos" });
            }
            const paises = [...new Set(data.map(d => d.country).filter(Boolean))];
            res.status(200).json(paises.sort());
        });
    });

    // Años
    router.get("/year", (req, res) => {
        db.find({}).exec((err, data) => {
            if (err) {
                return res.status(500).json({ error: "Error al acceder a la base de datos" });
            }
            const años = [...new Set(data.map(d => d.year).filter(a => a))];
            res.status(200).json(años.sort((a, b) => a - b));
        });
    });

    // ============================================
    // BÚSQUEDA POR PAÍS CON PAGINACIÓN
    // ============================================
    router.get("/:country", (req, res) => {
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

        db.count(query, (err, totalCount) => {
            if (err) {
                return res.status(500).json({ error: "Error al contar resultados" });
            }

            db.find(query)
                .sort({ year: 1 })
                .skip(skipNum)
                .limit(limitNum)
                .exec((err, data) => {
                    if (err) {
                        return res.status(500).json({ error: "Error al acceder a la base de datos" });
                    }
                    
                    if (data.length === 0 && !from && !to && page === 1) {
                        return res.status(404).json({ message: "Country not found" });
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

    // POST no permitido en recurso específico
    router.post("/:country", (req, res) => {
        res.status(405).json({ message: "Method Not Allowed: Cannot create a specific resource like this. Use POST / instead." });
    });

    // PUT en recurso por país (actualiza todos los registros de ese país)
    router.put("/:country", (req, res) => {
        const countryParam = req.params.country;
        const nuevosDatos = req.body;

        if (nuevosDatos.country && nuevosDatos.country.toLowerCase() !== countryParam.toLowerCase()) {
            return res.status(400).json({ message: "Bad Request: Country in URL and body do not match" });
        }

        db.update(
            { country: { $regex: new RegExp(`^${countryParam}$`, 'i') } },
            { $set: nuevosDatos },
            { multi: true },
            (err, numReplaced) => {
                if (err) {
                    return res.status(500).json({ error: "Error al actualizar" });
                }
                if (numReplaced === 0) {
                    return res.status(404).json({ message: "Country not found" });
                }
                
                res.status(200).json({ message: "Records updated successfully", count: numReplaced });
            }
        );
    });

    // DELETE en recurso por país
    router.delete("/:country", (req, res) => {
        const countryParam = req.params.country;
        
        db.remove(
            { country: { $regex: new RegExp(`^${countryParam}$`, 'i') } },
            { multi: true },
            (err, numRemoved) => {
                if (err) {
                    return res.status(500).json({ error: "Error al eliminar" });
                }
                if (numRemoved === 0) {
                    return res.status(404).json({ message: "Country not found" });
                }
                res.status(200).json({ message: "Records deleted successfully", count: numRemoved });
            }
        );
    });

    // ============================================
    // RECURSO EXACTO (país/año)
    // ============================================
    router.get("/:country/:year", (req, res) => {
        const countryParam = req.params.country;
        const yearParam = parseInt(req.params.year);

        db.findOne({ 
            country: { $regex: new RegExp(`^${countryParam}$`, 'i') }, 
            year: yearParam 
        }, (err, recurso) => {
            if (err) {
                return res.status(500).json({ error: "Error al acceder a la base de datos" });
            }
            if (!recurso) {
                return res.status(404).json({ message: "Resource not found" });
            }
            const { _id, ...result } = recurso;
            res.status(200).json(result);
        });
    });

    // POST no permitido
    router.post("/:country/:year", (req, res) => {
        res.status(405).json({ message: "Method Not Allowed: Cannot create a specific resource like this. Use POST / instead." });
    });

    // PUT en recurso exacto
    router.put("/:country/:year", (req, res) => {
        const countryParam = req.params.country;
        const yearParam = parseInt(req.params.year);
        const body = req.body;

        if (!body) {
            return res.status(400).json({ message: "Bad Request: No data provided" });
        }

        if ((body.country && body.country.toLowerCase() !== countryParam.toLowerCase()) || 
            (body.year && parseInt(body.year) !== yearParam)) {
            return res.status(400).json({ message: "Bad Request: IDs in URL and body do not match" });
        }

        db.update(
            { country: { $regex: new RegExp(`^${countryParam}$`, 'i') }, year: yearParam },
            { $set: body },
            { returnUpdatedDocs: true },
            (err, numReplaced, affectedDoc) => {
                if (err) {
                    return res.status(500).json({ error: "Error al actualizar" });
                }
                if (numReplaced === 0) {
                    return res.status(404).json({ message: "Resource not found" });
                }
                
                const { _id, ...result } = affectedDoc;
                res.status(200).json(result);
            }
        );
    });

    // DELETE en recurso exacto
    router.delete("/:country/:year", (req, res) => {
        const countryParam = req.params.country;
        const yearParam = parseInt(req.params.year);

        db.remove(
            { country: { $regex: new RegExp(`^${countryParam}$`, 'i') }, year: yearParam },
            {},
            (err, numRemoved) => {
                if (err) {
                    return res.status(500).json({ error: "Error al eliminar" });
                }
                if (numRemoved === 0) {
                    return res.status(404).json({ message: "Resource not found" });
                }
                res.status(200).json({ message: "Resource deleted successfully" });
            }
        );
    });

    // Registrar el router
    app.use('/api/v1/cheaters-stats', router);
}

export default loadBackendFMGP;