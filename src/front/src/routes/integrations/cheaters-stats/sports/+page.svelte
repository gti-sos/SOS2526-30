<script>
    import { onMount, tick } from 'svelte';
    import * as d3 from 'd3';
    
    let loading = true;
    let error = null;
    let yearsList = [];
    let debugInfo = '';
    
    async function fetchSportsData() {
        console.log('⚽ Obteniendo datos de SportsDB...');
        const response = await fetch('/api/sports/sports');
        const data = await response.json();
        
        // Depurar: ver qué devuelve la API
        console.log('📦 SportsDB respuesta completa:', data);
        console.log('📦 SportsDB sports array:', data.sports);
        console.log('📦 Número de deportes:', data.sports?.length || 0);
        
        // Mostrar los primeros 5 deportes para depurar
        if (data.sports && data.sports.length > 0) {
            console.log('🏆 Primeros 5 deportes:');
            data.sports.slice(0, 5).forEach((sport, i) => {
                console.log(`  ${i+1}. ${sport.strSport} - ID: ${sport.idSport}`);
            });
        }
        
        return data;
    }
    
    async function fetchCheatersData() {
        console.log('📊 Cargando datos de Cheaters Stats...');
        try {
            const response = await fetch('http://sos2526-30.onrender.com/api/v2/cheaters-stats?limit=200');
            if (response.ok) {
                const json = await response.json();
                console.log(`📊 Cheaters: ${json.data?.length || 0} registros`);
                return json.data || [];
            }
        } catch (err) {
            console.warn('No se pudo conectar al backend:', err.message);
        }
        
        try {
            const response = await fetch('/api/v2/cheaters-stats?limit=200');
            if (response.ok) {
                const json = await response.json();
                console.log(`📊 Cheaters (proxy): ${json.data?.length || 0} registros`);
                return json.data || [];
            }
        } catch (err) {
            console.warn('No se pudo conectar al proxy:', err.message);
        }
        
        return [];
    }
    
    function processCheatersData(cheatersData) {
        const cheatersByYear = {};
        cheatersData.forEach(item => {
            const year = item.year;
            if (year) {
                cheatersByYear[year] = (cheatersByYear[year] || 0) + (item.cheater_report || 0);
            }
        });
        console.log('📊 Cheaters por año:', cheatersByYear);
        return cheatersByYear;
    }
    
    function processSportsData(sportsData, cheatersByYear) {
        const sports = sportsData.sports || [];
        
        // Tomar TODOS los deportes que no sean null o vacíos
        let allSports = sports
            .filter(s => s && s.strSport && s.strSport.trim() !== '')
            .map(s => s.strSport);
        
        console.log(`🏆 Total deportes encontrados: ${allSports.length}`);
        console.log('🏆 Lista completa de deportes:', allSports);
        
        // Si hay más de 15, limitamos a 15 para que el gráfico sea legible
        const mainSports = allSports.length > 15 ? allSports.slice(0, 15) : allSports;
        console.log(`🏆 Deportes a mostrar en gráfico: ${mainSports.length}`);
        
        const years = Object.keys(cheatersByYear).sort();
        const selectedYears = years.slice(-10); // Últimos 10 años
        
        const allItems = [...mainSports, ...selectedYears.map(y => `${y}`)];
        const n = allItems.length;
        
        // Crear matriz de relaciones
        const matrix = [];
        for (let i = 0; i < n; i++) {
            matrix[i] = [];
            for (let j = 0; j < n; j++) {
                matrix[i][j] = 0;
            }
        }
        
        // Relaciones deporte-año basadas en popularidad y reportes
        mainSports.forEach((sport, i) => {
            selectedYears.forEach((year, jIdx) => {
                const j = mainSports.length + jIdx;
                const reports = cheatersByYear[year] || 0;
                // Popularidad base: longitud del nombre del deporte + reportes normalizados
                const baseValue = (sport.length % 20) * 5 + 10;
                matrix[i][j] = baseValue + (reports / 2000);
                matrix[j][i] = matrix[i][j];
            });
        });
        
        // Relaciones entre deportes
        for (let i = 0; i < mainSports.length; i++) {
            for (let j = i + 1; j < mainSports.length; j++) {
                const value = (mainSports[i].length + mainSports[j].length) * 3;
                matrix[i][j] = value;
                matrix[j][i] = value;
            }
        }
        
        // Relaciones entre años
        for (let i = 0; i < selectedYears.length; i++) {
            for (let j = i + 1; j < selectedYears.length; j++) {
                const year1 = selectedYears[i];
                const year2 = selectedYears[j];
                const reports1 = cheatersByYear[year1] || 0;
                const reports2 = cheatersByYear[year2] || 0;
                const value = (reports1 + reports2) / 1000;
                const idx1 = mainSports.length + i;
                const idx2 = mainSports.length + j;
                matrix[idx1][idx2] = value;
                matrix[idx2][idx1] = value;
            }
        }
        
        debugInfo = `Deportes encontrados: ${allSports.length} | Mostrados: ${mainSports.length} | Años: ${selectedYears.length}`;
        
        return { mainSports, selectedYears, matrix, allItems };
    }
    
    function renderChordDiagram(sportsInfo) {
        const container = document.getElementById('chart');
        if (!container) return;
        container.innerHTML = '';
        
        const width = Math.min(1200, window.innerWidth - 100);
        const height = width;
        const outerRadius = Math.min(width, height) * 0.4 - 40;
        const innerRadius = outerRadius - 25;
        
        const chord = d3.chord()
            .padAngle(0.05)
            .sortSubgroups(d3.descending);
        
        const chords = chord(sportsInfo.matrix);
        
        const arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);
        
        const ribbon = d3.ribbon()
            .radius(innerRadius);
        
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2},${height / 2})`);
        
        // Colores
        const colorScale = d3.scaleOrdinal(d3.schemeTableau10);
        
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
        
        // Grupos
        const group = svg.append('g')
            .selectAll('g')
            .data(chords.groups)
            .enter()
            .append('g');
        
        group.append('path')
            .attr('d', arc)
            .style('fill', (d, i) => colorScale(i))
            .style('stroke', 'white')
            .style('stroke-width', 1.5)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this).style('opacity', 0.7);
                const name = sportsInfo.allItems[d.index];
                tooltip.style('opacity', 1)
                    .html(`<strong>${name}</strong>`)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 30) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).style('opacity', 1);
                tooltip.style('opacity', 0);
            });
        
        // Etiquetas (solo si hay espacio)
        group.append('text')
            .attr('dy', '.35em')
            .attr('transform', d => {
                const angle = (d.startAngle + d.endAngle) / 2;
                const x = (outerRadius + 20) * Math.sin(angle);
                const y = -(outerRadius + 20) * Math.cos(angle);
                return `translate(${x},${y}) rotate(${angle * 180 / Math.PI - 90})`;
            })
            .attr('text-anchor', 'middle')
            .style('font-size', d => {
                const name = sportsInfo.allItems[d.index];
                return name.length > 15 ? '8px' : '10px';
            })
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(d => {
                let name = sportsInfo.allItems[d.index];
                if (name.length > 20) name = name.substring(0, 17) + '...';
                return name;
            });
        
        // Cuerdas
        svg.append('g')
            .selectAll('path')
            .data(chords)
            .enter()
            .append('path')
            .attr('d', ribbon)
            .style('fill', d => colorScale(d.source.index))
            .style('stroke', 'white')
            .style('stroke-width', 0.5)
            .style('opacity', 0.4)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this).style('opacity', 0.9);
                const sourceName = sportsInfo.allItems[d.source.index];
                const targetName = sportsInfo.allItems[d.target.index];
                const value = d.source.value;
                tooltip.style('opacity', 1)
                    .html(`<strong>${sourceName} ↔ ${targetName}</strong><br/>📊 Valor: ${value.toFixed(0)}`)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 30) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).style('opacity', 0.4);
                tooltip.style('opacity', 0);
            });
        
        // Título
        svg.append('text')
            .attr('x', 0)
            .attr('y', -outerRadius - 25)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#166534')
            .text('⚽ Deportes vs Años - Chord Diagram');
        
        // Subtítulo con info de debug
        svg.append('text')
            .attr('x', 0)
            .attr('y', -outerRadius - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', '#666')
            .text(`Datos: ${sportsInfo.mainSports.length} deportes | ${sportsInfo.selectedYears.length} años | ${sportsInfo.allItems.length} nodos`);
    }
    
    onMount(async () => {
        await tick();
        
        try {
            const sportsData = await fetchSportsData();
            const cheatersData = await fetchCheatersData();
            
            const cheatersByYear = processCheatersData(cheatersData);
            yearsList = Object.keys(cheatersByYear).sort();
            
            const sportsInfo = processSportsData(sportsData, cheatersByYear);
            
            console.log('📅 Años:', yearsList);
            console.log('⚽ Deportes encontrados:', sportsInfo.mainSports.length);
            console.log('⚽ Lista:', sportsInfo.mainSports);
            console.log('📊 Debug info:', debugInfo);
            
            renderChordDiagram(sportsInfo);
            
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
    <h1>⚽ SportsDB + Cheaters Stats</h1>
    <p class="subtitle">Chord Diagram (D3.js): Relaciones entre deportes, años y reportes</p>
    
    <div class="info-note-top">
        📌 <strong>Interpretación del Chord Diagram:</strong> Los arcos exteriores representan deportes y años. 
        Las <strong>cuerdas (flechas)</strong> muestran la intensidad de la relación.
    </div>
    
    <div style="min-height: 900px; width: 100%; overflow-x: auto; display: flex; justify-content: center;">
        <div id="chart"></div>
    </div>
    
    {#if loading}
        <div class="loading">⚽ Cargando datos desde las APIs...</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else}
        <div class="info-note">
            <p><strong>📌 Datos obtenidos en tiempo real:</strong></p>
            <ul>
                <li><strong>⚽ Deportes:</strong> {sportsInfo?.mainSports?.length || 0} deportes desde SportsDB API</li>
                <li><strong>📊 Años:</strong> {yearsList.length} años desde Cheaters Stats</li>
                <li><strong>🔗 Relaciones:</strong> Calculadas dinámicamente</li>
            </ul>
            <p><strong>🏆 Deportes cargados:</strong> {sportsInfo?.mainSports?.join(', ') || 'Cargando...'}</p>
            <div class="debug-note">
                💡 <strong>Nota:</strong> SportsDB API devuelve alrededor de 30-40 deportes. Si ves pocos, revisa la consola (F12) 
                para ver el log completo de la API.
            </div>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #dcfce7; }
    .back-link { color: #16a34a; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #166534; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1rem; }
    .loading { text-align: center; padding: 2rem; color: #16a34a; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
    .info-note-top { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 0.75rem 1rem; margin-bottom: 1.5rem; border-radius: 8px; font-size: 0.85rem; color: #166534; }
    .info-note { margin-top: 2rem; padding: 1rem; background: #f0fdf4; border-radius: 8px; font-size: 0.85rem; color: #166534; border-left: 4px solid #22c55e; }
    .info-note ul { margin: 0.5rem 0; padding-left: 1.5rem; }
    .info-note li { margin: 0.3rem 0; }
    .info-note code { background: #bbf7d0; padding: 0.1rem 0.3rem; border-radius: 4px; }
    .debug-note { margin-top: 1rem; padding: 0.5rem; background: #fef3c7; border-radius: 6px; font-size: 0.8rem; color: #92400e; }
</style>