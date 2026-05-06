<script>
    import { onMount, tick } from 'svelte';
    import Highcharts from 'highcharts';

    let loading = $state(true);
    let error = $state(null);

    onMount(async () => {
        await tick();
        try {
            // 1. TUS DATOS
            let resE = await fetch('/api/v2/esportsearnings-stats');
            let esportsData = await resE.json();
            
            if (!esportsData || esportsData.length === 0) {
                await fetch('/api/v2/esportsearnings-stats/loadInitialData');
                resE = await fetch('/api/v2/esportsearnings-stats');
                esportsData = await resE.json();
            }

            // 2. DATOS GRUPO 29 (Llamando a tu nuevo PROXY Express)
            const resC = await fetch('/proxy/citys-stats');
        // NUEVO SISTEMA DE DETECCIÓN DE ERRORES:
            if (!resC.ok) {
                let motivo = resC.statusText;
                try {
                    // Intentamos leer el mensaje exacto que nos devuelve axios desde el proxy
                    const errJson = await resC.json(); 
                    if(errJson.error) motivo = errJson.error;
                } catch(e) {} // Si no es un JSON, ignoramos
                
                throw new Error(`La API del Grupo 29 está fallando (Estado: ${resC.status}). Motivo reportado: ${motivo}`);
            }
            
            const citysData = await resC.json();

            // 3. PROCESAR DATOS (Agrupar por año)
            const moneyByYear = {};
            esportsData.forEach(d => { 
                if(d.year) moneyByYear[d.year] = (moneyByYear[d.year] || 0) + (d.total_money / 1000000);
            });
            
            const cityRecordsByYear = {};
            citysData.forEach(d => {
                if(d.year) cityRecordsByYear[d.year] = (cityRecordsByYear[d.year] || 0) + 1;
            });

            const allYears = Object.keys(moneyByYear).sort();
            const esportsValues = allYears.map(y => moneyByYear[y] || 0);
            const citysValues = allYears.map(y => cityRecordsByYear[y] || 0);

            loading = false;

            // 4. DIBUJAR GRÁFICA (Highcharts - Spline)
            setTimeout(() => {
                Highcharts.chart('chart-proxy', {
                    chart: { type: 'spline' },
                    title: { text: 'Evolución: eSports vs Ciudades (G29)', style: { color: '#7e22ce' } },
                    xAxis: { categories: allYears, title: { text: 'Año' } },
                    yAxis: [
                        { title: { text: 'Premios eSports (M$)', style: { color: '#a855f7' } } },
                        { title: { text: 'Registros de Ciudades', style: { color: '#0ea5e9' } }, opposite: true }
                    ],
                    series: [
                        { name: 'Dinero eSports (M$)', data: esportsValues, color: '#a855f7' },
                        { name: 'Registros G29', data: citysValues, yAxis: 1, color: '#0ea5e9' }
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
        <div class="loading">Conectando con Proxy...</div>
    {:else if error}
        <div class="error">❌ Error: {error}</div>
    {/if}
</div>

<style>
    .container { max-width: 1000px; margin: 2rem auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; font-weight: bold; }
    h1 { color: #7e22ce; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 2rem; }
    .loading { text-align: center; padding: 3rem; color: #7e22ce; font-weight: bold; }
    .error { text-align: center; padding: 2rem; color: #dc2626; background: #fee2e2; border-radius: 8px; margin-top: 2rem; }
</style>
