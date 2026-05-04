<script>
    import { onMount } from 'svelte';
    import * as d3 from 'd3';
    
    let loading = true;
    let error = null;
    
    onMount(() => {
        loadData();
    });
    
    async function loadData() {
        try {
            console.log('Cargando Cheaters Stats...');
            
            // 1. Cheaters Stats - URL RELATIVA
            const cheatersRes = await fetch('/api/v2/cheaters-stats?limit=200');
            const cheatersJson = await cheatersRes.json();
            const cheatersData = cheatersJson.data || [];
            
            const cheatersByCountry = {};
            cheatersData.forEach(item => {
                const country = item.country?.toLowerCase();
                if (country) {
                    cheatersByCountry[country] = (cheatersByCountry[country] || 0) + (item.cheater_report || 0);
                }
            });
            
            const topCountries = Object.entries(cheatersByCountry)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([country, reports]) => ({ country: country.toUpperCase(), reports }));
            
            console.log('Cargando Pokémon...');
            
            // 2. Pokémon - URL RELATIVA
            const pokemonRes = await fetch('/api/cheaters-stats/github-pokemon');
            
            if (!pokemonRes.ok) {
                throw new Error(`Error al cargar Pokémon: ${pokemonRes.status}`);
            }
            
            const pokemonData = await pokemonRes.json();
            const pokemonList = pokemonData.data;
            
            console.log('Pokémon cargados:', pokemonList.length);
            
            // Extraer estadísticas
            const pokemonStats = pokemonList.slice(0, 20).map(pokemon => ({
                name: pokemon.name?.english?.toUpperCase() || pokemon.name?.toUpperCase() || 'DESCONOCIDO',
                hp: pokemon.base?.HP || 0,
                attack: pokemon.base?.Attack || 0,
                defense: pokemon.base?.Defense || 0,
                specialAttack: pokemon.base?.['Sp. Attack'] || 0,
                specialDefense: pokemon.base?.['Sp. Defense'] || 0,
                speed: pokemon.base?.Speed || 0,
                totalStats: (pokemon.base?.HP || 0) + (pokemon.base?.Attack || 0) + (pokemon.base?.Defense || 0) +
                           (pokemon.base?.['Sp. Attack'] || 0) + (pokemon.base?.['Sp. Defense'] || 0) + (pokemon.base?.Speed || 0)
            }));
            
            const topPokemon = pokemonStats.sort((a, b) => b.totalStats - a.totalStats).slice(0, 10);
            
            const maxPower = Math.max(...topPokemon.map(p => p.totalStats));
            const maxReports = Math.max(...topCountries.map(c => c.reports));
            
            const combinedData = topPokemon.map(pokemon => ({
                pokemon: pokemon.name,
                hp: pokemon.hp,
                attack: pokemon.attack,
                defense: pokemon.defense,
                specialAttack: pokemon.specialAttack,
                specialDefense: pokemon.specialDefense,
                speed: pokemon.speed,
                totalStats: pokemon.totalStats,
                assignedReports: Math.floor((pokemon.totalStats / maxPower) * maxReports * 0.8)
            }));
            
            setTimeout(() => {
                createChart(combinedData);
                loading = false;
            }, 100);
            
        } catch (err) {
            console.error('Error:', err);
            error = err.message;
            loading = false;
        }
    }
    
    function createChart(combinedData) {
        console.log('Creando gráfico...');
        
        const statNames = ['HP', 'Ataque', 'Defensa', 'At. Especial', 'Def. Especial', 'Velocidad'];
        const statKeys = ['hp', 'attack', 'defense', 'specialAttack', 'specialDefense', 'speed'];
        const colors = ['#a855f7', '#7e22ce', '#6b21a5', '#581c87', '#4c1d95', '#3b0764'];
        
        const normalizedData = combinedData.map(p => {
            const total = statKeys.reduce((sum, key) => sum + p[key], 0);
            const norm = { pokemon: p.pokemon };
            statKeys.forEach((key, i) => {
                norm[statNames[i]] = total > 0 ? (p[key] / total) * 100 : 0;
            });
            return norm;
        });
        
        const container = document.getElementById('chart');
        if (!container) {
            console.error('Contenedor #chart no encontrado');
            return;
        }
        
        container.innerHTML = '';
        
        const width = 1100, height = 550;
        const margin = { top: 80, right: 130, bottom: 80, left: 80 };
        const innerW = width - margin.left - margin.right;
        const innerH = height - margin.top - margin.bottom;
        
        const svg = d3.select('#chart')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        const xScale = d3.scaleBand()
            .domain(combinedData.map(p => p.pokemon))
            .range([0, innerW])
            .padding(0.2);
        
        const yScale = d3.scaleLinear().domain([0, 100]).range([innerH, 0]);
        const maxReportsVal = Math.max(...combinedData.map(p => p.assignedReports));
        const yRightScale = d3.scaleLinear().domain([0, maxReportsVal * 1.1]).range([innerH, 0]);
        
        const stack = d3.stack().keys(statNames);
        const series = stack(normalizedData);
        const colorScale = d3.scaleOrdinal().domain(statNames).range(colors);
        
        series.forEach(s => {
            svg.append('path')
                .datum(s)
                .attr('d', d3.area()
                    .x((d, i) => xScale(normalizedData[i].pokemon) + xScale.bandwidth() / 2)
                    .y0(d => yScale(d[0]))
                    .y1(d => yScale(d[1]))
                    .curve(d3.curveCatmullRom)
                )
                .attr('fill', colorScale(s.key))
                .attr('opacity', 0.7);
        });
        
        svg.append('path')
            .datum(combinedData.map((p, i) => ({
                x: xScale(p.pokemon) + xScale.bandwidth() / 2,
                y: yRightScale(p.assignedReports)
            })))
            .attr('d', d3.line().x(d => d.x).y(d => d.y).curve(d3.curveCatmullRom))
            .attr('fill', 'none')
            .attr('stroke', '#dc2626')
            .attr('stroke-width', 3);
        
        svg.selectAll('.point')
            .data(combinedData)
            .enter()
            .append('circle')
            .attr('cx', d => xScale(d.pokemon) + xScale.bandwidth() / 2)
            .attr('cy', d => yRightScale(d.assignedReports))
            .attr('r', 6)
            .attr('fill', '#dc2626')
            .attr('stroke', 'white')
            .attr('stroke-width', 2);
        
        svg.append('g')
            .attr('transform', `translate(0, ${innerH})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .attr('text-anchor', 'end')
            .style('font-size', '10px');
        
        svg.append('g').call(d3.axisLeft(yScale).ticks(5));
        svg.append('g')
            .attr('transform', `translate(${innerW}, 0)`)
            .call(d3.axisRight(yScale).ticks(5));
        
        svg.append('text')
            .attr('x', innerW / 2)
            .attr('y', -45)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#7e22ce')
            .text('⚡ Pokémon (GitHub Token) vs Reportes de Tramposos');
        
        console.log('Gráfico creado correctamente');
    }
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver</a>
    <h1>⚡ Pokémon API + Cheaters Stats</h1>
    <p class="subtitle">Autenticación con Personal Access Token (PAT) de GitHub</p>
    
    <div id="chart" style="min-height: 600px; width: 100%;"></div>
    
    {#if loading}
        <div class="loading">Cargando datos...</div>
    {/if}
    
    {#if error}
        <div class="error">Error: {error}</div>
    {/if}
    
    <div class="info-note">
        <p><strong>✅ Autenticación con Personal Access Token (PAT)</strong></p>
        <ul>
            <li>🔐 Método: GitHub Personal Access Token</li>
            <li>🐉 Datos: Purukitto/pokemon-data.json</li>
            <li>📊 Gráfico: Pokémon vs Reportes de tramposos</li>
        </ul>
    </div>
</div>

<style>
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #e9d5ff; }
    .back-link { color: #7e22ce; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    h1 { color: #f59e0b; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1.5rem; }
    .loading { text-align: center; padding: 2rem; color: #7e22ce; }
    .error { text-align: center; padding: 2rem; color: #dc2626; }
    .info-note { margin-top: 2rem; padding: 1rem; background: #f1f5f9; border-radius: 8px; font-size: 0.85rem; border-left: 4px solid #3b82f6; }
</style>