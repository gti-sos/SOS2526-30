<script>
    import { onMount } from 'svelte';
    
    let loading = $state(true);
    let error = $state(null);
    // @ts-ignore
    let combinedData = $state([]);
    let chartInitialized = false;
    
    onMount(() => {
        fetchCombinedData();
    });
    
    async function fetchCombinedData() {
        try {
            loading = true;
            
            // 1. Obtener tus datos: eSports Growth
            const esportsRes = await fetch('/api/v1/esportsgrowth-stats?limit=1000');
            if (!esportsRes.ok) throw new Error("No se pudo cargar la API propia de eSports");
            const esportsData = await esportsRes.json();
            
            const playersByCountry = {};
            // @ts-ignore
            esportsData.forEach(stat => {
                const country = stat.country;
                if (country) {
                    // Supongamos que active_player_no viene en millones, lo pasamos a valor real
                    // Si ya viene en valor real, quita el * 1000000. Ajusta esto según tu base de datos.
                    const players = stat.active_player_no * 1000000; 
                    // @ts-ignore
                    playersByCountry[country] = (playersByCountry[country] || 0) + players;
                }
            });
            
            // 2. Obtener datos de la API pública Externa: REST Countries
            const countriesRes = await fetch('https://restcountries.com/v3.1/all');
            if (!countriesRes.ok) throw new Error("No se pudo contactar con la API de REST Countries");
            const countriesData = await countriesRes.json();
            
            const populationByCountry = {};
            // @ts-ignore
            countriesData.forEach(country => {
                // Guardamos el nombre común y la población
                if (country.name && country.name.common) {
                    populationByCountry[country.name.common.toLowerCase()] = country.population;
                }
            });
            
            // 3. Cruzar datos para sacar el porcentaje de jugadores sobre la población total
            combinedData = Object.keys(playersByCountry)
                .map(myCountry => {
                    const normMyCountry = myCountry.toLowerCase().trim();
                    const population = populationByCountry[normMyCountry];
                    
                    // Si encontramos el país en la API de población y tiene habitantes
                    if (population && population > 0) {
                        // @ts-ignore
                        const players = playersByCountry[myCountry];
                        // Calculamos el % de penetración
                        let percentage = (players / population) * 100;
                        
                        // Si por error de los datos da más de 100%, lo capeamos a 100
                        if (percentage > 100) percentage = 100;
                        
                        return {
                            country: myCountry,
                            percentage: Number(percentage.toFixed(2)) // Redondeamos a 2 decimales
                        };
                    }
                    return null;
                })
                .filter(item => item !== null) // Quitamos los que no cruzaron
                // @ts-ignore
                .sort((a, b) => b.percentage - a.percentage) // Ordenamos por mayor porcentaje
                .slice(0, 5); // Cogemos el TOP 5 para que el gráfico circular quede limpio
            
            loading = false;
            
            setTimeout(() => {
                initChart();
            }, 300);
            
            const overlay = document.querySelector('.loading-overlay');
            // @ts-ignore
            if (overlay) overlay.style.display = 'none';
            
        } catch (e) {
            console.error('Error:', e);
            // @ts-ignore
            error = e.message;
            loading = false;
            const overlay = document.querySelector('.loading-overlay');
            // @ts-ignore
            if (overlay) overlay.style.display = 'none';
        }
    }
    
    // USAMOS APEXCHARTS TIPO "RADIAL BAR" (Totalmente legal y espectacular para porcentajes)
    function initChart() {
        if (combinedData.length === 0 || chartInitialized) return;
        
        const container = document.querySelector('#chart-container');
        if (!container) return;
        
        const labels = combinedData.map(d => d.country);
        const seriesData = combinedData.map(d => d.percentage);
        
        const options = {
            series: seriesData,
            chart: {
                height: 500,
                type: 'radialBar',
            },
            plotOptions: {
                radialBar: {
                    offsetY: 0,
                    startAngle: 0,
                    endAngle: 270,
                    hollow: {
                        margin: 5,
                        size: '30%',
                        background: 'transparent',
                        image: undefined,
                    },
                    dataLabels: {
                        name: {
                            show: false,
                        },
                        value: {
                            show: false,
                        }
                    }
                }
            },
            colors: ['#7e22ce', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
            labels: labels,
            legend: {
                show: true,
                floating: true,
                fontSize: '16px',
                position: 'left',
                offsetX: 20,
                offsetY: 15,
                labels: {
                    useSeriesColors: true,
                },
                markers: {
                    size: 0
                },
                formatter: function(seriesName, opts) {
                    return seriesName + ":  " + opts.w.globals.series[opts.seriesIndex] + "%"
                },
                itemMargin: {
                    vertical: 5
                }
            },
            tooltip: {
                enabled: true,
                y: {
                    formatter: function(val) {
                        return val + "% de la población juega";
                    }
                }
            }
        };
        
        // @ts-ignore
        const chart = new window.ApexCharts(container, options);
        chart.render();
        
        chartInitialized = true;
    }
</script>

<svelte:head>
    <title>API Externa - Población Mundial</title>
    <!-- Importamos ApexCharts por CDN -->
    <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
</svelte:head>

<div class="integration-container">
    <h1>🌍 eSports vs 👥 Población Total</h1>
    <p class="subtitle">Penetración de mercado: ¿Qué porcentaje de la población juega a eSports? (Top 5 países)</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> eSports Growth Stats</p>
        <p><strong>API Externa:</strong> REST Countries (Pública y en tiempo real)</p>
    </div>
    
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Calculando porcentajes demográficos...</p>
    </div>
    
    {#if error}
        <div class="error">
            <p>❌ Error: {error}</p>
        </div>
    {:else}
        {#if combinedData.length === 0 && !loading}
            <div class="error" style="background: #fffbeb; color: #d97706;">
                <p>⚠️ No hay datos suficientes para calcular los porcentajes.</p>
            </div>
        {/if}
        <!-- Contenedor de la gráfica, sin tabla debajo -->
        <div id="chart-container" style="height: 550px; width: 100%; display: {combinedData.length > 0 ? 'block' : 'none'};"></div>
    {/if}
</div>

<style>
    .integration-container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); position: relative; min-height: 600px; }
    h1 { color: #7e22ce; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 1.5rem; }
    .info-api { background: #faf5ff; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 2rem; font-size: 0.85rem; border-left: 4px solid #7e22ce; display: flex; justify-content: space-around;}
    .loading-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255, 255, 255, 0.95); display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 16px; z-index: 100; }
    .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #7e22ce; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 0 auto 1rem; }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .error { text-align: center; padding: 2rem; margin-top: 1rem; color: #dc2626; background: #fee2e2; border-radius: 8px; }
</style>