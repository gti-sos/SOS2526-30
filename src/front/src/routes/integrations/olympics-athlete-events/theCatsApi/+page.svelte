<script>
// @ts-nocheck

    import { onMount } from 'svelte';
    
    let loading = $state(true);
    let error = $state(null);
    let countriesData = $state([]);
    let chart = null;
    let c3 = null;
    
    const CAT_API_KEY = import.meta.env.VITE_CAT_API_KEY;
    
    onMount(async () => {
        const c3Module = await import('c3');
        c3 = c3Module.default || c3Module;
        await import('c3/c3.css');
        
        await fetchData();
    });
    
    async function fetchData() {
        try {
            loading = true;
            
            // 1. Obtener datos de Olympics
            console.log('Obteniendo datos de Olympics...');
            const olympicsRes = await fetch('/api/v1/olympics-athlete-events/loadInitialData?limit=5000');
            const olympicsData = await olympicsRes.json();
            const athletes = olympicsData;
            
            // 2. Contar atletas por pais
            const countryCount = {};
            athletes.forEach(ath => {
                const country = ath.team;
                if (country && country !== 'NA' && country !== 'Individual' && country !== 'Mixed team') {
                    countryCount[country] = (countryCount[country] || 0) + 1;
                }
            });
            
            // 3. Top 6 paises
            const topCountries = Object.entries(countryCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([country, count]) => ({ country, athletes: count }));
            
            // 4. Buscar razas de gato para cada pais
            const countriesWithCats = [];
            
            for (let i = 0; i < topCountries.length; i++) {
                const item = topCountries[i];
                const { country, athletes } = item;
                
                let breed = null;
                let imageUrl = null;
                
                try {
                    const breedsRes = await fetch('https://api.thecatapi.com/v1/breeds', {
                        headers: { 'x-api-key': CAT_API_KEY }
                    });
                    
                    if (breedsRes.ok) {
                        const breeds = await breedsRes.json();
                        
                        const countryMapping = {
                            'united states': 'united states',
                            'usa': 'united states',
                            'china': 'china',
                            'japan': 'japan',
                            'great britain': 'united kingdom',
                            'uk': 'united kingdom',
                            'russia': 'russia',
                            'germany': 'germany',
                            'france': 'france',
                            'australia': 'australia',
                            'italy': 'italy',
                            'canada': 'canada',
                            'brazil': 'brazil',
                            'spain': 'spain',
                            'netherlands': 'netherlands',
                            'denmark': 'denmark',
                            'sweden': 'sweden',
                            'norway': 'norway',
                            'south korea': 'south korea',
                            'kenya': 'kenya',
                            'jamaica': 'jamaica'
                        };
                        
                        const countryLower = country.toLowerCase().trim();
                        const mappedCountry = countryMapping[countryLower] || countryLower;
                        
                        const foundBreed = breeds.find(b => {
                            const breedOrigin = b.origin?.toLowerCase().trim();
                            return breedOrigin === mappedCountry || breedOrigin === countryLower;
                        });
                        
                        if (foundBreed) {
                            breed = foundBreed;
                            
                            const imgRes = await fetch(`https://api.thecatapi.com/v1/images/search?breed_ids=${foundBreed.id}&limit=1`, {
                                headers: { 'x-api-key': CAT_API_KEY }
                            });
                            
                            if (imgRes.ok) {
                                const imgData = await imgRes.json();
                                imageUrl = imgData[0]?.url || null;
                            }
                            
                            console.log(`OK ${country} -> Raza: ${foundBreed.name}`);
                        } else {
                            console.log(`No se encontró raza para ${country}`);
                        }
                    }
                } catch (error) {
                    console.error(`Error con ${country}:`, error);
                }
                
                countriesWithCats.push({
                    country,
                    athletes,
                    breed: breed ? {
                        name: breed.name,
                        origin: breed.origin,
                        description: breed.description || 'No disponible',
                        temperament: breed.temperament || 'No disponible',
                        lifeSpan: breed.life_span || 'No disponible',
                        weight: breed.weight?.metric || 'No disponible',
                        imageUrl: imageUrl
                    } : null
                });
                
                await new Promise(r => setTimeout(r, 300));
            }
            
            countriesData = countriesWithCats;
            console.log('Datos finales:', countriesData);
            
            await createDonutChart();
            loading = false;
            
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) overlay.style.display = 'none';
            
        } catch (e) {
            console.error('Error:', e);
            error = e.message;
            loading = false;
            const overlay = document.querySelector('.loading-overlay');
            if (overlay) overlay.style.display = 'none';
        }
    }
    
    async function createDonutChart() {
        if (!c3 || countriesData.length === 0) return;
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Preparar datos para el donut
        const columns = countriesData.map(item => [item.country, item.athletes]);
        
        // Crear un mapa de paises a datos de gato para el tooltip
        const catInfoMap = {};
        countriesData.forEach(item => {
            if (item.breed) {
                catInfoMap[item.country] = {
                    breedName: item.breed.name,
                    origin: item.breed.origin,
                    temperament: item.breed.temperament,
                    lifeSpan: item.breed.lifeSpan,
                    weight: item.breed.weight,
                    description: item.breed.description
                };
            } else {
                catInfoMap[item.country] = null;
            }
        });
        
        if (chart) {
            chart.destroy();
        }
        
        chart = c3.generate({
            bindto: '#donut-chart',
            data: {
                columns: columns,
                type: 'donut',
                onclick: function(d, i) {
                    const country = countriesData[i];
                    if (country) {
                        showCountryModal(country);
                    }
                }
            },
            donut: {
                title: {
                    text: 'Atletas Olimpicos',
                    position: 'bottom'
                },
                label: {
                    format: function(value, ratio, id) {
                        return value.toLocaleString();
                    }
                },
                width: 60
            },
            tooltip: {
                format: {
                    title: function(x) { return x; },
                    value: function(value, ratio, id) {
                        const catInfo = catInfoMap[id];
                        let tooltipText = `${value.toLocaleString()} atletas (${Math.round(ratio * 100)}%)`;
                        
                        if (catInfo) {
                            tooltipText += `\n\n Raza: ${catInfo.breedName}`;
                            tooltipText += `\n Origen: ${catInfo.origin}`;
                            tooltipText += `\n Temperamento: ${catInfo.temperament}`;
                            tooltipText += `\n Vida: ${catInfo.lifeSpan} años`;
                            tooltipText += `\n Peso: ${catInfo.weight} kg`;
                            
                        } else {
                            tooltipText += `\n\n No se encontró raza de gato para este pais`;
                        }
                        
                        return tooltipText;
                    }
                }
            },
            color: {
                pattern: ['#0284c7', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec489a']
            },
            legend: {
                position: 'right'
            },
            size: {
                height: 500
            }
        });
    }
    
    let selectedCountry = $state(null);
    
    function showCountryModal(country) {
        selectedCountry = country;
    }
    
    function closeModal() {
        selectedCountry = null;
    }
    
    function formatNumber(num) {
        if (num > 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num > 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }
</script>

<div class="integration-container">
    <h1>Atletas Olimpicos + Razas de Gatos por Pais</h1>
    <p class="subtitle">Grafico Donut: Distribucion de atletas | Tooltip con informacion de la raza de gato</p>
    
    <div class="info-api">
        <p><strong>API 1 (propia):</strong> Olympics Athlete Events - Numero de atletas por pais (campo <code>team</code>)</p>
        <p><strong>API 2 (The Cat API):</strong> Razas de gatos - Campo <code>origin</code> (pais de origen de la raza)</p>
        <p><strong>Widget:</strong> Donut (Doughnut) con <strong>C3.js</strong></p>
        <p><strong>Interaccion:</strong> Pasa el raton sobre cualquier sector para ver los datos del gato | Haz clic para ver imagen y mas detalles</p>
    </div>
    
    <div class="loading-overlay">
        <div class="spinner"></div>
        <p>Cargando datos...</p>
    </div>
    
    {#if error}
        <div class="error">
            <p>Error: {error}</p>
            <p>Verifica que VITE_CAT_API_KEY este configurada</p>
        </div>
    {:else}
        <div id="donut-chart" style="min-height: 550px; width: 100%; margin-bottom: 2rem;"></div>
        
        <div class="table-container">
            <h3>Datos combinados: Atletas + Razas de Gato</h3>
            <div class="table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Pais</th>
                            <th>Atletas Olimpicos</th>
                            <th>Raza de Gato</th>
                            <th>Origen</th>
                            <th>Temperamento</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each countriesData as item}
                            <tr class={item.breed ? 'found' : 'not-found'}>
                                <td><strong>{item.country}</strong></td>
                                <td>{item.athletes.toLocaleString()}</td>
                                <td>
                                    {#if item.breed}
                                         {item.breed.name}
                                    {:else}
                                        <span class="no-breed">No encontrada</span>
                                    {/if}
                                </td>
                                <td>{item.breed?.origin || '-'}</td>
                                <td>{item.breed?.temperament || '-'}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
            <p class="table-info">
                Total paises analizados: {countriesData.length} | 
                Razas encontradas: {countriesData.filter(c => c.breed).length} | 
                No encontradas: {countriesData.filter(c => !c.breed).length}
            </p>
        </div>
        
        {#if selectedCountry}
            <div class="modal" on:click={closeModal}>
                <div class="modal-content" on:click|stopPropagation>
                    <button class="close-btn" on:click={closeModal}>✕</button>
                    
                    <h2>{selectedCountry.country}</h2>
                    <p class="athletes">{selectedCountry.athletes.toLocaleString()} atletas olimpicos</p>
                    
                    {#if selectedCountry.breed}
                        <div class="breed-details">
                            <h3> {selectedCountry.breed.name}</h3>
                            
                            <div class="breed-image">
                                {#if selectedCountry.breed.imageUrl}
                                    <img src={selectedCountry.breed.imageUrl} alt={selectedCountry.breed.name} />
                                {:else}
                                    <div class="no-image-large">🐱</div>
                                {/if}
                            </div>
                            
                            <div class="breed-info">
                                <p><strong>Origen:</strong> {selectedCountry.breed.origin}</p>
                                <p><strong>Descripcion:</strong> {selectedCountry.breed.description}</p>
                                <p><strong>Temperamento:</strong> {selectedCountry.breed.temperament}</p>
                                <p><strong>Esperanza de vida:</strong> {selectedCountry.breed.lifeSpan} años</p>
                                <p><strong>Peso:</strong> {selectedCountry.breed.weight} kg</p>
                            </div>
                        </div>
                    {:else}
                        <div class="no-breed">
                            <p>No se encontró una raza de gato originaria de <strong>{selectedCountry.country}</strong></p>
                            <p>The Cat API no tiene razas registradas para este pais</p>
                        </div>
                    {/if}
                </div>
            </div>
        {/if}
    {/if}
    
    <div class="info">
        <h3>Interpretacion</h3>
        <ul>
            <li><strong>Grafico Donut (C3.js):</strong> Muestra la distribucion de atletas olimpicos por pais (Top 6)</li>
            <li><strong>Tooltip interactivo:</strong> Al pasar el raton sobre cada sector, muestra tambien los datos de la raza de gato</li>
            <li><strong>Datos de Olympics:</strong> Campo <code>team</code> = pais del atleta</li>
            <li><strong>The Cat API:</strong> Campo <code>origin</code> = pais de origen de la raza</li>
            <li><strong>Haz clic:</strong> En el grafico o en "Ver mas" para ver la imagen y detalles completos</li>
        </ul>
    </div>
</div>

<style>
    .integration-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        background: white;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        position: relative;
        min-height: 600px;
    }
    
    h1 {
        color: #0369a1;
        text-align: center;
        margin-bottom: 0.5rem;
    }
    
    .subtitle {
        text-align: center;
        color: #666;
        margin-bottom: 1rem;
    }
    
    .info-api {
        background: #f0f9ff;
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;
        font-size: 0.85rem;
        border-left: 4px solid #0284c7;
    }
    
    .info-api code {
        background: #e2e8f0;
        padding: 0.2rem 0.4rem;
        border-radius: 4px;
        font-size: 0.8rem;
    }
    
    .loading-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.95);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        border-radius: 16px;
        z-index: 100;
    }
    
    .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #0284c7;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .error {
        text-align: center;
        padding: 2rem;
        color: #dc2626;
        background: #fee2e2;
        border-radius: 8px;
    }
    
    .table-container {
        margin-top: 2rem;
        border-top: 1px solid #e2e8f0;
        padding-top: 1rem;
    }
    
    .table-container h3 {
        color: #0369a1;
        margin-bottom: 1rem;
        text-align: left;
    }
    
    .table-wrapper {
        overflow-x: auto;
    }
    
    table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.85rem;
    }
    
    th, td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
    }
    
    th {
        background: #f8fafc;
        font-weight: 600;
        color: #0369a1;
        position: sticky;
        top: 0;
    }
    
    tr:hover {
        background: #f0f9ff;
    }
    
    tr.found {
        background: #f0fdf4;
    }
    
    tr.not-found {
        background: #fef2f2;
    }
    
    .no-breed {
        color: #94a3b8;
        font-style: italic;
    }
    
    .detail-btn {
        background: #0284c7;
        color: white;
        border: none;
        padding: 0.25rem 0.75rem;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.75rem;
    }
    
    .detail-btn:hover {
        background: #0369a1;
    }
    
    .no-data {
        color: #94a3b8;
    }
    
    .table-info {
        margin-top: 1rem;
        font-size: 0.85rem;
        color: #666;
        text-align: right;
    }
    
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }
    
    .modal-content {
        background: white;
        border-radius: 16px;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow: auto;
        position: relative;
        padding: 1.5rem;
    }
    
    .close-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: #e2e8f0;
        border: none;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        cursor: pointer;
        font-size: 1.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .close-btn:hover {
        background: #cbd5e1;
    }
    
    .modal h2 {
        margin: 0 0 0.5rem 0;
        color: #0369a1;
    }
    
    .modal .athletes {
        color: #666;
        margin-bottom: 1rem;
    }
    
    .breed-details h3 {
        color: #0369a1;
        margin-top: 0.5rem;
        margin-bottom: 1rem;
    }
    
    .breed-image {
        margin: 1rem 0;
        border-radius: 12px;
        overflow: hidden;
    }
    
    .breed-image img {
        width: 100%;
        border-radius: 12px;
    }
    
    .no-image-large {
        font-size: 5rem;
        text-align: center;
        padding: 2rem;
        background: #f1f5f9;
        border-radius: 12px;
    }
    
    .breed-info {
        background: #f8fafc;
        padding: 1rem;
        border-radius: 8px;
        margin-top: 1rem;
    }
    
    .breed-info p {
        margin: 0.5rem 0;
        font-size: 0.9rem;
        line-height: 1.4;
    }
    
    .no-breed {
        text-align: center;
        padding: 2rem;
        color: #666;
    }
    
    .info {
        margin-top: 2rem;
        padding: 1rem;
        background: #f0f9ff;
        border-radius: 12px;
        border: 1px solid #bae6fd;
    }
    
    .info h3 {
        color: #0369a1;
        margin-top: 0;
        text-align: left;
    }
    
    .info ul {
        margin: 0;
        padding-left: 1.5rem;
    }
    
    .info li {
        margin: 0.5rem 0;
        color: #333;
    }
</style>