<script>
    // @ts-nocheck
    let allResources = $state([]);
    let displayedResources = $state([]);
    
    let loading = $state(false);
    let error = $state(null);
    let successMessage = $state(null);
    
    let showDeleteModal = $state(false);
    let deleteTarget = $state(null);
    let showCreateForm = $state(false);
    
    // Paginación 
    let currentPage = $state(1);
    let itemsPerPage = $state(5);
    let totalPages = $derived(Math.ceil(allResources.length / itemsPerPage) || 1);

    // Formulario de creación
    let formData = $state({
        game_name: '', year: new Date().getFullYear(), total_money: '', genre: '', 
        player_no: '', tournament_no: '', country: '', top_country_earnings: ''
    });

    // Filtros de búsqueda TOTALES (Todos los campos permitidos por la API)
    let searchGame = $state('');
    let searchYear = $state('');
    let searchGenre = $state('');
    let searchMoney = $state('');
    let searchPlayers = $state('');
    let searchTournaments = $state('');
    let searchCountry = $state('');
    let searchTopEarnings = $state('');
    let searchFrom = $state('');
    let searchTo = $state('');

    $effect(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        displayedResources = allResources.slice(start, end);
    });

    function clearMessages() {
        setTimeout(() => { error = null; successMessage = null; }, 5000);
    }

    // --- OBTENER DATOS CON TODOS LOS FILTROS (V2) ---
    async function getResources() {
        loading = true;
        try {
            const params = new URLSearchParams();
            
            // Añadimos a la URL solo los campos que el usuario haya rellenado
            if (searchGame) params.append('game_name', searchGame);
            if (searchYear) params.append('year', searchYear);
            if (searchGenre) params.append('genre', searchGenre);
            if (searchMoney) params.append('total_money', searchMoney);
            if (searchPlayers) params.append('player_no', searchPlayers);
            if (searchTournaments) params.append('tournament_no', searchTournaments);
            if (searchCountry) params.append('country', searchCountry);
            if (searchTopEarnings) params.append('top_country_earnings', searchTopEarnings);
            if (searchFrom) params.append('from', searchFrom);
            if (searchTo) params.append('to', searchTo);

            const res = await fetch(`/api/v2/esportsearnings-stats?${params.toString()}`);
            if (!res.ok) throw new Error('Error al cargar los datos');
            
            allResources = await res.json();
            
            if (allResources.length === 0 && Array.from(params).length === 0) {
                successMessage = 'La base de datos está vacía. Carga datos de ejemplo.';
            } else if (Array.from(params).length > 0) {
                successMessage = `Búsqueda completada: ${allResources.length} resultados.`;
            }
            currentPage = 1;
        } catch (e) {
            error = e.message;
        } finally {
            loading = false; clearMessages();
        }
    }

    // --- CARGAR DATOS INICIALES (V2) ---
    async function loadSampleData() {
        if (!confirm('¿Cargar datos de ejemplo?')) return;
        loading = true;
        try {
            const res = await fetch('/api/v2/esportsearnings-stats/loadInitialData');
            if (res.status === 201) successMessage = 'Datos cargados con éxito.';
            else if (res.status === 200) successMessage = 'Los datos ya estaban cargados.';
            await getResources();
        } catch (e) {
            error = 'Error al cargar datos.';
        } finally {
            loading = false; clearMessages();
        }
    }

    // --- CREAR NUEVO (V2) ---
    async function saveNewResource() {
        try {
            if (!formData.game_name || !formData.year || !formData.country) {
                alert('Rellena Nombre del Juego, Año y País.'); return;
            }
            const dataToSend = {
                game_name: formData.game_name, year: parseInt(formData.year),
                total_money: parseFloat(formData.total_money || 0), genre: formData.genre || "Desconocido",
                player_no: parseInt(formData.player_no || 0), tournament_no: parseInt(formData.tournament_no || 0),
                country: formData.country, top_country_earnings: parseFloat(formData.top_country_earnings || 0)
            };

            const res = await fetch('/api/v2/esportsearnings-stats', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            if (res.status === 409) {
                alert(`Ya existe un registro para ${formData.game_name} en ${formData.year}.`); return;
            }
            if (!res.ok) throw new Error('Error al guardar');
            
            showCreateForm = false; resetForm();
            successMessage = 'Registro añadido correctamente.';
            await getResources();
        } catch (e) {
            alert('No se pudo guardar el registro.');
        }
    }

    // --- BORRAR UNO (V2) ---
    async function deleteResource(game, year) {
        try {
            const res = await fetch(`/api/v2/esportsearnings-stats/${game}/${year}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al eliminar');
            showDeleteModal = false;
            successMessage = 'Registro eliminado correctamente.';
            await getResources();
        } catch (e) { alert('No se pudo eliminar el registro.'); }
    }

    // --- BORRAR TODOS (V2) ---
    async function deleteAllResources() {
        if (!confirm('¡PELIGRO! ¿Borrar TODOS los registros?')) return;
        try {
            const res = await fetch('/api/v2/esportsearnings-stats', { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al vaciar');
            successMessage = 'Todos los registros eliminados.';
            await getResources();
        } catch (e) { alert('No se pudo vaciar la base de datos.'); }
    }

    function resetForm() {
        formData = { game_name: '', year: new Date().getFullYear(), total_money: '', genre: '', player_no: '', tournament_no: '', country: '', top_country_earnings: '' };
    }

    function clearSearch() {
        searchGame = ''; searchYear = ''; searchGenre = ''; searchMoney = '';
        searchPlayers = ''; searchTournaments = ''; searchCountry = ''; 
        searchTopEarnings = ''; searchFrom = ''; searchTo = ''; 
        getResources();
    }

    getResources();
</script>

<svelte:head><title>Ganancias en eSports</title></svelte:head>

<style>
    :root { --p-50: #faf5ff; --p-200: #e9d5ff; --p-500: #a855f7; --p-600: #9333ea; --p-700: #7e22ce; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    h1 { color: var(--p-700); border-bottom: 2px solid var(--p-500); padding-bottom: 0.5rem; text-align: center; }
    .msg-success { background: #d1fae5; color: #065f46; padding: 1rem; border-radius: 8px; text-align: center; margin-bottom: 1rem; }
    .msg-error { background: #fee2e2; color: #b91c1c; padding: 1rem; border-radius: 8px; text-align: center; margin-bottom: 1rem; }
    
    /* Nuevo estilo para la caja de búsqueda */
    .search-box { background: var(--p-50); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid var(--p-200); }
    .search-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 1rem;}
    
    label { display: block; font-weight: bold; margin-bottom: 0.3rem; color: var(--p-700); font-size: 0.85rem;}
    input, select { width: 100%; padding: 0.5rem; border: 1px solid var(--p-200); border-radius: 6px; box-sizing: border-box; }
    .btn-group { display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 2rem; flex-wrap: wrap;}
    button, .btn-link { border: none; border-radius: 6px; padding: 0.6rem 1.2rem; font-weight: bold; cursor: pointer; transition: 0.2s; color: white; text-decoration: none; display: inline-block; text-align: center;}
    .btn-purple { background: var(--p-600); } .btn-purple:hover { background: var(--p-700); }
    .btn-blue { background: #0284c7; } .btn-blue:hover { background: #0369a1; }
    .btn-red { background: #dc2626; } .btn-red:hover { background: #b91c1c; }
    .btn-gray { background: #e5e7eb; color: #374151; } .btn-gray:hover { background: #d1d5db; }
    .btn-orange { background: #f59e0b; } .btn-orange:hover { background: #d97706; }
    .card { border: 1px solid var(--p-200); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .data-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
    .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;}
    .modal-content { background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;}
    .pagination { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
</style>

<div class="container">
    <h1>Ganancias en eSports (V2)</h1>

    {#if successMessage}<div class="msg-success">{successMessage}</div>{/if}
    {#if error}<div class="msg-error">{error}</div>{/if}

    <div class="search-box">
        <h3 style="margin-top:0; color:var(--p-700);">Búsqueda Avanzada</h3>
        <div class="search-grid">
            <div><label>Juego</label><input type="text" bind:value={searchGame} placeholder="Ej: Dota 2"></div>
            <div><label>Género</label><input type="text" bind:value={searchGenre} placeholder="Ej: MOBA"></div>
            <div><label>País</label><input type="text" bind:value={searchCountry} placeholder="Ej: Spain"></div>
            <div><label>Año (Exacto)</label><input type="number" bind:value={searchYear}></div>
            <div><label>Desde Año</label><input type="number" bind:value={searchFrom}></div>
            <div><label>Hasta Año</label><input type="number" bind:value={searchTo}></div>
            <div><label>Dinero Total</label><input type="number" step="0.01" bind:value={searchMoney}></div>
            <div><label>Ganancias País</label><input type="number" step="0.01" bind:value={searchTopEarnings}></div>
            <div><label>Nº Torneos</label><input type="number" bind:value={searchTournaments}></div>
            <div><label>Nº Jugadores</label><input type="number" bind:value={searchPlayers}></div>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:0.5rem;">
            <button class="btn-gray" onclick={clearSearch}>Limpiar Filtros</button>
            <button class="btn-purple" onclick={getResources}>Aplicar Búsqueda</button>
        </div>
    </div>

    <div class="btn-group">
        <button class="btn-blue" onclick={() => { resetForm(); showCreateForm = true; }}>Añadir Registro</button>
        <button class="btn-purple" onclick={loadSampleData}>Cargar Iniciales</button>
        <button class="btn-gray" onclick={getResources}>Actualizar Lista</button>
        <button class="btn-red" onclick={deleteAllResources}>Vaciar Datos</button>
    </div>

    {#if allResources.length > 0}
        <div class="pagination">
            <div>
                <button class="btn-gray" disabled={currentPage === 1} onclick={() => currentPage--}>Anterior</button>
                <span style="margin: 0 1rem; font-weight: bold;">Página {currentPage} de {totalPages}</span>
                <button class="btn-gray" disabled={currentPage === totalPages} onclick={() => currentPage++}>Siguiente</button>
            </div>
            <div>
                <label style="display:inline; margin-right:0.5rem;">Mostrar:</label>
                <select bind:value={itemsPerPage} onchange={() => currentPage = 1}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={50}>50</option>
                </select>
            </div>
        </div>
    {/if}

    {#if allResources.length === 0}
        <p style="text-align: center; color: gray;">No hay datos que coincidan con la búsqueda.</p>
    {:else}
        {#each displayedResources as resource}
            <div class="card">
                <div style="display: flex; justify-content: space-between;">
                    <h2 style="margin:0 0 1rem 0; color: var(--p-700);">{resource.game_name} ({resource.year})</h2>
                    <div>
                        <a href={`/esportsearnings-stats/${resource.game_name}/${resource.year}`} class="btn-link btn-orange">Editar</a>
                        <button class="btn-red" onclick={() => { deleteTarget = resource; showDeleteModal = true; }}>Eliminar</button>
                    </div>
                </div>
                <div class="data-grid">
                    <p><strong>Género:</strong> {resource.genre}</p>
                    <p><strong>Dinero Total:</strong> ${resource.total_money}</p>
                    <p><strong>País:</strong> {resource.country}</p>
                    <p><strong>Jugadores:</strong> {resource.player_no}</p>
                    <p><strong>Torneos:</strong> {resource.tournament_no}</p>
                    <p><strong>Ganancias País:</strong> ${resource.top_country_earnings}</p>
                </div>
            </div>
        {/each}
    {/if}

    {#if showCreateForm}
        <div class="modal">
            <div class="modal-content">
                <h2 style="margin-top:0;">Nuevo Registro</h2>
                <div class="search-grid">
                    <div><label>Juego *</label><input type="text" bind:value={formData.game_name}></div>
                    <div><label>Año *</label><input type="number" bind:value={formData.year}></div>
                    <div><label>País *</label><input type="text" bind:value={formData.country}></div>
                    <div><label>Género</label><input type="text" bind:value={formData.genre}></div>
                    <div><label>Dinero Total ($)</label><input type="number" step="0.01" bind:value={formData.total_money}></div>
                    <div><label>Torneos</label><input type="number" bind:value={formData.tournament_no}></div>
                    <div><label>Jugadores</label><input type="number" bind:value={formData.player_no}></div>
                    <div><label>Ganancias País ($)</label><input type="number" step="0.01" bind:value={formData.top_country_earnings}></div>
                </div>
                <div style="margin-top: 1.5rem; text-align: right;">
                    <button class="btn-gray" onclick={() => { showCreateForm = false; resetForm(); }}>Cancelar</button>
                    <button class="btn-purple" onclick={saveNewResource}>Guardar</button>
                </div>
            </div>
        </div>
    {/if}

    {#if showDeleteModal}
        <div class="modal">
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <h2 style="color:#dc2626;">Confirmar Borrado</h2>
                <p>¿Seguro que quieres borrar <strong>{deleteTarget.game_name} ({deleteTarget.year})</strong>?</p>
                <div style="margin-top: 1.5rem; display: flex; justify-content:center; gap: 1rem;">
                    <button class="btn-gray" onclick={() => showDeleteModal = false}>Cancelar</button>
                    <button class="btn-red" onclick={() => deleteResource(deleteTarget.game_name, deleteTarget.year)}>Sí, Borrar</button>
                </div>
            </div>
        </div>
    {/if}
</div>
