<script>
    import { onMount, tick } from 'svelte';
    import * as d3 from 'd3';
    
    let loading = true;
    let error = null;
    let yearsList = [];
    let currentWeather = null;
    let forecast = [];
    let patStatus = null;
    let currentCity = 'Madrid';
    
    async function loadInitialData() {
        console.log('🌤️ Verificando OpenWeather API...');
        
        try {
            const response = await fetch('/api/weather/status');
            patStatus = await response.json();
            console.log('Estado PAT OpenWeather:', patStatus);
            return patStatus;
        } catch (err) {
            console.warn('⚠️ No se pudo conectar:', err.message);
            return null;
        }
    }
    
    async function fetchCurrentWeather(city) {
        console.log(`🌤️ Obteniendo clima actual para ${city}...`);
        try {
            const response = await fetch(`/api/weather/weather?city=${city}`);
            const data = await response.json();
            if (data.success) {
                console.log(`✅ Clima: ${data.temperature}°C, ${data.description}`);
                return data;
            }
        } catch (err) {
            console.warn('Error fetching weather:', err);
        }
        return null;
    }
    
    async function fetchForecast(city) {
        console.log(`📅 Obteniendo pronóstico para ${city}...`);
        try {
            const response = await fetch(`/api/weather/forecast?city=${city}&limit=40`);
            const data = await response.json();
            if (data.success) {
                console.log(`✅ Pronóstico: ${data.forecast?.length || 0} días`);
                return data.forecast || [];
            }
        } catch (err) {
            console.warn('Error fetching forecast:', err);
        }
        return [];
    }
    
  
    
    async function fetchCheatersData() {
        console.log('📊 Cargando datos de Cheaters Stats...');
        try {
            const response = await fetch('/api/v2/cheaters-stats?limit=200');
            const json = await response.json();
            return json.data || [];
        } catch (err) {
            console.warn('Error fetching cheaters:', err);
            return [];
        }
    }
    
    function processCheatersData(cheatersData) {
        const cheatersByYear = {};
        cheatersData.forEach(item => {
            const year = item.year;
            if (year) {
                cheatersByYear[year] = (cheatersByYear[year] || 0) + (item.cheater_report || 0);
            }
        });
        return cheatersByYear;
    }
    
    function prepareCirclePackData(cheatersByYear, forecastDays, currentTemp) {
        // Obtener años y reportes
        const years = Object.keys(cheatersByYear).sort();
        const reportsData = years.map(y => cheatersByYear[y]);
        
        // Calcular máximo para normalizar
        const maxReports = Math.max(...reportsData, 1);
        const normalizedReports = reportsData.map(r => (r / maxReports) * 50 + 20); // Escalar para visualización
        
        // Crear nodos para el circle packing
        const children = [];
        
        // Nodos de reportes por año
        years.forEach((year, i) => {
            children.push({
                name: `📊 ${year}`,
                value: normalizedReports[i],
                type: 'reports',
                originalValue: reportsData[i],
                year: year
            });
        });
        
        // Nodos de pronóstico
        if (forecastDays && forecastDays.length > 0) {
            forecastDays.slice(0, 5).forEach((day, i) => {
                children.push({
                    name: `📅 ${day.date || `Día ${i+1}`}`,
                    value: (day.temp_max || 20) * 2,
                    type: 'forecast',
                    tempMin: day.temp_min,
                    tempMax: day.temp_max,
                    description: day.description
                });
            });
        }
        
        // Nodo de clima actual si existe
        if (currentTemp) {
            children.push({
                name: `🌡️ Actual`,
                value: (currentTemp + 20) * 2,
                type: 'current',
                temperature: currentTemp
            });
        }
        
        const root = {
            name: '🌍 Clima y Reportes',
            children: children
        };
        
        console.log('📊 Datos preparados:', children.length, 'nodos');
        return root;
    }
    
    function renderCirclePack(chartData, currentWeatherData, cityName) {
        const container = document.getElementById('chart');
        if (!container) return;
        container.innerHTML = '';
        
        const width = 1000;
        const height = 700;
        
        const root = d3.hierarchy(chartData)
            .sum(d => d.value || 1)
            .sort((a, b) => b.value - a.value);
        
        const pack = d3.pack()
            .size([width, height])
            .padding(5);
        
        const nodes = pack(root).descendants();
        
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('background', '#f0fdf4')
            .style('border-radius', '16px');
        
        const colorMap = {
            'reports': '#7e22ce',
            'forecast': '#3b82f6',
            'current': '#f59e0b'
        };
        
        const tooltip = d3.select(container)
            .append('div')
            .style('position', 'absolute')
            .style('background', 'rgba(0,0,0,0.85)')
            .style('color', 'white')
            .style('padding', '12px')
            .style('border-radius', '8px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', '1000')
            .style('max-width', '250px');
        
        const circle = svg.selectAll('circle')
            .data(nodes.filter(d => d.depth > 0))
            .enter()
            .append('circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', d => d.r)
            .attr('fill', d => {
                if (d.data.type === 'reports') return colorMap.reports;
                if (d.data.type === 'forecast') return colorMap.forecast;
                if (d.data.type === 'current') return colorMap.current;
                return '#e5e7eb';
            })
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .attr('opacity', 0.9)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this).attr('opacity', 0.7);
                
                let tooltipHtml = `<strong>${d.data.name}</strong><br/>`;
                if (d.data.type === 'reports') {
                    tooltipHtml += `📊 Reportes: ${d.data.originalValue?.toLocaleString() || 0}`;
                } else if (d.data.type === 'forecast') {
                    tooltipHtml += `🌡️ Máx: ${d.data.tempMax}°C / Mín: ${d.data.tempMin}°C<br/>${d.data.description || ''}`;
                } else if (d.data.type === 'current') {
                    tooltipHtml += `🌡️ Temperatura actual: ${d.data.temperature}°C`;
                }
                
                tooltip.style('opacity', 1)
                    .html(tooltipHtml)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 30) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 0.9);
                tooltip.style('opacity', 0);
            });
        
        // Etiquetas
        svg.selectAll('text')
            .data(nodes.filter(d => d.depth > 0 && d.r > 20))
            .enter()
            .append('text')
            .attr('x', d => d.x)
            .attr('y', d => d.y)
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .style('font-size', d => Math.min(12, d.r / 5) + 'px')
            .style('fill', 'white')
            .style('font-weight', 'bold')
            .style('pointer-events', 'none')
            .text(d => {
                let name = d.data.name;
                if (name.includes('📊')) name = name.replace('📊 ', '');
                if (name.includes('📅')) name = name.replace('📅 ', '');
                if (name.length > 12) name = name.substring(0, 10) + '...';
                return name;
            });
        
        // Título
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 30)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#15803d')
            .text(`🌤️ Reportes de Tramposos vs Clima - ${cityName}`);
        
        if (currentWeatherData) {
            svg.append('text')
                .attr('x', width - 20)
                .attr('y', 30)
                .attr('text-anchor', 'end')
                .style('font-size', '11px')
                .style('fill', '#666')
                .html(`🌡️ ${Math.round(currentWeatherData.temperature)}°C | 💧 ${currentWeatherData.humidity}%`);
        }
    }
    
    async function loadWeatherIntegration() {
        try {
            loading = true;
            console.log('🌤️ Cargando integración: Cheaters Stats + OpenWeather API...');
            
            await loadInitialData();
            
            // Ya NO llamamos a fetchYearlyTemperatures
            const [cheatersData, weatherData, forecastData] = await Promise.all([
                fetchCheatersData(),
                fetchCurrentWeather(currentCity),
                fetchForecast(currentCity)
            ]);
            
            currentWeather = weatherData;
            forecast = forecastData;
            
            const cheatersByYear = processCheatersData(cheatersData);
            yearsList = Object.keys(cheatersByYear).sort();
            
            const chartData = prepareCirclePackData(cheatersByYear, forecast, currentWeather?.temperature);
            
            console.log('📅 Años:', yearsList);
            console.log('📅 Pronóstico:', forecast.length);
            console.log('🌤️ Clima actual:', currentWeather?.city, currentWeather?.temperature);
            
            renderCirclePack(chartData, currentWeather, currentCity);
            
            loading = false;
            
        } catch (err) {
            console.error('❌ Error:', err);
            error = err.message;
            loading = false;
        }
    }
    
    onMount(async () => {
        await tick();
        await loadWeatherIntegration();
    });
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver a Cheaters Stats</a>
    <h1>🌤️ OpenWeather API + Cheaters Stats</h1>
    <p class="subtitle">Circle Packing (D3.js): Proporciones de reportes, clima actual y pronóstico</p>
    
    <div class="info-note-top">
        📌 <strong>Interpretación del Circle Packing:</strong> Cada círculo representa un dato. 
        El <strong>tamaño</strong> es proporcional al valor. Los colores distinguen categorías: 
        Reportes (morado) | Pronóstico (azul) | Clima actual (naranja)
    </div>
    
    <div style="min-height: 750px; width: 100%; overflow-x: auto; display: flex; justify-content: center;">
        <div id="chart"></div>
    </div>
    
    {#if loading}
        <div class="loading">🌤️ Cargando datos de las APIs...</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else}
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
        
        {#if forecast.length > 0}
        <div class="forecast">
            <h3>📅 Pronóstico 5 días</h3>
            <div class="forecast-grid">
                {#each forecast.slice(0, 5) as day}
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
            <p><strong>📌 Circle Packing (D3.js):</strong></p>
            <ul>
                <li><strong>🟣 Círculos morados:</strong> Reportes de tramposos por año (Cheaters Stats API)</li>
                <li><strong>🔵 Círculos azules:</strong> Pronóstico de temperatura por día (OpenWeather API)</li>
                <li><strong>🟠 Círculo naranja:</strong> Clima actual (OpenWeather API)</li>
                <li><strong>📏 Tamaño:</strong> Proporcional al valor</li>
                <li><strong>🔘 Hover:</strong> Muestra el valor exacto</li>
            </ul>
            <p><strong>📐 Años representados:</strong> {yearsList.length} años ({yearsList.slice(0, 5).join(', ')}...)</p>
            <p><strong>✅ Sin datos precargados:</strong> Todo se obtiene mediante fetch() a las APIs</p>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1100px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #dcfce7; }
    .back-link { color: #16a34a; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #15803d; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1rem; }
    .loading { text-align: center; padding: 2rem; color: #16a34a; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
    .info-note-top { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 0.75rem 1rem; margin-bottom: 1.5rem; border-radius: 8px; font-size: 0.85rem; color: #166534; }
    
    .current-weather { background: #f0fdf4; border-radius: 12px; padding: 1rem; text-align: center; margin-bottom: 1.5rem; }
    .weather-temp { font-size: 3rem; font-weight: bold; color: #16a34a; }
    .weather-desc { font-size: 1.2rem; color: #666; }
    .weather-details { display: flex; justify-content: center; gap: 1rem; margin-top: 0.5rem; }
    
    .forecast { margin-bottom: 1.5rem; }
    .forecast-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 0.5rem; }
    .forecast-card { background: #f0fdf4; padding: 0.5rem; border-radius: 8px; text-align: center; }
    .forecast-date { font-weight: bold; font-size: 0.8rem; }
    .forecast-temp { font-size: 0.9rem; color: #16a34a; }
    
    .info-note { margin-top: 1.5rem; padding: 1rem; background: #f0fdf4; border-radius: 8px; font-size: 0.85rem; color: #166534; border-left: 4px solid #22c55e; }
    .info-note ul { margin: 0.5rem 0; padding-left: 1.5rem; }
    .info-note li { margin: 0.3rem 0; }
    .info-note code { background: #bbf7d0; padding: 0.1rem 0.3rem; border-radius: 4px; }
</style>