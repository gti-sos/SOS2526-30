const datosOlimpicos = [
    { id: 1, name: "A Dijiang", sex: "M", age: 24, height: 180, weight: 80, country: "China", noc: "CHN", game: "1992 Summer", year: 1992, season: "Summer", city: "Barcelona", sport: "Basketball", event: "Basketball Men's Basketball", medal: "NA" },
    { id: 2, name: "A Lamusi", sex: "M", age: 23, height: 170, weight: 60, country: "China", noc: "CHN", game: "2012 Summer", year: 2012, season: "Summer", city: "London", sport: "Judo", event: "Judo Men's Extra-Lightweight", medal: "NA" },
    { id: 3, name: "Gunnar Nielsen Aaby", sex: "M", age: 24, height: null, weight: null, country: "Denmark", noc: "DEN", game: "1920 Summer", year: 1920, season: "Summer", city: "Antwerpen", sport: "Football", event: "Football Men's Football", medal: "NA" },
    { id: 4, name: "Edgar Lindenau Aabye", sex: "M", age: 34, height: null, weight: null, country: "Denmark/Sweden", noc: "DEN", game: "1900 Summer", year: 1900, season: "Summer", city: "Paris", sport: "Tug-Of-War", event: "Tug-Of-War Men's Tug-Of-War", medal: "Gold" },
    { id: 5, name: "Christine Jacoba Aaftink", sex: "F", age: 21, height: 185, weight: 82, country: "Netherlands", noc: "NED", game: "1988 Winter", year: 1988, season: "Winter", city: "Calgary", sport: "Speed Skating", event: "Speed Skating Women's 500 metres", medal: "NA" },
    { id: 5, name: "Christine Jacoba Aaftink", sex: "F", age: 25, height: 185, weight: 82, country: "Netherlands", noc: "NED", game: "1992 Winter", year: 1992, season: "Winter", city: "Albertville", sport: "Speed Skating", event: "Speed Skating Women's 500 metres", medal: "NA" },
    { id: 5, name: "Christine Jacoba Aaftink", sex: "F", age: 25, height: 185, weight: 82, country: "Netherlands", noc: "NED", game: "1992 Winter", year: 1992, season: "Winter", city: "Albertville", sport: "Speed Skating", event: "Speed Skating Women's 1,000 metres", medal: "NA" },
    { id: 5, name: "Christine Jacoba Aaftink", sex: "F", age: 27, height: 185, weight: 82, country: "Netherlands", noc: "NED", game: "1994 Winter", year: 1994, season: "Winter", city: "Lillehammer", sport: "Speed Skating", event: "Speed Skating Women's 500 metres", medal: "NA" },
    { id: 5, name: "Christine Jacoba Aaftink", sex: "F", age: 27, height: 185, weight: 82, country: "Netherlands", noc: "NED", game: "1994 Winter", year: 1994, season: "Winter", city: "Lillehammer", sport: "Speed Skating", event: "Speed Skating Women's 1,000 metres", medal: "NA" },
    { id: 6, name: "Per Knut Aaland", sex: "M", age: 31, height: 188, weight: 75, country: "United States", noc: "USA", game: "1992 Winter", year: 1992, season: "Winter", city: "Albertville", sport: "Cross Country Skiing", event: "Cross Country Skiing Men's 10 kilometres", medal: "NA" }
];

const pais = "Netherlands";
const edad = "age";


const filasPorPais = datosOlimpicos.filter(row => row.country === pais);


const sumaEdades = filasPorPais
    .map(row => row[edad])
    .reduce((ac, e) => ac + e, 0);


const media = sumaEdades / filasPorPais.length;


console.log(`Media de edad de los atletas de ${pais}: ${media} años`);