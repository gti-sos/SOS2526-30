<script>
    import { onMount, tick } from 'svelte';
    import * as d3 from 'd3';
    
    let loading = true;
    let error = null;
    let yearsList = [];
    
    async function loadInitialData() {
        console.log('Inicializando datos en Tourist Arrivals API...');
        
        try {
            const response = await fetch('https://sos2526-25.onrender.com/api/v1/international-tourist-arrivals/LoadInitialData');
            
            if (response.status === 409 || response.status === 400) {
                console.log('Base de datos ya inicializada');
                return { alreadyInitialized: true };
            }
            
            if (response.ok) {
                const data = await response.json();
                console.log(data.message);
                return { initialized: true };
            }
        } catch (err) {
            console.warn('No se pudo inicializar:', err.message);
            return null;
        }
    }
    
    async function fetchTouristData() {
        const response = await fetch('https://sos2526-25.onrender.com/api/v1/international-tourist-arrivals?limit=200');
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
    
    function processTouristData(touristData) {
        const touristByYear = {};
        
        touristData.forEach(item => {
            const year = item.year;
            if (year) {
                const totalArrivals = (item.air_arrival || 0) + 
                                     (item.water_arrival || 0) + 
                                     (item.land_arrival || 0);
                
                if (totalArrivals > 0) {
                    touristByYear[year] = (touristByYear[year] || 0) + totalArrivals;
                }
            }
        });
        
        return touristByYear;
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
    
    function prepareChartData(cheatersByYear, touristByYear) {
        const allYearsSet = new Set([...Object.keys(cheatersByYear), ...Object.keys(touristByYear)]);
        const allYears = Array.from(allYearsSet).sort((a, b) => a - b);
        
        const years = allYears.map(y => y.toString());
        const reportsData = allYears.map(y => cheatersByYear[y] || 0);
        const touristData = allYears.map(y => touristByYear[y] || 0);
        
        return { years, reportsData, touristData };
    }
    
    function renderTreemap(chartData) {
        const container = document.getElementById('chart');
        if (!container) return;
        container.innerHTML = '';
        
        const width = 900;
        const height = 600;
        
        // Preparar datos para el treemap - estructura jerárquica
        // Creamos un nodo raíz con dos categorías: Reportes y Turistas
        const rootData = {
            name: 'root',
            children: [
                {
                    name: 'Reportes de Tramposos',
                    children: chartData.years.map((year, i) => ({
                        name: `${year}`,
                        value: chartData.reportsData[i],
                        type: 'reports',
                        originalValue: chartData.reportsData[i]
                    })).filter(d => d.value > 0)
                },
                {
                    name: 'Llegadas Turísticas',
                    children: chartData.years.map((year, i) => ({
                        name: `${year}`,
                        value: chartData.touristData[i],
                        type: 'tourist',
                        originalValue: chartData.touristData[i]
                    })).filter(d => d.value > 0)
                }
            ].filter(category => category.children.length > 0)
        };
        
        // Si no hay datos, mostrar mensaje
        if (rootData.children.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:50px; color:#666;">No hay datos disponibles</div>';
            return;
        }
        
        const root = d3.hierarchy(rootData)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);
        
        d3.treemap()
            .size([width, height])
            .padding(2)
            .round(true)(root);
        
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(0,0)');
        
        // Colores por categoría
        const categoryColors = {
            'Reportes de Tramposos': '#7e22ce',
            'Llegadas Turísticas': '#22c55e'
        };
        
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
            .style('opacity', 0)
            .style('z-index', '1000');
        
        // Dibujar rectángulos
        const cell = svg.selectAll('g')
            .data(root.leaves())
            .enter()
            .append('g')
            .attr('transform', d => `translate(${d.x0},${d.y0})`);
        
        cell.append('rect')
            .attr('width', d => d.x1 - d.x0)
            .attr('height', d => d.y1 - d.y0)
            .attr('fill', d => categoryColors[d.parent.data.name] || '#888')
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .style('transition', 'opacity 0.2s')
            .on('mouseover', function(event, d) {
                d3.select(this).attr('opacity', 0.8);
                const category = d.parent.data.name;
                const value = d.data.originalValue;
                let formattedValue = '';
                if (category.includes('Reportes')) {
                    formattedValue = value.toLocaleString() + ' reportes';
                } else {
                    formattedValue = value.toLocaleString() + ' llegadas';
                }
                tooltip.style('opacity', 1)
                    .html(`<strong>${category}</strong><br/>Año: ${d.data.name}<br/>Valor: ${formattedValue}`)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 30) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 1);
                tooltip.style('opacity', 0);
            });
        
        // Añadir texto dentro de los rectángulos
        cell.append('text')
            .attr('x', 5)
            .attr('y', 20)
            .attr('fill', 'white')
            .attr('font-size', '11px')
            .attr('font-weight', 'bold')
            .text(d => d.data.name)
            .style('pointer-events', 'none');
        
        cell.append('text')
            .attr('x', 5)
            .attr('y', 38)
            .attr('fill', 'rgba(255,255,255,0.8)')
            .attr('font-size', '9px')
            .text(d => {
                const val = d.data.originalValue;
                if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
                return val.toString();
            })
            .style('pointer-events', 'none');
        
        // Título
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#15803d')
            .text('Reportes de Tramposos vs Llegadas Turísticas Internacionales');
        
        // Subtítulo
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 48)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('fill', '#666')
            .text('Treemap - El tamaño de cada rectángulo representa la magnitud (mayor área = mayor valor)');
        
        // Leyenda
        const legend = svg.append('g')
            .attr('transform', `translate(${width - 200}, 70)`);
        
        legend.append('rect')
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', 14)
            .attr('height', 14)
            .attr('fill', categoryColors['Reportes de Tramposos'])
            .attr('rx', 3);
        
        legend.append('text')
            .attr('x', 20)
            .attr('y', 11)
            .style('font-size', '11px')
            .style('fill', '#666')
            .text('Reportes');
        
        legend.append('rect')
            .attr('x', 0)
            .attr('y', 22)
            .attr('width', 14)
            .attr('height', 14)
            .attr('fill', categoryColors['Llegadas Turísticas'])
            .attr('rx', 3);
        
        legend.append('text')
            .attr('x', 20)
            .attr('y', 33)
            .style('font-size', '11px')
            .style('fill', '#666')
            .text('Llegadas Turísticas');
    }
    
    onMount(async () => {
        await tick();
        
        try {
            await loadInitialData();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const touristData = await fetchTouristData();
            const cheatersData = await fetchCheatersData();
            
            const touristByYear = processTouristData(touristData);
            const cheatersByYear = processCheatersData(cheatersData);
            
            const chartData = prepareChartData(cheatersByYear, touristByYear);
            yearsList = chartData.years;
            
            console.log('Años:', yearsList);
            console.log('Reportes:', chartData.reportsData);
            console.log('Turistas:', chartData.touristData);
            
            renderTreemap(chartData);
            
            loading = false;
            
        } catch (err) {
            console.error('Error:', err);
            error = err.message;
            loading = false;
        }
    });
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver a Cheaters Stats</a>
    <h1>International Tourist Arrivals + Cheaters Stats</h1>
    <p class="subtitle">Treemap (D3.js): Visualización de proporciones - reportes vs llegadas turísticas</p>
    
    <div class="info-note-top">
        <strong>Interpretación del Treemap:</strong> Cada rectángulo representa un año. 
        El <strong>tamaño</strong> del rectángulo es proporcional al valor (reportes o llegadas). 
        A mayor área, mayor magnitud. Los colores distinguen entre reportes (morado) y turistas (verde).
    </div>
    
    <div style="min-height: 650px; width: 100%; overflow-x: auto; display: flex; justify-content: center;">
        <div id="chart"></div>
    </div>
    
    {#if loading}
        <div class="loading">Cargando datos...</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else}
        <div class="info-note">
            <p><strong>Treemap (D3.js):</strong></p>
            <ul>
                <li><strong>Rectángulos morados:</strong> Reportes de tramposos por año</li>
                <li><strong>Rectángulos verdes:</strong> Llegadas turísticas internacionales por año</li>
                <li><strong>Tamaño:</strong> Proporcional al valor (más grande = mayor cantidad)</li>
                <li><strong>Números:</strong> Muestra valores abreviados (K = miles, M = millones)</li>
                <li><strong>Hover:</strong> Muestra el valor exacto al pasar el ratón</li>
            </ul>
            <p><strong>Años representados:</strong> {yearsList.length} años</p>
            <p><strong>Total reportes:</strong> {chartData?.reportsData?.reduce((a,b) => a + b, 0).toLocaleString()}</p>
            <p><strong>Total llegadas:</strong> {chartData?.touristData?.reduce((a,b) => a + b, 0).toLocaleString()}</p>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1000px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #dcfce7; }
    .back-link { color: #16a34a; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #15803d; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1rem; }
    .loading { text-align: center; padding: 2rem; color: #16a34a; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
    .info-note-top { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 0.75rem 1rem; margin-bottom: 1.5rem; border-radius: 8px; font-size: 0.85rem; color: #166534; }
    .info-note { margin-top: 2rem; padding: 1rem; background: #f0fdf4; border-radius: 8px; font-size: 0.85rem; color: #166534; border-left: 4px solid #22c55e; }
    .info-note ul { margin: 0.5rem 0; padding-left: 1.5rem; }
    .info-note li { margin: 0.3rem 0; }
    .info-note code { background: #bbf7d0; padding: 0.1rem 0.3rem; border-radius: 4px; }
</style>