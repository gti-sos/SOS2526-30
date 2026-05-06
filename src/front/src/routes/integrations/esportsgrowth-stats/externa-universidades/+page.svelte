<script>
    import { onMount } from 'svelte';
    
    let loading = $state(true);
    let error = $state(null);
    // @ts-ignore
    let combinedData = $state([]);
    let chartInstance = null;
    
    onMount(() => {
        fetchCombinedData();
    });
    
    async function fetchCombinedData() {
        try {
            loading = true;
            
            // 1. Obtener tus datos: eSports Growth
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

            // Top 5 de países
            const topCountries = Object.keys(playersByCountry)
                // @ts-ignore
                .sort((a, b) => playersByCountry[b] - playersByCountry[a])
                .slice(0, 5);
            
            combinedData = [];

            // 2. Consultamos a TU PROXY país por país
            for (const country of topCountries) {
                // @ts-ignore
                const players = playersByCountry[country];
                
                // Llamamos a nuestro proxy seguro
                const uniRes = await fetch(`/api/v1/esportsgrowth-stats/universities/${country}`);

                if (!uniRes.ok) throw new Error(`Error en el Proxy: ${uniRes.status}`);

                const uniData = await uniRes.json();
                
                combinedData.push({
                    country: country,
                    players: players, 
                    universities: uniData.universitiesCount || 0
                });

                // Pequeña pausa para no saturar
                await new Promise(r => setTimeout(r, 300));
            }
            
            loading = false;
            
            setTimeout(() => {
                initChart();
            }, 100);
            
        } catch (e) {
            console.error('Error:', e);
            // @ts-ignore
            error = e.message;
            loading = false;
        }
    }
    
    // USAMOS CHART.JS (Gráfico Mixto: Barras + Línea)
    function initChart() {
        if (combinedData.length === 0) return;
        
        const canvas = document.getElementById('myChart');
        if (!canvas) return;
        
        if (chartInstance) {
            chartInstance.destroy();
        }
        
        const labels = combinedData.map(d => d.country);
        const playersData = combinedData.map(d => d.players);
        const universitiesData = combinedData.map(d => d.universities);
        
        // @ts-ignore
        chartInstance = new window.Chart(canvas, {
            type: 'bar', // Tipo base
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Número de Universidades',
                        type: 'line', // Mezclamos con una línea
                        data: universitiesData,
                        borderColor: '#ec4899',
                        backgroundColor: '#ec4899',
                        borderWidth: 3,
                        tension: 0.3,
                        yAxisID: 'y1',
                        marker: { radius: 5 }
                    },
                    {
                        label: 'Jugadores de eSports (Millones)',
                        type: 'bar', // Barras
                        data: playersData,
                        backgroundColor: 'rgba(126, 34, 206, 0.7)',
                        borderColor: '#7e22ce',
                        borderWidth: 1,
                        borderRadius: 6,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: { display: true, text: 'Jugadores (M)' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        title: { display: true, text: 'Universidades' },
                        grid: { drawOnChartArea: false } // Para que no se crucen las líneas del fondo
                    }
                },
                plugins: {
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleFont: { size: 16 },
                        bodyFont: { size: 14 },
                        padding: 15
                    }
                }
            }
        });
    }
</script>

<svelte:head>
    <title>API Externa - Universidades</title>
    <!-- Importamos Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</svelte:head>

<div class="integration-container">
    <h1>🎓 Universidades vs 🎮 eSports</h1>
    <p class="subtitle">¿Tienen los países más gamers una mayor infraestructura educativa universitaria?</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> eSports Growth Stats</p>
        <p><strong>API Externa:</strong> HipoLabs Universities API (A través de Proxy en Backend)</p>
    </div>
    
    {#if loading}
        <div class="loading-overlay">
            <div class="spinner"></div>
            <p>Cruzando bases de datos globales...</p>
        </div>
    {/if}

    {#if error}
        <div class="error">
            <p>❌ {error}</p>
        </div>
    {/if}

    <div class="chart-wrapper" style="display: {combinedData.length > 0 && !loading ? 'block' : 'none'};">
        <canvas id="myChart"></canvas>
    </div>
</div>

<style>
    .integration-container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); position: relative; min-height: 600px; }
    h1 { color: #ec4899; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 1.5rem; }
    .info-api { background: #fdf2f8; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 2rem; font-size: 0.85rem; border-left: 4px solid #ec4899; display: flex; justify-content: space-around;}
    
    .loading-overlay { display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 3rem; }
    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #ec4899; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    
    .error { text-align: center; padding: 1.5rem; color: #dc2626; background: #fee2e2; border-radius: 8px; margin-bottom: 1rem; }
    
    .chart-wrapper { position: relative; height: 500px; width: 100%; margin-top: 1rem; }
</style>