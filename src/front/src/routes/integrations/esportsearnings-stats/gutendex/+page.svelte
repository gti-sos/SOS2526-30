<script>
    import { onMount, tick } from 'svelte';

    let loading = true;
    let error = null;
    let tableData = [];

    onMount(async () => {
        await tick();
        try {
            // 1. TUS DATOS
            let resEsports = await fetch('/api/v2/esportsearnings-stats');
            let esportsData = await resEsports.json();
            if (!esportsData || esportsData.length === 0) {
                await fetch('/api/v2/esportsearnings-stats/loadInitialData');
                resEsports = await fetch('/api/v2/esportsearnings-stats');
                esportsData = await resEsports.json();
            }

            // 2. API EXTERNA: Gutendex (Libros) ¡Sin proxies que fallen!
            const resBooks = await fetch('https://gutendex.com/books/?ids=1,2,3,4,5,6,7,8,9,10');
            const booksData = await resBooks.json();

            // Mezclamos los datos para la tabla
            const maxRows = Math.min(esportsData.length, booksData.results.length, 10);
            for(let i = 0; i < maxRows; i++) {
                tableData.push({
                    rank: i + 1,
                    game: esportsData[i].game_name || 'Desconocido',
                    players: esportsData[i].total_players || 0,
                    book: booksData.results[i].title,
                    downloads: booksData.results[i].download_count
                });
            }

            loading = false;
        } catch (err) { 
            error = err.message; 
            loading = false; 
        }
    });
</script>

<div class="container">
    <a href="/integrations/esportsearnings-stats" class="back-link">← Volver</a>
    <h1>🎮 eSports vs 📚 Libros Clásicos</h1>
    <p class="subtitle">Integración Textual en HTML (Cumplimiento Regla 6.i)</p>
    
    {#if loading}
        <div class="loading">Recopilando datos de la biblioteca...</div>
    {:else if error}
        <div class="error">{error}</div>
    {:else}
        <div class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Top</th>
                        <th>Juego (eSports)</th>
                        <th>Nº Jugadores</th>
                        <th>Libro (Gutendex)</th>
                        <th>Nº Descargas</th>
                    </tr>
                </thead>
                <tbody>
                    {#each tableData as row}
                        <tr>
                            <td>#{row.rank}</td>
                            <td class="highlight-purple">{row.game}</td>
                            <td>{row.players.toLocaleString()}</td>
                            <td class="highlight-green">{row.book}</td>
                            <td>{row.downloads.toLocaleString()}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; font-weight: bold; }
    h1 { color: #7e22ce; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 2rem; }
    
    .table-wrapper { overflow-x: auto; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; background: white; }
    .data-table th { background: #f3e8ff; color: #7e22ce; padding: 1rem; font-weight: bold; border-bottom: 2px solid #e9d5ff; }
    .data-table td { padding: 1rem; border-bottom: 1px solid #f3f4f6; color: #4b5563; }
    .data-table tbody tr:hover { background: #faf5ff; }
    
    .highlight-purple { font-weight: bold; color: #9333ea; }
    .highlight-green { font-weight: bold; color: #059669; }
    
    .loading { text-align: center; padding: 2rem; color: #7e22ce; }
    .error { text-align: center; padding: 3rem; color: #dc2626; background: #fee2e2; border-radius: 8px; }
</style>
