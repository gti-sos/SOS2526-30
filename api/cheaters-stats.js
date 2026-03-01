const express = require("express");
const router = express.Router();
const path = require("path");
const csv = require('csvtojson');


const cheaters_csv = path.join(__dirname, "../data/video_game_cheaters_dataset_en.csv");


let cheaters = [];


router.get("/loadInitialData", (req, res) => {
    if (cheaters.length === 0) {
        csv().fromFile(cheaters_csv).then((datos) => {
            cheaters = datos.slice(0, 15);
            res.status(201).json(cheaters);
        }).catch(() => {
            res.status(500).json({ error: "Error al cargar CSV" });
        });
    } else {
        res.status(200).json(cheaters);
    }
});


router.get("/", (req, res) => {
    let results = [...cheaters];

    if (req.query.id) {
        results = results.filter(a => String(a.id) === String(req.query.id));
    }

    if (req.query.country) {
        results = results.filter(a => 
            a.country && a.country.toLowerCase() === req.query.country.toLowerCase()
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

    if (!nuevo.country || !nuevo.year) {
        return res.status(400).json({ error: "country y year son obligatorios" });
    }
    
    const existe = cheaters.find(a => 
        a.country === nuevo.country && a.year == nuevo.year
    );
    
    if (existe) {
        return res.status(409).json({ error: "Ya existe un registro para ese país y año" });
    }
    
    cheaters.push(nuevo);
    res.status(201).send();
});

router.delete("/", (req, res) => {
    cheaters = [];
    res.status(200).json({ message: "Colección borrada" });
});


router.get("/id/:id", (req, res) => {
    const results = cheaters.filter(a => a.id == req.params.id);
    res.status(200).json(results);
});

router.put("/id/:id", (req, res) => {
    res.status(404).json({ error: "No encontrado - este dataset no tiene IDs" });
});

router.delete("/id/:id", (req, res) => {
    res.status(404).json({ error: "No encontrado - este dataset no tiene IDs" });
});


router.get("/country/:country/year/:year", (req, res) => {
    const recurso = cheaters.find(a => 
        a.country && a.country.toLowerCase() === req.params.country.toLowerCase() && 
        a.year == req.params.year
    );
    
    if (recurso) {
        res.status(200).json(recurso);
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

router.put("/country/:country/year/:year", (req, res) => {
    const index = cheaters.findIndex(a => 
        a.country && a.country.toLowerCase() === req.params.country.toLowerCase() && 
        a.year == req.params.year
    );
    
    if (index !== -1) {
        cheaters[index] = req.body;
        res.status(200).send();
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

router.delete("/country/:country/year/:year", (req, res) => {
    const longitud = cheaters.length;
    cheaters = cheaters.filter(a => 
        !(a.country && a.country.toLowerCase() === req.params.country.toLowerCase() && 
          a.year == req.params.year)
    );
    
    if (cheaters.length < longitud) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "No encontrado" });
    }
});

router.get("/country/:country", (req, res) => {
    let results = cheaters.filter(a => 
        a.country && a.country.toLowerCase() === req.params.country.toLowerCase()
    );
    
    if (req.query.from) {
        results = results.filter(a => a.year >= parseInt(req.query.from));
    }
    if (req.query.to) {
        results = results.filter(a => a.year <= parseInt(req.query.to));
    }
    
    res.status(200).json(results);
});


router.get("/countries", (req, res) => {
    const paises = [...new Set(cheaters.map(c => c.country).filter(Boolean))];
    res.status(200).json(paises.sort());
});


router.post("/countries", (req, res) => {
    const nuevoPais = req.body;
    
    if (!nuevoPais.country || !nuevoPais.year) {
        return res.status(400).json({ error: "country y year son obligatorios" });
    }
    
    cheaters.push(nuevoPais);
    res.status(201).send();
});


router.delete("/countries", (req, res) => {
    cheaters = [];
    res.status(200).json({ message: "Todos los países borrados" });
});


router.get("/countries/:country", (req, res) => {
    const results = cheaters.filter(a => 
        a.country && a.country.toLowerCase() === req.params.country.toLowerCase()
    );
    
    if (results.length > 0) {
        res.status(200).json(results);
    } else {
        res.status(404).json({ error: "País no encontrado" });
    }
});


router.put("/countries/:country", (req, res) => {
    const countryActual = req.params.country;
    const nuevosDatos = req.body;
    let actualizados = 0;
    
    cheaters = cheaters.map(c => {
        if (c.country && c.country.toLowerCase() === countryActual.toLowerCase()) {
            actualizados++;
            return { ...c, ...nuevosDatos, country: c.country };
        }
        return c;
    });
    
    if (actualizados > 0) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "País no encontrado" });
    }
});


router.delete("/countries/:country", (req, res) => {
    const longitud = cheaters.length;
    cheaters = cheaters.filter(c => 
        !(c.country && c.country.toLowerCase() === req.params.country.toLowerCase())
    );
    
    if (cheaters.length < longitud) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "País no encontrado" });
    }
});


router.get("/years", (req, res) => {
    const años = [...new Set(cheaters.map(c => c.year).filter(Boolean))];
    res.status(200).json(años.sort((a,b) => a - b));
});


router.post("/years", (req, res) => {
    const nuevoAño = req.body;
    
    if (!nuevoAño.country || !nuevoAño.year) {
        return res.status(400).json({ error: "country y year son obligatorios" });
    }
    
    cheaters.push(nuevoAño);
    res.status(201).send();
});


router.delete("/years", (req, res) => {
    cheaters = [];
    res.status(200).json({ message: "Todos los años borrados" });
});


router.get("/years/:year", (req, res) => {
    const results = cheaters.filter(c => c.year == req.params.year);
    
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
    
    cheaters = cheaters.map(c => {
        if (c.year == yearActual) {
            actualizados++;
            return { ...c, ...nuevosDatos, year: c.year };
        }
        return c;
    });
    
    if (actualizados > 0) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "Año no encontrado" });
    }
});


router.delete("/years/:year", (req, res) => {
    const yearActual = parseInt(req.params.year);
    const longitud = cheaters.length;
    cheaters = cheaters.filter(c => c.year != yearActual);
    
    if (cheaters.length < longitud) {
        res.status(200).send();
    } else {
        res.status(404).json({ error: "Año no encontrado" });
    }
});


router.post("/countries/:country", (req, res) => 
    res.status(405).json({ error: "Método no permitido sobre un recurso concreto" })
);

router.post("/years/:year", (req, res) => 
    res.status(405).json({ error: "Método no permitido sobre un recurso concreto" })
);

router.post("/country/:country", (req, res) => 
    res.status(405).json({ error: "Método no permitido" })
);

module.exports = router;