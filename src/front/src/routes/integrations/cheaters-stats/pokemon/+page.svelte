<script>
    import { onMount, tick } from 'svelte';
    import * as d3 from 'd3';
    
    let loading = true;
    let error = null;
    
    onMount(async () => {
        await tick();
        await initChart();
    });
    
    async function initChart() {
        try {
            console.log('Cargando datos de Pokémon y Cheaters...');
            
            // 1. FETCH Cheaters Stats
            const cheatersRes = await fetch('/api/v2/cheaters-stats?limit=200');
            const cheatersJson = await cheatersRes.json();
            const cheatersData = cheatersJson.data || [];
            
            // Agrupar Cheaters por país y calcular totales
            const cheatersByCountry = {};
            cheatersData.forEach(item => {
                const country = item.country?.toLowerCase();
                if (country) {
                    cheatersByCountry[country] = (cheatersByCountry[country] || 0) + (item.cheater_report || 0);
                }
            });
            
            // Top países por reportes
            const topCountries = Object.entries(cheatersByCountry)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([country, reports]) => ({ country: country.toUpperCase(), reports }));
            
            console.log('Top países por reportes:', topCountries);
            
            // 2. FETCH Pokémon API
            console.log('Cargando Pokémon desde PokeAPI...');
            const pokemonRes = await fetch('https://pokeapi.co/api/v2/pokemon?limit=20');
            const pokemonJson = await pokemonRes.json();
            
            // Cargar detalles de cada Pokémon
            const pokemonDetails = await Promise.all(
                pokemonJson.results.map(async (p) => {
                    const detailRes = await fetch(p.url);
                    return detailRes.json();
                })
            );
            
            // 3. Extraer estadísticas de Pokémon
            const pokemonStats = pokemonDetails.map(pokemon => {
                const stats = pokemon.stats;
                return {
                    name: pokemon.name.toUpperCase(),
                    hp: stats.find(s => s.stat.name === 'hp')?.base_stat || 0,
                    attack: stats.find(s => s.stat.name === 'attack')?.base_stat || 0,
                    defense: stats.find(s => s.stat.name === 'defense')?.base_stat || 0,
                    specialAttack: stats.find(s => s.stat.name === 'special-attack')?.base_stat || 0,
                    specialDefense: stats.find(s => s.stat.name === 'special-defense')?.base_stat || 0,
                    speed: stats.find(s => s.stat.name === 'speed')?.base_stat || 0,
                    totalStats: stats.reduce((sum, s) => sum + s.base_stat, 0)
                };
            });
            
            // Tomar top 10 Pokémon
            const topPokemon = pokemonStats.sort((a, b) => b.totalStats - a.totalStats).slice(0, 10);
            
            // 4. Asignar reportes de Cheaters a cada Pokémon (basado en su poder relativo)
            const maxPower = Math.max(...topPokemon.map(p => p.totalStats));
            const maxReports = Math.max(...topCountries.map(c => c.reports));
            
            // Crear array con datos combinados: para cada Pokémon, asignamos un valor de reportes proporcional a su poder
            const combinedData = topPokemon.map((pokemon, index) => {
                // Proporción de poder del Pokémon respecto al máximo
                const powerRatio = pokemon.totalStats / maxPower;
                // Asignar reportes proporcionales al poder (escalado al rango de reportes reales)
                const assignedReports = Math.floor(powerRatio * maxReports * 0.8);
                // Usar el país correspondiente o un valor basado en el índice
                const referenceCountry = topCountries[index % topCountries.length]?.country || `País ${index + 1}`;
                const referenceReports = topCountries[index % topCountries.length]?.reports || 0;
                
                return {
                    pokemon: pokemon.name,
                    hp: pokemon.hp,
                    attack: pokemon.attack,
                    defense: pokemon.defense,
                    specialAttack: pokemon.specialAttack,
                    specialDefense: pokemon.specialDefense,
                    speed: pokemon.speed,
                    totalStats: pokemon.totalStats,
                    assignedReports: assignedReports,
                    referenceCountry: referenceCountry,
                    referenceReports: referenceReports
                };
            });
            
            console.log('Datos combinados:', combinedData);
            
            // 5. Preparar datos normalizados para stacked area (stats de Pokémon)
            const statNames = ['HP', 'Ataque', 'Defensa', 'At. Especial', 'Def. Especial', 'Velocidad'];
            const statKeys = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];
            const pokemonColors = ['#a855f7', '#7e22ce', '#6b21a5', '#581c87', '#4c1d95', '#3b0764'];
            
            const normalizedData = combinedData.map(p => {
                const total = statKeys.reduce((sum, key) => sum + p[key], 0);
                const normalized = { pokemon: p.pokemon };
                statKeys.forEach((key, i) => {
                    normalized[statNames[i]] = total > 0 ? (p[key] / total) * 100 : 0;
                });
                return normalized;
            });
            
            // 6. Limpiar contenedor
            const container = document.getElementById('chart');
            if (container) {
                container.innerHTML = '';
            } else {
                throw new Error('Contenedor no encontrado');
            }
            
            // 7. Dimensiones del gráfico
            const width = 1000;
            const height = 550;
            const margin = { top: 80, right: 120, bottom: 80, left: 80 };
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;
            
            // Crear SVG
            const svg = d3.select('#chart')
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .append('g')
                .attr('transform', `translate(${margin.left},${margin.top})`);
            
            // Escalas
            const xScale = d3.scaleBand()
                .domain(combinedData.map(p => p.pokemon))
                .range([0, innerWidth])
                .padding(0.2);
            
            const yScale = d3.scaleLinear()
                .domain([0, 100])
                .range([innerHeight, 0]);
            
            // Escala para la línea de reportes (eje Y derecho)
            const maxAssignedReports = Math.max(...combinedData.map(p => p.assignedReports));
            const yRightScale = d3.scaleLinear()
                .domain([0, maxAssignedReports * 1.1])
                .range([innerHeight, 0]);
            
            // Preparar stacks para stats de Pokémon
            const stack = d3.stack().keys(statNames);
            const series = stack(normalizedData);
            
            // Colores para stats
            const colorScale = d3.scaleOrdinal()
                .domain(statNames)
                .range(pokemonColors);
            
            // Dibujar áreas apiladas (stats de Pokémon)
            series.forEach(seriesData => {
                svg.append('path')
                    .datum(seriesData)
                    .attr('class', 'area')
                    .attr('d', d3.area()
                        .x((d, i) => xScale(normalizedData[i].pokemon) + xScale.bandwidth() / 2)
                        .y0(d => yScale(d[0]))
                        .y1(d => yScale(d[1]))
                        .curve(d3.curveCatmullRom)
                    )
                    .attr('fill', colorScale(seriesData.key))
                    .attr('opacity', 0.7)
                    .attr('stroke', colorScale(seriesData.key))
                    .attr('stroke-width', 1);
            });
            
            // Dibujar bordes superiores
            series.forEach(seriesData => {
                svg.append('path')
                    .datum(seriesData)
                    .attr('class', 'area-border')
                    .attr('d', d3.line()
                        .x((d, i) => xScale(normalizedData[i].pokemon) + xScale.bandwidth() / 2)
                        .y(d => yScale(d[1]))
                        .curve(d3.curveCatmullRom)
                    )
                    .attr('fill', 'none')
                    .attr('stroke', colorScale(seriesData.key))
                    .attr('stroke-width', 2)
                    .attr('stroke-dasharray', '4,2');
            });
            
            // Añadir línea de reportes de tramposos (Cheaters data)
            const lineData = combinedData.map((p, i) => ({
                x: xScale(p.pokemon) + xScale.bandwidth() / 2,
                y: yRightScale(p.assignedReports)
            }));
            
            const lineGenerator = d3.line()
                .x(d => d.x)
                .y(d => d.y)
                .curve(d3.curveCatmullRom);
            
            // Línea de reportes asignados
            svg.append('path')
                .datum(lineData)
                .attr('class', 'reports-line')
                .attr('d', lineGenerator)
                .attr('fill', 'none')
                .attr('stroke', '#dc2626')
                .attr('stroke-width', 3)
                .attr('stroke-dasharray', '6,3');
            
            // Añadir puntos en la línea
            svg.selectAll('.reports-point')
                .data(combinedData)
                .enter()
                .append('circle')
                .attr('cx', d => xScale(d.pokemon) + xScale.bandwidth() / 2)
                .attr('cy', d => yRightScale(d.assignedReports))
                .attr('r', 6)
                .attr('fill', '#dc2626')
                .attr('stroke', 'white')
                .attr('stroke-width', 2);
            
            // Etiquetas de valores en los puntos
            svg.selectAll('.reports-label')
                .data(combinedData)
                .enter()
                .append('text')
                .attr('x', d => xScale(d.pokemon) + xScale.bandwidth() / 2)
                .attr('y', d => yRightScale(d.assignedReports) - 10)
                .attr('text-anchor', 'middle')
                .style('font-size', '10px')
                .style('fill', '#dc2626')
                .style('font-weight', 'bold')
                .text(d => d.assignedReports.toLocaleString());
            
            // Eje X
            svg.append('g')
                .attr('transform', `translate(0, ${innerHeight})`)
                .call(d3.axisBottom(xScale))
                .selectAll('text')
                .attr('transform', 'rotate(-45)')
                .attr('text-anchor', 'end')
                .attr('dx', '-0.5em')
                .attr('dy', '0.5em')
                .style('font-size', '11px');
            
            // Eje Y izquierdo (porcentaje de stats)
            svg.append('g')
                .call(d3.axisLeft(yScale).ticks(5, 's'))
                .append('text')
                .attr('x', -50)
                .attr('y', -10)
                .attr('fill', '#666')
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .text('Distribución de Stats (%)');
            
            // Eje Y derecho (reportes de tramposos)
            svg.append('g')
                .attr('transform', `translate(${innerWidth}, 0)`)
                .call(d3.axisRight(yRightScale).ticks(5))
                .append('text')
                .attr('x', 40)
                .attr('y', -10)
                .attr('fill', '#dc2626')
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .text('Reportes de Tramposos');
            
            // Título
            svg.append('text')
                .attr('x', innerWidth / 2)
                .attr('y', -45)
                .attr('text-anchor', 'middle')
                .style('font-size', '18px')
                .style('font-weight', 'bold')
                .style('fill', '#7e22ce')
                .text('⚡ Comparativa: Stats de Pokémon vs Reportes de Tramposos');
            
            // Subtítulo
            svg.append('text')
                .attr('x', innerWidth / 2)
                .attr('y', -25)
                .attr('text-anchor', 'middle')
                .style('font-size', '12px')
                .style('fill', '#666')
                .text('Áreas apiladas = distribución de estadísticas (eje izquierdo) | Línea roja = reportes asignados (eje derecho)');
            
            // Leyenda de stats
            const legendStats = svg.append('g')
                .attr('transform', `translate(${innerWidth + 10}, 0)`);
            
            statNames.forEach((stat, i) => {
                const legendRow = legendStats.append('g')
                    .attr('transform', `translate(0, ${i * 22})`);
                
                legendRow.append('rect')
                    .attr('width', 12)
                    .attr('height', 12)
                    .attr('fill', pokemonColors[i])
                    .attr('opacity', 0.7);
                
                legendRow.append('text')
                    .attr('x', 18)
                    .attr('y', 10)
                    .style('font-size', '10px')
                    .style('fill', '#333')
                    .text(stat);
            });
            
            // Leyenda de reportes
            const legendReports = svg.append('g')
                .attr('transform', `translate(${innerWidth + 10}, ${statNames.length * 22 + 10})`);
            
            legendReports.append('line')
                .attr('x1', 0)
                .attr('y1', 6)
                .attr('x2', 12)
                .attr('y2', 6)
                .attr('stroke', '#dc2626')
                .attr('stroke-width', 3)
                .attr('stroke-dasharray', '6,3');
            
            legendReports.append('text')
                .attr('x', 18)
                .attr('y', 10)
                .style('font-size', '10px')
                .style('fill', '#dc2626')
                .style('font-weight', 'bold')
                .text('Reportes Cheaters');
            
            loading = false;
            console.log('Gráfico D3.js con datos de Cheaters creado');
            
        } catch (err) {
            console.error('Error:', err);
            error = err.message;
            loading = false;
        }
    }
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver</a>
    <h1>⚡ Pokémon API + Cheaters Stats</h1>
    <p class="subtitle">Gráfico D3.js: Distribución de stats de Pokémon vs Reportes de tramposos</p>
    
    <div id="chart" style="min-height: 600px; width: 100%; overflow-x: auto;"></div>
    
    {#if loading}
        <div class="loading">Cargando datos de Pokémon y Cheaters...</div>
    {/if}
    
    {#if error}
        <div class="error">Error: {error}</div>
    {/if}
    
    <div class="info-note">
        <p><strong>📌 Interpretación del gráfico (D3.js):</strong></p>
        <ul>
            <li><strong>📊 Áreas apiladas (colores):</strong> Distribución porcentual de estadísticas de cada Pokémon</li>
            <li><strong>🔴 Línea roja + puntos rojos:</strong> Reportes de tramposos asignados proporcionalmente al poder del Pokémon</li>
            <li><strong>📈 Eje izquierdo:</strong> Porcentaje de contribución de cada estadística (0-100%)</li>
            <li><strong>📉 Eje derecho:</strong> Número de reportes de tramposos asignados</li>
            <li><strong>⚡ Relación:</strong> Los Pokémon más poderosos tienen asignados más reportes</li>
        </ul>
        <p><strong>🐉 Datos:</strong> Pokémon: PokeAPI | Reportes: Cheaters Stats (top países como referencia)</p>
    </div>
</div>

<style>
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #f59e0b; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .loading { text-align: center; padding: 2rem; color: #7e22ce; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
    .info-note { margin-top: 2rem; padding: 1rem; background: #fffbeb; border-radius: 8px; font-size: 0.85rem; color: #666; border-left: 4px solid #f59e0b; }
    .info-note ul { margin: 0.5rem 0; padding-left: 1.5rem; }
    .info-note li { margin: 0.3rem 0; }
</style>