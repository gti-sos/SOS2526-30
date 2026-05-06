<script>
    import { onMount, tick } from 'svelte';
    import * as d3 from 'd3';
    
    let loading = true;
    let error = null;
    let yearsList = [];
    let deathsUnit = 'miles';
    
    async function loadInitialData() {
        console.log('💀 Inicializando datos en Deaths API...');
        
        try {
            const response = await fetch('https://sos2526-10.onrender.com/api/v2/deaths-by-risk-factors/LoadInitialData');
            
            if (response.status === 409 || response.status === 400) {
                console.log('ℹ️ Base de datos ya inicializada');
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
    
    async function fetchDeathsData() {
        const response = await fetch('https://sos2526-10.onrender.com/api/v2/deaths-by-risk-factors?limit=200');
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
    
    function processDeathsData(deathsData) {
        const deathsByYear = {};
        
        deathsData.forEach(item => {
            let year = null;
            let deaths = null;
            
            const possibleYearFields = ['year', 'Year', 'YEAR', 'ano', 'Año', 'date', 'Date'];
            for (const field of possibleYearFields) {
                if (item[field] !== undefined && item[field] !== null) {
                    year = item[field];
                    break;
                }
            }
            
            if (year && typeof year === 'string' && year.includes('-')) {
                year = year.split('-')[0];
            }
            
            const possibleDeathFields = ['deaths', 'Deaths', 'value', 'Value', 'total', 'Total', 'count', 'Count'];
            for (const field of possibleDeathFields) {
                if (item[field] !== undefined && item[field] !== null) {
                    deaths = item[field];
                    break;
                }
            }
            
            if (!deaths) {
                for (let key in item) {
                    const value = item[key];
                    if (typeof value === 'number' && value !== year && value > 0) {
                        deaths = value;
                        break;
                    }
                }
            }
            
            if (year && deaths) {
                const yearStr = year.toString();
                // Dividir entre 1000 aquí mismo
                deathsByYear[yearStr] = (deathsByYear[yearStr] || 0) + (typeof deaths === 'number' ? deaths / 1000 : parseFloat(deaths) / 1000 || 0);
            }
        });
        
        return deathsByYear;
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
    
    function prepareChartData(cheatersByYear, deathsByYear) {
        const allYearsSet = new Set([...Object.keys(cheatersByYear), ...Object.keys(deathsByYear)]);
        const allYears = Array.from(allYearsSet).sort((a, b) => a - b);
        
        const years = allYears.map(y => y.toString());
        const reportsData = allYears.map(y => cheatersByYear[y] || 0);
        const deathsData = allYears.map(y => deathsByYear[y] || 0);
        
        return { years, reportsData, deathsData };
    }
    
    function renderBarChart(chartData) {
        const container = document.getElementById('chart');
        if (!container) return;
        container.innerHTML = '';
        
        const margin = { top: 100, right: 80, bottom: 80, left: 90 };
        const width = 1100 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;
        
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        const x0 = d3.scaleBand()
            .domain(chartData.years)
            .range([0, width])
            .padding(0.2);
        
        const x1 = d3.scaleBand()
            .domain(['reportes', 'muertes'])
            .range([0, x0.bandwidth()])
            .padding(0.1);
        
        const maxValue = Math.max(
            Math.max(...chartData.reportsData),
            Math.max(...chartData.deathsData)
        );
        
        const y = d3.scaleLinear()
            .domain([0, maxValue])
            .range([height, 0]);
        
        const colors = { reportes: '#7e22ce', muertes: '#ef4444' };
        
        const yearDataMap = {};
        chartData.years.forEach((year, idx) => {
            yearDataMap[year] = {
                reports: chartData.reportsData[idx],
                deaths: chartData.deathsData[idx]
            };
        });
        
        // Dibujar barras
        chartData.years.forEach(year => {
            const yearData = yearDataMap[year];
            const reportsValue = yearData.reports;
            const deathsValue = yearData.deaths;
            
            svg.append('rect')
                .attr('x', x0(year) + x1('reportes'))
                .attr('y', y(reportsValue))
                .attr('width', x1.bandwidth())
                .attr('height', height - y(reportsValue))
                .attr('fill', colors.reportes)
                .attr('rx', 4)
                .style('cursor', 'pointer');
            
            svg.append('rect')
                .attr('x', x0(year) + x1('muertes'))
                .attr('y', y(deathsValue))
                .attr('width', x1.bandwidth())
                .attr('height', height - y(deathsValue))
                .attr('fill', colors.muertes)
                .attr('rx', 4)
                .style('cursor', 'pointer');
        });
        
        // Tooltip
        const tooltip = d3.select(container)
            .append('div')
            .style('position', 'absolute')
            .style('background', 'rgba(0,0,0,0.85)')
            .style('color', 'white')
            .style('padding', '10px')
            .style('border-radius', '8px')
            .style('font-size', '12px')
            .style('pointer-events', 'none')
            .style('z-index', '1000')
            .style('opacity', 0);
        
        svg.selectAll('rect').each(function(d, i) {
            const rect = d3.select(this);
            const fill = rect.attr('fill');
            const yearIndex = Math.floor(i / 2);
            const year = chartData.years[yearIndex];
            const yearData = yearDataMap[year];
            
            rect.on('mouseover', function(event) {
                let text = '';
                if (fill === colors.reportes) {
                    text = `📊 Reportes de Tramposos ${year}: ${yearData.reports.toLocaleString()}`;
                } else {
                    text = `💀 Muertes por Factores de Riesgo ${year}: ${yearData.deaths.toFixed(1)} mil (${(yearData.deaths * 1000).toLocaleString()} personas)`;
                }
                tooltip.style('opacity', 1)
                    .html(text)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 30) + 'px');
            })
            .on('mouseout', function() {
                tooltip.style('opacity', 0);
            });
        });
        
        // Eje X
        svg.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(x0))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .attr('text-anchor', 'end')
            .attr('dx', '-0.8em')
            .attr('dy', '-0.5em')
            .style('font-size', '9px');
        
        // Eje Y
        svg.append('g')
            .call(d3.axisLeft(y))
            .selectAll('text')
            .style('font-size', '10px');
        
        // Título principal
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -55)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#991b1b')
            .text('💀 Reportes de Tramposos vs Muertes por Factores de Riesgo');
        
        // Subtítulo (unidades)
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -35)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#666')
            .text('📊 Reportes: número de reportes | 💀 Muertes: datos divididos entre 1.000 (mostrados en miles)');
        
        // Etiqueta del eje Y
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', -60)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#666')
            .text('Cantidad (Reportes / Muertes en miles)');
        
        // Leyenda
        const legend = svg.append('g')
            .attr('transform', `translate(${width - 180}, -70)`);
        
        legend.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 14)
            .attr('height', 14)
            .attr('fill', colors.reportes)
            .attr('rx', 3);
        
        legend.append('text')
            .attr('x', 20)
            .attr('y', 11)
            .style('font-size', '11px')
            .style('fill', '#666')
            .text('📊 Reportes');
        
        legend.append('rect')
            .attr('x', 0)
            .attr('y', 22)
            .attr('width', 14)
            .attr('height', 14)
            .attr('fill', colors.muertes)
            .attr('rx', 3);
        
        legend.append('text')
            .attr('x', 20)
            .attr('y', 33)
            .style('font-size', '11px')
            .style('fill', '#666')
            .text('💀 Muertes (×1.000)');
    }
    
    onMount(async () => {
        await tick();
        
        try {
            await loadInitialData();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const deathsData = await fetchDeathsData();
            const cheatersData = await fetchCheatersData();
            
            const deathsByYear = processDeathsData(deathsData);
            const cheatersByYear = processCheatersData(cheatersData);
            
            const chartData = prepareChartData(cheatersByYear, deathsByYear);
            yearsList = chartData.years;
            
            console.log('📅 Años:', yearsList);
            console.log('📊 Reportes:', chartData.reportsData);
            console.log('💀 Muertes (en miles):', chartData.deathsData);
            
            renderBarChart(chartData);
            
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
    <h1>💀 Deaths by Risk Factors + Cheaters Stats</h1>
    <p class="subtitle">Bar Chart (D3.js): Reportes vs Muertes (datos de muertes divididos entre 1.000)</p>
    
    <div class="unit-note">
        ⚠️ <strong>Nota:</strong> Los datos de muertes se muestran <strong>divididos entre 1.000</strong> (en miles) para facilitar la visualización. 
        Al hacer hover sobre las barras rojas se muestra el valor real en personas.
    </div>
    
    <div style="min-height: 600px; width: 100%; overflow-x: auto;">
        <div id="chart"></div>
    </div>
    
    {#if loading}
        <div class="loading">💀 Cargando datos...</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else}
        <div class="info-note">
            <p><strong>📌 Bar Chart (D3.js) - Datos transformados:</strong></p>
            <ul>
                <li><strong>🟣 Barras moradas:</strong> Reportes de tramposos (valores reales)</li>
                <li><strong>🔴 Barras rojas:</strong> Muertes por factores de riesgo <strong>(÷ 1.000)</strong> - mostradas en miles</li>
                <li><strong>📅 Eje X:</strong> Año</li>
                <li><strong>📊 Eje Y:</strong> Cantidad (reportes / muertes en miles)</li>
                <li><strong>🔘 Hover:</strong> Muestra valores reales (muertes en personas)</li>
            </ul>
            <p><strong>📐 Años:</strong> {yearsList.length} años ({yearsList.slice(0, 5).join(', ')}...)</p>
            <p><strong>💀 Ejemplo de transformación:</strong> Una muerte de 2.526.523 personas → 2.526,5 miles (mostrado en el gráfico)</p>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #fee2e2; }
    .back-link { color: #dc2626; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #991b1b; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1rem; }
    .loading { text-align: center; padding: 2rem; color: #dc2626; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
    .unit-note { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 0.75rem 1rem; margin-bottom: 1.5rem; border-radius: 8px; font-size: 0.85rem; color: #92400e; }
    .info-note { margin-top: 2rem; padding: 1rem; background: #fef2f2; border-radius: 8px; font-size: 0.85rem; color: #991b1b; border-left: 4px solid #dc2626; }
    .info-note ul { margin: 0.5rem 0; padding-left: 1.5rem; }
    .info-note li { margin: 0.3rem 0; }
    .info-note code { background: #fecaca; padding: 0.1rem 0.3rem; border-radius: 4px; }
</style>