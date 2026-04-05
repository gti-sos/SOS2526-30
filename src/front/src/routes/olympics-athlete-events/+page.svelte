<script>
// @ts-nocheck

import { onMount } from 'svelte';   
// @ts-nocheck
    // @ts-ignore
    let athletes = $state([]);
    let loading = $state(false);
    let error = $state(null);
    let successMessage = $state(null);
    let showDeleteModal = $state(false);
    let deleteTarget = $state(null);
    let showCreateForm = $state(false);
    let editingAthlete = $state(null);
    
    // Variables para paginación
    let currentPage = $state(1);
    let itemsPerPage = $state(5);
    let totalAthletes = $state(0);
    let totalPages = $state(1);
    let paginationData = $state(null);
    
    // Variables para búsqueda avanzada
    let searchMode = $state(false);
    let searching = $state(false);
    let searchError = $state(null);
    let searchResults = $state(null);
    
    // Variables para valores únicos
    let campoSeleccionado = $state(null);
    let valoresUnicos = $state([]);
    let mostrarValoresUnicos = $state(false);
    
    // Campos de búsqueda
    let searchFilters = $state({
        name: '',
        year: '',
        from: '',
        to: '',
        team: '',
        sport: '',
        event: '',
        season: '',
        medal: '',
        sex: '',
        city: ''
    });
    
    // Formulario para nuevo/editar atleta
    let formData = $state({
        name: '',
        sex: 'M',
        age: '',
        height: '',
        weight: '',
        team: '',
        noc: '',
        year: '',
        season: 'Summer',
        city: '',
        sport: '',
        event: '',
        medal: 'NA'
    });

    function clearMessages() {
        setTimeout(() => {
            error = null;
            successMessage = null;
            searchError = null;
        }, 5000);
    }

    // API v2 - TODAS LAS OPERACIONES
    async function getAthletes(page = currentPage) {
        loading = true;
        error = null;
        successMessage = null;
        searchMode = false;
        searchResults = null;
        
        try {
            const res = await fetch(`/api/v2/olympics-athlete-events?page=${page}&limit=${itemsPerPage}&t=${Date.now()}`);
            
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('No se encontraron atletas en la base de datos');
                } else {
                    throw new Error(`Error del servidor: ${res.status}`);
                }
            }
            
            const data = await res.json();
            athletes = data.data || [];
            paginationData = data.pagination;
            
            if (paginationData) {
                totalAthletes = paginationData.total;
                totalPages = paginationData.totalPages;
                currentPage = paginationData.page;
            }
            
            if (athletes.length === 0) {
                successMessage = 'La lista está vacía. Puedes cargar datos de ejemplo o añadir un nuevo atleta.';
            }
        } catch (e) {
            // @ts-ignore
            error = e.message;
        } finally {
            loading = false;
            clearMessages();
        }
    }

    function goToPage(page) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            getAthletes(page);
        }
    }

    function changeItemsPerPage() {
        currentPage = 1;
        getAthletes(1);
    }

    // Cargar valores únicos de un campo específico
    async function cargarValoresUnicos(campo) {
        campoSeleccionado = campo;
        mostrarValoresUnicos = true;
        try {
            const res = await fetch(`/api/v2/olympics-athlete-events/${campo}`);
            if (res.ok) {
                valoresUnicos = await res.json();
                successMessage = `Valores únicos de ${campo} cargados (${valoresUnicos.length})`;
            } else {
                error = "Error al obtener valores únicos";
            }
        } catch (e) {
            error = "Error de conexión";
        }
        clearMessages();
    }

    // Aplicar un valor único como filtro
    async function aplicarValorUnico(valor) {
        mostrarValoresUnicos = false;
        
        // Construir query con el filtro
        const params = new URLSearchParams();
        params.append(campoSeleccionado, valor);
        
        searching = true;
        searchMode = true;
        searchResults = null;
        
        try {
            const res = await fetch(`/api/v2/olympics-athlete-events?${params.toString()}&t=${Date.now()}`);
            const data = await res.json();
            searchResults = data.data || (Array.isArray(data) ? data : [data]);
            
            if (searchResults.length === 0) {
                searchError = `No se encontraron resultados para ${campoSeleccionado}: ${valor}`;
            } else {
                successMessage = `Mostrando ${searchResults.length} resultado(s) para ${campoSeleccionado}: ${valor}`;
            }
        } catch (e) {
            searchError = 'Error al aplicar filtro.';
        } finally {
            searching = false;
            clearMessages();
        }
    }

    // Cerrar la vista de valores únicos
    function cerrarValoresUnicos() {
        mostrarValoresUnicos = false;
        campoSeleccionado = null;
        valoresUnicos = [];
    }

    // Búsqueda avanzada
    async function advancedSearch() {
        const params = new URLSearchParams();
        
        for (const [key, value] of Object.entries(searchFilters)) {
            if (value && value.toString().trim() !== '') {
                params.append(key, value.toString().trim());
            }
        }
        
        if (params.toString() === '') {
            searchError = 'Por favor, introduce al menos un criterio de búsqueda.';
            return;
        }
        
        searching = true;
        searchError = null;
        searchResults = null;
        searchMode = true;
        
        try {
            const res = await fetch(`/api/v2/olympics-athlete-events?${params.toString()}&t=${Date.now()}`);
            
            if (res.status === 404) {
                searchError = 'No se encontraron resultados con los criterios especificados.';
                searchResults = [];
                searching = false;
                return;
            }
            
            if (!res.ok) {
                throw new Error('Error en la búsqueda');
            }
            
            const data = await res.json();
            searchResults = data.data || (Array.isArray(data) ? data : [data]);
            
            if (searchResults.length === 0) {
                searchError = 'No se encontraron resultados con los criterios especificados.';
            } else {
                successMessage = `Se encontraron ${searchResults.length} resultado(s).`;
            }
            
        } catch (e) {
            searchError = 'Error al buscar. Por favor, inténtalo de nuevo.';
            console.error(e);
        } finally {
            searching = false;
            clearMessages();
        }
    }

    function clearSearch() {
        searchFilters = {
            name: '',
            year: '',
            from: '',
            to: '',
            team: '',
            sport: '',
            event: '',
            season: '',
            medal: '',
            sex: '',
            city: ''
        };
        searchResults = null;
        searchError = null;
        searchMode = false;
        getAthletes(1);
    }

    async function loadSampleData() {
        loading = true;
        error = null;
        successMessage = null;
        try {
            await fetch('/api/v2/olympics-athlete-events', {
                method: 'DELETE'
            });
            
            const res = await fetch('/api/v2/olympics-athlete-events/loadInitialData');
            
            if (!res.ok) {
                throw new Error('Error al cargar los datos de ejemplo. Por favor, inténtalo de nuevo.');
            }
            
            await getAthletes(1);
            successMessage = 'Se han cargado 15 atletas de ejemplo correctamente.';
        } catch (e) {
            // @ts-ignore
            error = e.message;
        } finally {
            loading = false;
            clearMessages();
        }
    }

    async function saveNewAthlete() {
        try {
            if (!formData.name || !formData.team || !formData.year || !formData.sport || !formData.event) {
                alert('Por favor, completa todos los campos obligatorios (*)');
                return;
            }
            
            const res = await fetch('/api/v2/olympics-athlete-events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    age: formData.age ? parseInt(formData.age) : null,
                    height: formData.height ? parseInt(formData.height) : null,
                    weight: formData.weight ? parseFloat(formData.weight) : null,
                    year: parseInt(formData.year)
                })
            });
            
            if (res.status === 409) {
                alert(`Ya existe un atleta llamado "${formData.name}" que participó en ${formData.event} en el año ${formData.year}.`);
                return;
            }
            
            if (!res.ok) throw new Error('Error al guardar');
            
            await getAthletes(1);
            showCreateForm = false;
            resetForm();
            successMessage = `El atleta "${formData.name}" ha sido añadido correctamente.`;
        } catch (e) {
            alert('No se pudo guardar el atleta.');
        } finally {
            clearMessages();
        }
    }

    async function saveAthleteChanges() {
        try {
            const originalName = editingAthlete.name;
            const originalYear = editingAthlete.year;
            
            if (formData.name !== originalName || parseInt(formData.year) !== originalYear) {
                alert('No se puede cambiar el nombre o año del atleta.');
                return;
            }
            
            const res = await fetch(
                `/api/v2/olympics-athlete-events/${encodeURIComponent(originalName)}/${originalYear}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        ...formData,
                        age: formData.age ? parseInt(formData.age) : null,
                        height: formData.height ? parseInt(formData.height) : null,
                        weight: formData.weight ? parseFloat(formData.weight) : null,
                        year: parseInt(formData.year)
                    })
                }
            );
            
            if (res.status === 404) {
                alert('El atleta que intentas modificar ya no existe.');
                editingAthlete = null;
                showCreateForm = false;
                resetForm();
                return;
            }
            
            if (!res.ok) throw new Error('Error al guardar los cambios');
            
            await getAthletes(1);
            editingAthlete = null;
            showCreateForm = false;
            resetForm();
            successMessage = `Los cambios en "${formData.name}" han sido guardados correctamente.`;
        } catch (e) {
            alert('No se pudieron guardar los cambios.');
        } finally {
            clearMessages();
        }
    }

    async function deleteAthlete(name, year) {
        try {
            const res = await fetch(`/api/v2/olympics-athlete-events/${encodeURIComponent(name)}/${year}`, {
                method: 'DELETE'
            });
            
            if (res.status === 404) {
                alert(`No se encontró el atleta "${name}" del año ${year}.`);
                showDeleteModal = false;
                deleteTarget = null;
                return;
            }
            
            if (!res.ok) throw new Error('Error al eliminar');
            
            await getAthletes(1);
            showDeleteModal = false;
            deleteTarget = null;
            successMessage = `El atleta "${name}" (${year}) ha sido eliminado correctamente.`;
        } catch (e) {
            alert('No se pudo eliminar el atleta.');
        } finally {
            clearMessages();
        }
    }

    async function deleteAllAthletes() {
        if (!confirm('¿Estás seguro de que quieres eliminar TODOS los atletas?\n\nEsta acción no se puede deshacer.')) return;
        
        try {
            const res = await fetch('/api/v2/olympics-athlete-events', {
                method: 'DELETE'
            });
            
            if (!res.ok) throw new Error('Error al eliminar todos');
            
            await getAthletes(1);
            successMessage = 'Todos los atletas han sido eliminados correctamente.';
        } catch (e) {
            alert('No se pudieron eliminar todos los atletas.');
        } finally {
            clearMessages();
        }
    }

    function resetForm() {
        formData = {
            name: '', sex: 'M', age: '', height: '', weight: '',
            team: '', noc: '', year: '', season: 'Summer',
            city: '', sport: '', event: '', medal: 'NA'
        };
    }

    function startEditing(athlete) {
        formData = { ...athlete };
        editingAthlete = athlete;
        showCreateForm = true;
    }

    onMount(async () => {
        await getAthletes(1);
        
        if (athletes.length === 0) {
            await loadSampleData();
        }
    });
</script>

<svelte:head>
    <title>Gestion de Atletas Olimpicos</title>
</svelte:head>

<style>
    :root {
        --blue-50: #f0f9ff;
        --blue-100: #e0f2fe;
        --blue-200: #bae6fd;
        --blue-300: #7dd3fc;
        --blue-500: #0ea5e9;
        --blue-600: #0284c7;
        --blue-700: #0369a1;
        --blue-800: #075985;
    }

    .container {
        max-width: 1400px;
        margin: 0 auto;
        background: white;
        padding: 2rem;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(2, 132, 199, 0.2);
        border: 1px solid var(--blue-200);
    }

    h1 {
        color: var(--blue-800);
        border-bottom: 3px solid var(--blue-500);
        padding-bottom: 0.5rem;
        text-align: center;
    }

    .badge {
        background: var(--blue-100);
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        color: var(--blue-700);
        font-size: 0.8rem;
        margin-left: 0.5rem;
    }

    .msg-success, .msg-error {
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        text-align: center;
    }
    .msg-success { background: #d1fae5; color: #065f46; border: 1px solid #10b981; }
    .msg-error { background: #fee2e2; color: #b91c1c; border: 1px solid #dc2626; }

    .unique-values-buttons {
        background: var(--blue-50);
        padding: 1rem 1.5rem;
        border-radius: 12px;
        margin-bottom: 2rem;
        border: 1px solid var(--blue-200);
    }

    .search-box {
        background: var(--blue-50);
        padding: 1.5rem;
        border-radius: 12px;
        margin-bottom: 2rem;
        border: 1px solid var(--blue-200);
    }

    .search-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1rem;
    }

    label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.3rem;
        color: var(--blue-700);
        font-size: 0.9rem;
    }

    input, select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--blue-200);
        border-radius: 6px;
        box-sizing: border-box;
    }

    input:focus, select:focus {
        outline: none;
        border-color: var(--blue-500);
        box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2);
    }

    input:disabled {
        background: var(--blue-50);
        color: var(--blue-600);
    }

    .btn-group {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        justify-content: center;
        margin-bottom: 2rem;
    }

    button {
        border: none;
        border-radius: 6px;
        padding: 0.5rem 1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }
    button:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn-blue { background: var(--blue-600); color: white; }
    .btn-blue:hover:not(:disabled) { background: var(--blue-700); }
    .btn-green { background: #10b981; color: white; }
    .btn-green:hover:not(:disabled) { background: #059669; }
    .btn-red { background: #dc2626; color: white; }
    .btn-red:hover:not(:disabled) { background: #b91c1c; }
    .btn-gray { background: var(--blue-200); color: var(--blue-800); }
    .btn-gray:hover:not(:disabled) { background: var(--blue-300); }
    .btn-orange { background: #f59e0b; color: white; }
    .btn-orange:hover:not(:disabled) { background: #d97706; }

    .pagination {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .athlete-card {
        margin: 1rem 0;
        padding: 1rem;
        border: 1px solid var(--blue-200);
        border-radius: 8px;
        transition: 0.2s;
    }
    .athlete-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(2, 132, 199, 0.2);
    }

    .athlete-details-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 0.5rem 1rem;
        margin-top: 0.5rem;
    }

    .detail-item {
        margin: 0;
        font-size: 0.9rem;
    }

    .detail-label {
        font-weight: 600;
        color: var(--blue-700);
        margin-right: 0.3rem;
    }

    .grid-2 {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
    }

    .modal {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    }

    .modal-content {
        background: white;
        padding: 2rem;
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    }

    .text-center { text-align: center; }
    .text-muted { color: var(--blue-600); }
    hr { margin: 2rem 0; border: none; border-top: 2px solid var(--blue-200); }
    a { color: var(--blue-600); text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; color: var(--blue-800); }
    .footer-links { display: flex; gap: 2rem; justify-content: center; }
    .search-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem; }
</style>

<div class="container">
    <h1>Gestión de Atletas Olímpicos <span class="badge">API v2</span></h1>

    {#if successMessage}<div class="msg-success">{successMessage}</div>{/if}
    {#if error}<div class="msg-error">{error}</div>{/if}

    <!-- Sección de valores únicos -->
    <div class="unique-values-buttons">
        <h3 style="margin: 0 0 1rem 0; color: var(--blue-700);">📋 Ver valores únicos por campo</h3>
        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            <button onclick={() => cargarValoresUnicos('year')} class="btn-gray">Años</button>
            <button onclick={() => cargarValoresUnicos('team')} class="btn-gray">Países</button>
            <button onclick={() => cargarValoresUnicos('sport')} class="btn-gray">Deportes</button>
            <button onclick={() => cargarValoresUnicos('event')} class="btn-gray">Eventos</button>
            <button onclick={() => cargarValoresUnicos('season')} class="btn-gray">Temporadas</button>
            <button onclick={() => cargarValoresUnicos('medal')} class="btn-gray">Medallas</button>
            <button onclick={() => cargarValoresUnicos('sex')} class="btn-gray">Sexos</button>
            <button onclick={() => cargarValoresUnicos('city')} class="btn-gray">Ciudades</button>
        </div>
    </div>

    <div class="search-box">
        <h3 style="margin-top: 0; color: var(--blue-700);">🔍 Búsqueda avanzada</h3>
        <div class="search-grid">
            <div>
                <label for="searchName">Nombre</label>
                <input id="searchName" type="text" bind:value={searchFilters.name} placeholder="Ej: A Dijiang">
            </div>
            <div>
                <label for="searchYear">Año exacto</label>
                <input id="searchYear" type="number" bind:value={searchFilters.year} placeholder="Ej: 1992">
            </div>
            <div>
                <label for="searchFrom">📅 Desde año</label>
                <input id="searchFrom" type="number" bind:value={searchFilters.from} placeholder="Ej: 2000">
            </div>
            <div>
                <label for="searchTo">📅 Hasta año</label>
                <input id="searchTo" type="number" bind:value={searchFilters.to} placeholder="Ej: 2017">
            </div>
            <div>
                <label for="searchTeam">País</label>
                <input id="searchTeam" type="text" bind:value={searchFilters.team} placeholder="Ej: China">
            </div>
            <div>
                <label for="searchSport">Deporte</label>
                <input id="searchSport" type="text" bind:value={searchFilters.sport} placeholder="Ej: Baloncesto">
            </div>
            <div>
                <label for="searchEvent">Evento</label>
                <input id="searchEvent" type="text" bind:value={searchFilters.event} placeholder="Ej: 100m">
            </div>
            <div>
                <label for="searchSeason">Temporada</label>
                <select id="searchSeason" bind:value={searchFilters.season}>
                    <option value="">Todas</option>
                    <option value="Summer">Verano</option>
                    <option value="Winter">Invierno</option>
                </select>
            </div>
            <div>
                <label for="searchMedal">Medalla</label>
                <select id="searchMedal" bind:value={searchFilters.medal}>
                    <option value="">Todas</option>
                    <option value="Gold">Oro</option>
                    <option value="Silver">Plata</option>
                    <option value="Bronze">Bronce</option>
                    <option value="NA">Ninguna</option>
                </select>
            </div>
            <div>
                <label for="searchSex">Sexo</label>
                <select id="searchSex" bind:value={searchFilters.sex}>
                    <option value="">Todos</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                </select>
            </div>
            <div>
                <label for="searchCity">Ciudad</label>
                <input id="searchCity" type="text" bind:value={searchFilters.city} placeholder="Ej: Barcelona">
            </div>
        </div>
        <div class="search-actions">
            <button onclick={advancedSearch} disabled={searching} class="btn-blue">
                {searching ? 'Buscando...' : '🔍 Buscar'}
            </button>
            <button onclick={clearSearch} class="btn-gray">🗑️ Limpiar búsqueda</button>
        </div>
        
        {#if searchError}<div class="msg-error" style="margin-top: 1rem;">{searchError}</div>{/if}
        
        {#if searchResults !== null && searchResults.length > 0}
            <div style="margin-top: 1.5rem; border-top: 2px solid var(--blue-200); padding-top: 1rem;">
                <h4 style="color: var(--blue-700);">📋 Resultados ({searchResults.length}):</h4>
                {#each searchResults as athlete}
                    <div class="athlete-card" style="margin: 0.5rem 0; padding: 0.8rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <strong style="color: var(--blue-700); font-size: 1.1rem;">{athlete.name}</strong>
                                <span style="margin-left: 0.5rem; color: var(--blue-600);">({athlete.year})</span>
                                <div style="font-size: 0.85rem; margin-top: 0.3rem;">
                                    <span>{athlete.team} • {athlete.sport} • {athlete.event}</span>
                                    {#if athlete.medal && athlete.medal !== 'NA'}
                                        <span style="background: gold; padding: 0.1rem 0.4rem; border-radius: 12px; margin-left: 0.5rem; font-weight: bold;">{athlete.medal}</span>
                                    {/if}
                                </div>
                            </div>
                            <div style="display: flex; gap: 0.3rem;">
                                <button onclick={() => startEditing(athlete)} class="btn-orange" style="padding: 0.2rem 0.6rem; font-size: 0.8rem;">✏️ Editar</button>
                                <button onclick={() => { deleteTarget = { name: athlete.name, year: athlete.year }; showDeleteModal = true; }} 
                                        class="btn-red" style="padding: 0.2rem 0.6rem; font-size: 0.8rem;">🗑️ Borrar</button>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <div class="btn-group">
        <button onclick={loadSampleData} disabled={loading} class="btn-green">Cargar datos ejemplo</button>
        <button onclick={() => { resetForm(); showCreateForm = true; }} class="btn-blue">Añadir nuevo atleta</button>
        <button onclick={deleteAllAthletes} class="btn-red">Eliminar todos</button>
    </div>

    {#if !searchMode && athletes.length > 0}
        <div class="pagination">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <label for="itemsPerPageTop">Mostrar:</label>
                <select id="itemsPerPageTop" bind:value={itemsPerPage} onchange={changeItemsPerPage} style="width: auto;">
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
                <span>por página</span>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} class="btn-gray">◀ Anterior</button>
                <span style="padding: 0.3rem 0.8rem; background: var(--blue-50); border-radius: 4px;">
                    Pág. {currentPage} de {totalPages} ({totalAthletes} total)
                </span>
                <button onclick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} class="btn-gray">Siguiente ▶</button>
            </div>
        </div>
    {/if}

    {#if showCreateForm || editingAthlete}
        <div class="modal">
            <div class="modal-content">
                <h2 style="color: var(--blue-700); margin-top: 0;">{editingAthlete ? '✏️ Editar atleta' : '➕ Nuevo atleta'}</h2>
                <div class="grid-2">
                    <div><label for="formName">Nombre *</label><input id="formName" type="text" bind:value={formData.name} disabled={editingAthlete !== null}></div>
                    <div><label for="formSex">Sexo</label><select id="formSex" bind:value={formData.sex}><option value="M">M</option><option value="F">F</option></select></div>
                    <div><label for="formAge">Edad</label><input id="formAge" type="number" bind:value={formData.age} placeholder="25"></div>
                    <div><label for="formHeight">Altura (cm)</label><input id="formHeight" type="number" bind:value={formData.height} placeholder="180"></div>
                    <div><label for="formWeight">Peso (kg)</label><input id="formWeight" type="number" step="0.1" bind:value={formData.weight} placeholder="75.5"></div>
                    <div><label for="formTeam">País *</label><input id="formTeam" type="text" bind:value={formData.team} placeholder="China"></div>
                    <div><label for="formNoc">Código NOC</label><input id="formNoc" type="text" bind:value={formData.noc} placeholder="CHN"></div>
                    <div><label for="formYearEdit">Año *</label><input id="formYearEdit" type="number" bind:value={formData.year} disabled={editingAthlete !== null}></div>
                    <div><label for="formSeason">Temporada</label><select id="formSeason" bind:value={formData.season}><option value="Summer">Verano</option><option value="Winter">Invierno</option></select></div>
                    <div><label for="formCity">Ciudad</label><input id="formCity" type="text" bind:value={formData.city} placeholder="Barcelona"></div>
                    <div><label for="formSport">Deporte *</label><input id="formSport" type="text" bind:value={formData.sport} placeholder="Baloncesto"></div>
                    <div><label for="formEvent">Evento *</label><input id="formEvent" type="text" bind:value={formData.event} placeholder="Baloncesto masculino"></div>
                    <div style="grid-column: span 2;"><label for="formMedal">Medalla</label>
                        <select id="formMedal" bind:value={formData.medal}>
                            <option value="NA">Ninguna</option><option value="Gold">Oro</option><option value="Silver">Plata</option><option value="Bronze">Bronce</option>
                        </select>
                    </div>
                </div>
                <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
                    <button onclick={() => { showCreateForm = false; editingAthlete = null; resetForm(); }} class="btn-gray">Cancelar</button>
                    <button onclick={editingAthlete ? saveAthleteChanges : saveNewAthlete} class="btn-blue">
                        {editingAthlete ? 'Guardar cambios' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    {/if}

    {#if loading}
        <p class="text-center text-muted">Cargando...</p>
    {:else if athletes.length > 0 && !searchMode}
        <p class="text-center"><strong>Mostrando {athletes.length} atletas (página {currentPage} de {totalPages})</strong></p>
        
        {#each athletes as athlete}
            <div class="athlete-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex-grow: 1;">
                        <h3 style="margin: 0 0 1rem 0; color: var(--blue-700);">{athlete.name}</h3>
                        <div class="athlete-details-grid">
                            <p class="detail-item"><span class="detail-label">ID:</span> {athlete.id}</p>
                            <p class="detail-item"><span class="detail-label">Sexo:</span> {athlete.sex}</p>
                            <p class="detail-item"><span class="detail-label">Edad:</span> {athlete.age ?? 'N/A'}</p>
                            <p class="detail-item"><span class="detail-label">Altura:</span> {athlete.height ?? 'N/A'} cm</p>
                            <p class="detail-item"><span class="detail-label">Peso:</span> {athlete.weight ?? 'N/A'} kg</p>
                            <p class="detail-item"><span class="detail-label">País:</span> {athlete.team}</p>
                            <p class="detail-item"><span class="detail-label">NOC:</span> {athlete.noc ?? 'N/A'}</p>
                            <p class="detail-item"><span class="detail-label">Juegos:</span> {athlete.games ?? 'N/A'}</p>
                            <p class="detail-item"><span class="detail-label">Año:</span> {athlete.year}</p>
                            <p class="detail-item"><span class="detail-label">Temporada:</span> {athlete.season}</p>
                            <p class="detail-item"><span class="detail-label">Ciudad:</span> {athlete.city ?? 'N/A'}</p>
                            <p class="detail-item"><span class="detail-label">Deporte:</span> {athlete.sport}</p>
                            <p class="detail-item"><span class="detail-label">Evento:</span> {athlete.event}</p>
                            <p class="detail-item"><span class="detail-label">Medalla:</span> {
                                athlete.medal === 'Gold' ? '🥇 Oro' : 
                                athlete.medal === 'Silver' ? '🥈 Plata' : 
                                athlete.medal === 'Bronze' ? '🥉 Bronce' : 
                                athlete.medal ?? 'Ninguna'
                            }</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.3rem; margin-left: 1rem;">
                        <button onclick={() => startEditing(athlete)} class="btn-orange" style="padding: 0.3rem 0.8rem;">✏️ Editar</button>
                        <button onclick={() => { deleteTarget = { name: athlete.name, year: athlete.year }; showDeleteModal = true; }} 
                                class="btn-red" style="padding: 0.3rem 0.8rem;">🗑️ Borrar</button>
                    </div>
                </div>
            </div>
        {/each}

        <div style="display: flex; justify-content: center; gap: 0.5rem; margin: 2rem 0;">
            <button onclick={() => goToPage(1)} disabled={currentPage === 1} class="btn-gray">⏮️</button>
            <button onclick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} class="btn-gray">◀</button>
            <span style="padding: 0.3rem 0.8rem; background: var(--blue-50); border-radius: 4px;">{currentPage}/{totalPages}</span>
            <button onclick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} class="btn-gray">▶</button>
            <button onclick={() => goToPage(totalPages)} disabled={currentPage === totalPages} class="btn-gray">⏭️</button>
        </div>

        <hr>
        <div class="footer-links">
            <a href="/">🏠 Inicio</a>
            <a href="/about">📖 Acerca de</a>
            <a href="/api/v2/olympics-athlete-events/docs" target="_blank">📚 Docs v2</a>
        </div>
    {:else if !loading && !searchMode}
        <p class="text-center text-muted" style="padding: 2rem;">📭 No hay atletas. Carga datos de ejemplo o añade uno nuevo.</p>
    {/if}

    {#if showDeleteModal && deleteTarget}
        <div class="modal">
            <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 400px;">
                <h3 style="color: #dc2626; margin-top: 0;">⚠️ Confirmar eliminación</h3>
                <p>¿Estás seguro de que quieres eliminar a <strong>{deleteTarget.name}</strong> ({deleteTarget.year})?</p>
                <p style="color: #666; font-size: 0.9rem;">Esta acción no se puede deshacer.</p>
                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                    <button onclick={() => { showDeleteModal = false; deleteTarget = null; }} class="btn-gray">Cancelar</button>
                    <button onclick={() => deleteAthlete(deleteTarget.name, deleteTarget.year)} class="btn-red">Sí, eliminar</button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Modal para mostrar valores únicos -->
    {#if mostrarValoresUnicos}
        <div class="modal">
            <div class="modal-content" style="max-width: 500px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                    <h3 style="color: var(--blue-700); margin: 0;">Valores únicos: {campoSeleccionado}</h3>
                    <button onclick={cerrarValoresUnicos} class="btn-gray" style="padding: 0.2rem 0.5rem;">✗ Cerrar</button>
                </div>
                <div style="max-height: 400px; overflow-y: auto;">
                    {#if valoresUnicos.length > 0}
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                            {#each valoresUnicos as valor}
                                <button 
                                    onclick={() => aplicarValorUnico(valor)} 
                                    class="btn-blue" 
                                    style="padding: 0.3rem 0.8rem; font-size: 0.8rem;">
                                    {valor}
                                </button>
                            {/each}
                        </div>
                    {:else}
                        <p class="text-muted">No hay valores disponibles</p>
                    {/if}
                </div>
            </div>
        </div>
    {/if}
</div>