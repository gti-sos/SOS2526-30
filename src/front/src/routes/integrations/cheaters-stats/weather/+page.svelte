<script>
    import { onMount, tick } from 'svelte';
    import Chart from 'chart.js/auto';
    
    let loading = true;
    let error = null;
    let chart = null;
    let yearsList = [];
    let patStatus = null;
    let cheatersDataRaw = [];
    let currentWeather = null;
    let forecast = [];
    let yearlyTemps = {};
    let selectedCity = 'Madrid';
    let cities = ['Madrid', 'London', 'Paris', 'Berlin', 'Rome', 'New York', 'Tokyo'];
    
    onMount(async () => {
        await tick();
        await loadWeatherIntegration();
    });
    
    async function loadWeatherIntegration() {
        try {
            loading = true;
            console.log('🌤️ Cargando integración: Cheaters Stats + OpenWeather API (con PAT)...');
            
            // 1. Verificar estado del PAT
            const patStatusRes = await fetch('/api/weather/status');
            patStatus = await patStatusRes.json();
            console.log('Estado PAT OpenWeather:', patStatus);
            
            // 2. FETCH Cheaters Stats
            const cheatersRes = await fetch('/api/v2/cheaters-stats?limit=200');
            const cheatersJson = await cheatersRes.json();
            const cheatersData = cheatersJson.data || [];
            cheatersDataRaw = cheatersData;
            console.log(`Cheaters: ${cheatersData.length} registros`);
            
            // 3. FETCH clima actual
            const weatherRes = await fetch(`/api/weather/weather?city=${selectedCity}`);
            const weatherJson = await weatherRes.json();
            if (weatherJson.success) {
                currentWeather = weatherJson;
            }
            
            // 4. FETCH temperaturas anuales
            const tempsRes = await fetch('/api/weather/yearly-temperatures');
            const tempsJson = await tempsRes.json();
            if (tempsJson.success) {
                yearlyTemps = tempsJson.years;
            }
            
            // 5. FETCH pronóstico
            const forecastRes = await fetch(`/api/weather/forecast?city=${selectedCity}&limit=40`);
            const forecastJson = await forecastRes.json();
            if (forecastJson.success) {
                forecast = forecastJson.forecast.slice(0, 5);
            }
            
            // 6. Agrupar Cheaters por AÑO
            const cheatersByYear = {};
            cheatersData.forEach(item => {
                const year = item.year;
                if (year) {
                    cheatersByYear[year] = (cheatersByYear[year] || 0) + (item.cheater_report || 0);
                }
            });
            
            const years = Object.keys(cheatersByYear).sort();
            yearsList = years;
            
            const reportsData = years.map(y => cheatersByYear[y] || 0);
            
            // 7. Obtener temperaturas para los mismos años
            const tempData = years.map(y => yearlyTemps[y] || 14.5);
            
            // Normalizar datos
            const maxReports = Math.max(...reportsData);
            const maxTemp = Math.max(...tempData);
            const minTemp = Math.min(...tempData);
            
            const normalizedReports = reportsData.map(r => maxReports > 0 ? (r / maxReports) * 100 : 0);
            const normalizedTemps = tempData.map(t => ((t - minTemp) / (maxTemp - minTemp)) * 100);
            
            // 8. Renderizar gráfico
            const canvas = document.getElementById('chart');
            if (!canvas) throw new Error('Canvas no encontrado');
            
            const ctx = canvas.getContext('2d');
            if (chart) chart.destroy();
            
            chart = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: years,
                    datasets: [
                        {
                            label: '📊 Reportes de Tramposos (Cheaters)',
                            data: normalizedReports,
                            backgroundColor: 'rgba(124,58,237,0.2)',
                            borderColor: '#7e22ce',
                            borderWidth: 3,
                            pointBackgroundColor: '#7e22ce',
                            pointBorderColor: 'white',
                            pointRadius: 5,
                            fill: true
                        },
                        {
                            label: '🌡️ Temperatura Global Promedio (°C)',
                            data: normalizedTemps,
                            backgroundColor: 'rgba(239,68,68,0.2)',
                            borderColor: '#ef4444',
                            borderWidth: 3,
                            pointBackgroundColor: '#ef4444',
                            pointBorderColor: 'white',
                            pointRadius: 5,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: { 
                            display: true, 
                            text: '🌡️ Reportes de Tramposos vs Temperatura Global', 
                            color: '#991b1b', 
                            font: { size: 16, weight: 'bold' } 
                        },
                        subtitle: { 
                            display: true, 
                            text: 'Gráfico de Radar - Datos de OpenWeather API con PAT' 
                        },
                        tooltip: { 
                            callbacks: { 
                                label: (ctx) => {
                                    const index = ctx.dataIndex;
                                    const year = years[index];
                                    const reportsReal = reportsData[index];
                                    const tempReal = tempData[index];
                                    
                                    if (ctx.dataset.label.includes('Reportes')) {
                                        return `📊 Reportes ${year}: ${reportsReal.toLocaleString()}`;
                                    } else {
                                        return `🌡️ Temperatura ${year}: ${tempReal.toFixed(2)}°C`;
                                    }
                                }
                            }
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: true,
                            max: 100,
                            ticks: { stepSize: 20, callback: (val) => `${val}%` }
                        }
                    }
                }
            });
            
            loading = false;
            console.log('✅ Gráfico creado correctamente');
            
        } catch (err) {
            console.error('❌ Error:', err);
            error = err.message;
            loading = false;
        }
    }
    
    async function changeCity() {
        await loadWeatherIntegration();
    }
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver a Cheaters Stats</a>
    <h1>🌡️ OpenWeather API + Cheaters Stats</h1>
    <p class="subtitle">Gráfico de Radar: Evolución anual de reportes vs temperatura global</p>
    
    <div style="height: 500px; width: 100%; margin-bottom: 2rem;">
        <canvas id="chart" style="width: 100%; height: 100%;"></canvas>
    </div>
    
    {#if loading}
        <div class="loading">🌤️ Cargando datos de OpenWeather API con PAT...</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else}
        <div class="pat-status {patStatus?.authenticated ? 'success' : 'error'}">
            <strong>🔐 Estado PAT:</strong> 
            {patStatus?.authenticated ? '✅ Autenticado' : '❌ No autenticado'}
        </div>
        
        <!-- Selector de ciudad -->
        <div class="city-selector">
            <label>🌍 Ciudad:</label>
            <select bind:value={selectedCity} on:change={changeCity}>
                {#each cities as city}
                    <option value={city}>{city}</option>
                {/each}
            </select>
        </div>
        
        <!-- Clima actual -->
        {#if currentWeather}
        <div class="current-weather">
            <h3>🌤️ Clima actual en {currentWeather.city}</h3>
            <div class="weather-info">
                <div class="weather-temp">{Math.round(currentWeather.temperature)}°C</div>
                <div class="weather-desc">{currentWeather.description}</div>
                <div class="weather-details">
                    <span>💧 Humedad: {currentWeather.humidity}%</span>
                    <span>💨 Viento: {currentWeather.wind_speed} m/s</span>
                </div>
            </div>
        </div>
        {/if}
        
        <!-- Pronóstico -->
        {#if forecast.length > 0}
        <div class="forecast">
            <h3>📅 Pronóstico 5 días</h3>
            <div class="forecast-grid">
                {#each forecast as day}
                <div class="forecast-card">
                    <div class="forecast-date">{day.date}</div>
                    <div class="forecast-temp">🌡️ {Math.round(day.temp_max)}°/{Math.round(day.temp_min)}°</div>
                    <div class="forecast-desc">{day.description}</div>
                </div>
                {/each}
            </div>
        </div>
        {/if}
        
        <div class="info-note">
            <p><strong>📌 Interpretación del gráfico:</strong></p>
            <ul>
                <li><strong>🟣 Línea morada:</strong> Reportes de tramposos (Cheaters Stats API)</li>
                <li><strong>🔴 Línea roja:</strong> Temperatura global promedio (OpenWeather API)</li>
                <li><strong>🔐 PAT:</strong> API Key desde variable de entorno .env</li>
            </ul>
            <p><strong>📊 Fuente de datos:</strong> Todos los datos obtenidos en tiempo real mediante fetch a ambas APIs</p>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #fee2e2; }
    .back-link { color: #dc2626; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    h1 { color: #991b1b; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .pat-status { padding: 0.75rem; border-radius: 8px; margin-bottom: 1rem; text-align: center; }
    .pat-status.success { background: #f0fdf4; color: #166534; }
    .pat-status.error { background: #fef2f2; color: #991b1b; }
    
    .city-selector { text-align: center; margin-bottom: 1.5rem; }
    .city-selector select { padding: 0.5rem 1rem; font-size: 1rem; border-radius: 8px; border: 1px solid #f87171; background: #fef2f2; }
    
    .current-weather { background: #fef2f2; border-radius: 12px; padding: 1rem; text-align: center; margin-bottom: 1.5rem; }
    .weather-temp { font-size: 3rem; font-weight: bold; color: #dc2626; }
    .weather-desc { font-size: 1.2rem; color: #666; }
    .weather-details { display: flex; justify-content: center; gap: 1rem; margin-top: 0.5rem; }
    
    .forecast { margin-bottom: 1.5rem; }
    .forecast-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0.5rem; }
    .forecast-card { background: #fef2f2; padding: 0.5rem; border-radius: 8px; text-align: center; }
    .forecast-date { font-weight: bold; font-size: 0.8rem; }
    .forecast-temp { font-size: 0.9rem; color: #dc2626; }
    
    .info-note { margin-top: 1rem; padding: 1rem; background: #fef2f2; border-radius: 8px; font-size: 0.85rem; border-left: 4px solid #dc2626; }
</style>