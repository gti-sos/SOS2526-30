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
            
            // 0. Primero, asegurar que los datos del compañero están cargados (loadInitialData)
            try {
                const loadRes = await fetch('https://sos2526-25.onrender.com/api/v1/average-annual-temperatures/loadInitialData');
                if (!loadRes.ok) {
                    console.log('loadInitialData responded with status:', loadRes.status);
                }
            } catch (e) {
                // @ts-ignore
                console.log('loadInitialData error (probablemente ya cargado):', e.message);
            }
            
            // 1. Obtener datos de Olympics - atletas por país
            const olympicsRes = await fetch('/api/v2/olympics-athlete-events?limit=2000');
            const olympicsData = await olympicsRes.json();
            const athletes = olympicsData.data || [];
            
            // Contar atletas por país
            const athletesByCountry = {};
            // @ts-ignore
            athletes.forEach(ath => {
                const country = ath.team;
                if (country && country !== 'NA') {
                    // @ts-ignore
                    athletesByCountry[country] = (athletesByCountry[country] || 0) + 1;
                }
            });
            
            // 2. Obtener datos de Temperatures (endpoint principal)
            const tempRes = await fetch('https://sos2526-25.onrender.com/api/v1/average-annual-temperatures');
            const tempData = await tempRes.json();
            
            // 3. Combinar datos por país (último año disponible)
            const tempByCountry = {};
            // @ts-ignore
            tempData.forEach(item => {
                const country = item.country;
                // @ts-ignore
                if (country && !tempByCountry[country]) {
                    // @ts-ignore
                    tempByCountry[country] = {
                        temperature: item.temperature,
                        co2: item.co2_emission,
                        precipitation: item.precipitation,
                        year: item.year
                    };
                }
            });
            
            // 4. Preparar datos combinados (Top 10 países con más atletas)
            combinedData = Object.keys(athletesByCountry)
                // @ts-ignore
                .filter(country => tempByCountry[country])
                .map(country => ({
                    country: country,
                    // @ts-ignore
                    athletes: athletesByCountry[country] || 0,
                    // @ts-ignore
                    temperature: tempByCountry[country].temperature || 0,
                    // @ts-ignore
                    co2: tempByCountry[country].co2 || 0,
                    // @ts-ignore
                    precipitation: tempByCountry[country].precipitation || 0,
                    // @ts-ignore
                    year: tempByCountry[country].year
                }))
                .sort((a, b) => b.athletes - a.athletes)
                .slice(0, 10);
            
            loading = false;
            
            setTimeout(() => {
                initChart();
            }, 200);
            
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
    
    async function initChart() {
        if (combinedData.length === 0 || chartInitialized) return;
        
        const container = document.getElementById('chart-container');
        if (!container) {
            setTimeout(() => initChart(), 100);
            return;
        }
        
        const Highcharts = await import('highcharts');
        const HC = Highcharts.default;
        
        const categories = combinedData.map(d => d.country);
        const athletesData = combinedData.map(d => d.athletes);
        const temperatureData = combinedData.map(d => d.temperature);
        
        HC.chart('chart-container', {
            accessibility: { enabled: false },
            chart: { type: 'bar', height: 500 },
            title: { text: '🏅 Atletas Olímpicos vs 🌡️ Temperatura media por país' },
            subtitle: { text: 'Comparativa entre número de atletas y temperatura media (datos combinados)' },
            xAxis: { categories: categories, title: { text: 'País' } },
            yAxis: [
                { title: { text: 'Número de Atletas' }, opposite: false },
                { title: { text: 'Temperatura media (°C)' }, opposite: true }
            ],
            tooltip: { shared: true },
            plotOptions: { bar: { dataLabels: { enabled: true, format: '{point.y}' } } },
            series: [
                { name: 'Atletas Olímpicos', data: athletesData, color: '#0284c7', yAxis: 0 },
                { name: 'Temperatura media (°C)', data: temperatureData, color: '#f59e0b', yAxis: 1 }
            ]
        });
        
        chartInitialized = true;
    }
    
    // @ts-ignore
    function formatNumber(num) {
        if (num > 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num > 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
</script>

<div class="integration-container">
    <h1>🏅 Atletas Olímpicos vs 🌡️ Temperatura media por país</h1>
    <p class="subtitle">Relación entre número de atletas y temperatura media (datos combinados)</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Olympics Athlete Events - Número de atletas por país</p>
        <p><strong>API 2 (compañero):</strong> Average Annual Temperatures - Temperatura media por país</p>
        <p><strong>Fuente:</strong> Grupo 25 - SOS</p>
    </div>
    
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Cargando datos combinados...</p>
    </div>
    
    {#if error}
        <div class="error">
            <p>❌ Error: {error}</p>
        </div>
    {:else}
        <div id="chart-container" style="height: 550px; width: 100%; margin-bottom: 2rem;"></div>
        
        <div class="table-container">
            <h3>📋 Datos combinados</h3>
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>País</th>
                            <th>Atletas Olímpicos</th>
                            <th>Temperatura media (°C)</th>
                            <th>CO2 emitido</th>
                            <th>Precipitación (mm)</th>
                            <th>Año dato</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each combinedData as item}
                            <tr>
                                <td><strong>{item.country}</strong></td>
                                <td>{item.athletes.toLocaleString()}</td>
                                <td>{item.temperature.toFixed(1)}°C</td>
                                <td>{formatNumber(item.co2)} t</td>
                                <td>{item.precipitation} mm</td>
                                <td>{item.year}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}
    
    <div class="info">
        <h3>📖 Interpretación</h3>
        <ul>
            <li><strong>Objetivo:</strong> Comparar éxito deportivo (atletas) con temperatura media por país</li>
            <li><strong>Gráfico:</strong> Barras horizontales (bar) con Highcharts</li>
            <li><strong>Relación:</strong> Países con más atletas vs su temperatura media</li>
        </ul>
    </div>
</div>

<style>
    .integration-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        position: relative;
        min-height: 600px;
    }
    
    h1 { color: #0369a1; text-align: center; margin-bottom: 0.5rem; }
    .subtitle { text-align: center; color: #666; margin-bottom: 1rem; }
    
    .info-api {
        background: #f0f9ff;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        font-size: 0.85rem;
        border-left: 4px solid #0284c7;
    }
    
    .loading-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border-radius: 16px;
        z-index: 100;
    }
    
    .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #0284c7;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .error {
        text-align: center;
        padding: 2rem;
        margin-top: 1rem;
        color: #dc2626;
        background: #fee2e2;
        border-radius: 8px;
    }
    
    .table-container {
        margin-top: 2rem;
        border-top: 1px solid #e2e8f0;
        padding-top: 1rem;
    }
    
    .table-wrapper { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    th, td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; color: #0369a1; }
    tr:hover { background: #f0f9ff; }
    
    .info {
        margin-top: 2rem;
        padding: 1rem;
        background: #f0f9ff;
        border-radius: 12px;
        border: 1px solid #bae6fd;
    }
    .info h3 { color: #0369a1; margin-top: 0; }
</style>