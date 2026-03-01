const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');


const athletes_csv = path.join(__dirname, "../data/athlete_events.csv");

let athletes = [];

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


router.get("/", (req, res) => {
    let results = [...athletes];

    if (req.query.id) {
        results = results.filter(a => String(a.id) === String(req.query.id));
    }

    if (req.query.country) {
        results = results.filter(a => 
            a.team && a.team.toLowerCase() === req.query.country.toLowerCase()
        );
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

    if (!nuevo.name || !nuevo.year) {
        return res.status(400).json({ error: "name y year son obligatorios" });
    }
    
    const existe = athletes.find(a => 
        a.name === nuevo.name && a.year == nuevo.year
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


router.get("/id/:id", (req, res) => {
    const results = athletes.filter(a => a.id == req.params.id);
    res.status(200).json(results);
});

router.put("/id/:id", (req, res) => {
    const index = athletes.findIndex(a => a.id == req.params.id);
    
    if (index !== -1) {
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


router.get("/teams", (req, res) => {
    const equipos = [...new Set(athletes.map(a => a.team).filter(Boolean))];
    res.status(200).json(equipos.sort());
});


router.post("/teams", (req, res) => {
    const nuevoEquipo = req.body;
    
    if (!nuevoEquipo.team || !nuevoEquipo.name) {
        return res.status(400).json({ error: "team y name son obligatorios" });
    }
    
    athletes.push(nuevoEquipo);
    res.status(201).send();
});

router.delete("/teams", (req, res) => {
    athletes = [];
    res.status(200).json({ message: "Todos los equipos borrados" });
});


router.get("/teams/:team", (req, res) => {
    const results = athletes.filter(a => 
        a.team && a.team.toLowerCase() === req.params.team.toLowerCase()
    );
    
    if (results.length > 0) {
        res.status(200).json(results);
    } else {
        res.status(404).json({ error: "Equipo no encontrado" });
    }
});

router.put("/teams/:team", (req, res) => {
    const teamActual = req.params.team;
    const nuevosDatos = req.body;
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

router.delete("/teams/:team", (req, res) => {
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


router.get("/sports", (req, res) => {
    const deportes = [...new Set(athletes.map(a => a.sport).filter(Boolean))];
    res.status(200).json(deportes.sort());
});


router.post("/sports", (req, res) => {
    const nuevoDeporte = req.body;
    
    if (!nuevoDeporte.sport || !nuevoDeporte.name) {
        return res.status(400).json({ error: "sport y name son obligatorios" });
    }
    
    athletes.push(nuevoDeporte);
    res.status(201).send();
});

router.delete("/sports", (req, res) => {
    athletes = [];
    res.status(200).json({ message: "Todos los deportes borrados" });
});


router.get("/sports/:sport", (req, res) => {
    const results = athletes.filter(a => 
        a.sport && a.sport.toLowerCase() === req.params.sport.toLowerCase()
    );
    
    if (results.length > 0) {
        res.status(200).json(results);
    } else {
        res.status(404).json({ error: "Deporte no encontrado" });
    }
});


router.put("/sports/:sport", (req, res) => {
    const sportActual = req.params.sport;
    const nuevosDatos = req.body;
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


router.delete("/sports/:sport", (req, res) => {
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


router.get("/cities", (req, res) => {
    const ciudades = [...new Set(athletes.map(a => a.city).filter(Boolean))];
    res.status(200).json(ciudades.sort());
});

router.post("/cities", (req, res) => {
    const nuevaCiudad = req.body;
    
    if (!nuevaCiudad.city || !nuevaCiudad.name) {
        return res.status(400).json({ error: "city y name son obligatorios" });
    }
    
    athletes.push(nuevaCiudad);
    res.status(201).send();
});

router.delete("/cities", (req, res) => {
    athletes = [];
    res.status(200).json({ message: "Todas las ciudades borradas" });
});

router.get("/cities/:city", (req, res) => {
    const results = athletes.filter(a => 
        a.city && a.city.toLowerCase() === req.params.city.toLowerCase()
    );
    
    if (results.length > 0) {
        res.status(200).json(results);
    } else {
        res.status(404).json({ error: "Ciudad no encontrada" });
    }
});


router.put("/cities/:city", (req, res) => {
    const cityActual = req.params.city;
    const nuevosDatos = req.body;
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


router.delete("/cities/:city", (req, res) => {
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


router.get("/years", (req, res) => {
    const años = [...new Set(athletes.map(a => a.year).filter(Boolean))];
    res.status(200).json(años.sort((a,b) => a - b));
});


router.post("/years", (req, res) => {
    const nuevoAño = req.body;
    
    if (!nuevoAño.year || !nuevoAño.name) {
        return res.status(400).json({ error: "year y name son obligatorios" });
    }
    
    athletes.push(nuevoAño);
    res.status(201).send();
});


router.delete("/years", (req, res) => {
    athletes = [];
    res.status(200).json({ message: "Todos los años borrados" });
});


router.get("/years/:year", (req, res) => {
    const results = athletes.filter(a => a.year == req.params.year);
    
    if (results.length > 0) {
        res.status(200).json(results);
    } else {
        res.status(404).json({ error: "Año no encontrado" });
    }
});


router.put("/years/:year", (req, res) => {
    const yearActual = parseInt(req.params.year);
    const nuevosDatos = req.body;
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


router.delete("/years/:year", (req, res) => {
    const yearActual = parseInt(req.params.year);
    const longitud = athletes.length;
    athletes = athletes.filter(a => a.year != yearActual);
    
    if (athletes.length < longitud) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "Año no encontrado" });
    }
});


router.get("/seasons", (req, res) => {
    const temporadas = [...new Set(athletes.map(a => a.season).filter(Boolean))];
    res.status(200).json(temporadas.sort());
});


router.post("/seasons", (req, res) => {
    const nuevaTemporada = req.body;
    
    if (!nuevaTemporada.season || !nuevaTemporada.name) {
        return res.status(400).json({ error: "season y name son obligatorios" });
    }
    
    athletes.push(nuevaTemporada);
    res.status(201).send();
});


router.delete("/seasons", (req, res) => {
    athletes = [];
    res.status(200).json({ message: "Todas las temporadas borradas" });
});


router.get("/seasons/:season", (req, res) => {
    const results = athletes.filter(a => 
        a.season && a.season.toLowerCase() === req.params.season.toLowerCase()
    );
    
    if (results.length > 0) {
        res.status(200).json(results);
    } else {
        res.status(404).json({ error: "Temporada no encontrada" });
    }
});


router.put("/seasons/:season", (req, res) => {
    const seasonActual = req.params.season;
    const nuevosDatos = req.body;
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


router.delete("/seasons/:season", (req, res) => {
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

router.post("/teams/:team", (req, res) => 
    res.status(405).json({ error: "Método no permitido sobre un recurso concreto" })
);

router.post("/sports/:sport", (req, res) => 
    res.status(405).json({ error: "Método no permitido sobre un recurso concreto" })
);

router.post("/cities/:city", (req, res) => 
    res.status(405).json({ error: "Método no permitido sobre un recurso concreto" })
);

router.post("/years/:year", (req, res) => 
    res.status(405).json({ error: "Método no permitido sobre un recurso concreto" })
);

router.post("/seasons/:season", (req, res) => 
    res.status(405).json({ error: "Método no permitido sobre un recurso concreto" })
);

module.exports = router;