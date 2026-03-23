<script>
    // @ts-nocheck
    let allResources = $state([]); // Aquí guardamos todos los datos
    let displayedResources = $state([]); // Los que se ven en la página actual
    
    let loading = $state(false);
    let error = $state(null);
    let successMessage = $state(null);
    
    let showDeleteModal = $state(false);
    let deleteTarget = $state(null);
    let showCreateForm = $state(false);
    let editingResource = $state(null);
    
    // Paginación (Gestionada en el frontend)
    let currentPage = $state(1);
    let itemsPerPage = $state(5);
    let totalPages = $derived(Math.ceil(allResources.length / itemsPerPage) || 1);
    
    // Formulario para tus 8 campos
    let formData = $state({
        game_name: '',
        year: new Date().getFullYear(),
        total_money: '',
        genre: '',
        player_no: '',
        tournament_no: '',
        country: '',
        top_country_earnings: ''
    });

    // Filtros de búsqueda
    let searchGame = $state('');
    let searchCountry = $state('');
    let searchFrom = $state('');
    let searchTo = $state('');

    // Actualizar la vista de paginación cuando cambian los datos o la página
    $effect(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        displayedResources = allResources.slice(start, end);
    });

    function clearMessages() {
        setTimeout(() => { error = null; successMessage = null; }, 5000);
    }

    // --- OBTENER DATOS ---
    async function getResources() {
        loading = true;
        try {
            // Construimos la URL de búsqueda si hay filtros
            const params = new URLSearchParams();
            if (searchGame) params.append('game_name', searchGame);
            if (searchCountry) params.append('country', searchCountry);
            if (searchFrom) params.append('from', searchFrom);
            if (searchTo) params.append('to', searchTo);

            const res = await fetch(`/api/v1/esportsearnings-stats?${params.toString()}`);
            if (!res.ok) throw new Error('Error al cargar los datos');
            
            allResources = await res.json();
            
            if (allResources.length === 0 && !searchGame && !searchCountry) {
                successMessage = 'La base de datos está vacía. Carga datos de ejemplo.';
            } else if (searchGame || searchCountry || searchFrom) {
                successMessage = `Búsqueda completada: ${allResources.length} resultados.`;
            }
            
            currentPage = 1; // Volver a la primera página tras cargar/buscar
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
            clearMessages();
        }
    }

    // --- CARGAR DATOS INICIALES ---
    async function loadSampleData() {
        if (!confirm('¿Cargar datos de ejemplo? Si ya hay datos, se recomienda vaciar primero.')) return;
        loading = true;
        try {
            const res = await fetch('/api/v1/esportsearnings-stats/loadInitialData');
            if (res.status === 201) {
                successMessage = 'Datos de ejemplo cargados con éxito.';
            } else if (res.status === 200) {
                successMessage = 'Los datos ya estaban cargados.';
            }
            await getResources();
        } catch (e) {
            error = 'Error al cargar datos iniciales.';
        } finally {
            loading = false;
            clearMessages();
        }
    }

    // --- CREAR NUEVO ---
    async function saveNewResource() {
        try {
            if (!formData.game_name || !formData.year || !formData.country) {
                alert('Por favor, rellena al menos el Nombre del Juego, Año y País.');
                return;
            }

            const dataToSend = {
                game_name: formData.game_name,
                year: parseInt(formData.year),
                total_money: parseFloat(formData.total_money || 0),
                genre: formData.genre || "Desconocido",
                player_no: parseInt(formData.player_no || 0),
                tournament_no: parseInt(formData.tournament_no || 0),
                country: formData.country,
                top_country_earnings: parseFloat(formData.top_country_earnings || 0)
            };

            const res = await fetch('/api/v1/esportsearnings-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            if (res.status === 409) {
                alert(`Ya existe un registro para el juego ${formData.game_name} en el año ${formData.year}.`);
                return;
            }
            if (!res.ok) throw new Error('Error al guardar');

            showCreateForm = false;
            successMessage = 'Registro añadido correctamente.';
            await getResources();
        } catch (e) {
            alert('No se pudo guardar el registro.');
        }
    }

    // --- ACTUALIZAR ---
    async function saveResourceChanges() {
        try {
            const dataToSend = {
                game_name: editingResource.game_name, // No dejamos cambiar las IDs
                year: parseInt(editingResource.year),
                total_money: parseFloat(formData.total_money),
                genre: formData.genre,
                player_no: parseInt(formData.player_no),
                tournament_no: parseInt(formData.tournament_no),
                country: formData.country,
                top_country_earnings: parseFloat(formData.top_country_earnings)
            };

            const res = await fetch(`/api/v1/esportsearnings-stats/${editingResource.game_name}/${editingResource.year}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            if (!res.ok) throw new Error('Error al actualizar');

            showCreateForm = false;
            editingResource = null;
            successMessage = 'Registro actualizado correctamente.';
            await getResources();
        } catch (e) {
            alert('No se pudieron guardar los cambios.');
        }
    }

    // --- BORRAR UNO ---
    async function deleteResource(game, year) {
        try {
            const res = await fetch(`/api/v1/esportsearnings-stats/${game}/${year}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al eliminar');
            
            showDeleteModal = false;
            successMessage = 'Registro eliminado correctamente.';
            await getResources();
        } catch (e) {
            alert('No se pudo eliminar el registro.');
        }
    }

    // --- BORRAR TODOS ---
    async function deleteAllResources() {
        if (!confirm('¡PELIGRO! ¿Estás seguro de que quieres eliminar TODOS los registros de la base de datos?')) return;
        try {
            const res = await fetch('/api/v1/esportsearnings-stats', { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al vaciar');
            successMessage = 'Todos los registros han sido eliminados.';
            await getResources();
        } catch (e) {
            alert('No se pudo vaciar la base de datos.');
        }
    }

    // --- UTILIDADES ---
    function resetForm() {
        formData = { game_name: '', year: new Date().getFullYear(), total_money: '', genre: '', player_no: '', tournament_no: '', country: '', top_country_earnings: '' };
    }

    function startEditing(resource) {
        formData = { ...resource };
        editingResource = resource;
        showCreateForm = true;
    }

    function clearSearch() {
        searchGame = ''; searchCountry = ''; searchFrom = ''; searchTo = '';
        getResources();
    }

    // Cargar datos al iniciar la página
    getResources();
</script>

<svelte:head>
    <title>Ganancias en eSports</title>
</svelte:head>

<style>
    /* He mantenido los estilos limpios de tu compañero */
    :root { --p-50: #faf5ff; --p-200: #e9d5ff; --p-500: #a855f7; --p-600: #9333ea; --p-700: #7e22ce; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    h1 { color: var(--p-700); border-bottom: 2px solid var(--p-500); padding-bottom: 0.5rem; text-align: center; }
    .msg-success { background: #d1fae5; color: #065f46; padding: 1rem; border-radius: 8px; text-align: center; margin-bottom: 1rem; }
    .msg-error { background: #fee2e2; color: #b91c1c; padding: 1rem; border-radius: 8px; text-align: center; margin-bottom: 1rem; }
    .search-box { background: var(--p-50); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid var(--p-200); }
    .flex-row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
    label { display: block; font-weight: bold; margin-bottom: 0.3rem; color: var(--p-700); font-size: 0.9rem;}
    input, select { width: 100%; padding: 0.5rem; border: 1px solid var(--p-200); border-radius: 6px; box-sizing: border-box; }
    .btn-group { display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 2rem; flex-wrap: wrap;}
    button { border: none; border-radius: 6px; padding: 0.6rem 1.2rem; font-weight: bold; cursor: pointer; transition: 0.2s; color: white;}
    .btn-purple { background: var(--p-600); } .btn-purple:hover { background: var(--p-700); }
    .btn-blue { background: #0284c7; } .btn-blue:hover { background: #0369a1; }
    .btn-red { background: #dc2626; } .btn-red:hover { background: #b91c1c; }
    .btn-gray { background: #e5e7eb; color: #374151; } .btn-gray:hover { background: #d1d5db; }
    .btn-orange { background: #f59e0b; } .btn-orange:hover { background: #d97706; }
    .card { border: 1px solid var(--p-200); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
    .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;}
    .modal-content { background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;}
    .pagination { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
</style>

<div class="container">
    <h1>Ganancias en eSports (esportsearnings-stats)</h1>

    {#if successMessage}<div class="msg-success">{successMessage}</div>{/if}
    {#if error}<div class="msg-error">{error}</div>{/if}

    <div class="search-box">
        <div class="flex-row">
            <div style="flex:1"><label for="searchGame">Juego</label><input id="searchGame" type="text" bind:value={searchGame} placeholder="Ej: Fortnite"></div>
            <div style="flex:1"><label for="searchCountry">País</label><input id="searchCountry" type="text" bind:value={searchCountry} placeholder="Ej: Spain"></div>
            <div style="flex:1"><label for="searchFrom">Desde el año</label><input id="searchFrom" type="number" bind:value={searchFrom}></div>
            <div style="flex:1"><label for="searchTo">Hasta el año</label><input id="searchTo" type="number" bind:value={searchTo}></div>
            <div style="display:flex; gap:0.5rem;">
                <button class="btn-purple" onclick={getResources}>Buscar</button>
                <button class="btn-gray" onclick={clearSearch}>Limpiar</button>
            </div>
        </div>
    </div>

    <div class="btn-group">
        <button class="btn-blue" onclick={() => { resetForm(); showCreateForm = true; }}>Añadir Juego</button>
        <button class="btn-purple" onclick={loadSampleData}>Cargar Ejemplo</button>
        <button class="btn-gray" onclick={getResources}>Actualizar Lista</button>
        <button class="btn-red" onclick={deleteAllResources}>Vaciar Base de Datos</button>
    </div>

    {#if allResources.length > 0}
        <div class="pagination">
            <div>
                <button class="btn-gray" disabled={currentPage === 1} onclick={() => currentPage--}>Anterior</button>
                <span style="margin: 0 1rem; font-weight: bold;">Página {currentPage} de {totalPages}</span>
                <button class="btn-gray" disabled={currentPage === totalPages} onclick={() => currentPage++}>Siguiente</button>
            </div>
            <div>
                <label for="itemsPerPage" style="display:inline; margin-right:0.5rem;">Mostrar:</label>
                <select id="itemsPerPage" bind:value={itemsPerPage} onchange={() => currentPage = 1}>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={50}>50</option>
                </select>
            </div>
        </div>
    {/if}

    {#if allResources.length === 0}
        <p style="text-align: center; color: gray;">No hay datos para mostrar.</p>
    {:else}
        {#each displayedResources as resource}
            <div class="card">
                <div style="display: flex; justify-content: space-between;">
                    <h2 style="margin:0 0 1rem 0; color: var(--p-700);">{resource.game_name} ({resource.year})</h2>
                    <div>
                        <button class="btn-orange" onclick={() => startEditing(resource)}>Editar</button>
                        <button class="btn-red" onclick={() => { deleteTarget = resource; showDeleteModal = true; }}>Eliminar</button>
                    </div>
                </div>
                <div class="grid">
                    <p><strong>Género:</strong> {resource.genre}</p>
                    <p><strong>Total Dinero:</strong> ${resource.total_money}</p>
                    <p><strong>País:</strong> {resource.country}</p>
                    <p><strong>Nº Jugadores:</strong> {resource.player_no}</p>
                    <p><strong>Nº Torneos:</strong> {resource.tournament_no}</p>
                    <p><strong>Ganancias País:</strong> ${resource.top_country_earnings}</p>
                </div>
            </div>
        {/each}
    {/if}

    {#if showCreateForm || editingResource}
        <div class="modal">
            <div class="modal-content">
                <h2 style="margin-top:0;">{editingResource ? 'Editar Registro' : 'Nuevo Registro'}</h2>
                <div class="grid">
                    <div><label for="formGameName">Juego *</label><input id="formGameName" type="text" bind:value={formData.game_name} disabled={editingResource !== null}></div>
                    <div><label for="formYear">Año *</label><input id="formYear" type="number" bind:value={formData.year} disabled={editingResource !== null}></div>
                    <div><label for="formCountryEdit">País *</label><input id="formCountryEdit" type="text" bind:value={formData.country}></div>
                    <div><label for="formGenre">Género</label><input id="formGenre" type="text" bind:value={formData.genre}></div>
                    <div><label for="formTotalMoney">Dinero Total ($)</label><input id="formTotalMoney" type="number" step="0.01" bind:value={formData.total_money}></div>
                    <div><label for="formTournaments">Torneos</label><input id="formTournaments" type="number" bind:value={formData.tournament_no}></div>
                    <div><label for="formPlayerNo">Jugadores</label><input id="formPlayerNo" type="number" bind:value={formData.player_no}></div>
                    <div><label for="formCountryEarnings">Ganancias País ($)</label><input id="formCountryEarnings" type="number" step="0.01" bind:value={formData.top_country_earnings}></div>
                </div>
                {#if editingResource}
                    <p style="font-size:0.8rem; color:gray; margin-top:1rem;">* El Juego y el Año no se pueden editar porque son identificadores. Si te equivocaste, elimínalo y créalo de nuevo.</p>
                {/if}
                <div style="margin-top: 1.5rem; text-align: right;">
                    <button class="btn-gray" onclick={() => { showCreateForm = false; editingResource = null; resetForm(); }}>Cancelar</button>
                    <button class="btn-purple" onclick={editingResource ? saveResourceChanges : saveNewResource}>Guardar</button>
                </div>
            </div>
        </div>
    {/if}

    {#if showDeleteModal}
        <div class="modal">
            <div class="modal-content" style="max-width: 400px; text-align: center;">
                <h2 style="color:#dc2626;">Confirmar Borrado</h2>
                <p>¿Seguro que quieres borrar los datos de <strong>{deleteTarget.game_name} ({deleteTarget.year})</strong>?</p>
                <div style="margin-top: 1.5rem; display: flex; justify-content:center; gap: 1rem;">
                    <button class="btn-gray" onclick={() => showDeleteModal = false}>Cancelar</button>
                    <button class="btn-red" onclick={() => deleteResource(deleteTarget.game_name, deleteTarget.year)}>Sí, Borrar</button>
                </div>
            </div>
        </div>
    {/if}
</div>