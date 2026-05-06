<script>
    import { onMount, tick } from 'svelte';
    import Highcharts from 'highcharts'; // Usamos Highcharts, que ya lo tienes instalado

    let loading = $state(true);
    let error = $state(null);

    onMount(async () => {
        await tick();
        try {
            // 1. TUS DATOS (eSports)
            let resEsports = await fetch('/api/v2/esportsearnings-stats');
            let esportsData = await resEsports.json();
            
            if (!esportsData || esportsData.length === 0) {
                await fetch('/api/v2/esportsearnings-stats/loadInitialData');
                resEsports = await fetch('/api/v2/esportsearnings-stats');
                esportsData = await resEsports.json();
            }

            // 2. NUEVA API EXTERNA: TVMaze (Series de TV)
            const resTV = await fetch('https://api.tvmaze.com/shows');
            if (!resTV.ok) throw new Error('Fallo al conectar con TVMaze');
            const tvData = await resTV.json();

            // 3. Cruzamos los datos y preparamos los arrays para Highcharts
            const maxRows = Math.min(esportsData.length, tvData.length, 10);
            const labels = [];
            const playersData = [];
            const ratingsData = [];
            
            for(let i = 0; i < maxRows; i++) {
                const gameName = esportsData[i].game_name || 'Desconocido';
                const showName = tvData[i].name || 'Desconocida';
                
                labels.push(`${gameName} / ${showName}`); 
                playersData.push(esportsData[i].player_no || 0);
                ratingsData.push(tvData[i].rating?.average || 0);
            }

            loading = false;

            // 4. DIBUJAR LA GRÁFICA (Highcharts - Tipo: areaspline)
            setTimeout(() => {
                Highcharts.chart('tvmaze-chart', {
                    chart: { 
                        type: 'areaspline' // ¡TIPO CLAVE! No es "line", y nadie de tu grupo lo tiene.
                    }, 
                    title: { text: 'Comparativa: eSports vs Series (TVMaze)', style: { color: '#7e22ce' } },
                    xAxis: { 
                        categories: labels,
                        title: { text: 'Juego / Serie' }
                    },
                    yAxis: [
                        { title: { text: 'Nº Jugadores', style: { color: '#a855f7' } } },
                        { title: { text: 'Nota Serie (0-10)', style: { color: '#0ea5e9' } }, opposite: true } // Eje derecho
                    ],
                    tooltip: { shared: true },
                    plotOptions: {
                        areaspline: { fillOpacity: 0.4 } // Hace que el color del área sea transparente
                    },
                    series: [
                        { name: 'Jugadores eSports', data: playersData, color: '#a855f7' },
                        { name: 'Nota Serie (TVMaze)', data: ratingsData, yAxis: 1, color: '#0ea5e9' }
                    ]
                });
            }, 100);

        } catch (err) { 
            console.error(err);
            error = err.message; 
            loading = false; 
        }
    });
</script>

<div class="container">
    <a href="/integrations/esportsearnings-stats" class="back-link">← Volver a mis integraciones</a>
    <h1>🎮 eSports vs 📺 Series de TV (TVMaze)</h1>
    <p class="subtitle">Integración mediante Gráfico de Área Suavizada (Highcharts: areaspline)</p>
    
    <!-- Contenedor del Canvas para Highcharts -->
    <div id="tvmaze-chart" style="height: 500px; margin-top: 2rem; border-radius: 8px; overflow: hidden;"></div>

    {#if loading}
        <div class="loading">Cargando datos y generando gráfica...</div>
    {:else if error}
        <div class="error">❌ Error: {error}</div>
    {/if}
</div>

<style>
    .container { max-width: 1000px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; font-weight: bold; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #7e22ce; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 2rem; }
    .loading { text-align: center; padding: 3rem; color: #7e22ce; font-weight: bold; }
    .error { text-align: center; padding: 2rem; color: #dc2626; background: #fee2e2; border-radius: 8px; margin-top: 2rem; }
</style>
