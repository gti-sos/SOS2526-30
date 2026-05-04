<script>
    import { onMount } from 'svelte';

    let loading = $state(true);
    let error = $state(null);
    let chartContainer;

    onMount(async () => {
        try {
            // 1. CARGAMOS TUS DATOS 
            let resEsports = await fetch('/api/v2/esportsearnings-stats');
            let esportsData = await resEsports.json();
            
            if (!esportsData || esportsData.length === 0) {
                await fetch('/api/v2/esportsearnings-stats/loadInitialData');
                resEsports = await fetch('/api/v2/esportsearnings-stats');
                esportsData = await resEsports.json();
            }

            const genreCount = {};
            esportsData.forEach(item => {
                const genre = item.genre || 'Desconocido';
                genreCount[`🎮 ${genre} (eSports)`] = (genreCount[`🎮 ${genre} (eSports)`] || 0) + 1;
            });

            // 2. API EXTERNA
            const resRM = await fetch('https://rickandmortyapi.com/api/character');
            if (!resRM.ok) throw new Error('Error al conectar con Rick & Morty');
            const rmData = await resRM.json();

            const speciesCount = {};
            rmData.results.forEach(char => {
                speciesCount[`👽 ${char.species} (R&M)`] = (speciesCount[`👽 ${char.species} (R&M)`] || 0) + 1;
            });

            const pieData = [];
            Object.entries(genreCount).forEach(([name, y]) => pieData.push({ name, y }));
            Object.entries(speciesCount).forEach(([name, y]) => pieData.push({ name, y }));

            loading = false;

            setTimeout(async () => {
                const Highcharts = (await import('highcharts')).default;
                Highcharts.chart(chartContainer, {
                    chart: { type: 'pie', backgroundColor: '#ffffff' },
                    title: { text: 'Multiverso: Géneros de eSports vs Especies de R&M' },
                    tooltip: { pointFormat: '<b>{point.y}</b> registros ({point.percentage:.1f}%)' },
                    plotOptions: { pie: { dataLabels: { enabled: true, format: '<b>{point.name}</b>: {point.percentage:.1f} %' } } },
                    series: [{ name: 'Cantidad', colorByPoint: true, data: pieData }]
                });
            }, 100);

        } catch (err) {
            error = err.message;
            loading = false;
        }
    });
</script>
