<script>
    import { onMount } from 'svelte';
// @ts-nocheck
    import { tick } from 'svelte';
    let resources = $state([]);
    let loading = $state(false);
    let error = $state(null);
    let successMessage = $state(null);
    let showDeleteModal = $state(false);
    let deleteTarget = $state(null);
    let showCreateForm = $state(false);
    let editingResource = $state(null);
    
    // Variables para paginación
    let currentPage = $state(1);
    let itemsPerPage = $state(5);
    let totalResources = $state(0);
    let totalPages = $state(1);
    let paginationData = $state(null);
    
    // Variables para búsqueda avanzada
    let searchMode = $state(false);
    let searching = $state(false);
    let searchError = $state(null);
    let searchResults = $state(null);
    
    // Variables para filtros por campo
    let filterValues = $state({
        countries: [],
        years: []
    });
    
    let activeFieldFilter = $state(null);
    let activeFilterValue = $state(null);
    
    // Campos de búsqueda
    let searchFilters = $state({
        country: '',
        year: '',
        from: '',
        to: '',
        cheater_report: '',
        confirmed_ban: '',
        estimated_cheater: '',
        suspended_account: '',
        repeat_offender: ''
    });
    
    // Formulario para nuevo/editar recurso
    let formData = $state({
        country: '',
        year: new Date().getFullYear(),
        cheater_report: '',
        confirmed_ban: '',
        estimated_cheater: '',
        suspended_account: '',
        repeat_offender: ''
    });

    function formatValue(value) {
        if (value === null || value === undefined || value === '') {
            return 'No disponible';
        }
        return value;
    }

    function clearMessages() {
        setTimeout(() => {
            error = null;
            successMessage = null;
            searchError = null;
        }, 5000);
    }

    // Cargar valores únicos para filtros
    async function loadFilterValues() {
        try {
            const [countriesRes, yearsRes] = await Promise.all([
                fetch('/api/v2/cheaters-stats/countries'),
                fetch('/api/v2/cheaters-stats/years')
            ]);
            
            if (countriesRes.ok) filterValues.countries = await countriesRes.json();
            if (yearsRes.ok) filterValues.years = await yearsRes.json();
        } catch (e) {
            console.error('Error loading filter values:', e);
        }
    }

    // Función auxiliar para recargar datos SIN afectar mensajes
    async function refreshData() {
        try {
            const params = new URLSearchParams();
            params.append('page', currentPage);
            params.append('limit', itemsPerPage);
            params.append('t', Date.now());
            
            const url = `/api/v2/cheaters-stats?${params.toString()}`;
            const res = await fetch(url);
            
            if (!res.ok) throw new Error(`Error al recargar: ${res.status}`);
            
            const data = await res.json();
            resources = data.data || [];
            paginationData = data.pagination;
            
            if (paginationData) {
                totalResources = paginationData.total;
                totalPages = paginationData.totalPages;
                currentPage = paginationData.page;
            }
        } catch (e) {
            console.error('Error refreshing data:', e);
        }
    }

    // API v2 - TODAS LAS OPERACIONES
    async function getResources(page = currentPage) {
        loading = true;
        error = null;
        successMessage = null;
        searchMode = false;
        searchResults = null;
        
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', itemsPerPage);
            params.append('t', Date.now());
            
            const res = await fetch(`/api/v2/cheaters-stats?${params.toString()}`);
            
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('No se encontraron registros en la base de datos');
                } else {
                    throw new Error(`Error del servidor: ${res.status}`);
                }
            }
            
            const data = await res.json();
            resources = data.data || [];
            paginationData = data.pagination;
            
            if (paginationData) {
                totalResources = paginationData.total;
                totalPages = paginationData.totalPages;
                currentPage = paginationData.page;
            }
            
            if (resources.length === 0) {
                successMessage = 'La lista está vacía. Puedes cargar datos de ejemplo o añadir un nuevo registro.';
            }
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
            clearMessages();
        }
    }

    function goToPage(page) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            getResources(page);
        }
    }

    function changeItemsPerPage() {
        currentPage = 1;
        getResources(1);
    }

    // Aplicar filtro por campo seleccionado
    async function applyFieldFilter(field, value) {
        if (!value) {
            activeFieldFilter = null;
            activeFilterValue = null;
            getResources(1);
            return;
        }
        
        activeFieldFilter = field;
        activeFilterValue = value;
        
        const params = new URLSearchParams();
        params.append(field, value);
        
        searching = true;
        // CORRECCIÓN: mostrar resultados en la lista principal (searchMode=false)
        // para que el locator .resource-card los encuentre en los tests
        searchMode = false;
        searchResults = null;
        
        try {
            const res = await fetch(`/api/v2/cheaters-stats?${params.toString()}&t=${Date.now()}`);
            const data = await res.json();
            const results = data.data || [];
            
            if (results.length === 0) {
                searchError = `No se encontraron resultados para ${field === 'country' ? 'país' : field}: ${value}`;
            } else {
                // Mostrar en la lista principal en vez de en el search-box
                resources = results;
                totalResources = results.length;
                totalPages = 1;
                currentPage = 1;
                successMessage = `Mostrando ${results.length} resultado(s) para ${field === 'country' ? 'país' : field}: ${value}`;
            }
        } catch (e) {
            searchError = 'Error al aplicar filtro.';
        } finally {
            searching = false;
            clearMessages();
        }
    }
    
    function clearFieldFilter() {
        activeFieldFilter = null;
        activeFilterValue = null;
        searchMode = false;
        searchResults = null;
        searchError = null;
        successMessage = null;
        getResources(1);
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
        activeFieldFilter = null;
        activeFilterValue = null;
        
        try {
            const res = await fetch(`/api/v2/cheaters-stats?${params.toString()}&t=${Date.now()}`);
            
            if (res.status === 404) {
                searchError = 'No se encontraron resultados con los criterios especificados.';
                searchResults = [];
                searching = false;
                return;
            }
            
            if (!res.ok) throw new Error('Error en la búsqueda');
            
            const data = await res.json();
            searchResults = data.data || [];
            
            if (searchResults.length === 0) {
                searchError = 'No se encontraron resultados con los criterios especificados.';
            } else {
                successMessage = `Se encontraron ${searchResults.length} resultado(s).`;
            }
            
        } catch (e) {
            searchError = 'Error al buscar. Por favor, inténtalo de nuevo.';
        } finally {
            searching = false;
            clearMessages();
        }
    }

    function clearSearch() {
        searchFilters = {
            country: '',
            year: '',
            from: '',
            to: '',
            cheater_report: '',
            confirmed_ban: '',
            estimated_cheater: '',
            suspended_account: '',
            repeat_offender: ''
        };
        searchResults = null;
        searchError = null;
        searchMode = false;
        activeFieldFilter = null;
        activeFilterValue = null;
        getResources(1);
    }

    async function loadSampleData() {
        loading = true;
        error = null;
        try {
            const checkRes = await fetch('/api/v2/cheaters-stats?limit=1');
            const checkData = await checkRes.json();
            
            if (checkData.data && checkData.data.length > 0) {
                if (!confirm('Ya existen datos. ¿Quieres reemplazarlos con los datos de ejemplo? Esto eliminará todos los datos actuales.')) {
                    loading = false;
                    return;
                }
                // CORRECCIÓN: el DELETE ahora funciona sin requerir ?confirm=true
                await fetch('/api/v2/cheaters-stats', { method: 'DELETE' });
            }
            
            const res = await fetch('/api/v2/cheaters-stats/loadInitialData');
            
            if (!res.ok) throw new Error('Error al cargar los datos de ejemplo.');
            
            await refreshData();
            await loadFilterValues();
            successMessage = 'Se han cargado 15 registros de ejemplo correctamente.';
            
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
            clearMessages();
        }
    }

   async function saveNewResource() {
    let savedCountry, savedYear;
    
    try {
        if (!formData.country || !formData.year || !formData.cheater_report || !formData.confirmed_ban) {
            alert('Por favor, completa todos los campos obligatorios (*)');
            return;
        }
        
        savedCountry = formData.country;
        savedYear = formData.year;

        const dataToSend = {
            country: formData.country,
            year: parseInt(formData.year),
            cheater_report: parseInt(formData.cheater_report),
            confirmed_ban: parseInt(formData.confirmed_ban)
        };
        
        if (formData.estimated_cheater) dataToSend.estimated_cheater = parseFloat(formData.estimated_cheater);
        if (formData.suspended_account) dataToSend.suspended_account = parseInt(formData.suspended_account);
        if (formData.repeat_offender) dataToSend.repeat_offender = parseInt(formData.repeat_offender);
        
        const res = await fetch('/api/v2/cheaters-stats', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataToSend)
        });
        
        if (res.status === 409) {
            alert(`Ya existe un registro para "${formData.country}" en ${formData.year}.`);
            return;
        }
        
        if (!res.ok) throw new Error('Error al guardar');
        
        // ÉXITO - Asignar mensaje
        successMessage = `El registro para "${savedCountry}" (${savedYear}) ha sido añadido correctamente.`;
        
        // CERRAR MODAL INMEDIATAMENTE
        showCreateForm = false;
        resetForm();
        
        // Recargar datos en segundo plano (sin await para no bloquear)
        getResources(currentPage);
        loadFilterValues();
        
    } catch (e) {
        alert('No se pudo guardar el registro: ' + e.message);
    } finally {
        clearMessages();
    }
}

   async function saveResourceChanges() {
    const originalCountry = editingResource.country;
    const originalYear = editingResource.year;
    try {
        if (formData.country !== originalCountry || parseInt(formData.year) !== originalYear) {
            alert('No se puede cambiar el país o año del registro.');
            return;
        }
        
        const dataToSend = {
            country: formData.country,
            year: parseInt(formData.year),
            cheater_report: formData.cheater_report ? parseInt(formData.cheater_report) : 0,
            confirmed_ban: formData.confirmed_ban ? parseInt(formData.confirmed_ban) : 0
        };
        
        if (formData.estimated_cheater) dataToSend.estimated_cheater = parseFloat(formData.estimated_cheater);
        if (formData.suspended_account) dataToSend.suspended_account = parseInt(formData.suspended_account);
        if (formData.repeat_offender) dataToSend.repeat_offender = parseInt(formData.repeat_offender);
        
        const res = await fetch(
            `/api/v2/cheaters-stats/country/${encodeURIComponent(originalCountry)}/year/${originalYear}`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            }
        );
        
        if (res.ok || res.status === 200) {
            // Actualizar en memoria para reflejar cambios inmediatamente
            resources = resources.map(r =>
                (r.country === originalCountry && r.year === originalYear)
                    ? { ...r, ...dataToSend }
                    : r
            );
            successMessage = `Los cambios en "${originalCountry}" (${originalYear}) han sido guardados correctamente.`;
            // Recargar en segundo plano
            refreshData();
            loadFilterValues();
        } else {
            alert('Error al guardar los cambios (código: ' + res.status + ')');
        }
        
    } catch (e) {
        alert('No se pudieron guardar los cambios: ' + e.message);
    } finally {
        // CORRECCIÓN: retrasar el cierre del modal y limpieza para que el mensaje sea visible
        setTimeout(() => {
            editingResource = null;
            showCreateForm = false;
            resetForm();
            clearMessages();
        }, 100);
    }
}

    async function deleteResource(country, year) {
        try {
            const res = await fetch(
                `/api/v2/cheaters-stats/country/${encodeURIComponent(country)}/year/${year}`,
                { method: 'DELETE' }
            );
            
            if (res.ok || res.status === 204) {
                // Eliminar del array en memoria para respuesta inmediata
                resources = resources.filter(r => !(r.country === country && r.year === year));
                successMessage = `El registro para "${country}" (${year}) ha sido eliminado correctamente.`;
                // Recargar en segundo plano
                refreshData();
                loadFilterValues();
            } else if (res.status === 404) {
                alert(`No se encontró el registro para "${country}" (${year}).`);
            } else {
                alert('Error al eliminar el registro (código: ' + res.status + ')');
            }
            
        } catch (e) {
            alert('No se pudo eliminar el registro.');
        } finally {
            // CORRECCIÓN DEFINITIVA: cerrar el modal SIEMPRE en finally
            showDeleteModal = false;
            deleteTarget = null;
            clearMessages();
        }
    }

    async function deleteAllResources() {
        if (!confirm('¿Estás seguro de que quieres eliminar TODOS los registros?\n\nEsta acción no se puede deshacer.')) return;
        
        try {
            // CORRECCIÓN: el backend ya no requiere ?confirm=true obligatoriamente
            const res = await fetch('/api/v2/cheaters-stats', { method: 'DELETE' });
            
            if (!res.ok) throw new Error('Error al eliminar todos');
            
            await getResources(1);
            await loadFilterValues();
            successMessage = 'Todos los registros han sido eliminados correctamente.';
        } catch (e) {
            alert('No se pudieron eliminar todos los registros.');
        } finally {
            clearMessages();
        }
    }

    function resetForm() {
        formData = {
            country: '',
            year: new Date().getFullYear(),
            cheater_report: '',
            confirmed_ban: '',
            estimated_cheater: '',
            suspended_account: '',
            repeat_offender: ''
        };
    }

    function startEditing(resource) {
        formData = { ...resource };
        editingResource = resource;
        showCreateForm = true;
    }

    async function checkAndLoadData() {
        try {
            const checkRes = await fetch('/api/v2/cheaters-stats?limit=1');
            const checkData = await checkRes.json();
            
            if (!checkData.data || checkData.data.length === 0) {
                console.log('No hay datos, cargando datos de ejemplo...');
                await loadSampleData();
            }
        } catch (e) {
            console.error('Error checking data:', e);
        }
    }



    onMount(async () => {
        await getResources(1);
        await loadFilterValues();

        if (resources.length === 0) {
            await loadSampleData();
        }
    
});
</script>

<svelte:head>
    <title>Gestión de Estadísticas de Tramposos (API v2)</title>
</svelte:head>

<style>
    :root {
        --purple-50: #faf5ff;
        --purple-100: #f3e8ff;
        --purple-200: #e9d5ff;
        --purple-300: #d8b4fe;
        --purple-500: #a855f7;
        --purple-600: #9333ea;
        --purple-700: #7e22ce;
        --purple-800: #6b21a5;
    }

    .container {
        max-width: 1400px;
        margin: 0 auto;
        background: white;
        padding: 2rem;
        border-radius: 16px;
        box-shadow: 0 20px 25px -5px rgba(147, 51, 234, 0.2);
        border: 1px solid var(--purple-200);
    }

    h1 {
        color: var(--purple-800);
        border-bottom: 3px solid var(--purple-500);
        padding-bottom: 0.5rem;
        text-align: center;
    }

    .badge {
        background: var(--purple-100);
        padding: 0.2rem 0.5rem;
        border-radius: 4px;
        color: var(--purple-700);
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

    .field-filters {
        background: var(--purple-50);
        padding: 1rem 1.5rem;
        border-radius: 12px;
        margin-bottom: 2rem;
        border: 1px solid var(--purple-200);
    }

    .filters-row {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: flex-end;
    }

    .filter-group {
        flex: 1;
        min-width: 150px;
    }

    .filter-group label {
        font-size: 0.8rem;
        font-weight: 600;
        color: var(--purple-700);
        margin-bottom: 0.2rem;
    }

    .filter-group select {
        width: 100%;
        padding: 0.4rem;
        border: 1px solid var(--purple-200);
        border-radius: 6px;
        background: white;
    }

    .active-filter-badge {
        display: inline-block;
        background: var(--purple-600);
        color: white;
        padding: 0.2rem 0.6rem;
        border-radius: 20px;
        font-size: 0.8rem;
        margin-left: 0.5rem;
    }

    .search-box {
        background: var(--purple-50);
        padding: 1.5rem;
        border-radius: 12px;
        margin-bottom: 2rem;
        border: 1px solid var(--purple-200);
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
        color: var(--purple-700);
        font-size: 0.9rem;
    }

    input, select {
        width: 100%;
        padding: 0.5rem;
        border: 1px solid var(--purple-200);
        border-radius: 6px;
        box-sizing: border-box;
    }

    input:focus, select:focus {
        outline: none;
        border-color: var(--purple-500);
        box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.2);
    }

    input:disabled {
        background: var(--purple-50);
        color: var(--purple-600);
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

    .btn-purple { background: var(--purple-600); color: white; }
    .btn-purple:hover:not(:disabled) { background: var(--purple-700); }
    .btn-green { background: #10b981; color: white; }
    .btn-green:hover:not(:disabled) { background: #059669; }
    .btn-red { background: #dc2626; color: white; }
    .btn-red:hover:not(:disabled) { background: #b91c1c; }
    .btn-gray { background: var(--purple-200); color: var(--purple-800); }
    .btn-gray:hover:not(:disabled) { background: var(--purple-300); }
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

    .resource-card {
        margin: 1rem 0;
        padding: 1rem;
        border: 1px solid var(--purple-200);
        border-radius: 8px;
        transition: 0.2s;
    }
    .resource-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(147, 51, 234, 0.2);
    }

    .resource-details-grid {
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
        color: var(--purple-700);
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
    .text-muted { color: var(--purple-600); }
    hr { margin: 2rem 0; border: none; border-top: 2px solid var(--purple-200); }
    a { color: var(--purple-600); text-decoration: none; font-weight: 500; }
    a:hover { text-decoration: underline; color: var(--purple-800); }
    .footer-links { display: flex; gap: 2rem; justify-content: center; }
    .search-actions { display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1rem; }
</style>

<div class="container">
    <h1>Gestión de Estadísticas de Tramposos <span class="badge">API v2</span></h1>

    {#if successMessage}<div class="msg-success">{successMessage}</div>{/if}
    {#if error}<div class="msg-error">{error}</div>{/if}

    <!-- Filtros por campo -->
    <div class="field-filters">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.8rem;">
            <h3 style="margin: 0; color: var(--purple-700); font-size: 1rem;">Filtrar por campo</h3>
            {#if activeFieldFilter}
                <button onclick={clearFieldFilter} class="btn-gray" style="font-size: 0.8rem;">Limpiar filtro</button>
            {/if}
        </div>
        <div class="filters-row">
            <div class="filter-group">
                <label for="filter-country">País</label>
                <select id="filter-country" onchange={(e) => applyFieldFilter('country', e.target.value)}>
                    <option value="">Nada seleccionado</option>
                    {#each filterValues.countries as country}
                        <option value={country} selected={activeFieldFilter === 'country' && activeFilterValue === country}>{country}</option>
                    {/each}
                </select>
            </div>
            
            <div class="filter-group">
                <label for="filter-year">Año</label>
                <select id="filter-year" onchange={(e) => applyFieldFilter('year', e.target.value)}>
                    <option value="">Nada seleccionado</option>
                    {#each filterValues.years as year}
                        <option value={year} selected={activeFieldFilter === 'year' && activeFilterValue == year}>{year}</option>
                    {/each}
                </select>
            </div>
        </div>
        
        {#if activeFieldFilter}
            <div style="margin-top: 0.8rem; font-size: 0.85rem;">
                <span class="active-filter-badge">
                    Filtro activo: {activeFieldFilter === 'country' ? 'País' : 'Año'} = {activeFilterValue}
                </span>
            </div>
        {/if}
    </div>

    <!-- Búsqueda avanzada -->
    <div class="search-box">
        <h3 style="margin-top: 0; color: var(--purple-700);">Búsqueda avanzada</h3>
        <div class="search-grid">
            <div>
                <label for="searchCountry">País</label>
                <input id="searchCountry" type="text" bind:value={searchFilters.country} placeholder="Ej: Spain">
            </div>
            <div>
                <label for="searchYear">Año exacto</label>
                <input id="searchYear" type="number" bind:value={searchFilters.year} placeholder="Ej: 2020">
            </div>
            <div>
                <label for="searchFrom">Desde año</label>
                <input id="searchFrom" type="number" bind:value={searchFilters.from} placeholder="Ej: 2010">
            </div>
            <div>
                <label for="searchTo">Hasta año</label>
                <input id="searchTo" type="number" bind:value={searchFilters.to} placeholder="Ej: 2020">
            </div>
            <div>
                <label for="searchCheaterReport">Reportes de tramposos</label>
                <input id="searchCheaterReport" type="number" bind:value={searchFilters.cheater_report} placeholder="Ej: 704">
            </div>
            <div>
                <label for="searchConfirmedBan">Baneos confirmados</label>
                <input id="searchConfirmedBan" type="number" bind:value={searchFilters.confirmed_ban} placeholder="Ej: 367">
            </div>
            <div>
                <label for="searchEstimatedCheater">% Estimado</label>
                <input id="searchEstimatedCheater" type="number" step="0.01" bind:value={searchFilters.estimated_cheater} placeholder="Ej: 2.48">
            </div>
            <div>
                <label for="searchSuspendedAccount">Cuentas suspendidas</label>
                <input id="searchSuspendedAccount" type="number" bind:value={searchFilters.suspended_account} placeholder="Ej: 308">
            </div>
            <div>
                <label for="searchRepeatOffender">Reincidentes</label>
                <input id="searchRepeatOffender" type="number" bind:value={searchFilters.repeat_offender} placeholder="Ej: 62">
            </div>
        </div>
        <div class="search-actions">
            <button onclick={advancedSearch} disabled={searching} class="btn-purple">
                {searching ? 'Buscando...' : 'Buscar'}
            </button>
            <button onclick={clearSearch} class="btn-gray">Limpiar búsqueda</button>
        </div>
        
        {#if searchError}<div class="msg-error" style="margin-top: 1rem;">{searchError}</div>{/if}
        
        {#if searchResults !== null && searchResults.length > 0}
            <div style="margin-top: 1.5rem; border-top: 2px solid var(--purple-200); padding-top: 1rem;">
                <h4 style="color: var(--purple-700);">Resultados ({searchResults.length}):</h4>
                {#each searchResults as resource}
                    <div class="resource-card" style="margin: 0.5rem 0; padding: 0.8rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <!-- CORRECCIÓN: año entre paréntesis para que coincida con los tests -->
                                <strong style="color: var(--purple-700); font-size: 1.1rem;">{resource.country}</strong>
                                <span style="margin-left: 0.5rem; color: var(--purple-600);">({resource.year})</span>
                                <div style="font-size: 0.85rem; margin-top: 0.3rem;">
                                    Reportes: {resource.cheater_report} | Baneos: {resource.confirmed_ban}
                                    {#if resource.estimated_cheater} | % Estimado: {resource.estimated_cheater}{/if}
                                </div>
                            </div>
                            <div style="display: flex; gap: 0.3rem;">
                                <button onclick={() => startEditing(resource)} class="btn-orange" style="padding: 0.2rem 0.6rem; font-size: 0.8rem;">Editar</button>
                                <button onclick={() => { deleteTarget = { country: resource.country, year: resource.year }; showDeleteModal = true; }} 
                                        class="btn-red" style="padding: 0.2rem 0.6rem; font-size: 0.8rem;">Borrar</button>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </div>

    <!-- Botones principales -->
    <div class="btn-group">
        <button onclick={loadSampleData} disabled={loading} class="btn-green">Cargar datos de ejemplo</button>
        <button onclick={() => { resetForm(); showCreateForm = true; }} class="btn-purple">Añadir nuevo registro</button>
        <button onclick={deleteAllResources} class="btn-red">Eliminar todos</button>
        <a href="/api/v2/cheaters-stats/docs" target="_blank" class="btn-purple" style="background: #8b5cf6; display: inline-block; text-decoration: none;">Documentación v2</a>
    </div>

    <!-- Paginación -->
    {#if !searchMode && resources.length > 0}
        <div class="pagination">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <label for="itemsPerPage">Mostrar:</label>
                <select id="itemsPerPage" bind:value={itemsPerPage} onchange={changeItemsPerPage} style="width: auto;">
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                </select>
                <span>por página</span>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} class="btn-gray">Anterior</button>
                <span style="padding: 0.3rem 0.8rem; background: var(--purple-50); border-radius: 4px;">
                    Pág. {currentPage} de {totalPages} ({totalResources} total)
                </span>
                <button onclick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} class="btn-gray">Siguiente</button>
            </div>
        </div>
    {/if}

    <!-- Modal para crear/editar -->
    {#if showCreateForm || editingResource}
        <div class="modal" id="edit-modal">
            <div class="modal-content">
                <h2 style="color: var(--purple-700); margin-top: 0;">{editingResource ? 'Editar registro' : 'Nuevo registro'}</h2>
                <div class="grid-2">
                    <div><label for="formCountry">País *</label><input id="formCountry" type="text" bind:value={formData.country} disabled={editingResource !== null} placeholder="Ej: Spain"></div>
                    <div><label for="formYear">Año *</label><input id="formYear" type="number" bind:value={formData.year} disabled={editingResource !== null} placeholder="Ej: 2020"></div>
                    <div><label for="formCheaterReport">Reportes de tramposos *</label><input id="formCheaterReport" type="number" bind:value={formData.cheater_report} placeholder="Ej: 100"></div>
                    <div><label for="formConfirmedBan">Baneos confirmados *</label><input id="formConfirmedBan" type="number" bind:value={formData.confirmed_ban} placeholder="Ej: 50"></div>
                    <div><label for="formEstimatedCheater">% Estimado de tramposos</label><input id="formEstimatedCheater" type="number" step="0.01" bind:value={formData.estimated_cheater} placeholder="Ej: 2.5"></div>
                    <div><label for="formSuspendedAccount">Cuentas suspendidas</label><input id="formSuspendedAccount" type="number" bind:value={formData.suspended_account} placeholder="Ej: 30"></div>
                    <div><label for="formRepeatOffender">Reincidentes</label><input id="formRepeatOffender" type="number" bind:value={formData.repeat_offender} placeholder="Ej: 10"></div>
                </div>
                {#if editingResource}
                    <p style="color: var(--purple-600); font-size: 0.9rem; margin-top: 1rem;">
                        Para cambiar país o año, elimina el registro y crea uno nuevo.
                    </p>
                {/if}
                <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
                    <button onclick={() => { showCreateForm = false; editingResource = null; resetForm(); }} class="btn-gray">Cancelar</button>
                    <button onclick={editingResource ? saveResourceChanges : saveNewResource} class="btn-purple">
                        {editingResource ? 'Guardar cambios' : 'Guardar'}
                    </button>
                </div>
            </div>
        </div>
    {/if}

    <!-- Lista de recursos -->
    {#if loading}
        <p class="text-center text-muted">Cargando registros...</p>
    {:else if resources.length > 0 && !searchMode}
        <p class="text-center"><strong>Mostrando {resources.length} registros (página {currentPage} de {totalPages})</strong></p>
        
        {#each resources as resource}
            <div class="resource-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex-grow: 1;">
                        <!-- CORRECCIÓN: año entre paréntesis en el h3 para que los tests puedan detectarlo -->
                        <h3 style="margin: 0 0 1rem 0; color: var(--purple-700);">
                            {resource.country} <span style="font-size: 0.85rem; font-weight: normal; color: var(--purple-600);">({resource.year})</span>
                        </h3>
                        <div class="resource-details-grid">
                            <p class="detail-item"><span class="detail-label">Año:</span> {resource.year}</p>
                            <p class="detail-item"><span class="detail-label">Reportes de tramposos:</span> {resource.cheater_report}</p>
                            <p class="detail-item"><span class="detail-label">Baneos confirmados:</span> {resource.confirmed_ban}</p>
                            <p class="detail-item"><span class="detail-label">% Estimado:</span> {formatValue(resource.estimated_cheater)}</p>
                            <p class="detail-item"><span class="detail-label">Cuentas suspendidas:</span> {formatValue(resource.suspended_account)}</p>
                            <p class="detail-item"><span class="detail-label">Reincidentes:</span> {formatValue(resource.repeat_offender)}</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.3rem; margin-left: 1rem;">
                        <button onclick={() => startEditing(resource)} class="btn-orange" style="padding: 0.3rem 0.8rem;">Editar</button>
                        <button onclick={() => { deleteTarget = { country: resource.country, year: resource.year }; showDeleteModal = true; }} 
                                class="btn-red" style="padding: 0.3rem 0.8rem;">Eliminar</button>
                    </div>
                </div>
            </div>
        {/each}

        <div style="display: flex; justify-content: center; gap: 0.5rem; margin: 2rem 0;">
            <button onclick={() => goToPage(1)} disabled={currentPage === 1} class="btn-gray">Primera</button>
            <button onclick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} class="btn-gray">Anterior</button>
            <span style="padding: 0.3rem 0.8rem; background: var(--purple-50); border-radius: 4px;">{currentPage}/{totalPages}</span>
            <button onclick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} class="btn-gray">Siguiente</button>
            <button onclick={() => goToPage(totalPages)} disabled={currentPage === totalPages} class="btn-gray">Última</button>
        </div>

        <hr>
        <div class="footer-links">
            <a href="/">Inicio</a>
            <a href="/about">Acerca de</a>
            <a href="/api/v2/cheaters-stats/docs" target="_blank">Documentación API v2</a>
        </div>
    {:else if !loading && !searchMode}
        <p class="text-center text-muted" style="padding: 2rem;">No hay registros. Carga datos de ejemplo o añade uno nuevo.</p>
    {/if}

    <!-- Modal para eliminar -->
    {#if showDeleteModal && deleteTarget}
        <div class="modal" id="delete-modal">
            <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 400px;">
                <h3 style="color: #dc2626; margin-top: 0;">Confirmar eliminación</h3>
                <p>¿Estás seguro de que quieres eliminar este registro?</p>
                <p><strong>{deleteTarget.country} ({deleteTarget.year})</strong></p>
                <p style="color: #666; font-size: 0.9rem;">Esta acción no se puede deshacer.</p>
                <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 1.5rem;">
                    <button onclick={() => { showDeleteModal = false; deleteTarget = null; }} class="btn-gray">Cancelar</button>
                    <button onclick={() => deleteResource(deleteTarget.country, deleteTarget.year)} class="btn-red">Sí, eliminar</button>
                </div>
            </div>
        </div>
    {/if}
</div>