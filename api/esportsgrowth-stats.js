const express = require("express");
const router = express.Router();

let datos = [];

const datosIniciales = [
  { year: 2010, country: "United States", active_player_no: 11, viewership: 17.9, top_genre: "Sports", top_platform: "Console", tournament_no: 104, pro_player_no: 15912, internet_penetration: 82.5, company_no: 395 },
  { year: 2011, country: "United States", active_player_no: 32.4, viewership: 76.7, top_genre: "Strategy", top_platform: "Mobile", tournament_no: 63, pro_player_no: 13797, internet_penetration: 70.5, company_no: 60 },
  { year: 2010, country: "China", active_player_no: 59.7, viewership: 110.5, top_genre: "Sports", top_platform: "Console", tournament_no: 18, pro_player_no: 1260, internet_penetration: 63.9, company_no: 452 },
  { year: 2011, country: "China", active_player_no: 58.4, viewership: 133.6, top_genre: "MOBA", top_platform: "Mobile", tournament_no: 31, pro_player_no: 2356, internet_penetration: 72.2, company_no: 326 },
  { year: 2010, country: "Japan", active_player_no: 41, viewership: 123.2, top_genre: "MOBA", top_platform: "Mobile", tournament_no: 61, pro_player_no: 5368, internet_penetration: 93.1, company_no: 142 },
  { year: 2011, country: "Japan", active_player_no: 58.2, viewership: 167.3, top_genre: "Strategy", top_platform: "Mobile", tournament_no: 21, pro_player_no: 5859, internet_penetration: 52.6, company_no: 203 },
  { year: 2010, country: "South Korea", active_player_no: 30.1, viewership: 82.4, top_genre: "RPG", top_platform: "Console", tournament_no: 92, pro_player_no: 16468, internet_penetration: 82.1, company_no: 247 },
  { year: 2011, country: "South Korea", active_player_no: 8.1, viewership: 24, top_genre: "Sports", top_platform: "Mobile", tournament_no: 43, pro_player_no: 10062, internet_penetration: 55.4, company_no: 221 },
  { year: 2010, country: "Spain", active_player_no: 16, viewership: 53.3, top_genre: "RPG", top_platform: "PC", tournament_no: 85, pro_player_no: 12665, internet_penetration: 83.1, company_no: 277 },
  { year: 2019, country: "Spain", active_player_no: 27.3, viewership: 73.5, top_genre: "FPS", top_platform: "PC", tournament_no: 86, pro_player_no: 17458, internet_penetration: 82.9, company_no: 282 }
];

router.get("/loadInitialData", (req, res) => {
    if (datos.length === 0) {
        datos = [...datosIniciales];
        res.status(201).json(datos);
    } else {
        res.status(200).json({ message: "Data is already loaded" });
    }
});


// GET GENERAL INTELIGENTE

router.get("/", (req, res) => {
    const { country, year, from, to } = req.query;
    let filtrados = [...datos];

    // Filtro por país (ej: ?country=Spain)
    if (country) {
        filtrados = filtrados.filter(d => d.country === country);
    }

    // Filtro por año exacto (ej: ?year=2010)
    if (year) {
        filtrados = filtrados.filter(d => d.year === parseInt(year));
    }

    // Filtro por rango de años (ej: ?from=2010&to=2015)
    if (from && to) {
        filtrados = filtrados.filter(d => d.year >= parseInt(from) && d.year <= parseInt(to));
    } else if (from) {
        filtrados = filtrados.filter(d => d.year >= parseInt(from));
    } else if (to) {
        filtrados = filtrados.filter(d => d.year <= parseInt(to));
    }

    // El patrón exige devolver un array (incluso vacío si no hay resultados)
    res.status(200).json(filtrados); 
});

router.post("/", (req, res) => {
    const newData = req.body;
    
    // Validación básica: que traiga los campos clave
    if (!newData.country || !newData.year) {
        return res.status(400).json({ message: "Bad Request: Missing country or year" });
    }

    const existe = datos.find(d => d.country === newData.country && d.year === newData.year);
    
    if (existe) {
        res.status(409).json({ message: "Resource already exists" });
    } else {
        datos.push(newData);
        res.status(201).json(newData);
    }
});

router.put("/", (req, res) => {
    res.status(405).json({ message: "Method Not Allowed: Cannot update the entire list" });
});

router.delete("/", (req, res) => {
    datos = [];
    res.status(200).json({ message: "All data deleted successfully" });
});



// GET ESPECÍFICO CON RANGOS (Patrón del profesor)

router.get("/:country", (req, res) => {
    const country = req.params.country;
    const { from, to } = req.query;
    
    let filtrados = datos.filter(d => d.country === country);

    // Si tiene parámetros from/to, filtramos el resultado
    if (from && to) {
        filtrados = filtrados.filter(d => d.year >= parseInt(from) && d.year <= parseInt(to));
    } else if (from) {
        filtrados = filtrados.filter(d => d.year >= parseInt(from));
    } else if (to) {
        filtrados = filtrados.filter(d => d.year <= parseInt(to));
    }

    // Si no hay datos Y NO SE USARON FILTROS, devolvemos 404 (recurso no existe).
    // Si se usaron filtros (from/to) y no hay datos, el patrón dice que devolvamos un array vacío [] con 200 OK.
    if (filtrados.length === 0 && !from && !to) {
        res.status(404).json({ message: "Resource not found" });
    } else {
        res.status(200).json(filtrados);
    }
});



// RUTAS DE RECURSO EXACTO (País y Año)

router.get("/:country/:year", (req, res) => {
    const country = req.params.country;
    const year = parseInt(req.params.year); 
    const recurso = datos.find(d => d.country === country && d.year === year);
    
    if (recurso) {
        res.status(200).json(recurso);
    } else {
        res.status(404).json({ message: "Resource not found" });
    }
});

router.post("/:country/:year", (req, res) => {
    res.status(405).json({ message: "Method Not Allowed: Cannot create a specific resource like this. Use POST / instead." });
});

router.put("/:country/:year", (req, res) => {
    const country = req.params.country;
    const year = parseInt(req.params.year);
    const body = req.body;

    if (country !== body.country || year !== parseInt(body.year)) {
        return res.status(400).json({ message: "Bad Request: IDs in URL and body do not match" });
    }

    const index = datos.findIndex(d => d.country === country && d.year === year);
    
    if (index !== -1) {
        datos[index] = body;
        res.status(200).json(datos[index]);
    } else {
        res.status(404).json({ message: "Resource not found" });
    }
});

router.delete("/:country/:year", (req, res) => {
    const country = req.params.country;
    const year = parseInt(req.params.year);
    const index = datos.findIndex(d => d.country === country && d.year === year);
    
    if (index !== -1) {
        datos.splice(index, 1);
        res.status(200).json({ message: "Resource deleted successfully" });
    } else {
        res.status(404).json({ message: "Resource not found" });
    }
});

module.exports = router;