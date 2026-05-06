<script>
    import { onMount } from 'svelte';
    
    let loading = $state(true);
    let error = $state(null);
    // @ts-ignore
    let combinedData = $state([]);
    let chartInitialized = false;
    let chartInstance = null;
    
    onMount(() => {
        fetchCombinedData();
    });
    
    async function fetchCombinedData() {
        try {
            loading = true;
            error = null;
            
            // 1. Obtener TUS datos: eSports Growth
            const esportsRes = await fetch('/api/v1/esportsgrowth-stats?limit=1000');
            if (!esportsRes.ok) throw new Error("No se pudo cargar tu API de eSports");
            const esportsData = await esportsRes.json();
            
            const playersByCountry = {};
            // @ts-ignore
            esportsData.forEach(stat => {
                const country = stat.country;
                if (country) {
                    // @ts-ignore
                    playersByCountry[country] = (playersByCountry[country] || 0) + (stat.active_player_no || 0);
                }
            });

            // Sacamos el Top 5 de países con más jugadores
            const topCountries = Object.keys(playersByCountry)
                // @ts-ignore
                .sort((a, b) => playersByCountry[b] - playersByCountry[a])
                .slice(0, 5);
            
            combinedData = [];

            // 2. Consultamos a TU PROXY BACKEND país por país
            for (const country of topCountries) {
                // @ts-ignore
                const players = playersByCountry[country];
                
                // Llamamos a nuestro servidor, y este usa el Token para llamar a GitHub
                const githubRes = await fetch(`/api/v1/esportsgrowth-stats/github/${country}`);

                if (!githubRes.ok) {
                    throw new Error(`Error en el Proxy de GitHub: ${githubRes.status}`);
                }

                const githubData = await githubRes.json();
                
                combinedData.push({
                    country: country,
                    players: players, 
                    developers: githubData.developers || 0
                });

                // Pausa de 500ms para evitar cuellos de botella
                await new Promise(r => setTimeout(r, 500));
            }
            
            loading = false;
            
            setTimeout(() => {
                initChart();
            }, 300);
            
        } catch (e) {
            console.error('Error:', e);
            // @ts-ignore
            error = e.message;
            loading = false;
        }
    }
    
    // USAMOS ECHARTS TIPO "SCATTER" (DISPERSIÓN)
    function initChart() {
        if (combinedData.length === 0) return;
        
        const container = document.getElementById('chart-container');
        if (!container) return;
        
        if (chartInstance) {
            chartInstance.dispose();
        }
        
        // @ts-ignore
        chartInstance = window.echarts.init(container);
        
        // Formato: [ejeX(Devs), ejeY(Jugadores), NombrePaís]
        // @ts-ignore
        const scatterData = combinedData.map(d => [d.developers, d.players, d.country]);
        
        const option = {
            title: { text: '' },
            tooltip: {
                trigger: 'item',
                formatter: function (params) {
                    return `<strong>${params.data[2]}</strong><br/>
                            💻 Desarrolladores GitHub: ${params.data[0].toLocaleString()}<br/>
                            🎮 Jugadores eSports: ${params.data[1].toLocaleString()} M`;
                }
            },
            grid: { left: '10%', right: '10%', bottom: '15%', containLabel: true },
            xAxis: {
                type: 'value',
                name: 'Desarrolladores en GitHub',
                nameLocation: 'middle',
                nameGap: 30,
                splitLine: { lineStyle: { type: 'dashed' } }
            },
            yAxis: {
                type: 'value',
                name: 'Jugadores eSports (M)',
                nameLocation: 'middle',
                nameGap: 40,
                splitLine: { lineStyle: { type: 'dashed' } }
            },
            series: [{
                name: 'Países',
                type: 'scatter',
                symbolSize: 30, 
                itemStyle: {
                    color: '#24292e', 
                    opacity: 0.8,
                    borderColor: '#7e22ce', 
                    borderWidth: 2
                },
                data: scatterData,
                label: {
                    show: true,
                    formatter: '{@[2]}', 
                    position: 'top',
                    color: '#333'
                }
            }]
        };
        
        chartInstance.setOption(option);
        chartInitialized = true;
    }
</script>

<svelte:head>
    <title>API Externa - GitHub OAuth</title>
    <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>
</svelte:head>

<div class="integration-container">
    <h1>🎮 eSports vs 💻 Devs (GitHub)</h1>
    <p class="subtitle">Análisis de correlación: Jugadores activos vs Programadores por país</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> eSports Growth Stats</p>
        <p><strong>API Externa:</strong> GitHub REST API (Autenticación OAuth Proxy)</p>
    </div>
    
    {#if loading}
        <div class="loading-overlay">
            <div class="spinner"></div>
            <p>Consultando API de GitHub de forma segura...</p>
        </div>
    {/if}

    {#if error}
        <div class="error">
            <p>❌ {error}</p>
        </div>
    {/if}

    <div id="chart-container" style="height: 500px; width: 100%; margin-top: 1rem; display: {combinedData.length > 0 && !loading ? 'block' : 'none'};"></div>
</div>

<style>
    .integration-container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); position: relative; min-height: 600px; }
    h1 { color: #24292e; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 1.5rem; }
    .info-api { background: #f8fafc; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 2rem; font-size: 0.85rem; border-left: 4px solid #24292e; display: flex; justify-content: space-around;}
    
    .loading-overlay { display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 3rem; }
    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #24292e; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    
    .error { text-align: center; padding: 1.5rem; color: #dc2626; background: #fee2e2; border-radius: 8px; margin-bottom: 1rem; }
</style>