<script>
    import { onMount } from 'svelte';

    let loading = $state(true);
    let error = $state(null);
    let chartContainer;

    onMount(async () => {
        try {
            // 1. Obtenemos TUS datos de eSports
            const resEsports = await fetch('/api/v2/esportsearnings-stats');
            if (!resEsports.ok) throw new Error('Error al cargar eSports');
            const esportsData = await resEsports.json();

            // Agrupamos contando cuántos juegos hay de cada género
            const genreCount = {};
            esportsData.forEach(item => {
                const genre = item.genre || 'Desconocido';
                genreCount[`🎮 ${genre} (eSports)`] = (genreCount[`🎮 ${genre} (eSports)`] || 0) + 1;
            });

            // 2. Obtenemos datos de la API externa de Rick and Morty
            const resRM = await fetch('https://rickandmortyapi.com/api/character');
            if (!resRM.ok) throw new Error('Error al conectar con Rick & Morty');
            const rmData = await resRM.json();

            // Agrupamos contando cuántos personajes hay de cada especie
            const speciesCount = {};
            rmData.results.forEach(char => {
                speciesCount[`👽 ${char.species} (Rick & Morty)`] = (speciesCount[`👽 ${char.species} (Rick & Morty)`] || 0) + 1;
            });

            // 3. Juntamos los dos grupos para la gráfica de pastel
            const pieData = [];
            Object.entries(genreCount).forEach(([name, y]) => pieData.push({ name, y }));
            Object.entries(speciesCount).forEach(([name, y]) => pieData.push({ name, y }));

            loading = false;

            // 4. Dibujamos la Gráfica de Pastel con Highcharts
            setTimeout(async () => {
                const Highcharts = (await import('highcharts')).default;
                
                Highcharts.chart(chartContainer, {
                    chart: { type: 'pie', backgroundColor: '#ffffff' },
                    title: { text: 'Multiverso: Géneros de eSports vs Especies de Rick & Morty' },
                    tooltip: { pointFormat: '<b>{point.y}</b> registros detectados ({point.percentage:.1f}%)' },
                    plotOptions: {
                        pie: {
                            allowPointSelect: true,
                            cursor: 'pointer',
                            dataLabels: { 
                                enabled: true, 
                                format: '<b>{point.name}</b>: {point.percentage:.1f} %' 
                            }
                        }
                    },
                    series: [{
                        name: 'Cantidad',
                        colorByPoint: true,
                        data: pieData
                    }]
                });
            }, 100);

        } catch (err) {
            error = err.message;
            loading = false;
        }
    });
</script>

<svelte:head>
    <title>Integración Rick & Morty</title>
</svelte:head>

<div class="container">
    <a href="/integrations/esportsearnings-stats" class="back-link">← Volver a mis integraciones</a>
    
    <h1>Integración: eSports vs Rick & Morty</h1>

    {#if loading}
        <div class="loading">Abriendo portales interdimensionales...</div>
    {:else if error}
        <div class="error">❌ {error}</div>
    {:else}
        <div bind:this={chartContainer} class="chart-wrapper"></div>
        
        <div class="info">
            <h3>📖 Detalles de la Integración</h3>
            <ul>
                <li><strong>API Propia:</strong> <code>/api/v2/esportsearnings-stats</code> (Géneros de juegos)</li>
                <li><strong>API Externa:</strong> <code>https://rickandmortyapi.com/api/character</code> (Especies de personajes)</li>
                <li><strong>Visualización:</strong> Highcharts (Pie) - Combinación permitida y no repetida</li>
            </ul>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1000px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .back-link { color: #7e22ce; text-decoration: none; font-weight: bold; margin-bottom: 1rem; display: inline-block; }
    h1 { color: #7e22ce; text-align: center; border-bottom: 2px solid #a855f7; padding-bottom: 0.5rem; margin-bottom: 2rem; }
    .chart-wrapper { width: 100%; height: 500px; }
    .loading { text-align: center; color: #a855f7; font-weight: bold; padding: 3rem; }
    .error { text-align: center; color: #dc2626; background: #fee2e2; padding: 1rem; border-radius: 8px; }
    .info { margin-top: 2rem; padding: 1rem; background: #faf5ff; border-radius: 8px; border-left: 4px solid #7e22ce; }
</style>
