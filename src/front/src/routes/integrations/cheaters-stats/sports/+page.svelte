<script>
    import { onMount, tick } from 'svelte';
    import * as d3 from 'd3';
    
    let loading = true;
    let error = null;
    
    let totalReportes = 0;
    let maxStadiumCapacity = 0;
    let maxStadiumTeam = '';
    let totalTeamsProcessed = 0;
    let teamsWithCapacity = 0;
    
   
    async function fetchCheatersData() {
        console.log('Cargando datos de Cheaters Stats...');
        
        const proxyResponse = await fetch('/api/v2/cheaters-stats?limit=200');
        if (proxyResponse.ok) {
            const json = await proxyResponse.json();
            const allData = json.data || [];
            const total = allData.reduce((sum, item) => sum + (item.cheater_report || 0), 0);
            console.log(`Total reportes: ${total}`);
            return total;
        }
        
        throw new Error('No se pudo obtener datos de Cheaters Stats');
    }
    
   
    async function fetchSpanishTeams() {
        
        
      
        const response = await fetch('/api/sports/teams?sport=Soccer&country=Spain');
        
        if (!response.ok) {
            throw new Error('Error al obtener datos del proxy');
        }
        
        const data = await response.json();
        const teams = data.teams || [];
        
        console.log(`Equipos encontrados: ${teams.length}`);
        
        let maxCapacity = 0;
        let maxTeam = '';
        let validTeams = 0;
        
        teams.forEach(team => {
            const capacity = parseInt(team.intStadiumCapacity, 10);
            if (!isNaN(capacity) && capacity > 0) {
                validTeams++;
                if (capacity > maxCapacity) {
                    maxCapacity = capacity;
                    maxTeam = team.strTeam;
                }
            }
        });
        
        console.log(`Equipos con capacidad válida: ${validTeams}`);
        console.log(`Capacidad máxima: ${maxCapacity.toLocaleString()} (${maxTeam})`);
        
        return { maxCapacity, maxTeam, totalTeams: teams.length, validTeams };
    }
    
    function renderPieChart() {
        const container = document.getElementById('pie-chart');
        if (!container) return;
        container.innerHTML = '';
        
        const totalComparacion = totalReportes + maxStadiumCapacity;
        
        const data = [
            { name: 'Reportes de Tramposos', value: totalReportes, color: '#7e22ce', description: 'Total de reportes' },
            { name: 'Capacidad Máxima Estadio', value: maxStadiumCapacity, color: '#f59e0b', description: `Estadio de ${maxStadiumTeam}` }
        ];
        
        const width = 700;
        const height = 650;
        const radius = Math.min(width, height) / 2 - 80;
        
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2 - 30})`);
        
        const color = d3.scaleOrdinal()
            .domain(data.map(d => d.name))
            .range(data.map(d => d.color));
        
        const pie = d3.pie().value(d => d.value).sort(null);
        const arc = d3.arc().innerRadius(60).outerRadius(radius);
        const arcHover = d3.arc().innerRadius(60).outerRadius(radius + 10);
        
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
        
        const slices = svg.selectAll('path')
            .data(pie(data))
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', d => color(d.data.name))
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .on('mouseover', function(event, d) {
                d3.select(this).transition().duration(200).attr('d', arcHover);
                const percentage = ((d.data.value / totalComparacion) * 100).toFixed(1);
                tooltip.style('opacity', 1)
                    .html(`<strong>${d.data.name}</strong><br/>Valor: ${d.data.value.toLocaleString()}<br/>Porcentaje: ${percentage}%<br/>${d.data.description}`)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 30) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).transition().duration(200).attr('d', arc);
                tooltip.style('opacity', 0);
            });
        
        slices.append('text')
            .attr('transform', d => {
                const centroid = arc.centroid(d);
                const angle = Math.atan2(centroid[1], centroid[0]);
                const r = radius * 0.7;
                const x = r * Math.cos(angle);
                const y = r * Math.sin(angle);
                return `translate(${x}, ${y})`;
            })
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', 'white')
            .style('text-shadow', '1px 1px 0px rgba(0,0,0,0.5)')
            .text(d => {
                const percentage = ((d.data.value / totalComparacion) * 100).toFixed(1);
                return `${percentage}%`;
            });
        
        // Texto central
        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .style('fill', '#166534')
            .text('COMPARATIVA');
        
        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1.6em')
            .style('font-size', '13px')
            .style('fill', '#166534')
            .text(totalComparacion.toLocaleString());
        
        // Título
        svg.append('text')
            .attr('x', 0)
            .attr('y', -radius - 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#166534')
            .text('Reportes de Tramposos vs Capacidad del Estadio Más Grande');
        
        // Leyenda debajo del gráfico
        const legendX = -150;
        const legendY = radius + 40;
        
        const legend = svg.append('g')
            .attr('transform', `translate(${legendX}, ${legendY})`);
        
        data.forEach((d, i) => {
            const legendRow = legend.append('g')
                .attr('transform', `translate(${i * 220}, 0)`);
            
            legendRow.append('rect')
                .attr('width', 16)
                .attr('height', 16)
                .attr('fill', d.color)
                .attr('rx', 4);
            
            legendRow.append('text')
                .attr('x', 22)
                .attr('y', 13)
                .style('font-size', '12px')
                .style('fill', '#333')
                .style('font-weight', 'bold')
                .text(`${d.name}: ${d.value.toLocaleString()}`);
        });
    }
    
    onMount(async () => {
        await tick();
        try {
            const [reportes, sportsData] = await Promise.all([
                fetchCheatersData(),
                fetchSpanishTeams()
            ]);
            
            totalReportes = reportes;
            maxStadiumCapacity = sportsData.maxCapacity;
            maxStadiumTeam = sportsData.maxTeam;
            totalTeamsProcessed = sportsData.totalTeams;
            teamsWithCapacity = sportsData.validTeams;
            
            console.log('Datos cargados desde el proxy:', { 
                totalReportes, 
                maxStadiumCapacity, 
                maxStadiumTeam
            });
            
            renderPieChart();
            loading = false;
        } catch (err) {
            console.error('Error fatal:', err);
            error = err.message;
            loading = false;
        }
    });
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver a Cheaters Stats</a>
    <h1>Cheaters Stats + Fútbol en España</h1>
    <p class="subtitle">Comparativa: Reportes de tramposos vs Capacidad del estadio más grande de España</p>
    
    <div class="info-note-top">
        <strong>Interpretación del gráfico:</strong> El gráfico circular compara el total de reportes de tramposos 
        con la <strong>capacidad máxima de un estadio de fútbol</strong> en España (The Sports DB).
    </div>
    
    <div style="min-height: 750px; width: 100%; display: flex; justify-content: center;">
        <div id="pie-chart"></div>
    </div>
    
    {#if loading}
        <div class="loading">Cargando datos de las APIs a través del proxy...</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else}
        <div class="stats-grid">
            <div class="stat-card cheaters">
                <h3>Reportes de Tramposos</h3>
                <p class="big-number">{totalReportes.toLocaleString()}</p>
                <p>Total de reportes</p>
            </div>
            <div class="stat-card stadium">
                <h3>Capacidad Máxima</h3>
                <p class="big-number">{maxStadiumCapacity.toLocaleString()}</p>
                <p>Estadio de <strong>{maxStadiumTeam}</strong></p>
            </div>
            <div class="stat-card info">
                <h3>Equipos Analizados</h3>
                <p class="big-number">{totalTeamsProcessed}</p>
                <p>Equipos de fútbol en España</p>
                <small>({teamsWithCapacity} con capacidad válida)</small>
            </div>
        </div>
        
        <div class="info-note">
            <p><strong>Datos obtenidos en tiempo real (sin precarga):</strong></p>
            <ul>
                <li><strong>Cheaters Stats:</strong> <code>fetch('/api/v2/cheaters-stats')</code> → Total de reportes</li>
                <li><strong>The Sports DB (vía proxy):</strong> <code>fetch('/api/sports/teams?sport=Soccer&country=Spain')</code> → Equipos españoles y capacidades</li>
                <li><strong>Capacidad máxima:</strong> Se calcula recorriendo todos los equipos</li>
            </ul>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 900px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #dcfce7; }
    .back-link { color: #16a34a; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #166534; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1rem; }
    .loading { text-align: center; padding: 2rem; color: #16a34a; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
    .info-note-top { background: #f0fdf4; border-left: 4px solid #22c55e; padding: 0.75rem 1rem; margin-bottom: 1.5rem; border-radius: 8px; font-size: 0.85rem; color: #166534; }
    
    .stats-grid { display: flex; flex-wrap: wrap; justify-content: center; gap: 1.5rem; margin: 2rem 0; }
    .stat-card { border-radius: 16px; padding: 1rem 1.5rem; text-align: center; min-width: 200px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .stat-card.cheaters { background: linear-gradient(135deg, #7e22ce, #581c87); color: white; }
    .stat-card.stadium { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; }
    .stat-card.info { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; }
    .big-number { font-size: 2rem; font-weight: bold; margin: 0.5rem 0; }
    .stat-card p { margin: 0; opacity: 0.9; }
    .stat-card small { display: block; font-size: 0.7rem; opacity: 0.7; margin-top: 0.3rem; }
    
    .info-note { margin-top: 1rem; padding: 1rem; background: #f0fdf4; border-radius: 8px; font-size: 0.85rem; color: #166534; border-left: 4px solid #22c55e; }
    .info-note ul { margin: 0.5rem 0; padding-left: 1.5rem; }
    .info-note code { background: #bbf7d0; padding: 0.1rem 0.3rem; border-radius: 4px; }
</style>