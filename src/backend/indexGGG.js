import express from 'express';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';
import Datastore from 'nedb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función principal que recibe app y registra las rutas
function loadBackendGGG(app) {
    const router = express.Router();
    
    // Configurar base de datos NeDB
    const db = new Datastore({ 
        filename: path.join(__dirname, '..', '..', 'data', 'athlete_events.db'),
        autoload: true 
    });

    // Crear índices para mejorar rendimiento en búsquedas frecuentes
    db.ensureIndex({ fieldName: 'name' });
    db.ensureIndex({ fieldName: 'year' });
    db.ensureIndex({ fieldName: 'team' });

    // Cargar datos iniciales del CSV
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
        console.log(`✅ CSV cargado: ${csvContent.length} atletas totales`);
    } catch (err) {
        console.error("Error leyendo CSV:", err.message);
    }

    // CARGA INICIAL
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
                    console.log(`✅ Datos iniciales cargados: ${newDocs.length} registros`);
                    
                    db.find({}).exec((err, data) => {
                        if (err) {
                            return res.status(500).json({ error: "Error al recuperar datos" });
                        }
                        const resultado = data.map(({ _id, ...rest }) => rest);
                        res.status(201).json(resultado);
                    });
                });
            } else {
                db.find({}).limit(15).exec((err, data) => {
                    if (err) {
                        return res.status(500).json({ error: "Error al recuperar datos" });
                    }
                    const resultado = data.map(({ _id, ...rest }) => rest);
                    res.status(200).json(resultado);
                });
            }
        });
    });

    // COLECCIÓN PRINCIPAL CON PAGINACIÓN
    router.get("/", (req, res) => {
        const { 
            name, team, country, year, from, to, sport, season, city, id,
            page = 1, limit = 20, offset
        } = req.query;
        
        let query = {};
        
        // Construir query basado en filtros
        if (name) {
            query.name = { $regex: new RegExp(name, 'i') };
        }
        if (team || country) {
            const teamFilter = team || country;
            query.team = { $regex: new RegExp(`^${teamFilter}$`, 'i') };
        }
        if (year) {
            query.year = parseInt(year);
        }
        if (sport) {
            query.sport = { $regex: new RegExp(sport, 'i') };
        }
        if (season) {
            query.season = { $regex: new RegExp(`^${season}$`, 'i') };
        }
        if (city) {
            query.city = { $regex: new RegExp(city, 'i') };
        }
        if (id) {
            query.id = parseInt(id);
        }
        
        // Filtro por rango de años
        if (from || to) {
            query.year = {};
            if (from) query.year.$gte = parseInt(from);
            if (to) query.year.$lte = parseInt(to);
        }

        // Calcular paginación
        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100);
        const skipNum = offset !== undefined ? parseInt(offset) : (pageNum - 1) * limitNum;

        db.count(query, (err, totalCount) => {
            if (err) {
                return res.status(500).json({ error: "Error al contar resultados" });
            }

            db.find(query)
                .sort({ id: 1 }) // Ordenar por nombre y año para consistencia
                .skip(skipNum)
                .limit(limitNum)
                .exec((err, data) => {
                    if (err) {
                        return res.status(500).json({ error: "Error al acceder a la base de datos" });
                    }
                    
                    const resultado = data.map(({ _id, ...rest }) => rest);
                    
                    res.status(200).json({
                        data: resultado,
                        pagination: {
                            total: totalCount,
                            page: pageNum,
                            limit: limitNum,
                            offset: skipNum,
                            nextPage: skipNum + limitNum < totalCount ? pageNum + 1 : null,
                            prevPage: pageNum > 1 ? pageNum - 1 : null,
                            totalPages: Math.ceil(totalCount / limitNum)
                        }
                    });
                });
        });
    });

    // POST - Crear nuevo atleta
    router.post("/", (req, res) => {
        const newData = req.body;
        
        if (!newData.name || !newData.year) {
            return res.status(400).json({ message: "Bad Request: Missing name or year" });
        }

        db.findOne({ 
            name: newData.name, 
            year: newData.year, 
            event: newData.event 
        }, (err, existing) => {
            if (err) {
                return res.status(500).json({ error: "Error al acceder a la base de datos" });
            }
            if (existing) {
                return res.status(409).json({ message: "Resource already exists" });
            }

            db.insert(newData, (err, newDoc) => {
                if (err) {
                    return res.status(500).json({ error: "Error al insertar el dato" });
                }
                const { _id, ...result } = newDoc;
                res.status(201).json(result);
            });
        });
    });

    router.put("/", (req, res) => {
        res.status(405).json({ message: "Method Not Allowed: Cannot update the entire list" });
    });

    // DELETE - Borrar todos
    router.delete("/", (req, res) => {
        db.remove({}, { multi: true }, (err, numRemoved) => {
            if (err) {
                return res.status(500).json({ error: "Error al borrar los datos" });
            }
            res.status(200).json({ message: "All data deleted successfully", count: numRemoved });
        });
    });

    // LISTAS
    router.get("/team", (req, res) => {
        db.find({}).exec((err, data) => {
            if (err) {
                return res.status(500).json({ error: "Error al acceder a la base de datos" });
            }
            const equipos = [...new Set(data.map(d => d.team).filter(Boolean))];
            res.status(200).json(equipos.sort());
        });
    });

    router.get("/sport", (req, res) => {
        db.find({}).exec((err, data) => {
            if (err) {
                return res.status(500).json({ error: "Error al acceder a la base de datos" });
            }
            const deportes = [...new Set(data.map(d => d.sport).filter(Boolean))];
            res.status(200).json(deportes.sort());
        });
    });

    router.get("/city", (req, res) => {
        db.find({}).exec((err, data) => {
            if (err) {
                return res.status(500).json({ error: "Error al acceder a la base de datos" });
            }
            const ciudades = [...new Set(data.map(d => d.city).filter(Boolean))];
            res.status(200).json(ciudades.sort());
        });
    });

    router.get("/year", (req, res) => {
        db.find({}).exec((err, data) => {
            if (err) {
                return res.status(500).json({ error: "Error al acceder a la base de datos" });
            }
            const años = [...new Set(data.map(d => d.year).filter(a => a))];
            res.status(200).json(años.sort((a,b) => a - b));
        });
    });

    router.get("/season", (req, res) => {
        db.find({}).exec((err, data) => {
            if (err) {
                return res.status(500).json({ error: "Error al acceder a la base de datos" });
            }
            const temporadas = [...new Set(data.map(d => d.season).filter(Boolean))];
            res.status(200).json(temporadas.sort());
        });
    });

    // BÚSQUEDA POR NOMBRE (con paginación)
    router.get("/:name", (req, res) => {
        const name = req.params.name;
        const { from, to, page = 1, limit = 20 } = req.query;
        
        let query = { name: { $regex: new RegExp(name, 'i') } };
        
        if (from || to) {
            query.year = {};
            if (from) query.year.$gte = parseInt(from);
            if (to) query.year.$lte = parseInt(to);
        }

        const pageNum = parseInt(page);
        const limitNum = Math.min(parseInt(limit), 100);
        const skipNum = (pageNum - 1) * limitNum;

        db.count(query, (err, totalCount) => {
            if (err) {
                return res.status(500).json({ error: "Error al contar resultados" });
            }

            db.find(query)
                .sort({ id: 1 })
                .skip(skipNum)
                .limit(limitNum)
                .exec((err, data) => {
                    if (err) {
                        return res.status(500).json({ error: "Error al acceder a la base de datos" });
                    }
                    
                    if (data.length === 0 && !from && !to && page === 1) {
                        return res.status(404).json({ message: "Atleta no encontrado" });
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

    // RECURSO EXACTO
    router.get("/:name/:year", (req, res) => {
        const name = req.params.name;
        const year = parseInt(req.params.year);
        
        db.findOne({ name: name, year: year }, (err, recurso) => {
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

        db.update({ name: name, year: year }, { $set: body }, {}, (err, numReplaced) => {
            if (err) {
                return res.status(500).json({ error: "Error al actualizar" });
            }
            if (numReplaced === 0) {
                return res.status(404).json({ message: "Resource not found" });
            }
            
            db.findOne({ name: name, year: year }, (err, updated) => {
                if (err) {
                    return res.status(500).json({ error: "Error al recuperar el dato actualizado" });
                }
                const { _id, ...result } = updated;
                res.status(200).json(result);
            });
        });
    });

    // DELETE
    router.delete("/:name/:year", (req, res) => {
        const name = req.params.name;
        const year = parseInt(req.params.year);
        
        db.remove({ name: name, year: year }, {}, (err, numRemoved) => {
            if (err) {
                return res.status(500).json({ error: "Error al eliminar" });
            }
            if (numRemoved === 0) {
                return res.status(404).json({ message: "Resource not found" });
            }
            res.status(200).json({ message: "Resource deleted successfully" });
        });
    });

    // ✅ REGISTRAR EL ROUTER EN LA APP
    app.use('/api/v1/olympics-athlete-events', router);
}

export default loadBackendGGG;