const datos = [
  { year: 2010, country: "United States", active_player_no: 11,   viewership: 17.9,  top_genre: "Sports",   top_platform: "Console", tournament_no: 104, pro_player_no: 15912, internet_penetration: 82.5, company_no: 395 },
  { year: 2011, country: "United States", active_player_no: 32.4, viewership: 76.7,  top_genre: "Strategy", top_platform: "Mobile",  tournament_no: 63,  pro_player_no: 13797, internet_penetration: 70.5, company_no: 60  },
  { year: 2010, country: "China",         active_player_no: 59.7, viewership: 110.5, top_genre: "Sports",   top_platform: "Console", tournament_no: 18,  pro_player_no: 1260,  internet_penetration: 63.9, company_no: 452 },
  { year: 2011, country: "China",         active_player_no: 58.4, viewership: 133.6, top_genre: "MOBA",     top_platform: "Mobile",  tournament_no: 31,  pro_player_no: 2356,  internet_penetration: 72.2, company_no: 326 },
  { year: 2010, country: "Japan",         active_player_no: 41,   viewership: 123.2, top_genre: "MOBA",     top_platform: "Mobile",  tournament_no: 61,  pro_player_no: 5368,  internet_penetration: 93.1, company_no: 142 },
  { year: 2011, country: "Japan",         active_player_no: 58.2, viewership: 167.3, top_genre: "Strategy", top_platform: "Mobile",  tournament_no: 21,  pro_player_no: 5859,  internet_penetration: 52.6, company_no: 203 },
  { year: 2010, country: "South Korea",   active_player_no: 30.1, viewership: 82.4,  top_genre: "RPG",      top_platform: "Console", tournament_no: 92,  pro_player_no: 16468, internet_penetration: 82.1, company_no: 247 },
  { year: 2011, country: "South Korea",   active_player_no: 8.1,  viewership: 24,    top_genre: "Sports",   top_platform: "Mobile",  tournament_no: 43,  pro_player_no: 10062, internet_penetration: 55.4, company_no: 221 },
  { year: 2010, country: "Spain",         active_player_no: 16,   viewership: 53.3,  top_genre: "RPG",      top_platform: "PC",      tournament_no: 85,  pro_player_no: 12665, internet_penetration: 83.1, company_no: 277 },
  { year: 2019, country: "Spain",         active_player_no: 27.3, viewership: 73.5,  top_genre: "FPS",      top_platform: "PC",      tournament_no: 86,  pro_player_no: 17458, internet_penetration: 82.9, company_no: 282 },
];

function calcularMediaViewership(arrayDatos, pais) {
  const filasPais = arrayDatos.filter(row => row.country === pais);

  if (filasPais.length === 0) {
    return `No se encontraron datos de viewership para: ${pais}`;
  }

  const suma = filasPais
    .map(row => row.viewership)
    .reduce((acc, val) => acc + val, 0);

  const media = suma / filasPais.length;

  return `Media de viewership en ${pais}: ${media.toFixed(2)}`;
}

module.exports = {
  calcularMediaViewership
};