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
    
    // Para filtros
    let countries = $state([]);
    let games = $state([]);
    let years = $state([]);
    let loadingFilters = $state(false);
    
    // Filtros actuales
    let filters = $state({
        country: '',
        game: '',
        year: '',
        from: '',
        to: '',
        cheater_report: ''
    });
    
    // Paginación
    let currentPage = $state(1);
    let limit = $state(10);
    let pagination = $state({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
        next: null,
        prev: null
    });

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

    // Limpiar mensajes después de un tiempo
    function clearMessages() {
        setTimeout(() => {
            error = null;
            successMessage = null;
        }, 5000);
    }

    // Cargar listas para filtros
    async function loadFilters() {
        loadingFilters = true;
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
        } finally {
            loadingFilters = false;
        }
    }

    // Cargar todos los recursos con filtros y paginación
    async function getResources() {
        loading = true;
        error = null;
        successMessage = null;
        
        try {
            // Construir URL con filtros y paginación
            const params = new URLSearchParams();
            params.append('page', currentPage);
            params.append('limit', limit);
            
            if (filters.country) params.append('country', filters.country);
            if (filters.game) params.append('game', filters.game);
            if (filters.year) params.append('year', filters.year);
            if (filters.from) params.append('from', filters.from);
            if (filters.to) params.append('to', filters.to);
            if (filters.cheater_report) params.append('cheater_report', filters.cheater_report);
            
            const url = `/api/v2/cheaters-stats?${params.toString()}`;
            const res = await fetch(url);
            
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('No se encontraron recursos en la base de datos');
                } else {
                    throw new Error(`Error del servidor: ${res.status}`);
                }
            }
            
            const data = await res.json();
            resources = data.data || [];
            pagination = data.pagination || {
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
                next: null,
                prev: null
            };
            
            if (resources.length === 0) {
                successMessage = 'La lista está vacía. Puedes cargar datos de ejemplo o añadir un nuevo recurso.';
            }
            
            // Actualizar listas de filtros
            await loadFilters();
            
        } catch (e) {
            // @ts-ignore
            error = e.message;
        } finally {
            loading = false;
            clearMessages();
        }
    }

    // Aplicar filtros
    function applyFilters() {
        currentPage = 1;
        getResources();
    }

    // Resetear filtros
    function resetFilters() {
        filters = {
            country: '',
            game: '',
            year: '',
            from: '',
            to: '',
            cheater_report: ''
        };
        currentPage = 1;
        getResources();
    }

    // Cambiar página
    function goToPage(page) {
        if (page < 1 || page > pagination.totalPages) return;
        currentPage = page;
        getResources();
    }

    // Cargar datos de ejemplo (15 registros iniciales)
    async function loadSampleData() {
        loading = true;
        error = null;
        successMessage = null;
        try {
            // Primero verificamos si ya hay datos
            const checkRes = await fetch('/api/v2/cheaters-stats?limit=1');
            const checkData = await checkRes.json();
            
            // Si ya hay datos, preguntamos si quiere reemplazarlos
            if (checkData.data && checkData.data.length > 0) {
                if (!confirm('⚠️ Ya existen datos. ¿Quieres reemplazarlos con los datos de ejemplo? Esto eliminará todos los datos actuales.')) {
                    loading = false;
                    return;
                }
                
                // Borrar todos los datos existentes
                await fetch('/api/v2/cheaters-stats?confirm=true', {
                    method: 'DELETE'
                });
            }
            
            // Cargar los datos de ejemplo
            const res = await fetch('/api/v2/cheaters-stats/loadInitialData');
            
            if (!res.ok) {
                if (res.status === 500) {
                    throw new Error('Error al cargar los datos de ejemplo. Por favor, inténtalo de nuevo.');
                } else {
                    throw new Error(`Error inesperado: ${res.status}`);
                }
            }
            
            await getResources();
            successMessage = '✅ Se han cargado 15 registros de ejemplo correctamente.';
        } catch (e) {
            // @ts-ignore
            error = e.message;
        } finally {
            loading = false;
            clearMessages();
        }
    }

    // Guardar nuevo recurso
    async function saveNewResource() {
        try {
            // Validar campos obligatorios
            if (!formData.country || !formData.game || !formData.year || !formData.cheater_report || !formData.confirmed_ban) {
                alert('❌ Por favor, completa todos los campos obligatorios (*)');
                return;
            }
            
            // Preparar datos para enviar
            const dataToSend = {
                country: formData.country,
                year: parseInt(formData.year),
                game: formData.game,
                cheater_report: parseInt(formData.cheater_report),
                confirmed_ban: parseInt(formData.confirmed_ban)
            };
            
            // Añadir campos opcionales si tienen valor
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
                alert(`❌ Ya existe un registro para "${formData.country}" en ${formData.year} con el juego "${formData.game}". No se puede crear duplicado.`);
                return;
            }
            
            if (res.status === 400) {
                const errorData = await res.json();
                alert(`❌ ${errorData.message || 'Faltan datos obligatorios o el formato es incorrecto.'}`);
                return;
            }
            
            if (!res.ok) {
                throw new Error('Error al guardar el recurso');
            }
            
            await getResources();
            showCreateForm = false;
            resetForm();
            successMessage = `✅ El registro para "${formData.country}" (${formData.year}) ha sido añadido correctamente.`;
        } catch (e) {
            alert('❌ No se pudo guardar el recurso. Por favor, inténtalo de nuevo.');
        } finally {
            clearMessages();
        }
    }

    // Guardar cambios del recurso
    async function saveResourceChanges() {
        try {
            const originalCountry = editingResource.country;
            const originalYear = editingResource.year;
            const originalGame = editingResource.game;
            
            // Preparar datos para enviar
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
            
            if (res.status === 400) {
                const errorData = await res.json();
                alert(`❌ ${errorData.message || 'Los datos no coinciden. No se puede cambiar el país, año o juego a través de esta opción.'}`);
                return;
            }
            
            if (res.status === 404) {
                alert('❌ El recurso que intentas modificar ya no existe. Puede que haya sido eliminado.');
                return;
            }
            
            if (!res.ok) {
                throw new Error('Error al guardar los cambios');
            }
            
            await getResources();
            editingResource = null;
            resetForm();
            successMessage = `✅ Los cambios en "${formData.country}" (${formData.year}) han sido guardados correctamente.`;
        } catch (e) {
            alert('❌ No se pudieron guardar los cambios. Por favor, inténtalo de nuevo.');
        } finally {
            clearMessages();
        }
    }

    // Eliminar un recurso
    async function deleteResource(country, year, game) {
        try {
            const res = await fetch(
                `/api/v2/cheaters-stats/country/${encodeURIComponent(country)}/year/${year}/game/${encodeURIComponent(game)}`,
                {
                    method: 'DELETE'
                }
            );
            
            if (res.status === 404) {
                alert(`❌ No se encontró el registro para "${country}" (${year}, ${game}). Puede que ya haya sido eliminado.`);
                showDeleteModal = false;
                deleteTarget = null;
                return;
            }
            
            if (!res.ok && res.status !== 204) {
                throw new Error('Error al eliminar');
            }
            
            await getResources();
            showDeleteModal = false;
            deleteTarget = null;
            successMessage = `✅ El registro para "${country}" (${year}, ${game}) ha sido eliminado correctamente.`;
        } catch (e) {
            alert('❌ No se pudo eliminar el recurso. Por favor, inténtalo de nuevo.');
        } finally {
            clearMessages();
        }
    }

    // Eliminar TODOS los recursos
    async function deleteAllResources() {
        if (!confirm('⚠️ ¿Estás seguro de que quieres eliminar TODOS los registros?\n\nEsta acción no se puede deshacer.')) return;
        
        try {
            const res = await fetch('/api/v2/cheaters-stats?confirm=true', {
                method: 'DELETE'
            });
            
            if (!res.ok) {
                throw new Error('Error al eliminar todos');
            }
            
            await getResources();
            successMessage = '✅ Todos los registros han sido eliminados correctamente.';
        } catch (e) {
            alert('❌ No se pudieron eliminar todos los registros. Por favor, inténtalo de nuevo.');
        } finally {
            clearMessages();
        }
    }

    // Resetear formulario
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

    // Cargar datos al iniciar
    getResources();
</script>

<svelte:head>
    <title>Gestión de Cheaters Stats - API v2</title>
</svelte:head>

<h1 style="color: #0284c7; text-align: center;">🎮 Gestión de Estadísticas de Tramposos (v2)</h1>

<!-- Mensajes para el usuario -->
{#if successMessage}
    <div style="background: #d1fae5; color: #065f46; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; text-align: center; border: 1px solid #10b981;">
        {successMessage}
    </div>
{/if}

{#if error}
    <div style="background: #fee2e2; color: #b91c1c; padding: 1rem; border-radius: 4px; margin-bottom: 1rem; text-align: center; border: 1px solid #dc2626;">
        ⚠️ {error}
    </div>
{/if}

<!-- BARRA DE BOTONES PRINCIPAL -->
<div style="margin-bottom: 2rem; display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;">
    <button onclick={loadSampleData} disabled={loading} style="background: #10b981; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        📥 Cargar datos de ejemplo
    </button>
    
    <button onclick={() => { resetForm(); showCreateForm = true; }} style="background: #0284c7; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        ➕ Añadir nuevo registro
    </button>
    
    <button onclick={getResources} disabled={loading} style="background: #64748b; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        {loading ? 'Cargando...' : '🔄 Actualizar lista'}
    </button>
    
    <button onclick={deleteAllResources} style="background: #dc2626; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        🗑️ Eliminar todos
    </button>
    
    <a href="/api/v2/cheaters-stats/docs" target="_blank" style="background: #8b5cf6; color: white; padding: 0.5rem 1rem; border-radius: 4px; text-decoration: none; font-weight: bold;">
        📘 Documentación API v2
    </a>
</div>

<!-- FILTROS DE BÚSQUEDA -->
<div style="background: #f1f5f9; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem;">
    <h3 style="margin-top: 0; color: #334155;">🔍 Filtros de búsqueda</h3>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
        <div>
            <label style="display: block; font-weight: bold; margin-bottom: 0.3rem;">País</label>
            <select bind:value={filters.country} style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" disabled={loadingFilters}>
                <option value="">Todos</option>
                {#each countries as country}
                    <option value={country}>{country}</option>
                {/each}
            </select>
        </div>
        
        <div>
            <label style="display: block; font-weight: bold; margin-bottom: 0.3rem;">Juego</label>
            <select bind:value={filters.game} style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" disabled={loadingFilters}>
                <option value="">Todos</option>
                {#each games as game}
                    <option value={game}>{game}</option>
                {/each}
            </select>
        </div>
        
        <div>
            <label style="display: block; font-weight: bold; margin-bottom: 0.3rem;">Año exacto</label>
            <select bind:value={filters.year} style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;" disabled={loadingFilters}>
                <option value="">Todos</option>
                {#each years as year}
                    <option value={year}>{year}</option>
                {/each}
            </select>
        </div>
        
        <div>
            <label style="display: block; font-weight: bold; margin-bottom: 0.3rem;">Desde año</label>
            <input type="number" bind:value={filters.from} placeholder="Ej: 2010" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
        </div>
        
        <div>
            <label style="display: block; font-weight: bold; margin-bottom: 0.3rem;">Hasta año</label>
            <input type="number" bind:value={filters.to} placeholder="Ej: 2020" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
        </div>
        
        <div>
            <label style="display: block; font-weight: bold; margin-bottom: 0.3rem;">Reportes mínimos</label>
            <input type="number" bind:value={filters.cheater_report} placeholder="Ej: 100" style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;">
        </div>
    </div>
    
    <div style="display: flex; gap: 1rem;">
        <button onclick={applyFilters} style="background: #0284c7; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
            Aplicar filtros
        </button>
        <button onclick={resetFilters} style="background: #64748b; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
            Resetear filtros
        </button>
    </div>
</div>

<!-- Formulario para añadir/editar recurso -->
{#if showCreateForm || editingResource}
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
        <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <h2 style="color: #0284c7; margin-top: 0;">{editingResource ? '✏️ Editar registro' : '➕ Añadir nuevo registro'}</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                    <label style="display: block; font-weight: bold;">País *</label>
                    <input 
                        type="text" 
                        bind:value={formData.country} 
                        readonly={editingResource}
                        style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px; background: {editingResource ? '#f1f5f9' : 'white'};" 
                        placeholder="Ej: Spain"
                    >
                </div>
                
                <div>
                    <label style="display: block; font-weight: bold;">Año *</label>
                    <input 
                        type="number" 
                        bind:value={formData.year} 
                        readonly={editingResource}
                        style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px; background: {editingResource ? '#f1f5f9' : 'white'};" 
                        placeholder="Ej: 2020"
                    >
                </div>
                
                <div>
                    <label style="display: block; font-weight: bold;">Juego *</label>
                    <input 
                        type="text" 
                        bind:value={formData.game} 
                        readonly={editingResource}
                        style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px; background: {editingResource ? '#f1f5f9' : 'white'};" 
                        placeholder="Ej: csgo"
                    >
                </div>
                
                <div>
                    <label style="display: block; font-weight: bold;">Reportes de tramposos *</label>
                    <input 
                        type="number" 
                        bind:value={formData.cheater_report} 
                        style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;" 
                        placeholder="Ej: 100"
                    >
                </div>
                
                <div>
                    <label style="display: block; font-weight: bold;">Baneos confirmados *</label>
                    <input 
                        type="number" 
                        bind:value={formData.confirmed_ban} 
                        style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;" 
                        placeholder="Ej: 50"
                    >
                </div>
                
                <div>
                    <label style="display: block; font-weight: bold;">Porcentaje estimado</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        bind:value={formData.estimated_cheater} 
                        style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;" 
                        placeholder="Ej: 2.5"
                    >
                </div>
                
                <div>
                    <label style="display: block; font-weight: bold;">Cuentas suspendidas</label>
                    <input 
                        type="number" 
                        bind:value={formData.suspended_account} 
                        style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;" 
                        placeholder="Ej: 30"
                    >
                </div>
                
                <div>
                    <label style="display: block; font-weight: bold;">Reincidentes</label>
                    <input 
                        type="number" 
                        bind:value={formData.repeat_offender} 
                        style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;" 
                        placeholder="Ej: 10"
                    >
                </div>
            </div>
            
            {#if editingResource}
                <p style="color: #64748b; font-size: 0.9rem; margin-top: 1rem;">
                    ℹ️ Para cambiar país, año o juego, elimina el registro y crea uno nuevo.
                </p>
            {/if}
            
            <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
                <button onclick={() => { showCreateForm = false; editingResource = null; resetForm(); }} 
                    style="background: #64748b; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
                    Cancelar
                </button>
                <button onclick={editingResource ? saveResourceChanges : saveNewResource}
                    style="background: #0284c7; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
                    {editingResource ? 'Guardar cambios' : 'Guardar registro'}
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Lista de recursos -->
{#if loading}
    <p style="text-align: center; color: #64748b;">Cargando recursos...</p>
{:else if resources.length > 0}
    <p style="text-align: center; font-weight: bold;">📊 Total de registros: {pagination.total}</p>
    
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <div>
            <label>Mostrar:</label>
            <select bind:value={limit} onchange={getResources} style="margin-left: 0.5rem; padding: 0.3rem;">
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
            </select>
        </div>
        
        <div>
            {#if pagination.totalPages > 1}
                <button onclick={() => goToPage(currentPage - 1)} disabled={!pagination.prev} style="padding: 0.3rem 0.8rem; margin-right: 0.5rem;">◀</button>
                <span>Página {currentPage} de {pagination.totalPages}</span>
                <button onclick={() => goToPage(currentPage + 1)} disabled={!pagination.next} style="padding: 0.3rem 0.8rem; margin-left: 0.5rem;">▶</button>
            {/if}
        </div>
    </div>
    
    {#each resources as resource}
        <div style="margin: 1rem 0; padding: 1rem; border: 1px solid #ccc; border-radius: 4px; background: #f8fafc;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex-grow: 1;">
                    <h3 style="margin: 0 0 0.5rem 0; color: #0284c7;">{resource.country} - {resource.game}</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5rem;">
                        <p style="margin: 0;"><strong>Año:</strong> {resource.year}</p>
                        <p style="margin: 0;"><strong>Reportes:</strong> {resource.cheater_report}</p>
                        <p style="margin: 0;"><strong>Baneos:</strong> {resource.confirmed_ban}</p>
                        {#if resource.estimated_cheater}
                            <p style="margin: 0;"><strong>% Estimado:</strong> {resource.estimated_cheater}%</p>
                        {/if}
                        {#if resource.suspended_account}
                            <p style="margin: 0;"><strong>Suspendidas:</strong> {resource.suspended_account}</p>
                        {/if}
                        {#if resource.repeat_offender}
                            <p style="margin: 0;"><strong>Reincidentes:</strong> {resource.repeat_offender}</p>
                        {/if}
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem; margin-left: 1rem;">
                    <button onclick={() => { 
                        formData = { ...resource }; 
                        editingResource = resource; 
                    }} style="background: #f59e0b; color: white; padding: 0.3rem 0.8rem; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;" title="Editar registro">
                        ✏️ Editar
                    </button>
                    <button onclick={() => { 
                        deleteTarget = { country: resource.country, year: resource.year, game: resource.game };
                        showDeleteModal = true;
                    }} style="background: #dc2626; color: white; padding: 0.3rem 0.8rem; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;" title="Eliminar registro">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        </div>
    {/each}
    
    <hr style="margin: 2rem 0; border: none; border-top: 2px solid #0284c7;">
    
    <div style="display: flex; gap: 2rem; justify-content: center;">
        <a href="/" style="color: #0284c7; text-decoration: none; font-weight: bold;">🏠 Página principal</a>
        <a href="/about" style="color: #0284c7; text-decoration: none; font-weight: bold;">ℹ️ Acerca del proyecto</a>
    </div>
{/if}

<!-- Modal de confirmación para eliminar -->
{#if showDeleteModal && deleteTarget}
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
        <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 400px; width: 90%;">
            <h3 style="color: #dc2626; margin-top: 0;">⚠️ Confirmar eliminación</h3>
            <p>¿Estás seguro de que quieres eliminar este registro?</p>
            <p style="font-weight: bold;">{deleteTarget.country} - {deleteTarget.game} ({deleteTarget.year})</p>
            <p style="color: #64748b; font-size: 0.9rem;">Esta acción no se puede deshacer.</p>
            <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
                <button onclick={() => showDeleteModal = false} 
                    style="background: #64748b; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
                    Cancelar
                </button>
                <button onclick={() => deleteResource(deleteTarget.country, deleteTarget.year, deleteTarget.game)} 
                    style="background: #dc2626; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
                    Sí, eliminar
                </button>
            </div>
        </div>
    </div>
{/if}