// IMPORT PARA USAR REQUIRE
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// FUNCIONES PARA LEER Y PARSEAR EL CSV RESPECTIVAMENTE
const { readFileSync } = require('fs');
const { parse } = require('csv-parse/sync');

// IMPORTAMOS LAS FUNCIONES PARA LA BASE DE DATOS
import dataStore from "nedb";
import { basename } from 'path';
import path from "path";
import request from 'request';

// LEEMOS EL CSV DE GGG (atletas olímpicos)
const __dirname = path.resolve();
let fileContent = readFileSync(path.join(__dirname, 'data/athlete_events.csv'), 'utf-8');

// PARSEAMOS EL CONTENIDO DEL CSV A UNA LISTA DE OBJETOS
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

// FUNCION loadInitialData() - Carga 15 registros iniciales
function loadInitialDataGGG() {
    let datos = csvContent.slice(0, 15);
    return datos;
}

// Insertar todos los datos al iniciar (opcional, puedes comentarlo si prefieres carga manual)
db.insert(csvContent, (err, newDocs) => {
    if (err) {
        console.error("Error al insertar los datos iniciales:", err);
    } else {
        console.log(`✅ ${newDocs.length} registros cargados en la BD`);
    }
});

function loadBackendGGG(app) {

    // ============================================
    // 1. CARGA INICIAL (/loadInitialData)
    // ============================================
    app.get(BASE_API + recurso + "/loadInitialData", (request, response) => {
        // COMPROBAMOS LA BD
        db.count({}, (err, count) => {
            if (err) {
                return response.status(500).send("Error al comprobar la base de datos");
            }
            if (count > 0) {
                // Si ya hay datos, los devolvemos (200 OK en lugar de 400)
                db.find({}).limit(15).exec((err, data) => {
                    if (err) {
                        return response.status(500).send("Error al recuperar los datos");
                    }
                    const nuevo = data.map(({_id, ...rest}) => rest);
                    return response.status(200).json(nuevo);
                });
            } else {
                let initialData = loadInitialDataGGG();
                // INSERTAMOS DATOS
                db.insert(initialData, (err, newDocs) => {
                    if(err) {
                        return response.status(500).send("Error al insertar en la base de datos");
                    }
                    // RECUPERAMOS DATOS
                    db.find({}, (err, data) => {
                        if (err) {
                            return response.status(500).send("Error al recuperar los datos");
                        }
                        const nuevo = data.map(({_id, ...rest}) => rest);
                        response.status(201).json(nuevo);
                    });
                });
            }
        });
    });

    // ============================================
    // 2. COLECCIÓN PRINCIPAL (con filtros)
    // ============================================
    app.get(BASE_API + recurso, (request, response) => {
        let { id, country, team, year, from, to, sport, season, city, name, limit, offset } = request.query;
        let query = {};

        // Filtros
        if (id) {
            query.id = Number(id);
        }
        if (country || team) {
            query.team = country || team;
        }
        if (name) {
            query.name = name;
        }
        if (year) {
            query.year = Number(year);
        }
        if (sport) {
            query.sport = sport;
        }
        if (season) {
            query.season = season;
        }
        if (city) {
            query.city = city;
        }
        
        // Rango de años
        if (from || to) {
            query.year = {};
            if (from) query.year.$gte = Number(from);
            if (to) query.year.$lte = Number(to);
        }

        let d = db.find(query);
        
        // PAGINACIÓN
        if (offset !== undefined) {
            d = d.skip(Number(offset));
        }
        if (limit !== undefined) {
            d = d.limit(Number(limit));
        }

        d.exec((err, data) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            // ELIMINAMOS _ID DE CADA OBJETO
            const nuevo = data.map(({_id, ...rest}) => rest);
            response.json(nuevo);
        });
    });

    // ============================================
    // 3. POST - Crear nuevo atleta
    // ============================================
    app.post(BASE_API + recurso, (request, response) => {
        let { name, team, year, sport, event } = request.body;
        
        // VALIDAR CAMPOS OBLIGATORIOS
        if (name === undefined || team === undefined || year === undefined) {
            return response.sendStatus(400);
        }

        // COMPROBAMOS SI YA EXISTE (nombre + año + evento)
        db.findOne({ name: name, year: year, event: event }, (err, existingData) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            if (existingData) {
                return response.sendStatus(409); // Conflict
            }

            db.insert(request.body, (err, newData) => {
                if (err) {
                    return response.status(500).send("Error al insertar el dato");
                }
                response.sendStatus(201);
            });
        });
    });

    // ============================================
    // 4. PUT NO PERMITIDO en colección
    // ============================================
    app.put(BASE_API + recurso, (request, response) => {
        response.sendStatus(405);
    });

    // ============================================
    // 5. DELETE - Borrar TODOS los datos
    // ============================================
    app.delete(BASE_API + recurso, (request, response) => {
        db.remove({}, {multi: true});
        console.log("✅ Todos los datos han sido eliminados");
        response.sendStatus(200);
    });

    // ============================================
    // 6. LISTAS EN SINGULAR (team, sport, city, year, season)
    // ============================================
    
    // GET /team - Lista de equipos
    app.get(BASE_API + recurso + "/team", (request, response) => {
        db.find({}).exec((err, data) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            const equipos = [...new Set(data.map(a => a.team).filter(Boolean))];
            response.status(200).json(equipos.sort());
        });
    });

    // POST /team - Crear nuevo equipo (nuevo atleta)
    app.post(BASE_API + recurso + "/team", (request, response) => {
        let { name, team, year, sport, event } = request.body;
        
        if (name === undefined || team === undefined || year === undefined) {
            return response.sendStatus(400);
        }

        db.findOne({ name: name, year: year, event: event }, (err, existingData) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            if (existingData) {
                return response.sendStatus(409);
            }

            db.insert(request.body, (err, newData) => {
                if (err) {
                    return response.status(500).send("Error al insertar el dato");
                }
                response.sendStatus(201);
            });
        });
    });

    // DELETE /team - Borrar TODOS los equipos (todos los atletas)
    app.delete(BASE_API + recurso + "/team", (request, response) => {
        db.remove({}, {multi: true});
        response.status(200).json({ message: "Todos los equipos borrados" });
    });

    // PUT NO PERMITIDO en /team
    app.put(BASE_API + recurso + "/team", (request, response) => {
        response.sendStatus(405);
    });

    // GET /sport - Lista de deportes
    app.get(BASE_API + recurso + "/sport", (request, response) => {
        db.find({}).exec((err, data) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            const deportes = [...new Set(data.map(a => a.sport).filter(Boolean))];
            response.status(200).json(deportes.sort());
        });
    });

    // POST /sport - Crear nuevo deporte
    app.post(BASE_API + recurso + "/sport", (request, response) => {
        let { name, team, year, sport, event } = request.body;
        
        if (name === undefined || sport === undefined || year === undefined) {
            return response.sendStatus(400);
        }

        db.findOne({ name: name, year: year, event: event }, (err, existingData) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            if (existingData) {
                return response.sendStatus(409);
            }

            db.insert(request.body, (err, newData) => {
                if (err) {
                    return response.status(500).send("Error al insertar el dato");
                }
                response.sendStatus(201);
            });
        });
    });

    // DELETE /sport - Borrar TODOS los deportes
    app.delete(BASE_API + recurso + "/sport", (request, response) => {
        db.remove({}, {multi: true});
        response.status(200).json({ message: "Todos los deportes borrados" });
    });

    // PUT NO PERMITIDO en /sport
    app.put(BASE_API + recurso + "/sport", (request, response) => {
        response.sendStatus(405);
    });

    // GET /city - Lista de ciudades
    app.get(BASE_API + recurso + "/city", (request, response) => {
        db.find({}).exec((err, data) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            const ciudades = [...new Set(data.map(a => a.city).filter(Boolean))];
            response.status(200).json(ciudades.sort());
        });
    });

    // POST /city - Crear nueva ciudad
    app.post(BASE_API + recurso + "/city", (request, response) => {
        let { name, team, year, city, event } = request.body;
        
        if (name === undefined || city === undefined || year === undefined) {
            return response.sendStatus(400);
        }

        db.findOne({ name: name, year: year, event: event }, (err, existingData) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            if (existingData) {
                return response.sendStatus(409);
            }

            db.insert(request.body, (err, newData) => {
                if (err) {
                    return response.status(500).send("Error al insertar el dato");
                }
                response.sendStatus(201);
            });
        });
    });

    // DELETE /city - Borrar TODAS las ciudades
    app.delete(BASE_API + recurso + "/city", (request, response) => {
        db.remove({}, {multi: true});
        response.status(200).json({ message: "Todas las ciudades borradas" });
    });

    // PUT NO PERMITIDO en /city
    app.put(BASE_API + recurso + "/city", (request, response) => {
        response.sendStatus(405);
    });

    // GET /year - Lista de años
    app.get(BASE_API + recurso + "/year", (request, response) => {
        db.find({}).exec((err, data) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            const años = [...new Set(data.map(a => a.year).filter(a => a))];
            response.status(200).json(años.sort((a,b) => a - b));
        });
    });

    // POST /year - Crear nuevo año
    app.post(BASE_API + recurso + "/year", (request, response) => {
        let { name, team, year, event } = request.body;
        
        if (name === undefined || year === undefined) {
            return response.sendStatus(400);
        }

        db.findOne({ name: name, year: year, event: event }, (err, existingData) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            if (existingData) {
                return response.sendStatus(409);
            }

            db.insert(request.body, (err, newData) => {
                if (err) {
                    return response.status(500).send("Error al insertar el dato");
                }
                response.sendStatus(201);
            });
        });
    });

    // DELETE /year - Borrar TODOS los años
    app.delete(BASE_API + recurso + "/year", (request, response) => {
        db.remove({}, {multi: true});
        response.status(200).json({ message: "Todos los años borrados" });
    });

    // PUT NO PERMITIDO en /year
    app.put(BASE_API + recurso + "/year", (request, response) => {
        response.sendStatus(405);
    });

    // GET /season - Lista de temporadas
    app.get(BASE_API + recurso + "/season", (request, response) => {
        db.find({}).exec((err, data) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            const temporadas = [...new Set(data.map(a => a.season).filter(Boolean))];
            response.status(200).json(temporadas.sort());
        });
    });

    // POST /season - Crear nueva temporada
    app.post(BASE_API + recurso + "/season", (request, response) => {
        let { name, team, year, season, event } = request.body;
        
        if (name === undefined || season === undefined || year === undefined) {
            return response.sendStatus(400);
        }

        db.findOne({ name: name, year: year, event: event }, (err, existingData) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            if (existingData) {
                return response.sendStatus(409);
            }

            db.insert(request.body, (err, newData) => {
                if (err) {
                    return response.status(500).send("Error al insertar el dato");
                }
                response.sendStatus(201);
            });
        });
    });

    // DELETE /season - Borrar TODAS las temporadas
    app.delete(BASE_API + recurso + "/season", (request, response) => {
        db.remove({}, {multi: true});
        response.status(200).json({ message: "Todas las temporadas borradas" });
    });

    // PUT NO PERMITIDO en /season
    app.put(BASE_API + recurso + "/season", (request, response) => {
        response.sendStatus(405);
    });

    // ============================================
    // 7. RECURSOS CONCRETOS
    // ============================================
    
    // GET /team/:team - Ver equipo específico
    app.get(BASE_API + recurso + "/team/:team", (request, response) => {
        let teamParam = request.params.team;
        
        db.find({ team: { $regex: new RegExp(`^${teamParam}$`, 'i') } }, (err, data) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            if (data.length === 0) {
                return response.status(404).json({ error: "Equipo no encontrado" });
            }
            const nuevo = data.map(({_id, ...rest}) => rest);
            response.status(200).json(nuevo);
        });
    });

    // PUT /team/:team - Actualizar equipo
    app.put(BASE_API + recurso + "/team/:team", (request, response) => {
        let teamParam = request.params.team;
        let nuevosDatos = request.body;
        
        // Validar que el team en body coincide
        if (nuevosDatos.team && nuevosDatos.team.toLowerCase() !== teamParam.toLowerCase()) {
            return response.sendStatus(400);
        }

        db.update({ team: { $regex: new RegExp(`^${teamParam}$`, 'i') } }, 
                  { $set: nuevosDatos }, 
                  { multi: true }, 
                  (err, numUpdated) => {
            if (err) {
                return response.status(500).send("Error al actualizar");
            }
            if (numUpdated === 0) {
                return response.status(404).json({ error: "Equipo no encontrado" });
            }
            response.sendStatus(200);
        });
    });

    // DELETE /team/:team - Borrar equipo específico
    app.delete(BASE_API + recurso + "/team/:team", (request, response) => {
        let teamParam = request.params.team;
        
        db.remove({ team: { $regex: new RegExp(`^${teamParam}$`, 'i') } }, 
                  { multi: true }, 
                  (err, numRemoved) => {
            if (err) {
                return response.status(500).send("Error al eliminar");
            }
            if (numRemoved === 0) {
                return response.status(404).json({ error: "Equipo no encontrado" });
            }
            response.sendStatus(200);
        });
    });

    // POST NO PERMITIDO en /team/:team
    app.post(BASE_API + recurso + "/team/:team", (request, response) => {
        response.sendStatus(405);
    });

    // GET /sport/:sport - Ver deporte específico
    app.get(BASE_API + recurso + "/sport/:sport", (request, response) => {
        let sportParam = request.params.sport;
        
        db.find({ sport: { $regex: new RegExp(`^${sportParam}$`, 'i') } }, (err, data) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            if (data.length === 0) {
                return response.status(404).json({ error: "Deporte no encontrado" });
            }
            const nuevo = data.map(({_id, ...rest}) => rest);
            response.status(200).json(nuevo);
        });
    });

    // PUT /sport/:sport - Actualizar deporte
    app.put(BASE_API + recurso + "/sport/:sport", (request, response) => {
        let sportParam = request.params.sport;
        let nuevosDatos = request.body;
        
        if (nuevosDatos.sport && nuevosDatos.sport.toLowerCase() !== sportParam.toLowerCase()) {
            return response.sendStatus(400);
        }

        db.update({ sport: { $regex: new RegExp(`^${sportParam}$`, 'i') } }, 
                  { $set: nuevosDatos }, 
                  { multi: true }, 
                  (err, numUpdated) => {
            if (err) {
                return response.status(500).send("Error al actualizar");
            }
            if (numUpdated === 0) {
                return response.status(404).json({ error: "Deporte no encontrado" });
            }
            response.sendStatus(200);
        });
    });

    // DELETE /sport/:sport - Borrar deporte específico
    app.delete(BASE_API + recurso + "/sport/:sport", (request, response) => {
        let sportParam = request.params.sport;
        
        db.remove({ sport: { $regex: new RegExp(`^${sportParam}$`, 'i') } }, 
                  { multi: true }, 
                  (err, numRemoved) => {
            if (err) {
                return response.status(500).send("Error al eliminar");
            }
            if (numRemoved === 0) {
                return response.status(404).json({ error: "Deporte no encontrado" });
            }
            response.sendStatus(200);
        });
    });

    // POST NO PERMITIDO en /sport/:sport
    app.post(BASE_API + recurso + "/sport/:sport", (request, response) => {
        response.sendStatus(405);
    });

    // GET /city/:city - Ver ciudad específica
    app.get(BASE_API + recurso + "/city/:city", (request, response) => {
        let cityParam = request.params.city;
        
        db.find({ city: { $regex: new RegExp(`^${cityParam}$`, 'i') } }, (err, data) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            if (data.length === 0) {
                return response.status(404).json({ error: "Ciudad no encontrada" });
            }
            const nuevo = data.map(({_id, ...rest}) => rest);
            response.status(200).json(nuevo);
        });
    });

    // PUT /city/:city - Actualizar ciudad
    app.put(BASE_API + recurso + "/city/:city", (request, response) => {
        let cityParam = request.params.city;
        let nuevosDatos = request.body;
        
        if (nuevosDatos.city && nuevosDatos.city.toLowerCase() !== cityParam.toLowerCase()) {
            return response.sendStatus(400);
        }

        db.update({ city: { $regex: new RegExp(`^${cityParam}$`, 'i') } }, 
                  { $set: nuevosDatos }, 
                  { multi: true }, 
                  (err, numUpdated) => {
            if (err) {
                return response.status(500).send("Error al actualizar");
            }
            if (numUpdated === 0) {
                return response.status(404).json({ error: "Ciudad no encontrada" });
            }
            response.sendStatus(200);
        });
    });

    // DELETE /city/:city - Borrar ciudad específica
    app.delete(BASE_API + recurso + "/city/:city", (request, response) => {
        let cityParam = request.params.city;
        
        db.remove({ city: { $regex: new RegExp(`^${cityParam}$`, 'i') } }, 
                  { multi: true }, 
                  (err, numRemoved) => {
            if (err) {
                return response.status(500).send("Error al eliminar");
            }
            if (numRemoved === 0) {
                return response.status(404).json({ error: "Ciudad no encontrada" });
            }
            response.sendStatus(200);
        });
    });

    // POST NO PERMITIDO en /city/:city
    app.post(BASE_API + recurso + "/city/:city", (request, response) => {
        response.sendStatus(405);
    });

    // GET /year/:year - Ver año específico
    app.get(BASE_API + recurso + "/year/:year", (request, response) => {
        let yearParam = Number(request.params.year);
        
        db.find({ year: yearParam }, (err, data) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            if (data.length === 0) {
                return response.status(404).json({ error: "Año no encontrado" });
            }
            const nuevo = data.map(({_id, ...rest}) => rest);
            response.status(200).json(nuevo);
        });
    });

    // PUT /year/:year - Actualizar año
    app.put(BASE_API + recurso + "/year/:year", (request, response) => {
        let yearParam = Number(request.params.year);
        let nuevosDatos = request.body;
        
        if (nuevosDatos.year && nuevosDatos.year !== yearParam) {
            return response.sendStatus(400);
        }

        db.update({ year: yearParam }, 
                  { $set: nuevosDatos }, 
                  { multi: true }, 
                  (err, numUpdated) => {
            if (err) {
                return response.status(500).send("Error al actualizar");
            }
            if (numUpdated === 0) {
                return response.status(404).json({ error: "Año no encontrado" });
            }
            response.sendStatus(200);
        });
    });

    // DELETE /year/:year - Borrar año específico
    app.delete(BASE_API + recurso + "/year/:year", (request, response) => {
        let yearParam = Number(request.params.year);
        
        db.remove({ year: yearParam }, { multi: true }, (err, numRemoved) => {
            if (err) {
                return response.status(500).send("Error al eliminar");
            }
            if (numRemoved === 0) {
                return response.status(404).json({ error: "Año no encontrado" });
            }
            response.sendStatus(200);
        });
    });

    // POST NO PERMITIDO en /year/:year
    app.post(BASE_API + recurso + "/year/:year", (request, response) => {
        response.sendStatus(405);
    });

    // GET /season/:season - Ver temporada específica
    app.get(BASE_API + recurso + "/season/:season", (request, response) => {
        let seasonParam = request.params.season;
        
        db.find({ season: { $regex: new RegExp(`^${seasonParam}$`, 'i') } }, (err, data) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            if (data.length === 0) {
                return response.status(404).json({ error: "Temporada no encontrada" });
            }
            const nuevo = data.map(({_id, ...rest}) => rest);
            response.status(200).json(nuevo);
        });
    });

    // PUT /season/:season - Actualizar temporada
    app.put(BASE_API + recurso + "/season/:season", (request, response) => {
        let seasonParam = request.params.season;
        let nuevosDatos = request.body;
        
        if (nuevosDatos.season && nuevosDatos.season.toLowerCase() !== seasonParam.toLowerCase()) {
            return response.sendStatus(400);
        }

        db.update({ season: { $regex: new RegExp(`^${seasonParam}$`, 'i') } }, 
                  { $set: nuevosDatos }, 
                  { multi: true }, 
                  (err, numUpdated) => {
            if (err) {
                return response.status(500).send("Error al actualizar");
            }
            if (numUpdated === 0) {
                return response.status(404).json({ error: "Temporada no encontrada" });
            }
            response.sendStatus(200);
        });
    });

    // DELETE /season/:season - Borrar temporada específica
    app.delete(BASE_API + recurso + "/season/:season", (request, response) => {
        let seasonParam = request.params.season;
        
        db.remove({ season: { $regex: new RegExp(`^${seasonParam}$`, 'i') } }, 
                  { multi: true }, 
                  (err, numRemoved) => {
            if (err) {
                return response.status(500).send("Error al eliminar");
            }
            if (numRemoved === 0) {
                return response.status(404).json({ error: "Temporada no encontrada" });
            }
            response.sendStatus(200);
        });
    });

    // POST NO PERMITIDO en /season/:season
    app.post(BASE_API + recurso + "/season/:season", (request, response) => {
        response.sendStatus(405);
    });

    // ============================================
    // 8. RECURSOS POR NOMBRE/AÑO
    // ============================================
    
    // GET /name/:name/year/:year - Atleta específico
    app.get(BASE_API + recurso + "/name/:name/year/:year", (request, response) => {
        let nameParam = request.params.name;
        let yearParam = Number(request.params.year);
        
        db.findOne({ name: nameParam, year: yearParam }, (err, data) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            if (!data) {
                return response.status(404).json({ error: "Atleta no encontrado" });
            }
            let { _id, ...sinId } = data;
            response.status(200).json(sinId);
        });
    });

    // PUT /name/:name/year/:year - Actualizar atleta
    app.put(BASE_API + recurso + "/name/:name/year/:year", (request, response) => {
        let nameParam = request.params.name;
        let yearParam = Number(request.params.year);
        let nuevosDatos = request.body;
        
        // Validar que coinciden
        if (nuevosDatos.name && nuevosDatos.name !== nameParam) {
            return response.sendStatus(400);
        }
        if (nuevosDatos.year && nuevosDatos.year !== yearParam) {
            return response.sendStatus(400);
        }

        db.update({ name: nameParam, year: yearParam }, 
                  nuevosDatos, 
                  {}, 
                  (err, numReplaced) => {
            if (err) {
                return response.status(500).send("Error al actualizar");
            }
            if (numReplaced === 0) {
                return response.status(404).json({ error: "Atleta no encontrado" });
            }
            response.sendStatus(200);
        });
    });

    // DELETE /name/:name/year/:year - Borrar atleta
    app.delete(BASE_API + recurso + "/name/:name/year/:year", (request, response) => {
        let nameParam = request.params.name;
        let yearParam = Number(request.params.year);
        
        db.remove({ name: nameParam, year: yearParam }, {}, (err, numRemoved) => {
            if (err) {
                return response.status(500).send("Error al eliminar");
            }
            if (numRemoved === 0) {
                return response.status(404).json({ error: "Atleta no encontrado" });
            }
            response.sendStatus(200);
        });
    });

    // POST NO PERMITIDO
    app.post(BASE_API + recurso + "/name/:name/year/:year", (request, response) => {
        response.sendStatus(405);
    });

    // GET /name/:name - Buscar por nombre (con filtros)
    app.get(BASE_API + recurso + "/name/:name", (request, response) => {
        let nameParam = request.params.name;
        let { from, to } = request.query;
        
        let query = { name: nameParam };
        
        if (from || to) {
            query.year = {};
            if (from) query.year.$gte = Number(from);
            if (to) query.year.$lte = Number(to);
        }

        db.find(query, (err, data) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            if (data.length === 0) {
                return response.status(404).json({ error: `No hay atletas con nombre: ${nameParam}` });
            }
            const nuevo = data.map(({_id, ...rest}) => rest);
            response.status(200).json(nuevo);
        });
    });

    // ============================================
    // 9. RECURSOS POR ID
    // ============================================
    
    // GET /id/:id - Atleta por ID
    app.get(BASE_API + recurso + "/id/:id", (request, response) => {
        let idParam = Number(request.params.id);
        
        db.find({ id: idParam }, (err, data) => {
            if (err) {
                return response.status(500).send("Error al acceder a la base de datos");
            }
            if (data.length === 0) {
                return response.status(404).json({ error: `No hay atletas con ID: ${idParam}` });
            }
            const nuevo = data.map(({_id, ...rest}) => rest);
            response.status(200).json(nuevo);
        });
    });

    // PUT /id/:id - Actualizar por ID
    app.put(BASE_API + recurso + "/id/:id", (request, response) => {
        let idParam = Number(request.params.id);
        let nuevosDatos = request.body;
        
        if (nuevosDatos.id && nuevosDatos.id !== idParam) {
            return response.sendStatus(400);
        }

        db.update({ id: idParam }, 
                  { $set: nuevosDatos }, 
                  { multi: true }, 
                  (err, numUpdated) => {
            if (err) {
                return response.status(500).send("Error al actualizar");
            }
            if (numUpdated === 0) {
                return response.status(404).json({ error: "ID no encontrado" });
            }
            response.sendStatus(200);
        });
    });

    // DELETE /id/:id - Borrar por ID
    app.delete(BASE_API + recurso + "/id/:id", (request, response) => {
        let idParam = Number(request.params.id);
        
        db.remove({ id: idParam }, { multi: true }, (err, numRemoved) => {
            if (err) {
                return response.status(500).send("Error al eliminar");
            }
            if (numRemoved === 0) {
                return response.status(404).json({ error: "ID no encontrado" });
            }
            response.sendStatus(200);
        });
    });

    // POST NO PERMITIDO
    app.post(BASE_API + recurso + "/id/:id", (request, response) => {
        response.sendStatus(405);
    });

    // // ============================================
    // // 10. PROXY (opcional, lo dejo como estaba)
    // // ============================================
    // var paths = '/api/dummy-products';
    // var apiServerHost = 'https://dummyjson.com/products';

    // app.use(paths, function(req, res) {
    //     var url = apiServerHost + req.url;
    //     console.log('piped: ' + req.url);
    //     req.pipe(request(url)).pipe(res);
    // });
};

// EXPORTAMOS LAS DISTINTAS FUNCIONES
export { loadBackendGGG, csvContent, loadInitialDataGGG };