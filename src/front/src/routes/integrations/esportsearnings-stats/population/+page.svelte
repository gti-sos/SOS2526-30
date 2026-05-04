<script>
    import { onMount } from 'svelte';
    
    let loading = $state(true);
    let error = $state(null);
    let chartContainer;

    onMount(async () => {
        try {
            // 1. CARGAMOS TUS DATOS (Auto-llenado si está vacía)
            let resEsports = await fetch('/api/v2/esportsearnings-stats');
            let esportsData = await resEsports.json();
            
            if (!esportsData || esportsData.length === 0) {
                await fetch('/api/v2/esportsearnings-stats/loadInitialData');
                resEsports = await fetch('/api/v2/esportsearnings-stats');
                esportsData = await resEsports.json();
            }

            const moneyByCountry = {};
            esportsData.forEach(item => {
                if (item.country) moneyByCountry[item.country] = (moneyByCountry[item.country] || 0) + item.total_money;
            });

            // 2. API EXTERNA (Con proxy público anti-bloqueos)
            const resCountries = await fetch('https://corsproxy.io/?https://restcountries.com/v3.1/all');
            if (!resCountries.ok) throw new Error('Error al cargar la API de Países');
            const countriesData = await resCountries.json();

            const categories = [];
            const esportsMoney = [];
            const populations = [];

            Object.keys(moneyByCountry).forEach(esportCountry => {
                const matchedCountry = countriesData.find(c => 
                    c.name.common.toLowerCase().includes(esportCountry.toLowerCase()) || 
                    esportCountry.toLowerCase().includes(c.name.common.toLowerCase())
                );

                if (matchedCountry) {
                    categories.push(esportCountry);
                    esportsMoney.push(moneyByCountry[esportCountry]);
                    populations.push(matchedCountry.population);
                }
            });

            loading = false;

            setTimeout(async () => {
                const Highcharts = (await import('highcharts')).default;
                Highcharts.chart(chartContainer, {
                    chart: { type: 'column', backgroundColor: '#ffffff' },
                    title: { text: '🎮 eSports Earnings vs 🌍 Población Mundial' },
                    xAxis: { categories: categories, crosshair: true },
                    yAxis: [
                        { title: { text: 'Dinero en eSports ($)' } },
                        { title: { text: 'Población Total' }, opposite: true }
                    ],
                    tooltip: { shared: true },
                    series: [
                        { name: 'Dinero (eSports)', type: 'column', yAxis: 0, data: esportsMoney, color: '#a855f7' },
                        { name: 'Población', type: 'spline', yAxis: 1, data: populations, color: '#10b981', marker: { lineWidth: 2, lineColor: '#10b981', fillColor: 'white' } }
                    ]
                });
            }, 100);

        } catch (err) {
            error = err.message;
            loading = false;
        }
    });
</script>
