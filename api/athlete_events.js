const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');

const athletes_csv = path.join(__dirname, "../data/athlete_events.csv");

let athletes = [];

/* ================================
    F05 - FUNCIÓN DE VALIDACIÓN DE CAMPOS
================================ */
function validarCamposAtleta(datos) {
    const camposEsperados = ['id', 'name', 'sex', 'age', 'height', 'weight', 'team', 'noc', 'games', 'year', 'season', 'city', 'sport', 'event', 'medal'];
    const camposRecibidos = Object.keys(datos);
    
    if (!datos.name || !datos.team || !datos.year) {
        return { valido: false, error: "Faltan campos obligatorios: name, team, year" };
    }
    
    const camposInvalidos = camposRecibidos.filter(c => !camposEsperados.includes(c));
    if (camposInvalidos.length > 0) {
        return { valido: false, error: `Campos no válidos: ${camposInvalidos.join(', ')}` };
    }
    
    return { valido: true };
}

/* ================================
    1. CARGA INICIAL
================================ */
router.get("/loadInitialData", (req, res) => {
    if (athletes.length === 0) {
        csv().fromFile(athletes_csv).then((datos) => {
            athletes = datos.slice(0, 15);
            res.status(201).json(athletes);
        }).catch(() => {
            res.status(500).json({ error: "Error al cargar CSV" });
        });
    } else {
        res.status(200).json(athletes);
    }
});

/* ================================
    2. COLECCIÓN PRINCIPAL
================================ */
router.get("/", (req, res) => {
    let results = [...athletes];

    if (req.query.id) {
        results = results.filter(a => String(a.id) === String(req.query.id));
    }
    if (req.query.country) {
        results = results.filter(a => a.team && a.team.toLowerCase() === req.query.country.toLowerCase());
    }
    if (req.query.team) {
        results = results.filter(a => a.team && a.team.toLowerCase() === req.query.team.toLowerCase());
    }
    if (req.query.year) {
        results = results.filter(a => a.year == req.query.year);
    }
    if (req.query.from) {
        results = results.filter(a => a.year >= parseInt(req.query.from));
    }
    if (req.query.to) {
        results = results.filter(a => a.year <= parseInt(req.query.to));
    }
    
    res.status(200).json(results);
});

router.post("/", (req, res) => {
    const nuevo = req.body;
    const validacion = validarCamposAtleta(nuevo);
    if (!validacion.valido) {
        return res.status(400).json({ error: validacion.error });
    }
    
    const existe = athletes.find(a => 
        a.name === nuevo.name && a.year == nuevo.year && a.event === nuevo.event
    );
    
    if (existe) {
        return res.status(409).json({ error: "Ya existe" });
    }
    
    athletes.push(nuevo);
    res.status(201).send();
});

router.delete("/", (req, res) => {
    athletes = [];
    res.status(200).json({ message: "Colección borrada" });
});

/* ================================
    F05 - PUT NO PERMITIDO en colección principal
================================ */
router.put("/", (req, res) => 
    res.status(405).json({ error: "Método PUT no permitido sobre la colección" })
);

/* ================================
    3. RECURSOS POR ID
================================ */
router.get("/id/:id", (req, res) => {
    const results = athletes.filter(a => a.id == req.params.id);
    res.status(200).json(results);
});

router.put("/id/:id", (req, res) => {
    const index = athletes.findIndex(a => a.id == req.params.id);
    
    if (index !== -1) {
        if (req.body.id && req.body.id != req.params.id) {
            return res.status(400).json({ error: "El ID en el body no coincide con la URL" });
        }
        athletes[index] = { ...req.body, id: athletes[index].id };
        res.status(200).send();
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

router.delete("/id/:id", (req, res) => {
    const longitud = athletes.length;
    athletes = athletes.filter(a => a.id != req.params.id);
    
    if (athletes.length < longitud) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

/* ================================
    4. RECURSOS POR NOMBRE/AÑO
================================ */
router.get("/name/:name/year/:year", (req, res) => {
    const recurso = athletes.find(a => 
        a.name === req.params.name && a.year == req.params.year
    );
    
    if (recurso) {
        res.status(200).json(recurso);
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

router.put("/name/:name/year/:year", (req, res) => {
    const index = athletes.findIndex(a => 
        a.name === req.params.name && a.year == req.params.year
    );
    
    if (index !== -1) {
        if (req.body.name && req.body.name !== req.params.name) {
            return res.status(400).json({ error: "El nombre en el body no coincide con la URL" });
        }
        if (req.body.year && req.body.year != req.params.year) {
            return res.status(400).json({ error: "El año en el body no coincide con la URL" });
        }
        athletes[index] = req.body;
        res.status(200).send();
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

router.delete("/name/:name/year/:year", (req, res) => {
    const longitud = athletes.length;
    athletes = athletes.filter(a => 
        !(a.name === req.params.name && a.year == req.params.year)
    );
    
    if (athletes.length < longitud) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

router.get("/name/:name", (req, res) => {
    let results = athletes.filter(a => a.name === req.params.name);
    if (req.query.from) {
        results = results.filter(a => a.year >= parseInt(req.query.from));
    }
    if (req.query.to) {
        results = results.filter(a => a.year <= parseInt(req.query.to));
    }
    res.status(200).json(results);
});

/* ================================
    5. LISTA /team (PRIMERO LAS COLECCIONES, DESPUÉS LOS RECURSOS CONCRETOS)
================================ */
/* COLECCIÓN /team */
router.get("/team", (req, res) => {
    const equipos = [...new Set(athletes.map(a => a.team).filter(Boolean))];
    res.status(200).json(equipos.sort());
});

router.post("/team", (req, res) => {
    const nuevoEquipo = req.body;
    const validacion = validarCamposAtleta(nuevoEquipo);
    if (!validacion.valido) {
        return res.status(400).json({ error: validacion.error });
    }
    
    const existe = athletes.find(a => 
        a.name === nuevoEquipo.name && a.year == nuevoEquipo.year && a.event === nuevoEquipo.event
    );
    
    if (existe) {
        return res.status(409).json({ error: "Ese atleta/participación ya existe" });
    }
    
    athletes.push(nuevoEquipo);
    res.status(201).send();
});

router.delete("/team", (req, res) => {
    athletes = [];
    res.status(200).json({ message: "Todos los equipos borrados" });
});

/* F05 - PUT NO PERMITIDO en colección /team (ANTES de /team/:team) */
router.put("/team", (req, res) => 
    res.status(405).json({ error: "Método PUT no permitido sobre la lista de equipos" })
);

/* RECURSOS CONCRETOS /team/:team (DESPUÉS de la colección) */
router.get("/team/:team", (req, res) => {
    const results = athletes.filter(a => 
        a.team && a.team.toLowerCase() === req.params.team.toLowerCase()
    );
    
    if (results.length > 0) {
        res.status(200).json(results);
    } else {
        res.status(404).json({ error: "Equipo no encontrado" });
    }
});

router.put("/team/:team", (req, res) => {
    const teamActual = req.params.team;
    const nuevosDatos = req.body;
    
    if (nuevosDatos.team && nuevosDatos.team.toLowerCase() !== teamActual.toLowerCase()) {
        return res.status(400).json({ 
            error: "El campo 'team' en el body no coincide con el de la URL" 
        });
    }
    
    let actualizados = 0;
    athletes = athletes.map(a => {
        if (a.team && a.team.toLowerCase() === teamActual.toLowerCase()) {
            actualizados++;
            return { ...a, ...nuevosDatos, team: a.team };
        }
        return a;
    });
    
    if (actualizados > 0) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "Equipo no encontrado" });
    }
});

router.delete("/team/:team", (req, res) => {
    const longitud = athletes.length;
    athletes = athletes.filter(a => 
        !(a.team && a.team.toLowerCase() === req.params.team.toLowerCase())
    );
    
    if (athletes.length < longitud) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "Equipo no encontrado" });
    }
});

/* ================================
    6. LISTA /sport
================================ */
router.get("/sport", (req, res) => {
    const deportes = [...new Set(athletes.map(a => a.sport).filter(Boolean))];
    res.status(200).json(deportes.sort());
});

router.post("/sport", (req, res) => {
    const nuevoDeporte = req.body;
    const validacion = validarCamposAtleta(nuevoDeporte);
    if (!validacion.valido) {
        return res.status(400).json({ error: validacion.error });
    }
    
    const existe = athletes.find(a => 
        a.name === nuevoDeporte.name && a.year == nuevoDeporte.year && a.event === nuevoDeporte.event
    );
    
    if (existe) {
        return res.status(409).json({ error: "Ese atleta/participación ya existe" });
    }
    
    athletes.push(nuevoDeporte);
    res.status(201).send();
});

router.delete("/sport", (req, res) => {
    athletes = [];
    res.status(200).json({ message: "Todos los deportes borrados" });
});

router.put("/sport", (req, res) => 
    res.status(405).json({ error: "Método PUT no permitido sobre la lista de deportes" })
);

router.get("/sport/:sport", (req, res) => {
    const results = athletes.filter(a => 
        a.sport && a.sport.toLowerCase() === req.params.sport.toLowerCase()
    );
    
    if (results.length > 0) {
        res.status(200).json(results);
    } else {
        res.status(404).json({ error: "Deporte no encontrado" });
    }
});

router.put("/sport/:sport", (req, res) => {
    const sportActual = req.params.sport;
    const nuevosDatos = req.body;
    
    if (nuevosDatos.sport && nuevosDatos.sport.toLowerCase() !== sportActual.toLowerCase()) {
        return res.status(400).json({ 
            error: "El campo 'sport' en el body no coincide con el de la URL" 
        });
    }
    
    let actualizados = 0;
    athletes = athletes.map(a => {
        if (a.sport && a.sport.toLowerCase() === sportActual.toLowerCase()) {
            actualizados++;
            return { ...a, ...nuevosDatos, sport: a.sport };
        }
        return a;
    });
    
    if (actualizados > 0) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "Deporte no encontrado" });
    }
});

router.delete("/sport/:sport", (req, res) => {
    const longitud = athletes.length;
    athletes = athletes.filter(a => 
        !(a.sport && a.sport.toLowerCase() === req.params.sport.toLowerCase())
    );
    
    if (athletes.length < longitud) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "Deporte no encontrado" });
    }
});

/* ================================
    7. LISTA /city
================================ */
router.get("/city", (req, res) => {
    const ciudades = [...new Set(athletes.map(a => a.city).filter(Boolean))];
    res.status(200).json(ciudades.sort());
});

router.post("/city", (req, res) => {
    const nuevaCiudad = req.body;
    const validacion = validarCamposAtleta(nuevaCiudad);
    if (!validacion.valido) {
        return res.status(400).json({ error: validacion.error });
    }
    
    const existe = athletes.find(a => 
        a.name === nuevaCiudad.name && a.year == nuevaCiudad.year && a.event === nuevaCiudad.event
    );
    
    if (existe) {
        return res.status(409).json({ error: "Ese atleta/participación ya existe" });
    }
    
    athletes.push(nuevaCiudad);
    res.status(201).send();
});

router.delete("/city", (req, res) => {
    athletes = [];
    res.status(200).json({ message: "Todas las ciudades borradas" });
});

router.put("/city", (req, res) => 
    res.status(405).json({ error: "Método PUT no permitido sobre la lista de ciudades" })
);

router.get("/city/:city", (req, res) => {
    const results = athletes.filter(a => 
        a.city && a.city.toLowerCase() === req.params.city.toLowerCase()
    );
    
    if (results.length > 0) {
        res.status(200).json(results);
    } else {
        res.status(404).json({ error: "Ciudad no encontrada" });
    }
});

router.put("/city/:city", (req, res) => {
    const cityActual = req.params.city;
    const nuevosDatos = req.body;
    
    if (nuevosDatos.city && nuevosDatos.city.toLowerCase() !== cityActual.toLowerCase()) {
        return res.status(400).json({ 
            error: "El campo 'city' en el body no coincide con el de la URL" 
        });
    }
    
    let actualizados = 0;
    athletes = athletes.map(a => {
        if (a.city && a.city.toLowerCase() === cityActual.toLowerCase()) {
            actualizados++;
            return { ...a, ...nuevosDatos, city: a.city };
        }
        return a;
    });
    
    if (actualizados > 0) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "Ciudad no encontrada" });
    }
});

router.delete("/city/:city", (req, res) => {
    const longitud = athletes.length;
    athletes = athletes.filter(a => 
        !(a.city && a.city.toLowerCase() === req.params.city.toLowerCase())
    );
    
    if (athletes.length < longitud) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "Ciudad no encontrada" });
    }
});

/* ================================
    8. LISTA /year
================================ */
router.get("/year", (req, res) => {
    const años = [...new Set(athletes.map(a => a.year).filter(Boolean))];
    res.status(200).json(años.sort((a,b) => a - b));
});

router.post("/year", (req, res) => {
    const nuevoAño = req.body;
    const validacion = validarCamposAtleta(nuevoAño);
    if (!validacion.valido) {
        return res.status(400).json({ error: validacion.error });
    }
    
    const existe = athletes.find(a => 
        a.name === nuevoAño.name && a.year == nuevoAño.year && a.event === nuevoAño.event
    );
    
    if (existe) {
        return res.status(409).json({ error: "Ese atleta/participación ya existe" });
    }
    
    athletes.push(nuevoAño);
    res.status(201).send();
});

router.delete("/year", (req, res) => {
    athletes = [];
    res.status(200).json({ message: "Todos los años borrados" });
});

router.put("/year", (req, res) => 
    res.status(405).json({ error: "Método PUT no permitido sobre la lista de años" })
);

router.get("/year/:year", (req, res) => {
    const results = athletes.filter(a => a.year == req.params.year);
    
    if (results.length > 0) {
        res.status(200).json(results);
    } else {
        res.status(404).json({ error: "Año no encontrado" });
    }
});

router.put("/year/:year", (req, res) => {
    const yearActual = parseInt(req.params.year);
    const nuevosDatos = req.body;
    
    if (nuevosDatos.year && nuevosDatos.year != yearActual) {
        return res.status(400).json({ 
            error: "El campo 'year' en el body no coincide con el de la URL" 
        });
    }
    
    let actualizados = 0;
    athletes = athletes.map(a => {
        if (a.year == yearActual) {
            actualizados++;
            return { ...a, ...nuevosDatos, year: a.year };
        }
        return a;
    });
    
    if (actualizados > 0) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "Año no encontrado" });
    }
});

router.delete("/year/:year", (req, res) => {
    const yearActual = parseInt(req.params.year);
    const longitud = athletes.length;
    athletes = athletes.filter(a => a.year != yearActual);
    
    if (athletes.length < longitud) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "Año no encontrado" });
    }
});

/* ================================
    9. LISTA /season
================================ */
router.get("/season", (req, res) => {
    const temporadas = [...new Set(athletes.map(a => a.season).filter(Boolean))];
    res.status(200).json(temporadas.sort());
});

router.post("/season", (req, res) => {
    const nuevaTemporada = req.body;
    const validacion = validarCamposAtleta(nuevaTemporada);
    if (!validacion.valido) {
        return res.status(400).json({ error: validacion.error });
    }
    
    const existe = athletes.find(a => 
        a.name === nuevaTemporada.name && a.year == nuevaTemporada.year && a.event === nuevaTemporada.event
    );
    
    if (existe) {
        return res.status(409).json({ error: "Ese atleta/participación ya existe" });
    }
    
    athletes.push(nuevaTemporada);
    res.status(201).send();
});

router.delete("/season", (req, res) => {
    athletes = [];
    res.status(200).json({ message: "Todas las temporadas borradas" });
});

router.put("/season", (req, res) => 
    res.status(405).json({ error: "Método PUT no permitido sobre la lista de temporadas" })
);

router.get("/season/:season", (req, res) => {
    const results = athletes.filter(a => 
        a.season && a.season.toLowerCase() === req.params.season.toLowerCase()
    );
    
    if (results.length > 0) {
        res.status(200).json(results);
    } else {
        res.status(404).json({ error: "Temporada no encontrada" });
    }
});

router.put("/season/:season", (req, res) => {
    const seasonActual = req.params.season;
    const nuevosDatos = req.body;
    
    if (nuevosDatos.season && nuevosDatos.season.toLowerCase() !== seasonActual.toLowerCase()) {
        return res.status(400).json({ 
            error: "El campo 'season' en el body no coincide con el de la URL" 
        });
    }
    
    let actualizados = 0;
    athletes = athletes.map(a => {
        if (a.season && a.season.toLowerCase() === seasonActual.toLowerCase()) {
            actualizados++;
            return { ...a, ...nuevosDatos, season: a.season };
        }
        return a;
    });
    
    if (actualizados > 0) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "Temporada no encontrada" });
    }
});

router.delete("/season/:season", (req, res) => {
    const longitud = athletes.length;
    athletes = athletes.filter(a => 
        !(a.season && a.season.toLowerCase() === req.params.season.toLowerCase())
    );
    
    if (athletes.length < longitud) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "Temporada no encontrada" });
    }
});

/* ================================
    10. MÉTODOS NO PERMITIDOS (POST en recursos concretos)
================================ */
router.post("/team/:team", (req, res) => 
    res.status(405).json({ error: "Método POST no permitido sobre un recurso concreto" })
);

router.post("/sport/:sport", (req, res) => 
    res.status(405).json({ error: "Método POST no permitido sobre un recurso concreto" })
);

router.post("/city/:city", (req, res) => 
    res.status(405).json({ error: "Método POST no permitido sobre un recurso concreto" })
);

router.post("/year/:year", (req, res) => 
    res.status(405).json({ error: "Método POST no permitido sobre un recurso concreto" })
);

router.post("/season/:season", (req, res) => 
    res.status(405).json({ error: "Método POST no permitido sobre un recurso concreto" })
);

module.exports = router;