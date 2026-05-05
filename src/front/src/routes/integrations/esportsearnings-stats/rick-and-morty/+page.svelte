<script>
    import { onMount, tick } from 'svelte';
    // ¡Cambio clave! Usamos Chart.js en lugar de Highcharts
    import Chart from 'chart.js/auto';

    let loading = true;
    let error = null;
    let chart = null;

    onMount(async () => {
        await tick(); 
        
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

            // 3. PREPARAR DATOS PARA CHART.JS
            const labels = [...Object.keys(genreCount), ...Object.keys(speciesCount)];
            const values = [...Object.values(genreCount), ...Object.values(speciesCount)];

            loading = false;

            // 4. DIBUJAR LA GRÁFICA POLAR
            await new Promise(resolve => setTimeout(resolve, 150));
            
            const canvas = document.getElementById('chartCanvas');
            if (!canvas) throw new Error('No se encontró el canvas');
            
            const ctx = canvas.getContext('2d');
            if (chart) chart.destroy();
            
            chart = new Chart(ctx, {
                type: 'polarArea', // Ahora sí funcionará porque es Chart.js
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: [
                            'rgba(168, 85, 247, 0.7)', 
                            'rgba(126, 34, 206, 0.7)',
                            'rgba(107, 33, 165, 0.7)',
                            'rgba(76, 29, 149, 0.7)',
                            'rgba(14, 165, 233, 0.7)', 
                            'rgba(2, 132, 199, 0.7)',
                            'rgba(3, 105, 161, 0.7)'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });

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
    
    <!-- Cambio clave: Chart.js necesita un canvas, no un div vacío -->
    <div style="height: 500px; position: relative;">
        <canvas id="chartCanvas"></canvas>
    </div>
    
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
            <li>Librería: Chart.js (Tipo polarArea)</li>
        </ul>
    </div>
</div>

<style>
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    h1 { color: #7e22ce; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .loading { text-align: center; padding: 2rem; color: #7e22ce; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
    .info-note { margin-top: 2rem; padding: 1rem; background: #faf5ff; border-radius: 8px; font-size: 0.85rem; color: #666; border-left: 4px solid #7e22ce; }
</style>
