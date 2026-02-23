const data = [
    { total_money: 31, game_name: "Acceleration of SUGURI 2", genre: "Fighting Game", player_no: 6, tournament_no: 2, country: "United States", top_country_earnings: 31, year: 2018 },
    { total_money: 149248.951, game_name: "Age of Empires II", genre: "Strategy", player_no: 956, tournament_no: 576, country: "China", top_country_earnings: 17425.244, year: 1999 },
    { total_money: 6811.385, game_name: "Age of Empires III", genre: "Strategy", player_no: 106, tournament_no: 76, country: "United States", top_country_earnings: 1852.352, year: 2005 },
    { total_money: 266.8, game_name: "Age of Empires Online", genre: "Strategy", player_no: 16, tournament_no: 7, country: "Germany", top_country_earnings: 126.4, year: 2011 },
    { total_money: 393978.329, game_name: "Call of Duty: Black Ops III", genre: "First-Person Shooter", player_no: 420, tournament_no: 78, country: "United States", top_country_earnings: 225498.462, year: 2015 },
    { total_money: 1349422.957, game_name: "Counter-Strike", genre: "First-Person Shooter", player_no: 4137, tournament_no: 995, country: "Sweden", top_country_earnings: 283739.801, year: 2000 },
    { total_money: 33798.540, game_name: "Dragon Ball FighterZ", genre: "Fighting Game", player_no: 159, tournament_no: 73, country: "Japan", top_country_earnings: 16611.931, year: 2018 },
    { total_money: 53804.738, game_name: "F1 2019", genre: "Racing", player_no: 25, tournament_no: 2, country: "Italy", top_country_earnings: 13333.332, year: 2019 },
    { total_money: 114467.372, game_name: "FIFA 20", genre: "Sports", player_no: 248, tournament_no: 39, country: "United Kingdom", top_country_earnings: 20561.304, year: 2019 },
    { total_money: 9750842.500, game_name: "Fortnite", genre: "Battle Royale", player_no: 4347, tournament_no: 660, country: "United States", top_country_earnings: 3342275.637, year: 2017 }
];

const country = "United States";


const games = data.filter(game => game.country === country);

const average = games
    .map(game => game.total_money)
    .reduce((acc, current) => acc + current, 0) / games.length;

console.log(`--- Análisis de eSports para: ${targetcountry} ---`);
console.log(`Se han encontrado ${games.length} juegos.`);
console.log(`La media de 'total_money' es: ${average.toFixed(2)}`);
