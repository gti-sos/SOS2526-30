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
                    players: esportsData[i].total_players || 0,
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
