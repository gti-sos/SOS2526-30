<script>
// @ts-nocheck
    // @ts-ignore
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
    
    // Variables para búsqueda/filtros
    let searchCountry = $state('');
    let searchGame = $state('');
    let searchYear = $state('');
    let searchFrom = $state('');
    let searchTo = $state('');
    let searchResults = $state(null);
    let searching = $state(false);
    let searchError = $state(null);
    let searchMode = $state(false);
    
    // Variables para listas de filtros
    let countries = $state([]);
    let games = $state([]);
    let years = $state([]);
    
    // Formulario para nuevo/editar recurso
    let formData = $state({
        country: '',
        year: new Date().getFullYear(),
        game: '',
        cheater_report: '',
        confirmed_ban: '',
        estimated_cheater: '',
        suspended_account: '',
        repeat_offender: ''
    });

    // Función para formatear valores vacíos
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

    // Cargar listas para filtros
    async function loadFilters() {
        try {
            const [countriesRes, gamesRes, yearsRes] = await Promise.all([
                fetch('/api/v2/cheaters-stats/countries'),
                fetch('/api/v2/cheaters-stats/games'),
                fetch('/api/v2/cheaters-stats/years')
            ]);
            
            if (countriesRes.ok) countries = await countriesRes.json();
            if (gamesRes.ok) games = await gamesRes.json();
            if (yearsRes.ok) years = await yearsRes.json();
        } catch (e) {
            console.error('Error loading filters:', e);
        }
    }

    // API v2 - TODAS LAS OPERACIONES
    async function getResources(page = currentPage) {
        loading = true;
        error = null;
        successMessage = null;
        searchMode = false;
        
        try {
            const params = new URLSearchParams();
            params.append('page', page);
            params.append('limit', itemsPerPage);
            params.append('t', Date.now());
            
            const url = `/api/v2/cheaters-stats?${params.toString()}`;
            const res = await fetch(url);
            
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
            
            await loadFilters();
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
            getResources(page);
        }
    }

    function changeItemsPerPage() {
        currentPage = 1;
        getResources(1);
    }

    // Búsqueda avanzada con filtros
    async function searchResources() {
        searching = true;
        searchError = null;
        searchResults = null;
        searchMode = true;
        
        try {
            const params = new URLSearchParams();
            if (searchCountry) params.append('country', searchCountry);
            if (searchGame) params.append('game', searchGame);
            if (searchYear) params.append('year', searchYear);
            if (searchFrom) params.append('from', searchFrom);
            if (searchTo) params.append('to', searchTo);
            
            const url = `/api/v2/cheaters-stats?${params.toString()}`;
            const res = await fetch(url);
            
            if (res.status === 404) {
                searchError = 'No se encontraron registros con los filtros especificados.';
                searchResults = null;
                return;
            }
            
            if (!res.ok) {
                throw new Error('Error al buscar registros');
            }
            
            const data = await res.json();
            searchResults = data.data || [];
            
            if (searchResults.length === 0) {
                searchError = 'No se encontraron registros con los filtros especificados.';
            } else {
                successMessage = `Se encontraron ${searchResults.length} registro(s) con los filtros aplicados.`;
            }
            
        } catch (e) {
            searchError = 'Error al buscar. Por favor, inténtalo de nuevo.';
        } finally {
            searching = false;
            clearMessages();
        }
    }

    function clearSearch() {
        searchCountry = '';
        searchGame = '';
        searchYear = '';
        searchFrom = '';
        searchTo = '';
        searchResults = null;
        searchError = null;
        searchMode = false;
        getResources(1);
    }

    async function loadSampleData() {
        loading = true;
        error = null;
        successMessage = null;
        try {
            // Primero verificamos si ya hay datos
            const checkRes = await fetch('/api/v2/cheaters-stats?limit=1');
            const checkData = await checkRes.json();
            
            if (checkData.data && checkData.data.length > 0) {
                if (!confirm('Ya existen datos. ¿Quieres reemplazarlos con los datos de ejemplo? Esto eliminará todos los datos actuales.')) {
                    loading = false;
                    return;
                }
                
                await fetch('/api/v2/cheaters-stats?confirm=true', {
                    method: 'DELETE'
                });
            }
            
            const res = await fetch('/api/v2/cheaters-stats/loadInitialData');
            
            if (!res.ok) {
                throw new Error('Error al cargar los datos de ejemplo.');
            }
            
            await getResources(1);
            successMessage = 'Se han cargado 15 registros de ejemplo correctamente.';
        } catch (e) {
            // @ts-ignore
            error = e.message;
        } finally {
            loading = false;
            clearMessages();
        }
    }

    async function saveNewResource() {
        try {
            if (!formData.country || !formData.game || !formData.year || !formData.cheater_report || !formData.confirmed_ban) {
                alert('Por favor, completa todos los campos obligatorios (*)');
                return;
            }
            
            const dataToSend = {
                country: formData.country,
                year: parseInt(formData.year),
                game: formData.game,
                cheater_report: parseInt(formData.cheater_report),
                confirmed_ban: parseInt(formData.confirmed_ban)
            };
            
            if (formData.estimated_cheater) {
                dataToSend.estimated_cheater = parseFloat(formData.estimated_cheater);
            }
            if (formData.suspended_account) {
                dataToSend.suspended_account = parseInt(formData.suspended_account);
            }
            if (formData.repeat_offender) {
                dataToSend.repeat_offender = parseInt(formData.repeat_offender);
            }
            
            const res = await fetch('/api/v2/cheaters-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });
            
            if (res.status === 409) {
                alert(`Ya existe un registro para "${formData.country}" en ${formData.year} con el juego "${formData.game}".`);
                return;
            }
            
            if (res.status === 400) {
                const errorData = await res.json();
                alert(errorData.message || 'Datos incorrectos. Revisa los campos obligatorios.');
                return;
            }
            
            if (!res.ok) throw new Error('Error al guardar');
            
            await getResources(1);
            showCreateForm = false;
            resetForm();
            successMessage = `El registro para "${formData.country}" (${formData.year}) ha sido añadido correctamente.`;
        } catch (e) {
            alert('No se pudo guardar el registro.');
        } finally {
            clearMessages();
        }
    }

    async function saveResourceChanges() {
        try {
            const originalCountry = editingResource.country;
            const originalYear = editingResource.year;
            const originalGame = editingResource.game;
            
            if (formData.country !== originalCountry || parseInt(formData.year) !== originalYear || formData.game !== originalGame) {
                alert('No se puede cambiar el país, año o juego del registro.');
                return;
            }
            
            const dataToSend = {
                country: formData.country,
                year: parseInt(formData.year),
                game: formData.game,
                cheater_report: parseInt(formData.cheater_report),
                confirmed_ban: parseInt(formData.confirmed_ban)
            };
            
            if (formData.estimated_cheater) {
                dataToSend.estimated_cheater = parseFloat(formData.estimated_cheater);
            }
            if (formData.suspended_account) {
                dataToSend.suspended_account = parseInt(formData.suspended_account);
            }
            if (formData.repeat_offender) {
                dataToSend.repeat_offender = parseInt(formData.repeat_offender);
            }
            
            const res = await fetch(
                `/api/v2/cheaters-stats/country/${encodeURIComponent(originalCountry)}/year/${originalYear}/game/${encodeURIComponent(originalGame)}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dataToSend)
                }
            );
            
            if (res.status === 404) {
                alert('El registro que intentas modificar ya no existe.');
                editingResource = null;
                showCreateForm = false;
                resetForm();
                return;
            }
            
            if (!res.ok) throw new Error('Error al guardar los cambios');
            
            await getResources(1);
            editingResource = null;
            showCreateForm = false;
            resetForm();
            successMessage = `Los cambios en "${formData.country}" (${formData.year}) han sido guardados correctamente.`;
        } catch (e) {
            alert('No se pudieron guardar los cambios.');
        } finally {
            clearMessages();
        }
    }

    async function deleteResource(country, year, game) {
        try {
            const res = await fetch(
                `/api/v2/cheaters-stats/country/${encodeURIComponent(country)}/year/${year}/game/${encodeURIComponent(game)}`,
                {
                    method: 'DELETE'
                }
            );
            
            if (res.status === 404) {
                alert(`No se encontró el registro para "${country}" (${year}, ${game}).`);
                showDeleteModal = false;
                deleteTarget = null;
                return;
            }
            
            if (!res.ok && res.status !== 204) throw new Error('Error al eliminar');
            
            await getResources(1);
            showDeleteModal = false;
            deleteTarget = null;
            successMessage = `El registro para "${country}" (${year}, ${game}) ha sido eliminado correctamente.`;
        } catch (e) {
            alert('No se pudo eliminar el registro.');
        } finally {
            clearMessages();
        }
    }

    async function deleteAllResources() {
        if (!confirm('¿Estás seguro de que quieres eliminar TODOS los registros?\n\nEsta acción no se puede deshacer.')) return;
        
        try {
            const res = await fetch('/api/v2/cheaters-stats?confirm=true', {
                method: 'DELETE'
            });
            
            if (!res.ok) throw new Error('Error al eliminar todos');
            
            await getResources(1);
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
            game: '',
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

    getResources(1);
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
        max-width: 1200px;
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

    .search-box {
        background: var(--purple-50);
        padding: 1.5rem;
        border-radius: 12px;
        margin-bottom: 2rem;
        border: 1px solid var(--purple-200);
    }

    .flex-row {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        align-items: flex-end;
    }

    .flex-2 { flex: 2; min-width: 200px; }
    .flex-1 { flex: 1; min-width: 120px; }

    label {
        display: block;
        font-weight: 600;
        margin-bottom: 0.3rem;
        color: var(--purple-700);
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
    .btn-blue { background: #0284c7; color: white; }
    .btn-blue:hover:not(:disabled) { background: #0369a1; }
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
</style>

<div class="container">
    <h1>Gestión de Estadísticas de Tramposos <span class="badge">API v2</span></h1>

    {#if successMessage}<div class="msg-success">{successMessage}</div>{/if}
    {#if error}<div class="msg-error">{error}</div>{/if}

    <!-- BUSCADOR / FILTROS AVANZADOS -->
    <div class="search-box">
        <h3 style="margin-top: 0; color: var(--purple-700);">Buscar registros</h3>
        <div class="flex-row">
            <div class="flex-2">
                <label>País</label>
                <select bind:value={searchCountry}>
                    <option value="">Todos</option>
                    {#each countries as country}
                        <option value={country}>{country}</option>
                    {/each}
                </select>
            </div>
            <div class="flex-2">
                <label>Juego</label>
                <select bind:value={searchGame}>
                    <option value="">Todos</option>
                    {#each games as game}
                        <option value={game}>{game}</option>
                    {/each}
                </select>
            </div>
            <div class="flex-1">
                <label>Año exacto</label>
                <select bind:value={searchYear}>
                    <option value="">Todos</option>
                    {#each years as year}
                        <option value={year}>{year}</option>
                    {/each}
                </select>
            </div>
            <div class="flex-1">
                <label>Desde año</label>
                <input type="number" bind:value={searchFrom} placeholder="Ej: 2010">
            </div>
            <div class="flex-1">
                <label>Hasta año</label>
                <input type="number" bind:value={searchTo} placeholder="Ej: 2020">
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick={searchResources} disabled={searching} class="btn-purple" style="height: 2.5rem;">
                    {searching ? 'Buscando...' : 'Buscar'}
                </button>
                <button onclick={clearSearch} class="btn-gray" style="height: 2.5rem;">Limpiar</button>
            </div>
        </div>
        
        {#if searchError}<div class="msg-error" style="margin-top: 1rem;">{searchError}</div>{/if}
        
        {#if searchResults !== null}
            <div style="margin-top: 1.5rem; border-top: 2px solid var(--purple-200); padding-top: 1rem;">
                <h4 style="color: var(--purple-700);">Resultados de la búsqueda:</h4>
                {#if searchResults.length === 0}
                    <p>No se encontraron resultados.</p>
                {:else}
                    {#each searchResults as resource}
                        <div style="padding: 0.5rem; background: white; border: 1px solid var(--purple-200); border-radius: 4px; margin-bottom: 0.3rem;">
                            <strong>{resource.country}</strong> - {resource.game} ({resource.year}) - Reportes: {resource.cheater_report}
                        </div>
                    {/each}
                {/if}
            </div>
        {/if}
    </div>

    <!-- BOTONES PRINCIPALES -->
    <div class="btn-group">
        <button onclick={loadSampleData} disabled={loading} class="btn-purple">Cargar datos de ejemplo</button>
        <button onclick={() => { resetForm(); showCreateForm = true; }} class="btn-blue">Añadir nuevo registro</button>
        <button onclick={() => getResources(currentPage)} disabled={loading} class="btn-gray">
            {loading ? 'Cargando...' : 'Actualizar lista'}
        </button>
        <button onclick={deleteAllResources} class="btn-red">Eliminar todos</button>
        <a href="/api/v2/cheaters-stats/docs" target="_blank" class="btn-purple" style="background: #8b5cf6; display: inline-block; text-decoration: none;">Documentación v2</a>
    </div>

    <!-- PAGINACIÓN SUPERIOR -->
    {#if !searchMode && resources.length > 0}
        <div class="pagination">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <label>Mostrar:</label>
                <select bind:value={itemsPerPage} onchange={changeItemsPerPage} style="width: auto;">
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

    <!-- FORMULARIO MODAL -->
    {#if showCreateForm || editingResource}
        <div class="modal">
            <div class="modal-content">
                <h2 style="color: var(--purple-700); margin-top: 0;">{editingResource ? 'Editar registro' : 'Nuevo registro'}</h2>
                <div class="grid-2">
                    <div><label>País *</label><input type="text" bind:value={formData.country} disabled={editingResource} placeholder="Ej: Spain"></div>
                    <div><label>Año *</label><input type="number" bind:value={formData.year} disabled={editingResource} placeholder="Ej: 2020"></div>
                    <div><label>Juego *</label><input type="text" bind:value={formData.game} disabled={editingResource} placeholder="Ej: csgo"></div>
                    <div><label>Reportes de tramposos *</label><input type="number" bind:value={formData.cheater_report} placeholder="Ej: 100"></div>
                    <div><label>Baneos confirmados *</label><input type="number" bind:value={formData.confirmed_ban} placeholder="Ej: 50"></div>
                    <div><label>Porcentaje estimado de tramposos</label><input type="number" step="0.01" bind:value={formData.estimated_cheater} placeholder="Ej: 2.5"></div>
                    <div><label>Cuentas suspendidas</label><input type="number" bind:value={formData.suspended_account} placeholder="Ej: 30"></div>
                    <div><label>Reincidentes</label><input type="number" bind:value={formData.repeat_offender} placeholder="Ej: 10"></div>
                </div>
                {#if editingResource}
                    <p style="color: var(--purple-600); font-size: 0.9rem; margin-top: 1rem;">
                        Para cambiar país, año o juego, elimina el registro y crea uno nuevo.
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

    <!-- LISTA DE RECURSOS -->
    {#if loading}
        <p class="text-center text-muted">Cargando registros...</p>
    {:else if resources.length > 0}
        <p class="text-center"><strong>Mostrando {resources.length} registros (página {currentPage} de {totalPages})</strong></p>
        
        {#each resources as resource}
            <div class="resource-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="flex-grow: 1;">
                        <h3 style="margin: 0 0 1rem 0; color: var(--purple-700);">{resource.country} - {resource.game}</h3>
                        <div class="resource-details-grid">
                            <p class="detail-item"><span class="detail-label">Año:</span> {resource.year}</p>
                            <p class="detail-item"><span class="detail-label">Reportes de tramposos:</span> {resource.cheater_report}</p>
                            <p class="detail-item"><span class="detail-label">Baneos confirmados:</span> {resource.confirmed_ban}</p>
                            <p class="detail-item"><span class="detail-label">Porcentaje estimado:</span> {formatValue(resource.estimated_cheater)}</p>
                            <p class="detail-item"><span class="detail-label">Cuentas suspendidas:</span> {formatValue(resource.suspended_account)}</p>
                            <p class="detail-item"><span class="detail-label">Reincidentes:</span> {formatValue(resource.repeat_offender)}</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.3rem; margin-left: 1rem;">
                        <button onclick={() => startEditing(resource)} class="btn-orange" style="padding: 0.3rem 0.8rem;">Editar</button>
                        <button onclick={() => { deleteTarget = { country: resource.country, year: resource.year, game: resource.game }; showDeleteModal = true; }} 
                                class="btn-red" style="padding: 0.3rem 0.8rem;">Eliminar</button>
                    </div>
                </div>
            </div>
        {/each}

        <!-- PAGINACIÓN INFERIOR -->
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

    <!-- MODAL CONFIRMACIÓN ELIMINAR -->
    {#if showDeleteModal && deleteTarget}
        <div class="modal">
            <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 400px;">
                <h3 style="color: #dc2626; margin-top: 0;">Confirmar eliminación</h3>
                <p>¿Eliminar este registro?</p>
                <p><strong>{deleteTarget.country} - {deleteTarget.game} ({deleteTarget.year})</strong></p>
                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button onclick={() => showDeleteModal = false} class="btn-gray">Cancelar</button>
                    <button onclick={() => deleteResource(deleteTarget.country, deleteTarget.year, deleteTarget.game)} class="btn-red">Sí, eliminar</button>
                </div>
            </div>
        </div>
    {/if}
</div>