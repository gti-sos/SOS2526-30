const express = require("express");
const router = express.Router();

let datos = [];

const datosIniciales = [
    { total_money: 31, game_name: "Acceleration of SUGURI 2", genre: "Fighting Game", player_no: 6, tournament_no: 2, country: "United States", top_country_earnings: 31, year: 2018 },
    { total_money: 149248.951, game_name: "Age of Empires II", genre: "Strategy", player_no: 956, tournament_no: 576, country: "China", top_country_earnings: 17425.244, year: 2004 },
    { total_money: 6811.385, game_name: "Age of Empires II", genre: "Strategy", player_no: 106, tournament_no: 76, country: "United States", top_country_earnings: 1852.352, year: 2005 },
    { total_money: 266.8, game_name: "Age of Empires Online", genre: "Strategy", player_no: 16, tournament_no: 7, country: "Germany", top_country_earnings: 126.4, year: 2011 },
    { total_money: 393978.329, game_name: "Call of Duty: Black Ops III", genre: "First-Person Shooter", player_no: 420, tournament_no: 78, country: "United States", top_country_earnings: 225498.462, year: 2015 },
    { total_money: 1349422.957, game_name: "Counter-Strike", genre: "First-Person Shooter", player_no: 4137, tournament_no: 995, country: "Sweden", top_country_earnings: 283739.801, year: 2000 },
    { total_money: 33798.540, game_name: "Dragon Ball FighterZ", genre: "Fighting Game", player_no: 159, tournament_no: 73, country: "Japan", top_country_earnings: 16611.931, year: 2018 },
    { total_money: 53804.738, game_name: "F1 2019", genre: "Racing", player_no: 25, tournament_no: 2, country: "Italy", top_country_earnings: 13333.332, year: 2019 },
    { total_money: 114467.372, game_name: "FIFA 20", genre: "Sports", player_no: 248, tournament_no: 39, country: "United Kingdom", top_country_earnings: 20561.304, year: 2019 },
    { total_money: 9750842.500, game_name: "Fortnite", genre: "Battle Royale", player_no: 4347, tournament_no: 660, country: "United States", top_country_earnings: 3342275.637, year: 2017 }
];

router.get("/loadInitialData", (req, res) => {
    if (datos.length === 0) {
        datos = [...datosIniciales];
        res.status(201).json(datos);
    } else {
        res.status(200).json({ message: "Data already loaded" });
    }
});


// GET GENERAL CON FILTROS

router.get("/", (req, res) => {
    const { country, genre, year, from, to } = req.query;
    let filtrados = [...datos];

    if (country) {
        filtrados = filtrados.filter(d => d.country === country);
    }

    if (genre) {
        filtrados = filtrados.filter(d => d.genre === genre);
    }

    if (year) {
        filtrados = filtrados.filter(d => d.year === parseInt(year));
    }

    if (from && to) {
        filtrados = filtrados.filter(d => d.year >= parseInt(from) && d.year <= parseInt(to));
    } else if (from) {
        filtrados = filtrados.filter(d => d.year >= parseInt(from));
    } else if (to) {
        filtrados = filtrados.filter(d => d.year <= parseInt(to));
    }

    res.status(200).json(filtrados);
});


// POST GENERAL

router.post("/", (req, res) => {
    const newData = req.body;

    if (!newData.game_name || !newData.year) {
        return res.status(400).json({ message: "Missing game_name or year" });
    }

    const existe = datos.find(d => 
        d.game_name === newData.game_name && 
        d.year === newData.year
    );

    if (existe) {
        res.status(409).json({ message: "Resource already exists" });
    } else {
        datos.push(newData);
        res.status(201).json(newData);
    }
});

router.put("/", (req, res) => {
    res.status(405).json({ message: "Cannot update entire list" });
});

router.delete("/", (req, res) => {
    datos = [];
    res.status(200).json({ message: "All data deleted" });
});


// GET POR JUEGO

router.get("/:game_name", (req, res) => {
    const game = req.params.game_name;

    const filtrados = datos.filter(d => d.game_name === game);

    if (filtrados.length === 0) {
        res.status(404).json({ message: "Game not found" });
    } else {
        res.status(200).json(filtrados);
    }
});


// RECURSO EXACTO (game + year)

router.get("/:game_name/:year", (req, res) => {
    const game = req.params.game_name;
    const year = parseInt(req.params.year);

    const recurso = datos.find(d => 
        d.game_name === game && 
        d.year === year
    );

    if (recurso) {
        res.status(200).json(recurso);
    } else {
        res.status(404).json({ message: "Resource not found" });
    }
});

router.put("/:game_name/:year", (req, res) => {
    const game = req.params.game_name;
    const year = parseInt(req.params.year);
    const body = req.body;

    if (game !== body.game_name || year !== parseInt(body.year)) {
        return res.status(400).json({ message: "IDs do not match" });
    }

    const index = datos.findIndex(d => 
        d.game_name === game && 
        d.year === year
    );

    if (index !== -1) {
        datos[index] = body;
        res.status(200).json(datos[index]);
    } else {
        res.status(404).json({ message: "Resource not found" });
    }
});

router.delete("/:game_name/:year", (req, res) => {
    const game = req.params.game_name;
    const year = parseInt(req.params.year);

    const index = datos.findIndex(d => 
        d.game_name === game && 
        d.year === year
    );

    if (index !== -1) {
        datos.splice(index, 1);
        res.status(200).json({ message: "Deleted successfully" });
    } else {
        res.status(404).json({ message: "Resource not found" });
    }
});

module.exports = router;
