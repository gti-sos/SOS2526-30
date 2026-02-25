// index-FMGP.js
const datos = [
    { year: 2020, country: "spain", cheater_report: 704, confirmed_ban: 367, estimated_cheater: 2.48, suspended_account: 308, repeat_offender: 62 },
    { year: 2021, country: "spain", cheater_report: 3956, confirmed_ban: 1224, estimated_cheater: 1.87, suspended_account: 1064, repeat_offender: 330 },
    { year: 2018, country: "chile", cheater_report: 4964, confirmed_ban: 2113, estimated_cheater: 3.3, suspended_account: 1866, repeat_offender: 684 },
    { year: 2022, country: "mexico", cheater_report: 3962, confirmed_ban: 1593, estimated_cheater: 2.12, suspended_account: 1731, repeat_offender: 346 },
    { year: 2011, country: "peru", cheater_report: 1292, confirmed_ban: 526, estimated_cheater: 2.88, suspended_account: 462, repeat_offender: 83 },
    { year: 2017, country: "spain", cheater_report: 3600, confirmed_ban: 1165, estimated_cheater: 2.67, suspended_account: 1151, repeat_offender: 381 },
    { year: 2015, country: "chile", cheater_report: 1069, confirmed_ban: 335, estimated_cheater: 2.41, suspended_account: 297, repeat_offender: 55 },
    { year: 2013, country: "spain", cheater_report: 3613, confirmed_ban: 1385, estimated_cheater: 4.04, suspended_account: 1259, repeat_offender: 310 },
    { year: 2013, country: "colombia", cheater_report: 1084, confirmed_ban: 523, estimated_cheater: 2.18, suspended_account: 532, repeat_offender: 95 },
    { year: 2016, country: "colombia", cheater_report: 2299, confirmed_ban: 1161, estimated_cheater: 4.87, suspended_account: 1199, repeat_offender: 227 }
];

function calcularMediaCheaters() {
    const FiltroPais = "spain";
    const CampoNumerico = "cheater_report";
    
    const filaCountry = datos.filter(row => row.country === FiltroPais);
    const suma = filaCountry
        .map(row => row[CampoNumerico])
        .reduce((acc, val) => acc + val, 0);
    
    const media = suma / filaCountry.length;
    
    return {
        media: media,
        filaCountry: filaCountry,
        FiltroPais: FiltroPais,
        CampoNumerico: CampoNumerico
    };
}


module.exports = { 
    calcularMediaCheaters,
    datos  
};

// Si se ejecuta directamente
if (require.main === module) {
    const resultado = calcularMediaCheaters();
    console.log(`Media de ${resultado.CampoNumerico} en ${resultado.FiltroPais}: ${resultado.media.toFixed(2)}`);
}