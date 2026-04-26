<script>
    let allResources = $state([]);
    let displayedResources = $state([]);
    
    let loading = $state(false);
    let error = $state(null);
    let successMessage = $state(null);
    
    let showDeleteModal = $state(false);
    let deleteTarget = $state(null);
    let showCreateForm = $state(false);
    
    let currentPage = $state(1);
    let itemsPerPage = $state(5);
    
    let totalPages = $derived(Math.ceil((allResources?.length || 0) / itemsPerPage) || 1);
    
    let formData = $state({
        country: '', year: new Date().getFullYear(), active_player_no: '', viewership: '',
        top_genre: '', top_platform: '', tournament_no: '', pro_player_no: '',
        internet_penetration: '', company_no: ''
    });

    let searchParams = $state({
        country: '', year: '', from: '', to: '', active_player_no: '', viewership: '',
        top_genre: '', top_platform: '', tournament_no: '', pro_player_no: '',
        internet_penetration: '', company_no: ''
    });

    $effect(() => {
        const safeResources = Array.isArray(allResources) ? allResources : [];
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        displayedResources = safeResources.slice(start, end);
    });

    function clearMessages() {
        setTimeout(() => { error = null; successMessage = null; }, 5000);
    }

    async function getResources() {
        loading = true;
        try {
            const params = new URLSearchParams();
            for (const [key, value] of Object.entries(searchParams)) {
                if (value !== '' && value !== null) params.append(key, value);
            }
            const res = await fetch(`/api/v1/esportsgrowth-stats?${params.toString()}`);
            if (res.status === 404) { allResources = []; error = 'No existen resultados.'; return; }
            if (!res.ok) throw new Error('Error');
            const data = await res.json();
            allResources = Array.isArray(data) ? data : [];
            successMessage = allResources.length > 0 ? `Cargados ${allResources.length} registros.` : null;
            currentPage = 1;
        } catch (e) {
            allResources = []; error = 'Error de conexión.';
        } finally {
            loading = false; clearMessages();
        }
    }

    async function loadSampleData() {
        if (!confirm('¿Cargar datos de ejemplo?')) return;
        try {
            await fetch('/api/v1/esportsgrowth-stats/loadInitialData');
            await getResources();
        } catch (e) { error = 'Error al cargar.'; }
    }

    async function saveNewResource() {
        try {
            const res = await fetch('/api/v1/esportsgrowth-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({...formData, year: parseInt(formData.year)})
            });
            if (!res.ok) throw new Error();
            showCreateForm = false;
            resetForm();
            await getResources();
        } catch (e) { alert('Error al guardar.'); }
    }

    async function deleteResource(country, year) {
        try {
            await fetch(`/api/v1/esportsgrowth-stats/${country}/${year}`, { method: 'DELETE' });
            showDeleteModal = false;
            await getResources();
        } catch (e) { alert('Error al eliminar.'); }
    }

    function resetForm() {
        formData = { country: '', year: new Date().getFullYear(), active_player_no: '', viewership: '', top_genre: '', top_platform: '', tournament_no: '', pro_player_no: '', internet_penetration: '', company_no: '' };
    }

    function clearSearch() {
        searchParams = { country: '', year: '', from: '', to: '', active_player_no: '', viewership: '', top_genre: '', top_platform: '', tournament_no: '', pro_player_no: '', internet_penetration: '', company_no: '' };
        getResources();
    }

    getResources();
</script>

<div class="container">
    <h1>Estadísticas de Crecimiento de eSports</h1>

    {#if successMessage}<div class="msg-success">{successMessage}</div>{/if}
    {#if error}<div class="msg-error">{error}</div>{/if}

    <div class="btn-group main-actions">
        <button class="btn-blue" onclick={() => { resetForm(); showCreateForm = true; }}>➕ Añadir Nuevo</button>
        <button class="btn-purple" onclick={loadSampleData}>📥 Cargar Ejemplo</button>
        <button class="btn-gray" onclick={getResources}>🔄 Actualizar</button>
    </div>

    <div class="analytics-nav">
        <a href="/analytics/esportsgrowth-stats" class="btn-analytics">📊 Ver Gráfica Analítica</a>
        <a href="/analytics/esportsgrowth-stats/map" class="btn-map">🌍 Ver Mapa Geoespacial</a>
    </div>

    <div class="search-box">
        <h3 style="margin-top: 0; color: var(--p-700);">Búsqueda Avanzada</h3>
        <div class="search-grid">
            <div><label>País</label><input type="text" bind:value={searchParams.country}></div>
            <div><label>Desde año</label><input type="number" bind:value={searchParams.from}></div>
            <div><label>Hasta año</label><input type="number" bind:value={searchParams.to}></div>
            <div><label>Género</label><input type="text" bind:value={searchParams.top_genre}></div>
        </div>
        <div style="text-align: right; margin-top: 1rem;">
            <button class="btn-purple" onclick={getResources}>Buscar</button>
            <button class="btn-gray" onclick={clearSearch}>Limpiar</button>
        </div>
    </div>

    {#if loading}
        <p style="text-align: center;">Cargando...</p>
    {:else}
        {#each displayedResources as resource}
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3>{resource.country} ({resource.year})</h3>
                    <div>
                        <a href={`/esportsgrowth-stats/${resource.country}/${resource.year}`} class="btn-orange-small">Editar</a>
                        <button class="btn-red-small" onclick={() => { deleteTarget = resource; showDeleteModal = true; }}>Borrar</button>
                    </div>
                </div>
                <div class="grid-info">
                    <span><strong>Jugadores:</strong> {resource.active_player_no}M</span>
                    <span><strong>Espectadores:</strong> {resource.viewership}M</span>
                    <span><strong>Género:</strong> {resource.top_genre}</span>
                </div>
            </div>
        {/each}
    {/if}

    <div style="text-align: center; margin-top: 2rem;">
        <button class="btn-red" style="font-size: 0.8rem; opacity: 0.7;" onclick={() => { if(confirm('¿Borrar TODO?')) fetch('/api/v1/esportsgrowth-stats', {method:'DELETE'}).then(getResources) }}>⚠️ Vaciar Base de Datos</button>
    </div>
</div>

<style>
    :root { --p-50: #faf5ff; --p-200: #e9d5ff; --p-500: #a855f7; --p-600: #9333ea; --p-700: #7e22ce; }
    .container { max-width: 900px; margin: 0 auto; padding: 2rem; font-family: sans-serif; }
    h1 { color: var(--p-700); text-align: center; border-bottom: 2px solid var(--p-500); }
    
    .btn-group { display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 1.5rem; }
    
    /* Estilos nuevos para los botones de analíticas */
    .analytics-nav { display: flex; gap: 1rem; justify-content: center; margin-bottom: 2rem; padding: 1rem; background: #f8fafc; border-radius: 12px; border: 1px dashed var(--p-200); }
    .btn-analytics, .btn-map { text-decoration: none; padding: 0.8rem 1.5rem; border-radius: 8px; color: white; font-weight: bold; transition: 0.2s; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
    .btn-analytics { background: #0f172a; } .btn-analytics:hover { background: #1e293b; transform: translateY(-2px); }
    .btn-map { background: #10b981; } .btn-map:hover { background: #059669; transform: translateY(-2px); }

    .search-box { background: var(--p-50); padding: 1rem; border-radius: 8px; border: 1px solid var(--p-200); margin-bottom: 2rem; }
    .search-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; }
    .card { border: 1px solid #e2e8f0; padding: 1rem; border-radius: 10px; margin-bottom: 1rem; background: white; }
    .grid-info { display: flex; gap: 1.5rem; font-size: 0.9rem; color: #475569; margin-top: 0.5rem; }
    
    button { cursor: pointer; border: none; border-radius: 6px; padding: 0.5rem 1rem; color: white; font-weight: bold; }
    .btn-blue { background: #0284c7; } .btn-purple { background: var(--p-600); } .btn-gray { background: #64748b; } .btn-red { background: #ef4444; }
    .btn-orange-small { background: #f59e0b; color: white; text-decoration: none; padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; }
    .btn-red-small { background: #ef4444; padding: 4px 8px; font-size: 0.8rem; margin-left: 4px;}
</style>