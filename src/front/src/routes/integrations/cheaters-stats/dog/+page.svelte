<script>
    import { onMount, tick } from 'svelte';
    import * as d3 from 'd3';
    import { sankey, sankeyLinkHorizontal } from 'd3-sankey';
    
    let loading = true;
    let error = null;
    let dogBreeds = [];
    let patStatus = null;
    let randomDogImage = null;
    let topTemperaments = [];
    let selectedBreed = null;
    let breedDetail = null;
    let cheatersDataRaw = [];
    let sankeyData = null;
    
    async function loadInitialData() {
        console.log('Verificando Dog API...');
        
        try {
            const response = await fetch('/api/dog/status');
            patStatus = await response.json();
            console.log('Estado PAT Dog API:', patStatus);
            return patStatus;
        } catch (err) {
            console.warn('No se pudo conectar a Dog API:', err.message);
            return null;
        }
    }
    
    async function fetchDogBreeds() {
        console.log('Obteniendo razas de perros...');
        const response = await fetch('/api/dog/breeds?limit=150');
        const data = await response.json();
        console.log(`Dog Breeds: ${data.breeds?.length || 0} razas`);
        return data.breeds || [];
    }
    
    async function fetchTemperaments() {
        console.log('Obteniendo estadísticas de temperamentos...');
        const response = await fetch('/api/dog/temperament-stats');
        const data = await response.json();
        console.log(`Temperamentos: ${data.top_temperaments?.length || 0}`);
        return data.top_temperaments || [];
    }
    
    async function fetchRandomDogImage() {
        console.log('Obteniendo imagen aleatoria...');
        const response = await fetch('/api/dog/random-image');
        const data = await response.json();
        return data.success ? data.image_url : null;
    }
    
    async function fetchCheatersData() {
        console.log('Cargando datos de Cheaters Stats...');
        try {
            const response = await fetch('https://sos2526-30.onrender.com/api/v2/cheaters-stats?limit=200');
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
    
    function prepareSankeyData(cheatersByYear, dogBreedsList, temperamentsList) {
        // Nodos
        const nodes = [
            { name: 'Reportes Cheaters', category: 'reports' },
            ...Object.keys(cheatersByYear).map(year => ({ name: `Año ${year}`, category: 'year' })),
            { name: 'Razas de Perros', category: 'breeds' },
            ...temperamentsList.slice(0, 6).map(t => ({ name: t.name, category: 'temperament', value: t.count }))
        ];
        
        // Links (conexiones)
        const links = [];
        
        // Conexión: Reportes Totales → Años
        const totalReports = Object.values(cheatersByYear).reduce((a, b) => a + b, 0);
        Object.keys(cheatersByYear).forEach(year => {
            links.push({
                source: 'Reportes Cheaters',
                target: `Año ${year}`,
                value: cheatersByYear[year]
            });
        });
        
        // Conexión: Años → Razas de Perros
        Object.keys(cheatersByYear).forEach(year => {
            links.push({
                source: `Año ${year}`,
                target: 'Razas de Perros',
                value: dogBreedsList.length / Object.keys(cheatersByYear).length
            });
        });
        
        // Conexión: Razas de Perros → Temperamentos
        temperamentsList.slice(0, 6).forEach(temp => {
            links.push({
                source: 'Razas de Perros',
                target: temp.name,
                value: temp.count
            });
        });
        
        return { nodes, links };
    }
    
    function renderSankeyChart(sankeyData) {
        const container = document.getElementById('chart');
        if (!container) return;
        container.innerHTML = '';
        
        const width = 1000;
        const height = 600;
        
        const { nodes, links } = sankeyData;
        
        // Mapa de nombres a índices
        const nodeMap = new Map();
        nodes.forEach((node, i) => {
            nodeMap.set(node.name, i);
        });
        
        // Convertir links a índices
        const sankeyLinks = links.map(link => ({
            source: nodeMap.get(link.source),
            target: nodeMap.get(link.target),
            value: link.value
        }));
        
        const sankeyGenerator = sankey()
            .nodeWidth(20)
            .nodePadding(15)
            .extent([[1, 1], [width - 1, height - 1]]);
        
        const { nodes: sankeyNodes, links: sankeyLinksProcessed } = sankeyGenerator({
            nodes: nodes.map((d, i) => ({ ...d, index: i })),
            links: sankeyLinks
        });
        
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('background', '#ffffff')
            .style('border-radius', '12px');
        
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
            .style('opacity', 0);
        
        // Colores por categoría
        const categoryColors = {
            'reports': '#7e22ce',
            'year': '#c084fc',
            'breeds': '#ea580c',
            'temperament': '#fdba74'
        };
        
        // Dibujar links
        svg.append('g')
            .selectAll('path')
            .data(sankeyLinksProcessed)
            .enter()
            .append('path')
            .attr('d', sankeyLinkHorizontal())
            .attr('stroke', d => {
                const sourceCategory = nodes[d.source.index].category;
                return categoryColors[sourceCategory] || '#ccc';
            })
            .attr('stroke-width', d => Math.max(1, d.width))
            .attr('fill', 'none')
            .attr('opacity', 0.6)
            .on('mouseover', function(event, d) {
                d3.select(this).attr('opacity', 0.9);
                tooltip.style('opacity', 1)
                    .html(`<strong>${nodes[d.source.index].name} → ${nodes[d.target.index].name}</strong><br/>Valor: ${d.value.toFixed(0)}`)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 30) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 0.6);
                tooltip.style('opacity', 0);
            });
        
        // Dibujar nodos
        svg.append('g')
            .selectAll('rect')
            .data(sankeyNodes)
            .enter()
            .append('rect')
            .attr('x', d => d.x0)
            .attr('y', d => d.y0)
            .attr('height', d => d.y1 - d.y0)
            .attr('width', d => d.x1 - d.x0)
            .attr('fill', d => categoryColors[d.category] || '#888')
            .attr('stroke', 'white')
            .attr('stroke-width', 1.5)
            .attr('rx', 4)
            .on('mouseover', function(event, d) {
                d3.select(this).attr('opacity', 0.8);
                tooltip.style('opacity', 1)
                    .html(`<strong>${d.name}</strong><br/>Categoría: ${d.category}<br/>Valor: ${d.value || d.y1 - d.y0}`)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 30) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this).attr('opacity', 1);
                tooltip.style('opacity', 0);
            });
        
        // Etiquetas de nodos
        svg.append('g')
            .selectAll('text')
            .data(sankeyNodes)
            .enter()
            .append('text')
            .attr('x', d => d.x0 - 10)
            .attr('y', d => (d.y0 + d.y1) / 2)
            .attr('dy', '0.35em')
            .attr('text-anchor', 'end')
            .style('font-size', '10px')
            .style('font-weight', 'bold')
            .style('fill', '#333')
            .text(d => d.name.length > 15 ? d.name.substring(0, 12) + '...' : d.name);
        
        // Título
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .style('fill', '#9a3412')
            .text('Flujo de Datos: Reportes → Años → Razas → Temperamentos');
        
        // Subtítulo
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 45)
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('fill', '#666')
            .text('Sankey Diagram - El grosor de las líneas indica la magnitud del flujo');
    }
    
    onMount(async () => {
        await tick();
        
        try {
            await loadInitialData();
            
            const [cheatersData, dogBreedsList, temperamentsList, randomImage] = await Promise.all([
                fetchCheatersData(),
                fetchDogBreeds(),
                fetchTemperaments(),
                fetchRandomDogImage()
            ]);
            
            cheatersDataRaw = cheatersData;
            dogBreeds = dogBreedsList;
            topTemperaments = temperamentsList;
            randomDogImage = randomImage;
            
            const cheatersByYear = processCheatersData(cheatersData);
            const sankeyData = prepareSankeyData(cheatersByYear, dogBreedsList, temperamentsList);
            
            const years = Object.keys(cheatersByYear).sort();
            
            console.log('Años:', years);
            console.log('Razas:', dogBreedsList.length);
            console.log('Temperamentos:', temperamentsList.length);
            
            renderSankeyChart(sankeyData);
            
            loading = false;
            
        } catch (err) {
            console.error('Error:', err);
            error = err.message;
            loading = false;
        }
    });
    
    async function loadBreedDetail(breedId) {
        try {
            const response = await fetch(`/api/dog/breed-image/${breedId}`);
            const data = await response.json();
            if (data.success) {
                const breed = dogBreeds.find(b => b.id == breedId);
                breedDetail = {
                    ...breed,
                    image_url: data.image_url
                };
            }
        } catch (err) {
            console.error('Error loading breed detail:', err);
        }
    }
</script>

<div class="container">
    <a href="/integrations/cheaters-stats" class="back-link">← Volver a Cheaters Stats</a>
    <h1>Dog API + Cheaters Stats</h1>
    <p class="subtitle">Sankey Diagram (D3.js): Flujo de datos desde reportes hasta temperamentos de perros</p>
    
    <div class="info-note-top">
        <strong>Interpretación del Sankey Diagram:</strong> Las líneas muestran el flujo de datos. 
        El <strong>grosor</strong> de las líneas es proporcional a la magnitud. 
        De izquierda a derecha: Reportes → Años → Razas de perros → Temperamentos.
    </div>
    
    <div style="min-height: 650px; width: 100%; overflow-x: auto; display: flex; justify-content: center;">
        <div id="chart"></div>
    </div>
    
    {#if loading}
        <div class="loading">Cargando datos de las APIs...</div>
    {:else if error}
        <div class="error">Error: {error}</div>
    {:else}
        <div class="info-grid">
            <div class="info-card">
                <h3>Razas de Perros</h3>
                <p class="big-number">{dogBreeds.length}</p>
                <p>desde The Dog API</p>
            </div>
            <div class="info-card">
                <h3>Temperamentos</h3>
                <p class="big-number">{topTemperaments.length}</p>
                <p>top temperamentos</p>
            </div>
            <div class="info-card">
                <h3>Reportes Totales</h3>
                <p class="big-number">{cheatersDataRaw.reduce((s, i) => s + (i.cheater_report || 0), 0).toLocaleString()}</p>
                <p>de Cheaters Stats</p>
            </div>
        </div>
        
        {#if topTemperaments.length > 0}
        <div class="info-card full-width">
            <h3>Top Temperamentos de Perros</h3>
            <div class="temperament-grid">
                {#each topTemperaments.slice(0, 8) as temp}
                    <span class="temperament-badge">{temp.name}: {temp.count}</span>
                {/each}
            </div>
        </div>
        {/if}
        
        {#if randomDogImage}
        <div class="random-dog">
            <h3>Perro Aleatorio</h3>
            <img src={randomDogImage} alt="Random dog" class="dog-image">
        </div>
        {/if}
        
        <div class="info-note">
            <p><strong>Sankey Diagram (D3.js):</strong></p>
            <ul>
                <li><strong>Nodos morados:</strong> Reportes totales de tramposos</li>
                <li><strong>Nodos violeta claro:</strong> Años (distribución de reportes)</li>
                <li><strong>Nodo naranja:</strong> Total de razas de perros</li>
                <li><strong>Nodos amarillos:</strong> Temperamentos más comunes</li>
                <li><strong>Grosor de línea:</strong> Proporcional a la magnitud del flujo</li>
            </ul>
            <p><strong>APIs utilizadas:</strong> Cheaters Stats + The Dog API (con PAT)</p>
        </div>
    {/if}
</div>

<style>
    .container { max-width: 1100px; margin: 0 auto; padding: 2rem; background: white; border-radius: 16px; border: 1px solid #ffedd5; }
    .back-link { color: #ea580c; text-decoration: none; display: inline-block; margin-bottom: 1rem; }
    .back-link:hover { text-decoration: underline; }
    h1 { color: #9a3412; margin: 0; }
    .subtitle { color: #666; margin-bottom: 1rem; }
    .loading { text-align: center; padding: 2rem; color: #ea580c; }
    .error { text-align: center; padding: 3rem; color: #dc2626; }
    .info-note-top { background: #fff7ed; border-left: 4px solid #ea580c; padding: 0.75rem 1rem; margin-bottom: 1.5rem; border-radius: 8px; font-size: 0.85rem; color: #9a3412; }
    
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    .info-card { background: #fff7ed; padding: 1rem; border-radius: 12px; text-align: center; }
    .info-card h3 { color: #9a3412; margin: 0 0 0.5rem 0; font-size: 1rem; }
    .big-number { font-size: 2rem; font-weight: bold; color: #ea580c; margin: 0.5rem 0; }
    .full-width { grid-column: 1 / -1; }
    .temperament-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; }
    .temperament-badge { background: #fef3c7; color: #9a3412; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.8rem; }
    
    .random-dog { text-align: center; margin-bottom: 1.5rem; padding: 1rem; background: #fef3c7; border-radius: 12px; }
    .dog-image { max-width: 300px; max-height: 200px; border-radius: 12px; object-fit: cover; }
    
    .info-note { margin-top: 1.5rem; padding: 1rem; background: #fff7ed; border-radius: 8px; font-size: 0.85rem; color: #9a3412; border-left: 4px solid #ea580c; }
    .info-note ul { margin: 0.5rem 0; padding-left: 1.5rem; }
    .info-note li { margin: 0.3rem 0; }
    .info-note code { background: #ffedd5; padding: 0.1rem 0.3rem; border-radius: 4px; }
</style>