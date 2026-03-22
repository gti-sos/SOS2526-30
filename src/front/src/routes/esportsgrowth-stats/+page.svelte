<script>
    let allResources = $state([]);
    let displayedResources = $state([]);
    
    let loading = $state(false);
    let error = $state(null);
    let successMessage = $state(null);
    
    let showDeleteModal = $state(false);
    let deleteTarget = $state(null);
    let showCreateForm = $state(false);
    let editingResource = $state(null);
    
    let currentPage = $state(1);
    let itemsPerPage = $state(5);
    let totalPages = $derived(Math.ceil(allResources.length / itemsPerPage) || 1);
    
    let formData = $state({
        country: '',
        year: new Date().getFullYear(),
        active_player_no: '',
        viewership: '',
        top_genre: '',
        top_platform: '',
        tournament_no: '',
        pro_player_no: '',
        internet_penetration: '',
        company_no: ''
    });

    let searchCountry = $state('');
    let searchGenre = $state('');
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

    async function getResources() {
        loading = true;
        try {
            const params = new URLSearchParams();
            if (searchCountry) params.append('country', searchCountry);
            if (searchGenre) params.append('top_genre', searchGenre);
            if (searchFrom) params.append('from', searchFrom);
            if (searchTo) params.append('to', searchTo);

            const res = await fetch(`/api/v1/esportsgrowth-stats?${params.toString()}`);
            if (!res.ok) throw new Error('Error al cargar los datos');
            
            allResources = await res.json();
            
            if (allResources.length === 0 && !searchCountry && !searchGenre) {
                successMessage = 'La base de datos está vacía. Carga datos de ejemplo.';
            } else if (searchCountry || searchGenre || searchFrom) {
                successMessage = `Búsqueda completada: ${allResources.length} resultados.`;
            }
            
            currentPage = 1;
        } catch (e) {
            error = e.message;
        } finally {
            loading = false;
            clearMessages();
        }
    }

    async function loadSampleData() {
        if (!confirm('¿Cargar datos de ejemplo? Si ya hay datos, se recomienda vaciar primero.')) return;
        loading = true;
        try {
            const res = await fetch('/api/v1/esportsgrowth-stats/loadInitialData');
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

    async function saveNewResource() {
        try {
            if (!formData.country || !formData.year) {
                alert('Por favor, rellena al menos el País y el Año.');
                return;
            }

            const dataToSend = {
                country: formData.country,
                year: parseInt(formData.year),
                active_player_no: parseFloat(formData.active_player_no || 0),
                viewership: parseFloat(formData.viewership || 0),
                top_genre: formData.top_genre || "Desconocido",
                top_platform: formData.top_platform || "Desconocida",
                tournament_no: parseInt(formData.tournament_no || 0),
                pro_player_no: parseInt(formData.pro_player_no || 0),
                internet_penetration: parseFloat(formData.internet_penetration || 0),
                company_no: parseInt(formData.company_no || 0)
            };

            const res = await fetch('/api/v1/esportsgrowth-stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            if (res.status === 409) {
                alert(`No se puede añadir: Ya existe una estadística para ${formData.country} en el año ${formData.year}.`);
                return;
            }
            if (!res.ok) throw new Error('Error al guardar');

            showCreateForm = false;
            successMessage = 'Registro añadido correctamente.';
            resetForm();
            await getResources();
        } catch (e) {
            alert('No se pudo guardar el registro. Revisa los datos.');
        }
    }

    async function saveResourceChanges() {
        try {
            const dataToSend = {
                country: editingResource.country, 
                year: parseInt(editingResource.year),
                active_player_no: parseFloat(formData.active_player_no),
                viewership: parseFloat(formData.viewership),
                top_genre: formData.top_genre,
                top_platform: formData.top_platform,
                tournament_no: parseInt(formData.tournament_no),
                pro_player_no: parseInt(formData.pro_player_no),
                internet_penetration: parseFloat(formData.internet_penetration),
                company_no: parseInt(formData.company_no)
            };

            const res = await fetch(`/api/v1/esportsgrowth-stats/${editingResource.country}/${editingResource.year}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            if (res.status === 404) {
                alert(`No se puede editar: No existe ninguna estadística para ${editingResource.country} en el año ${editingResource.year}.`);
                return;
            }

            if (!res.ok) throw new Error('Error al actualizar');

            showCreateForm = false;
            editingResource = null;
            successMessage = 'Registro actualizado correctamente.';
            resetForm();
            await getResources();
        } catch (e) {
            alert('No se pudieron guardar los cambios. Revisa los datos.');
        }
    }

    async function deleteResource(country, year) {
        try {
            const res = await fetch(`/api/v1/esportsgrowth-stats/${country}/${year}`, { method: 'DELETE' });
            
            if (res.status === 404) {
                alert(`No se puede borrar: No existe ninguna estadística para ${country} en el año ${year}.`);
                showDeleteModal = false;
                return;
            }

            if (!res.ok) throw new Error('Error al eliminar');
            
            showDeleteModal = false;
            successMessage = 'Registro eliminado correctamente.';
            await getResources();
        } catch (e) {
            alert('No se pudo eliminar el registro en este momento.');
        }
    }

    async function deleteAllResources() {
        if (!confirm('¡PELIGRO! ¿Estás seguro de que quieres eliminar TODOS los registros de la base de datos?')) return;
        try {
            const res = await fetch('/api/v1/esportsgrowth-stats', { method: 'DELETE' });
            if (!res.ok) throw new Error('Error al vaciar');
            successMessage = 'Todos los registros han sido eliminados.';
            await getResources();
        } catch (e) {
            alert('No se pudo vaciar la base de datos.');
        }
    }

    function resetForm() {
        formData = { country: '', year: new Date().getFullYear(), active_player_no: '', viewership: '', top_genre: '', top_platform: '', tournament_no: '', pro_player_no: '', internet_penetration: '', company_no: '' };
    }

    function startEditing(resource) {
        formData = { ...resource };
        editingResource = resource;
        showCreateForm = true;
    }

    function clearSearch() {
        searchCountry = ''; searchGenre = ''; searchFrom = ''; searchTo = '';
        getResources();
    }

    getResources();
</script>

<svelte:head>
    <title>Crecimiento de eSports</title>
</svelte:head>

<style>
    :root { --p-50: #faf5ff; --p-200: #e9d5ff; --p-500: #a855f7; --p-600: #9333ea; --p-700: #7e22ce; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
    h1 { color: var(--p-700); border-bottom: 2px solid var(--p-500); padding-bottom: 0.5rem; text-align: center; }
    .msg-success { background: #d1fae5; color: #065f46; padding: 1rem; border-radius: 8px; text-align: center; margin-bottom: 1rem; border: 1px solid #10b981;}
    .msg-error { background: #fee2e2; color: #b91c1c; padding: 1rem; border-radius: 8px; text-align: center; margin-bottom: 1rem; border: 1px solid #dc2626;}
    .search-box { background: var(--p-50); padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid var(--p-200); }
    .flex-row { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
    label { display: block; font-weight: bold; margin-bottom: 0.3rem; color: var(--p-700); font-size: 0.9rem;}
    input, select { width: 100%; padding: 0.5rem; border: 1px solid var(--p-200); border-radius: 6px; box-sizing: border-box; }
    input:focus, select:focus { outline: none; border-color: var(--p-500); box-shadow: 0 0 0 2px rgba(147, 51, 234, 0.2); }
    .btn-group { display: flex; gap: 0.5rem; justify-content: center; margin-bottom: 2rem; flex-wrap: wrap;}
    button { border: none; border-radius: 6px; padding: 0.6rem 1.2rem; font-weight: bold; cursor: pointer; transition: 0.2s; color: white;}
    .btn-purple { background: var(--p-600); } .btn-purple:hover { background: var(--p-700); }
    .btn-blue { background: #0284c7; } .btn-blue:hover { background: #0369a1; }
    .btn-red { background: #dc2626; } .btn-red:hover { background: #b91c1c; }
    .btn-gray { background: #e5e7eb; color: #374151; } .btn-gray:hover { background: #d1d5db; }
    .btn-orange { background: #f59e0b; } .btn-orange:hover { background: #d97706; }
    .card { border: 1px solid var(--p-200); padding: 1rem; border-radius: 8px; margin-bottom: 1rem; transition: 0.2s;}
    .card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(147, 51, 234, 0.2); }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem; }
    .modal { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; padding: 2rem; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto;}
    .pagination { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;}
</style>

<div class="container">
    <h1>Estadísticas de Crecimiento de eSports</h1>

    {#if successMessage}<div class="msg-success">{successMessage}</div>{/if}
    {#if error}<div class="msg-error">{error}</div>{/if}

    <div class="search-box">
        <div class="flex-row">
            <div style="flex:1"><label>País</label><input type="text" bind:value={searchCountry} placeholder="Ej: Spain"></div>
            <div style="flex:1"><label>Género (Top)</label><input type="text" bind:value={searchGenre} placeholder="Ej: FPS"></div>
            <div style="flex:1"><label>Desde el año</label><input type="number" bind:value={searchFrom}></div>
            <div style="flex:1"><label>Hasta el año</label><input type="number" bind:value={searchTo}></div>
            <div style="display:flex; gap:0.5rem;">
                <button class="btn-purple" onclick={getResources}>Buscar</button>
                <button class="btn-gray" onclick={clearSearch}>Limpiar</button>
            </div>
        </div>
    </div>

    <div class="btn-group">
        <button class="btn-blue" onclick={() => { resetForm(); showCreateForm = true; }}>Añadir Estadística</button>
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
                <label style="display:inline; margin-right:0.5rem;">Mostrar:</label>
                <select bind:value={itemsPerPage} onchange={() => currentPage = 1} style="width: auto;">
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={50}>50</option>
                </select>
                <span style="margin-left:0.5rem">por página</span>
            </div>
        </div>
    {/if}

    {#if loading}
        <p style="text-align: center; color: var(--p-600);">Cargando estadísticas...</p>
    {:else if allResources.length === 0}
        <p style="text-align: center; color: gray; padding: 2rem; background: var(--p-50); border-radius: 8px;">No hay datos para mostrar en este momento.</p>
    {:else}
        {#each displayedResources as resource}
            <div class="card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin:0 0 1rem 0; color: var(--p-700);">{resource.country} ({resource.year})</h2>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-orange" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick={() => startEditing(resource)}>Editar</button>
                        <button class="btn-red" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;" onclick={() => { deleteTarget = resource; showDeleteModal = true; }}>Eliminar</button>
                    </div>
                </div>
                <div class="grid">
                    <p style="margin: 0.2rem 0;"><strong style="color: var(--p-600);">Jugadores Activos:</strong> {resource.active_player_no} M</p>
                    <p style="margin: 0.2rem 0;"><strong style="color: var(--p-600);">Espectadores:</strong> {resource.viewership} M</p>
                    <p style="margin: 0.2rem 0;"><strong style="color: var(--p-600);">Género Top:</strong> {resource.top_genre}</p>
                    <p style="margin: 0.2rem 0;"><strong style="color: var(--p-600);">Plataforma Top:</strong> {resource.top_platform}</p>
                    <p style="margin: 0.2rem 0;"><strong style="color: var(--p-600);">Torneos:</strong> {resource.tournament_no}</p>
                    <p style="margin: 0.2rem 0;"><strong style="color: var(--p-600);">Jugadores Pro:</strong> {resource.pro_player_no}</p>
                    <p style="margin: 0.2rem 0;"><strong style="color: var(--p-600);">Penetración Internet:</strong> {resource.internet_penetration}%</p>
                    <p style="margin: 0.2rem 0;"><strong style="color: var(--p-600);">Compañías:</strong> {resource.company_no}</p>
                </div>
            </div>
        {/each}

        <div style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 2rem;">
            <button class="btn-gray" disabled={currentPage === 1} onclick={() => currentPage = 1}>Primera</button>
            <button class="btn-gray" disabled={currentPage === 1} onclick={() => currentPage--}>Anterior</button>
            <span style="padding: 0.6rem 1rem; background: var(--p-50); border-radius: 6px; font-weight: bold; color: var(--p-700);">{currentPage}/{totalPages}</span>
            <button class="btn-gray" disabled={currentPage === totalPages} onclick={() => currentPage++}>Siguiente</button>
            <button class="btn-gray" disabled={currentPage === totalPages} onclick={() => currentPage = totalPages}>Última</button>
        </div>
    {/if}

    {#if showCreateForm || editingResource}
        <div class="modal">
            <div class="modal-content">
                <h2 style="margin-top:0; color: var(--p-700); border-bottom: 2px solid var(--p-200); padding-bottom: 0.5rem;">
                    {editingResource ? 'Editar Registro' : 'Nuevo Registro'}
                </h2>
                <div class="grid" style="grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem;">
                    <div><label>País *</label><input type="text" bind:value={formData.country} disabled={editingResource} placeholder="Ej: Spain"></div>
                    <div><label>Año *</label><input type="number" bind:value={formData.year} disabled={editingResource} placeholder="Ej: 2024"></div>
                    <div><label>Jugadores Activos (M)</label><input type="number" step="0.1" bind:value={formData.active_player_no} placeholder="Millones"></div>
                    <div><label>Espectadores (M)</label><input type="number" step="0.1" bind:value={formData.viewership} placeholder="Millones"></div>
                    <div><label>Género Top</label><input type="text" bind:value={formData.top_genre} placeholder="Ej: Shooter"></div>
                    <div><label>Plataforma Top</label><input type="text" bind:value={formData.top_platform} placeholder="Ej: PC"></div>
                    <div><label>Nº Torneos</label><input type="number" bind:value={formData.tournament_no} placeholder="Cantidad total"></div>
                    <div><label>Nº Jugadores Pro</label><input type="number" bind:value={formData.pro_player_no} placeholder="Cantidad total"></div>
                    <div><label>Penetración Internet (%)</label><input type="number" step="0.1" bind:value={formData.internet_penetration} placeholder="Ej: 95.5"></div>
                    <div><label>Nº Compañías</label><input type="number" bind:value={formData.company_no} placeholder="Cantidad total"></div>
                </div>
                {#if editingResource}
                    <p style="font-size:0.8rem; color: #7f8c8d; background: #f9f9f9; padding: 0.5rem; border-radius: 4px; margin-top:1rem; border-left: 3px solid var(--p-200);">
                        El País y el Año no se pueden editar porque identifican el registro de forma única. Si son incorrectos, elimina el registro y crea uno nuevo.
                    </p>
                {/if}
                <div style="margin-top: 2rem; text-align: right; display: flex; gap: 0.5rem; justify-content: flex-end;">
                    <button class="btn-gray" onclick={() => { showCreateForm = false; editingResource = null; resetForm(); }}>Cancelar</button>
                    <button class="btn-purple" onclick={editingResource ? saveResourceChanges : saveNewResource}>Guardar Registro</button>
                </div>
            </div>
        </div>
    {/if}

    {#if showDeleteModal && deleteTarget}
        <div class="modal">
            <div class="modal-content" style="max-width: 400px; text-align: center; border: 2px solid #fee2e2;">
                <h2 style="color:#dc2626; margin-top: 0;">Confirmar Borrado</h2>
                <p>¿Estás seguro de que quieres borrar permanentemente los datos de:</p>
                <p style="font-size: 1.2rem; font-weight: bold; color: var(--p-700); background: var(--p-50); padding: 0.5rem; border-radius: 4px;">
                    {deleteTarget.country} ({deleteTarget.year})
                </p>
                <p style="color:gray;">Esta acción no se puede deshacer.</p>
                <div style="margin-top: 1.5rem; display: flex; justify-content:center; gap: 1rem;">
                    <button class="btn-gray" onclick={() => { showDeleteModal = false; deleteTarget = null; }}>Cancelar</button>
                    <button class="btn-red" onclick={() => deleteResource(deleteTarget.country, deleteTarget.year)}>Sí, Borrar Dato</button>
                </div>
            </div>
        </div>
    {/if}
</div>