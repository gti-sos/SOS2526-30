import express from 'express';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función principal que recibe app y registra las rutas
function loadBackendFMGP(app) {
    const router = express.Router();
    
    // Variable para almacenar datos en memoria (como en tu versión original)
    let datos = [];

    // Cargar datos iniciales del CSV
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
        console.log(`✅ CSV de FMGP cargado: ${csvContent.length} registros totales`);
    } catch (err) {
        console.error("Error leyendo CSV de FMGP:", err.message);
    }

    // CARGA INICIAL
    router.get("/loadInitialData", (req, res) => {
        if (datos.length === 0) {
            datos = csvContent.slice(0, 15);
            console.log(`✅ Datos iniciales de FMGP cargados: ${datos.length} registros`);
            res.status(200).json(datos);
        } else {
            res.status(200).json(datos);
        }
    });

    // COLECCIÓN PRINCIPAL CON FILTROS
    router.get("/", (req, res) => {
        const { country, year, from, to } = req.query;
        let filtrados = [...datos];

        if (country) {
            filtrados = filtrados.filter(d => 
                d.country && d.country.toLowerCase() === country.toLowerCase()
            );
        }
        if (year) {
            filtrados = filtrados.filter(d => d.year == year);
        }
        if (from || to) {
            filtrados = filtrados.filter(d => {
                let cumple = true;
                if (from) cumple = cumple && d.year >= parseInt(from);
                if (to) cumple = cumple && d.year <= parseInt(to);
                return cumple;
            });
        }

        res.status(200).json(filtrados);
    });

    // POST - Crear nuevo registro
    router.post("/", (req, res) => {
        const newData = req.body;

        if (!newData.country || !newData.year) {
            return res.status(400).json({ error: "Bad Request: Missing country or year" });
        }

        const existe = datos.find(d => 
            d.country && d.country.toLowerCase() === newData.country.toLowerCase() && 
            d.year == newData.year
        );

        if (existe) {
            return res.status(409).json({ error: "Resource already exists for this country and year" });
        }

        datos.push(newData);
        res.status(201).json(newData);
    });

    router.put("/", (req, res) => {
        res.status(405).json({ error: "Method Not Allowed: Cannot update the entire list" });
    });

    // DELETE - Borrar todos
    router.delete("/", (req, res) => {
        const count = datos.length;
        datos = [];
        res.status(200).json({ message: "All data deleted successfully", count: count });
    });

    // LISTAS
    router.get("/country", (req, res) => {
        const paises = [...new Set(datos.map(d => d.country).filter(Boolean))];
        res.status(200).json(paises.sort());
    });

    router.get("/year", (req, res) => {
        const años = [...new Set(datos.map(d => d.year).filter(a => a))];
        res.status(200).json(años.sort((a, b) => a - b));
    });

    // BÚSQUEDA POR PAÍS
    router.get("/:country", (req, res) => {
        const countryParam = req.params.country;
        const { from, to } = req.query;

        let filtrados = datos.filter(d => 
            d.country && d.country.toLowerCase() === countryParam.toLowerCase()
        );

        if (from || to) {
            filtrados = filtrados.filter(d => {
                let cumple = true;
                if (from) cumple = cumple && d.year >= parseInt(from);
                if (to) cumple = cumple && d.year <= parseInt(to);
                return cumple;
            });
        }

        if (filtrados.length === 0 && !from && !to) {
            return res.status(404).json({ error: "Country not found" });
        }

        res.status(200).json(filtrados);
    });

    router.post("/:country", (req, res) => {
        res.status(405).json({ error: "Method Not Allowed: Cannot create a specific resource like this. Use POST / instead." });
    });

    router.put("/:country", (req, res) => {
        const countryParam = req.params.country;
        const nuevosDatos = req.body;

        if (nuevosDatos.country && nuevosDatos.country.toLowerCase() !== countryParam.toLowerCase()) {
            return res.status(400).json({ error: "Bad Request: Country in URL and body do not match" });
        }

        let actualizados = 0;
        datos = datos.map(d => {
            if (d.country && d.country.toLowerCase() === countryParam.toLowerCase()) {
                actualizados++;
                return { ...d, ...nuevosDatos, country: d.country };
            }
            return d;
        });

        if (actualizados > 0) {
            res.status(200).json({ message: "Records updated successfully", count: actualizados });
        } else {
            res.status(404).json({ error: "Country not found" });
        }
    });

    router.delete("/:country", (req, res) => {
        const countryParam = req.params.country;
        const longitud = datos.length;

        datos = datos.filter(d => 
            !(d.country && d.country.toLowerCase() === countryParam.toLowerCase())
        );

        if (datos.length < longitud) {
            res.status(200).json({ message: "Records deleted successfully", count: longitud - datos.length });
        } else {
            res.status(404).json({ error: "Country not found" });
        }
    });

    // RECURSO EXACTO (PAÍS + AÑO)
    router.get("/:country/:year", (req, res) => {
        const countryParam = req.params.country;
        const yearParam = parseInt(req.params.year);

        const recurso = datos.find(d => 
            d.country && d.country.toLowerCase() === countryParam.toLowerCase() && 
            d.year == yearParam
        );

        if (recurso) {
            res.status(200).json(recurso);
        } else {
            res.status(404).json({ error: "Resource not found" });
        }
    });

    router.post("/:country/:year", (req, res) => {
        res.status(405).json({ error: "Method Not Allowed: Cannot create a specific resource like this. Use POST / instead." });
    });

    router.put("/:country/:year", (req, res) => {
        const countryParam = req.params.country;
        const yearParam = parseInt(req.params.year);
        const nuevosDatos = req.body;

        if (nuevosDatos.country && nuevosDatos.country.toLowerCase() !== countryParam.toLowerCase()) {
            return res.status(400).json({ error: "Bad Request: Country in URL and body do not match" });
        }
        if (nuevosDatos.year && nuevosDatos.year != yearParam) {
            return res.status(400).json({ error: "Bad Request: Year in URL and body do not match" });
        }

        const index = datos.findIndex(d => 
            d.country && d.country.toLowerCase() === countryParam.toLowerCase() && 
            d.year == yearParam
        );

        if (index !== -1) {
            datos[index] = { ...datos[index], ...nuevosDatos };
            res.status(200).json(datos[index]);
        } else {
            res.status(404).json({ error: "Resource not found" });
        }
    });

    router.delete("/:country/:year", (req, res) => {
        const countryParam = req.params.country;
        const yearParam = parseInt(req.params.year);

        const index = datos.findIndex(d => 
            d.country && d.country.toLowerCase() === countryParam.toLowerCase() && 
            d.year == yearParam
        );

        if (index !== -1) {
            const eliminado = datos.splice(index, 1)[0];
            res.status(200).json({ message: "Resource deleted successfully", data: eliminado });
        } else {
            res.status(404).json({ error: "Resource not found" });
        }
    });

    // ✅ REGISTRAR EL ROUTER EN LA APP
    app.use('/api/v1/cheaters-stats', router);
}

export default loadBackendFMGP;