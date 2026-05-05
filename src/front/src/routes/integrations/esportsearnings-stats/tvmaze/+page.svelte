<script>
    import { onMount, tick } from 'svelte';

    // ¡EL TRUCO MÁGICO! Le decimos a Svelte que estas variables deben actualizar la pantalla
    let loading = $state(true);
    let error = $state(null);
    let tableData = $state([]);

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

            // 3. Cruzamos los datos usando una variable temporal
            const maxRows = Math.min(esportsData.length, tvData.length, 10);
            let tempData = []; // Array temporal
            
            for(let i = 0; i < maxRows; i++) {
                tempData.push({
                    rank: i + 1,
                    game: esportsData[i].game_name || 'Desconocido',
                    players: esportsData[i].player_no || 0,
                    show: tvData[i].name || 'Desconocida',
                    rating: tvData[i].rating?.average || 'N/A'
                });
            }

            // 4. Asignamos los datos finales (Esto dispara la actualización de la pantalla)
            tableData = tempData;
            loading = false;

        } catch (err) { 
            console.error(err);
            error = err.message; 
            loading = false; 
        }
    });
</script>

<!-- ESTA ES LA PARTE QUE FALTABA PARA QUE SE VEA EN PANTALLA -->
<div class="container">
    <a href="/integrations/esportsearnings-stats" class="back-link">← Volver a mis integraciones</a>
    <h1>🎮 eSports vs 📺 Series de TV (TVMaze)</h1>
    <p class="subtitle">Integración Textual en HTML (Cumplimiento Regla 6.i)</p>
    
    {#if loading}
        <div class="loading">Cargando catálogo de series...</div>
    {:else if error}
        <div class="error">❌ Error: {error}</div>
    {:else}
        <div class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Top</th>
                        <th>Juego (eSports)</th>
                        <th>Nº Jugadores</th>
                        <th>Serie de TV</th>
                        <th>Nota (Sobre 10)</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tableData as row}
                        <tr>
                            <td class="rank-col">#{row.rank}</td>
                            <td class="highlight-purple">{row.game}</td>
                            <td>{row.players.toLocaleString()} 👤</td>
                            <td class="highlight-blue">{row.show}</td>
                            <td>⭐ {row.rating}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1000px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; font-weight: bold; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #7e22ce; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 2rem; }
    
    .table-wrapper { overflow-x: auto; border-radius: 8px; border: 1px solid #e5e7eb; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; background: white; }
    .data-table th { background: #f3e8ff; color: #7e22ce; padding: 1rem; font-weight: bold; border-bottom: 2px solid #d8b4fe; }
    .data-table td { padding: 1rem; border-bottom: 1px solid #f3f4f6; color: #4b5563; }
    .data-table tbody tr:hover { background: #faf5ff; }
    
    .rank-col { font-weight: bold; color: #9ca3af; }
    .highlight-purple { font-weight: bold; color: #9333ea; }
    .highlight-blue { font-weight: bold; color: #2563eb; }
    
    .loading { text-align: center; padding: 3rem; color: #7e22ce; font-weight: bold; }
    .error { text-align: center; padding: 2rem; color: #dc2626; background: #fee2e2; border-radius: 8px; margin-top: 2rem; }
</style>
