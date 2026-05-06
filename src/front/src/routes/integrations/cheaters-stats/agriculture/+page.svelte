<script>
    import { onMount, tick } from 'svelte';
    import * as d3 from 'd3';
    
    let loading = true;
    let error = null;
    let yearsList = [];
    
    async function loadInitialData() {
        console.log('🌾 Inicializando datos en Agriculture API...');
        
        try {
            const response = await fetch('https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts/LoadInitialData');
            
            if (response.status === 400) {
                const data = await response.json();
                console.log('ℹ️', data.message);
                return { alreadyInitialized: true };
            }
            
            if (response.ok) {
                const data = await response.json();
                console.log('✅', data.message);
                return { initialized: true };
            }
        } catch (err) {
            console.warn('⚠️ No se pudo inicializar:', err.message);
            return null;
        }
    }
    
    async function fetchAgricultureData() {
        const response = await fetch('https://sos2526-22.onrender.com/api/v1/global-agriculture-climate-impacts?limit=200');
        return await response.json();
    }
    
    async function fetchCheatersData() {
        try {
            const response = await fetch('http://localhost:3000/api/v2/cheaters-stats?limit=200');
            if (response.ok) {
                const json = await response.json();
                return json.data || [];
            }
        } catch (err) {
            console.warn('No se pudo conectar al backend:', err.message);
        }
        
        try {
            const response = await fetch('/api/v2/cheaters-stats?limit=200');
            if (response.ok) {
                const json = await response.json();
                return json.data || [];
            }
        } catch (err) {
            console.warn('No se pudo conectar al proxy:', err.message);
        }
        
        return [];
    }
    
    function processAgricultureData(agricultureData) {
        const tempByYear = {};
        const countByYear = {};
        
        agricultureData.forEach(item => {
            const year = item.year;
            if (year && item.average_temperature_c !== undefined) {
                tempByYear[year] = (tempByYear[year] || 0) + item.average_temperature_c;
                countByYear[year] = (countByYear[year] || 0) + 1;
            }
        });
        
        const avgTempByYear = {};
        Object.keys(tempByYear).forEach(year => {
            avgTempByYear[year] = tempByYear[year] / countByYear[year];
        });
        
        return avgTempByYear;
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
    
    function prepareChartData(cheatersByYear, avgTempByYear) {
        const allYearsSet = new Set([...Object.keys(cheatersByYear), ...Object.keys(avgTempByYear)]);
        const allYears = Array.from(allYearsSet).sort((a, b) => a - b);
        
        const years = allYears.map(y => y.toString());
        const reportsData = allYears.map(y => cheatersByYear[y] || 0);
        const tempData = allYears.map(y => avgTempByYear[y] || 0);
        
        // Normalizar para el gráfico polar (0-100)
        const maxReports = Math.max(...reportsData, 1);
        const maxTemp = Math.max(...tempData, 1);
        
        const reportsNormalized = reportsData.map(v => (v / maxReports) * 100);
        const tempNormalized = tempData.map(v => (v / maxTemp) * 100);
        
        return { years, reportsNormalized, tempNormalized, reportsData, tempData };
    }
    
    function renderPolarChart(chartData) {
        // Limpiar contenedor
        const container = document.getElementById('chart');
        if (!container) return;
        container.innerHTML = '';
        
        const width = 550;
        const height = 550;
        const radius = Math.min(width, height) / 2 - 60;
        
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);
        
        const angleSlice = (Math.PI * 2) / chartData.years.length;
        
        // Escalas para los radios
        const rScaleReports = d3.scaleLinear()
            .domain([0, 100])
            .range([0, radius]);
        
        const rScaleTemp = d3.scaleLinear()
            .domain([0, 100])
            .range([0, radius]);
        
        // Dibujar círculos concéntricos
        const levels = [20, 40, 60, 80, 100];
        levels.forEach(level => {
            svg.append('circle')
                .attr('r', (level / 100) * radius)
                .attr('fill', 'none')
                .attr('stroke', '#e9d5ff')
                .attr('stroke-width', 0.5)
                .attr('stroke-dasharray', '4,4');
            
            svg.append('text')
                .attr('x', 5)
                .attr('y', -((level / 100) * radius))
                .attr('dy', '0.35em')
                .attr('fill', '#666')
                .attr('font-size', '10px')
                .text(`${level}%`);
        });
        
        // Dibujar líneas radiales
        chartData.years.forEach((year, i) => {
            const angle = i * angleSlice - Math.PI / 2;
            const x2 = radius * Math.cos(angle);
            const y2 = radius * Math.sin(angle);
            
            svg.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', x2)
                .attr('y2', y2)
                .attr('stroke', '#e9d5ff')
                .attr('stroke-width', 1);
            
            // Etiquetas de años
            const labelRadius = radius + 15;
            const labelX = labelRadius * Math.cos(angle);
            const labelY = labelRadius * Math.sin(angle);
            
            svg.append('text')
                .attr('x', labelX)
                .attr('y', labelY)
                .attr('text-anchor', 'middle')
                .attr('dominant-baseline', 'middle')
                .attr('fill', '#7e22ce')
                .attr('font-size', '11px')
                .attr('font-weight', 'bold')
                .text(year);
        });
        
        // Generar puntos para reportes
        const reportsPoints = chartData.reportsNormalized.map((value, i) => {
            const angle = i * angleSlice - Math.PI / 2;
            const r = rScaleReports(value);
            return {
                x: r * Math.cos(angle),
                y: r * Math.sin(angle),
                value: value,
                realValue: chartData.reportsData[i]
            };
        });
        
        // Generar puntos para temperaturas
        const tempPoints = chartData.tempNormalized.map((value, i) => {
            const angle = i * angleSlice - Math.PI / 2;
            const r = rScaleTemp(value);
            return {
                x: r * Math.cos(angle),
                y: r * Math.sin(angle),
                value: value,
                realValue: chartData.tempData[i]
            };
        });
        
        // Dibujar área para reportes
        const reportsLineGenerator = d3.lineRadial()
            .angle((d, i) => i * angleSlice)
            .radius(d => rScaleReports(d))
            .curve(d3.curveLinearClosed);
        
        svg.append('path')
            .datum(chartData.reportsNormalized)
            .attr('d', reportsLineGenerator)
            .attr('fill', 'rgba(124,58,237,0.3)')
            .attr('stroke', '#7e22ce')
            .attr('stroke-width', 2);
        
        // Dibujar área para temperaturas
        const tempLineGenerator = d3.lineRadial()
            .angle((d, i) => i * angleSlice)
            .radius(d => rScaleTemp(d))
            .curve(d3.curveLinearClosed);
        
        svg.append('path')
            .datum(chartData.tempNormalized)
            .attr('d', tempLineGenerator)
            .attr('fill', 'rgba(5,150,105,0.3)')
            .attr('stroke', '#059669')
            .attr('stroke-width', 2);
        
        // Añadir tooltips interactivos
        const tooltip = d3.select(container)
            .append('div')
            .attr('class', 'polar-tooltip')
            .style('position', 'absolute')
            .style('background', 'white')
            .style('padding', '8px')
            .style('border-radius', '8px')
            .style('border', '1px solid #ccc')
            .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
            .style('pointer-events', 'none')
            .style('font-size', '12px')
            .style('opacity', 0);
        
        // Puntos interactivos para reportes
        reportsPoints.forEach((point, i) => {
            svg.append('circle')
                .attr('cx', point.x)
                .attr('cy', point.y)
                .attr('r', 5)
                .attr('fill', '#7e22ce')
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .style('cursor', 'pointer')
                .on('mouseover', (event) => {
                    tooltip.transition().duration(200).style('opacity', 0.9);
                    tooltip.html(`📊 Reportes ${chartData.years[i]}:<br/>${point.realValue.toLocaleString()}<br/>📈 ${point.value.toFixed(1)}%`)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', () => {
                    tooltip.transition().duration(500).style('opacity', 0);
                });
        });
        
        // Puntos interactivos para temperaturas
        tempPoints.forEach((point, i) => {
            svg.append('circle')
                .attr('cx', point.x)
                .attr('cy', point.y)
                .attr('r', 5)
                .attr('fill', '#059669')
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .style('cursor', 'pointer')
                .on('mouseover', (event) => {
                    tooltip.transition().duration(200).style('opacity', 0.9);
                    tooltip.html(`🌡️ Temperatura ${chartData.years[i]}:<br/>${point.realValue.toFixed(1)}°C<br/>📈 ${point.value.toFixed(1)}%`)
                        .style('left', (event.pageX + 10) + 'px')
                        .style('top', (event.pageY - 28) + 'px');
                })
                .on('mouseout', () => {
                    tooltip.transition().duration(500).style('opacity', 0);
                });
        });
        
        // Leyenda
        const legend = svg.append('g')
            .attr('transform', `translate(${-radius - 20}, ${-radius - 20})`);
        
        legend.append('circle')
            .attr('cx', 0)
            .attr('cy', 0)
            .attr('r', 6)
            .attr('fill', '#7e22ce');
        
        legend.append('text')
            .attr('x', 12)
            .attr('y', 4)
            .attr('fill', '#666')
            .attr('font-size', '11px')
            .text('📊 Reportes de Tramposos');
        
        legend.append('circle')
            .attr('cx', 0)
            .attr('cy', 20)
            .attr('r', 6)
            .attr('fill', '#059669');
        
        legend.append('text')
            .attr('x', 12)
            .attr('y', 24)
            .attr('fill', '#666')
            .attr('font-size', '11px')
            .text('🌡️ Temperatura Promedio');
    }
    
    onMount(async () => {
        await tick();
        
        try {
            await loadInitialData();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const agricultureData = await fetchAgricultureData();
            const cheatersData = await fetchCheatersData();
            
            const avgTempByYear = processAgricultureData(agricultureData);
            const cheatersByYear = processCheatersData(cheatersData);
            
            const chartData = prepareChartData(cheatersByYear, avgTempByYear);
            yearsList = chartData.years;
            
            console.log('📅 Años:', yearsList);
            console.log('📊 Reportes:', chartData.reportsData);
            console.log('🌡️ Temperaturas:', chartData.tempData);
            
            renderPolarChart(chartData);
            
            loading = false;
            
        } catch (err) {
            console.error('❌ Error:', err);
            error = err.message;
            loading = false;
        }
    });
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver a Cheaters Stats</a>
    <h1>🌾 Agriculture Climate + Cheaters Stats</h1>
    <p class="subtitle">Polar Chart (D3.js): Comparación radial de reportes vs temperatura agrícola</p>
    
    <div style="height: 600px; width: 100%; display: flex; justify-content: center;">
        <div id="chart"></div>
    </div>
    
    {#if loading}
        <div class="loading">🌾 Cargando datos...</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else}
        <div class="info-note">
            <p><strong>📌 Polar Chart (D3.js):</strong></p>
            <ul>
                <li><strong>🟣 Área morada:</strong> Reportes de tramposos (normalizado 0-100%)</li>
                <li><strong>🟢 Área verde:</strong> Temperatura agrícola promedio (normalizado 0-100%)</li>
                <li><strong>📅 Ejes radiales:</strong> Años disponibles</li>
                <li><strong>📈 Círculos concéntricos:</strong> Escala de porcentaje (20%, 40%, 60%, 80%, 100%)</li>
                <li><strong>🔘 Puntos interactivos:</strong> Muestran valores reales al hacer hover</li>
            </ul>
            <p><strong>📐 Años:</strong> {yearsList.length} años ({yearsList.join(', ')})</p>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #d1fae5; }
    .back-link { color: #059669; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #065f46; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .loading { text-align: center; padding: 2rem; color: #059669; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
    .info-note { margin-top: 2rem; padding: 1rem; background: #ecfdf5; border-radius: 8px; font-size: 0.85rem; color: #065f46; border-left: 4px solid #059669; }
    .info-note ul { margin: 0.5rem 0; padding-left: 1.5rem; }
    .info-note li { margin: 0.3rem 0; }
    .info-note code { background: #d1fae5; padding: 0.1rem 0.3rem; border-radius: 4px; }
</style>