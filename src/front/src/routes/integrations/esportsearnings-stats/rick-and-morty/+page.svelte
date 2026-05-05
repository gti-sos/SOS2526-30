<script>
    import { onMount, tick } from 'svelte';
    // Importamos Highcharts
    import Highcharts from 'highcharts';

    let loading = true;
    let error = null;
    let chartData = [];

    onMount(async () => {
        await tick(); // Esto es clave en vuestro proyecto
        
        try {
            // 1. FETCH TUS DATOS (con auto-carga si está vacío)
            let resEsports = await fetch('/api/v2/esportsearnings-stats');
            let esportsData = await resEsports.json();
            
            if (!esportsData || esportsData.length === 0) {
                await fetch('/api/v2/esportsearnings-stats/loadInitialData');
                resEsports = await fetch('/api/v2/esportsearnings-stats');
                esportsData = await resEsports.json();
            }

            // Agrupamos géneros
            const genreCount = {};
            esportsData.forEach(item => {
                const genre = item.genre || 'Otros';
                genreCount[`🎮 ${genre}`] = (genreCount[`🎮 ${genre}`] || 0) + 1;
            });

            // 2. FETCH API EXTERNA
            const resRM = await fetch('https://rickandmortyapi.com/api/character');
            const rmData = await resRM.json();

            const speciesCount = {};
            rmData.results.forEach(char => {
                speciesCount[`👽 ${char.species}`] = (speciesCount[`👽 ${char.species}`] || 0) + 1;
            });

            // 3. PREPARAR DATOS PIE
            const finalData = [];
            Object.entries(genreCount).forEach(([name, y]) => finalData.push({ name, y }));
            Object.entries(speciesCount).forEach(([name, y]) => finalData.push({ name, y }));

            loading = false;

            // 4. DIBUJAR (Usando setTimeout como en vuestros ejemplos)
            setTimeout(() => {
                Highcharts.chart('chart-div', {
                    chart: { type: 'polarArea', backgroundColor: 'transparent' },
                    title: { text: 'eSports vs Rick & Morty', style: { color: '#7e22ce' } },
                    series: [{ name: 'Registros', data: finalData }]
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
    <a href="/integrations/esportsearnings-stats" class="back-link">← Volver</a>
    <h1>🎮 eSports + Rick & Morty 👽</h1>
    <p class="subtitle">Integración de géneros de juegos y especies del multiverso</p>
    
    <div id="chart-div" style="height: 500px; width: 100%;"></div>
    
    {#if loading}
        <div class="loading">Cargando datos interdimensionales...</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {/if}

    <div class="info-note">
        <p><strong>📌 Detalles:</strong></p>
        <ul>
            <li>API Propia: eSports Earnings Stats</li>
            <li>API Externa: Rick & Morty API</li>
            <li>Librería: Highcharts (Pie Chart)</li>
        </ul>
    </div>
</div>

<style>
    /* Estilos copiados de tu compañero para asegurar que se vea igual */
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    h1 { color: #7e22ce; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .loading { text-align: center; padding: 2rem; color: #7e22ce; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
    .info-note { margin-top: 2rem; padding: 1rem; background: #faf5ff; border-radius: 8px; font-size: 0.85rem; color: #666; border-left: 4px solid #7e22ce; }
</style>
