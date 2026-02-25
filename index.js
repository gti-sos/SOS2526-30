const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.json()); 


const fmgp = require('./index-FMGP.js');


app.get('/samples/FMGP', (req, res) => {
    try {
        const resultado = fmgp.calcularMediaCheaters();
        res.set('Content-Type', 'text/plain');
        res.send(`Media de ${resultado.CampoNumerico} en ${resultado.FiltroPais}: ${resultado.media.toFixed(2)}`);
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error interno del servidor");
    }
});


const BASE_PATH = '/api/v1/cheaters-stats';


const initialData = fmgp.datos;


let cheatersStats = [];



app.get(`${BASE_PATH}/loadInitialData`, (req, res) => {
    if (cheatersStats.length === 0) {
        cheatersStats.push(...initialData);
        
        return res.status(201).json(cheatersStats); 
    } else {
        
        return res.status(200).json(cheatersStats);
    }
});


app.get(BASE_PATH, (req, res) => {
    let results = [...cheatersStats];

   
    if (req.query.country) {
        results = results.filter(item => item.country === req.query.country);
    }
    
    if (req.query.year) {
        results = results.filter(item => item.year === parseInt(req.query.year));
    }
   
    if (req.query.from) {
        results = results.filter(item => item.year >= parseInt(req.query.from));
    }
    if (req.query.to) {
        results = results.filter(item => item.year <= parseInt(req.query.to));
    }

    res.status(200).json(results);
});


app.get(`${BASE_PATH}/:country/:year`, (req, res) => {
    const country = req.params.country;
    const year = parseInt(req.params.year);

    const item = cheatersStats.find(
        stat => stat.country === country && stat.year === year
    );

    if (item) {
        res.status(200).json(item);
    } else {
        res.status(404).json({ error: 'Registro no encontrado' });
    }
});


app.post(BASE_PATH, (req, res) => {
    const newItem = req.body;

    if (!newItem.country || !newItem.year || newItem.cheater_report === undefined) {
        return res.status(400).json({
            error: 'Faltan campos obligatorios: country, year, cheater_report'
        });
    }

    const exists = cheatersStats.some(
        stat => stat.country === newItem.country && stat.year === newItem.year
    );

    if (exists) {
        return res.status(409).json({ error: 'Ya existe un registro para ese país y año' });
    }

    cheatersStats.push(newItem);
    res.status(201).json(newItem);
});


app.put(`${BASE_PATH}/:country/:year`, (req, res) => {
    const country = req.params.country;
    const year = parseInt(req.params.year);
    const updatedData = req.body;

    const index = cheatersStats.findIndex(
        stat => stat.country === country && stat.year === year
    );

    if (index === -1) {
        return res.status(404).json({ error: 'Registro no encontrado' });
    }

    cheatersStats[index] = {
        ...updatedData,
        country: country,
        year: year
    };

    res.status(200).json(cheatersStats[index]);
});


app.delete(`${BASE_PATH}/:country/:year`, (req, res) => {
    const country = req.params.country;
    const year = parseInt(req.params.year);

    const initialLength = cheatersStats.length;
    cheatersStats = cheatersStats.filter(
        stat => !(stat.country === country && stat.year === year)
    );

    if (cheatersStats.length < initialLength) {
        res.status(204).send();
    } else {
        res.status(404).json({ error: 'Registro no encontrado' });
    }
});


app.get('/', (req, res) => {
    res.json({ 
        message: 'API SOS2526-30 funcionando',
        samples: '/samples/FMGP',
        api: `${BASE_PATH}`,
        loadData: `${BASE_PATH}/loadInitialData`
    });
});


app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
    console.log(`- Ruta samples: /samples/FMGP`);
    console.log(`- API base: ${BASE_PATH}`);
    console.log(`- Cargar datos: ${BASE_PATH}/loadInitialData`);
});