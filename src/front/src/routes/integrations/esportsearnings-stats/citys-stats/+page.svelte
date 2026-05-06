<script>
    import { onMount, tick } from 'svelte';
    import Highcharts from 'highcharts';

    let loading = $state(true);
    let error = $state(null);

    onMount(async () => {
        await tick();
        try {
            // 1. TUS DATOS (eSports Earnings)
            let resE = await fetch('/api/v2/esportsearnings-stats');
            let esportsData = await resE.json();
            
            if (!esportsData || esportsData.length === 0) {
                await fetch('/api/v2/esportsearnings-stats/loadInitialData');
                resE = await fetch('/api/v2/esportsearnings-stats');
                esportsData = await resE.json();
            }

            // 2. DATOS GRUPO 29 (Llamando a tu nuevo PROXY Express)
            const resC = await fetch('/proxy/citys-stats');
            if (!resC.ok) throw new Error(`Fallo en el proxy (Estado: ${resC.status})`);
            let citysDataRaw = await resC.json();

            // Extraemos el array correcto venga como venga
            let citysData = Array.isArray(citysDataRaw) ? citysDataRaw : (citysDataRaw.data || []);

            // 3. PROCESAR DATOS (Premios Millonarios vs Población Millonaria)
            const maxRows = Math.min(esportsData.length, citysData.length, 10);
            const labels = [];
            const esportsValues = [];
            const citysValues = [];

            for(let i = 0; i < maxRows; i++) {
                const gameName = esportsData[i]?.game_name || 'Juego';
                // Convertimos tus premios a millones de dólares
                const moneyMillions = (Number(esportsData[i]?.total_money) || 0) / 1000000;

                // Leemos exactamente los campos de la API de tu compañero
                const cityNameRaw = citysData[i]?.city || `Ciudad ${i+1}`;
                const populationRaw = Number(citysData[i]?.un_2025_population) || 0;
                
                // Convertimos su población a millones de habitantes
                const populationMillions = populationRaw / 1000000;

                // Ponemos la primera letra de la ciudad en mayúscula (ej: "jakarta" -> "Jakarta")
                const cityCapitalized = cityNameRaw.charAt(0).toUpperCase() + cityNameRaw.slice(1);

                labels.push(`${gameName.substring(0, 15)} / ${cityCapitalized}`);
                
                // Guardamos los valores redondeados a 2 decimales
                esportsValues.push(Number(moneyMillions.toFixed(2)));
                citysValues.push(Number(populationMillions.toFixed(2)));
            }

            loading = false;
            await tick(); // Esperamos a que Svelte pinte el div

            // 4. DIBUJAR GRÁFICA (Highcharts - Spline)
            setTimeout(() => {
                Highcharts.chart('chart-proxy', {
                    chart: { type: 'spline' },
                    title: { text: 'Impacto Global: eSports vs Población de Ciudades (G29)', style: { color: '#7e22ce' } },
                    xAxis: { categories: labels, title: { text: 'Juego / Ciudad' } },
                    yAxis: [
                        { title: { text: 'Premios eSports (Millones $)', style: { color: '#a855f7' } } },
                        { title: { text: 'Población 2025 (Millones Hab.)', style: { color: '#0ea5e9' } }, opposite: true }
                    ],
                    series: [
                        { name: 'Dinero eSports (M$)', data: esportsValues, color: '#a855f7', tooltip: { valueSuffix: ' M$' } },
                        { name: 'Población Ciudad (M)', data: citysValues, yAxis: 1, color: '#0ea5e9', tooltip: { valueSuffix: ' Millones' } }
                    ],
                    tooltip: { shared: true }
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
    <h1>🎮 eSports vs 🏙️ Ciudades (G29)</h1>
    <p class="subtitle">Integración mediante Proxy Propio (Cumplimiento de Requisito SOS)</p>
    
    <div id="chart-proxy" style="height: 500px; margin-top: 2rem;"></div>
    
    {#if loading}
        <div class="loading">Conectando con Proxy y sincronizando datos...</div>
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
