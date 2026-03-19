<script>
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
    
    // Variables para búsqueda
    let searchName = $state('');
    let searchYear = $state('');
    let searchResults = $state(null);
    let searching = $state(false);
    let searchError = $state(null);
    let searchMode = $state(false);
    
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

    // Limpiar mensajes después de un tiempo
    function clearMessages() {
        setTimeout(() => {
            error = null;
            successMessage = null;
            searchError = null;
        }, 5000);
    }

    // ============================================
    // API v2 - TODAS LAS OPERACIONES
    // ============================================
    
    // Cargar todos los atletas desde v2 con paginación
    async function getAthletes(page = currentPage) {
        loading = true;
        error = null;
        successMessage = null;
        searchMode = false;
        
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
            
            // Guardar datos y metadatos de paginación
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

    // Cambiar de página
    function goToPage(page) {
        if (page >= 1 && page <= totalPages) {
            currentPage = page;
            getAthletes(page);
        }
    }

    // Cambiar items por página
    function changeItemsPerPage() {
        currentPage = 1;
        getAthletes(1);
    }

    // Buscar atleta por nombre
    async function searchAthlete() {
        if (!searchName.trim()) {
            searchError = 'Por favor, introduce un nombre para buscar.';
            return;
        }
        
        searching = true;
        searchError = null;
        searchResults = null;
        searchMode = true;
        
        try {
            const url = searchYear 
                ? `/api/v2/olympics-athlete-events/${encodeURIComponent(searchName.trim())}/${searchYear}`
                : `/api/v2/olympics-athlete-events/${encodeURIComponent(searchName.trim())}`;
            
            const res = await fetch(url);
            
            if (res.status === 404) {
                if (searchYear) {
                    searchError = `❌ No existe ningún atleta llamado "${searchName}" que participara en el año ${searchYear}.`;
                } else {
                    searchError = `❌ No existe ningún atleta con el nombre "${searchName}". Prueba con otro nombre.`;
                }
                searchResults = null;
                return;
            }
            
            if (res.status === 400) {
                searchError = '❌ La búsqueda no es válida. Comprueba que el nombre y el año sean correctos.';
                return;
            }
            
            if (!res.ok) {
                throw new Error('Error al buscar el atleta');
            }
            
            const data = await res.json();
            searchResults = data;
            
            if (searchYear) {
                successMessage = `✅ Atleta encontrado: ${data.name} (${data.year})`;
            } else if (Array.isArray(data) && data.length === 0) {
                searchError = `❌ No se encontraron atletas con el nombre "${searchName}".`;
            } else {
                const count = Array.isArray(data) ? data.length : 1;
                successMessage = `✅ Se encontraron ${count} atleta(s) con el nombre "${searchName}".`;
            }
            
        } catch (e) {
            searchError = '❌ Error al buscar. Por favor, inténtalo de nuevo.';
        } finally {
            searching = false;
            clearMessages();
        }
    }

    // Limpiar búsqueda y volver a la lista paginada
    function clearSearch() {
        searchName = '';
        searchYear = '';
        searchResults = null;
        searchError = null;
        searchMode = false;
        getAthletes(1);
    }

    // Cargar datos de ejemplo (v2)
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
                if (res.status === 500) {
                    throw new Error('Error al cargar los datos de ejemplo. Por favor, inténtalo de nuevo.');
                } else {
                    throw new Error(`Error inesperado: ${res.status}`);
                }
            }
            
            await getAthletes(1);
            successMessage = '✅ Se han cargado 15 atletas de ejemplo correctamente.';
        } catch (e) {
            // @ts-ignore
            error = e.message;
        } finally {
            loading = false;
            clearMessages();
        }
    }

    // Guardar nuevo atleta
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
                alert(`❌ Ya existe un atleta llamado "${formData.name}" que participó en ${formData.event} en el año ${formData.year}. No se puede crear duplicado.`);
                return;
            }
            
            if (res.status === 400) {
                alert('❌ Faltan datos obligatorios o el formato es incorrecto. Revisa los campos marcados con *.');
                return;
            }
            
            if (!res.ok) {
                throw new Error('Error al guardar el atleta');
            }
            
            await getAthletes(1);
            showCreateForm = false;
            resetForm();
            successMessage = `✅ El atleta "${formData.name}" ha sido añadido correctamente.`;
        } catch (e) {
            alert('❌ No se pudo guardar el atleta. Por favor, inténtalo de nuevo.');
        } finally {
            clearMessages();
        }
    }

    // Guardar cambios del atleta
    async function saveAthleteChanges() {
        try {
            const originalName = editingAthlete.name;
            const originalYear = editingAthlete.year;
            
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
            
            if (res.status === 400) {
                alert('❌ Los datos no coinciden. No se puede cambiar el nombre o año del atleta a través de esta opción.');
                return;
            }
            
            if (res.status === 404) {
                alert('❌ El atleta que intentas modificar ya no existe. Puede que haya sido eliminado.');
                return;
            }
            
            if (!res.ok) {
                throw new Error('Error al guardar los cambios');
            }
            
            await getAthletes(1);
            editingAthlete = null;
            resetForm();
            successMessage = `✅ Los cambios en "${formData.name}" han sido guardados correctamente.`;
        } catch (e) {
            alert('❌ No se pudieron guardar los cambios. Por favor, inténtalo de nuevo.');
        } finally {
            clearMessages();
        }
    }

    // Eliminar un atleta
    async function deleteAthlete(name, year) {
        try {
            const res = await fetch(`/api/v2/olympics-athlete-events/${encodeURIComponent(name)}/${year}`, {
                method: 'DELETE'
            });
            
            if (res.status === 404) {
                alert(`❌ No se encontró el atleta "${name}" del año ${year}. Puede que ya haya sido eliminado.`);
                showDeleteModal = false;
                deleteTarget = null;
                return;
            }
            
            if (!res.ok) {
                throw new Error('Error al eliminar');
            }
            
            await getAthletes(1);
            showDeleteModal = false;
            deleteTarget = null;
            successMessage = `✅ El atleta "${name}" (${year}) ha sido eliminado correctamente.`;
        } catch (e) {
            alert('❌ No se pudo eliminar el atleta. Por favor, inténtalo de nuevo.');
        } finally {
            clearMessages();
        }
    }

    // Eliminar TODOS los atletas
    async function deleteAllAthletes() {
        if (!confirm('⚠️ ¿Estás seguro de que quieres eliminar TODOS los atletas?\n\nEsta acción no se puede deshacer.')) return;
        
        try {
            const res = await fetch('/api/v2/olympics-athlete-events', {
                method: 'DELETE'
            });
            
            if (!res.ok) {
                throw new Error('Error al eliminar todos');
            }
            
            await getAthletes(1);
            successMessage = '✅ Todos los atletas han sido eliminados correctamente.';
        } catch (e) {
            alert('❌ No se pudieron eliminar todos los atletas. Por favor, inténtalo de nuevo.');
        } finally {
            clearMessages();
        }
    }

    // Resetear formulario
    function resetForm() {
        formData = {
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
        };
    }

    // Cargar datos al iniciar (v2)
    getAthletes(1);
</script>

<svelte:head>
    <title>Gestión de Atletas Olímpicos (API v2)</title>
</svelte:head>

<h1 style="color: #0284c7; text-align: center;">🏅 Gestión de Atletas Olímpicos <span style="font-size: 0.8rem; background: #e0f2fe; padding: 0.2rem 0.5rem; border-radius: 4px; color: #0369a1;">API v2</span></h1>

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

<!-- BUSCADOR DE ATLETAS -->
<div style="background: #f8fafc; padding: 1.5rem; border-radius: 8px; margin-bottom: 2rem; border: 1px solid #cbd5e1;">
    <h3 style="margin-top: 0; color: #0284c7;">🔍 Buscar atletas</h3>
    
    <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end;">
        <div style="flex: 2; min-width: 200px;">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label style="display: block; font-weight: bold; margin-bottom: 0.3rem;">Nombre *</label>
            <input 
                type="text" 
                bind:value={searchName} 
                style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;"
                placeholder="Ej: A Dijiang"
                onkeypress={(e) => e.key === 'Enter' && searchAthlete()}
            >
        </div>
        
        <div style="flex: 1; min-width: 120px;">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label style="display: block; font-weight: bold; margin-bottom: 0.3rem;">Año (opcional)</label>
            <input 
                type="number" 
                bind:value={searchYear} 
                style="width: 100%; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px;"
                placeholder="Ej: 1992"
                onkeypress={(e) => e.key === 'Enter' && searchAthlete()}
            >
        </div>
        
        <div style="display: flex; gap: 0.5rem;">
            <button 
                onclick={searchAthlete} 
                disabled={searching}
                style="background: #0284c7; color: white; padding: 0.5rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; height: 2.5rem;">
                {searching ? 'Buscando...' : '🔍 Buscar'}
            </button>
            
            <button 
                onclick={clearSearch}
                style="background: #64748b; color: white; padding: 0.5rem 1.5rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; height: 2.5rem;">
                🧹 Limpiar
            </button>
        </div>
    </div>
    
    <!-- Mensaje de error de búsqueda -->
    {#if searchError}
        <div style="background: #fee2e2; color: #b91c1c; padding: 0.8rem; border-radius: 4px; margin-top: 1rem; border: 1px solid #fecaca;">
            {searchError}
        </div>
    {/if}
    
    <!-- Resultados de búsqueda -->
    {#if searchResults !== null}
        <div style="margin-top: 1.5rem; border-top: 2px solid #cbd5e1; padding-top: 1rem;">
            <h4 style="color: #0284c7; margin: 0 0 1rem 0;">📋 Resultados de la búsqueda:</h4>
            
            {#if Array.isArray(searchResults)}
                {#if searchResults.length > 0}
                    {#each searchResults as athlete}
                        <div style="padding: 0.8rem; background: white; border: 1px solid #cbd5e1; border-radius: 4px; margin-bottom: 0.5rem;">
                            <strong>{athlete.name}</strong> - {athlete.team} ({athlete.year}) - {athlete.sport}
                        </div>
                    {/each}
                {:else}
                    <p style="color: #64748b;">No se encontraron resultados.</p>
                {/if}
            {:else}
                <div style="background: #e0f2fe; padding: 1rem; border-radius: 4px; border: 1px solid #0284c7;">
                    <p><strong>Atleta encontrado:</strong> {searchResults.name}</p>
                    <p><strong>País:</strong> {searchResults.team} ({searchResults.noc})</p>
                    <p><strong>Año:</strong> {searchResults.year} ({searchResults.season})</p>
                    <p><strong>Deporte:</strong> {searchResults.sport}</p>
                    <p><strong>Evento:</strong> {searchResults.event}</p>
                    <p><strong>Medalla:</strong> {
                        searchResults.medal === 'Gold' ? 'Oro 🥇' :
                        searchResults.medal === 'Silver' ? 'Plata 🥈' :
                        searchResults.medal === 'Bronze' ? 'Bronce 🥉' : 'Ninguna'
                    }</p>
                </div>
            {/if}
        </div>
    {/if}
</div>

<!-- BARRA DE BOTONES PRINCIPAL -->
<div style="margin-bottom: 2rem; display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;">
    <button onclick={loadSampleData} disabled={loading} style="background: #10b981; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        📥 Cargar datos de ejemplo
    </button>
    
    <button onclick={() => { resetForm(); showCreateForm = true; }} style="background: #0284c7; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        ➕ Añadir nuevo atleta
    </button>
    
    <button onclick={() => getAthletes(currentPage)} disabled={loading} style="background: #64748b; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        {loading ? 'Cargando...' : '🔄 Actualizar lista'}
    </button>
    
    <button onclick={deleteAllAthletes} style="background: #dc2626; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        🗑️ Eliminar todos
    </button>
</div>

<!-- Controles de paginación -->
{#if !searchMode && athletes.length > 0}
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
            <!-- svelte-ignore a11y_label_has_associated_control -->
            <label style="font-weight: bold;">Mostrar:</label>
            <select bind:value={itemsPerPage} onchange={changeItemsPerPage} style="padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;">
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
            </select>
            <span>atletas por página</span>
        </div>
        
        <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button 
                onclick={() => goToPage(currentPage - 1)} 
                disabled={currentPage === 1}
                style="background: #64748b; color: white; padding: 0.3rem 0.8rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                ◀ Anterior
            </button>
            
            <span style="font-weight: bold;">
                Página {currentPage} de {totalPages} (Total: {totalAthletes} atletas)
            </span>
            
            <button 
                onclick={() => goToPage(currentPage + 1)} 
                disabled={currentPage === totalPages}
                style="background: #64748b; color: white; padding: 0.3rem 0.8rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                Siguiente ▶
            </button>
        </div>
    </div>
{/if}

<!-- Formulario para añadir/editar atleta -->
{#if showCreateForm || editingAthlete}
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
        <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <h2 style="color: #0284c7; margin-top: 0;">{editingAthlete ? '✏️ Editar atleta' : '➕ Añadir nuevo atleta'}</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <!-- ... (el formulario se mantiene igual) ... -->
            </div>
            
            <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
                <button onclick={() => { showCreateForm = false; editingAthlete = null; resetForm(); }} 
                    style="background: #64748b; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
                    Cancelar
                </button>
                <button onclick={editingAthlete ? saveAthleteChanges : saveNewAthlete}
                    style="background: #0284c7; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
                    {editingAthlete ? 'Guardar cambios' : 'Guardar atleta'}
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Lista de atletas -->
{#if loading}
    <p style="text-align: center; color: #64748b;">Cargando atletas desde API v2...</p>
{:else if searchMode && searchResults !== null}
    <!-- Mostrando resultados de búsqueda -->
{:else if athletes.length > 0}
    <p style="text-align: center; font-weight: bold;">📊 Mostrando {athletes.length} atletas (página {currentPage} de {totalPages})</p>
    
    {#each athletes as athlete}
        <div style="margin: 1rem 0; padding: 1rem; border: 1px solid #ccc; border-radius: 4px; background: #f8fafc;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex-grow: 1;">
                    <h3 style="margin: 0 0 0.5rem 0; color: #0284c7;">{athlete.name}</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 0.5rem;">
                        <p style="margin: 0;"><strong>País:</strong> {athlete.team}</p>
                        <p style="margin: 0;"><strong>Año:</strong> {athlete.year}</p>
                        <p style="margin: 0;"><strong>Deporte:</strong> {athlete.sport}</p>
                        <p style="margin: 0;"><strong>Evento:</strong> {athlete.event}</p>
                        <p style="margin: 0;"><strong>Medalla:</strong> {
                            athlete.medal === 'Gold' ? 'Oro 🥇' :
                            athlete.medal === 'Silver' ? 'Plata 🥈' :
                            athlete.medal === 'Bronze' ? 'Bronce 🥉' : 'Ninguna'
                        }</p>
                        <p style="margin: 0;"><strong>Edad:</strong> {athlete.age ?? 'N/A'}</p>
                        <p style="margin: 0;"><strong>Altura:</strong> {athlete.height ?? 'N/A'} cm</p>
                        <p style="margin: 0;"><strong>Peso:</strong> {athlete.weight ?? 'N/A'} kg</p>
                        <p style="margin: 0;"><strong>Temporada:</strong> {athlete.season === 'Summer' ? 'Verano' : 'Invierno'}</p>
                        <p style="margin: 0;"><strong>Ciudad:</strong> {athlete.city ?? 'N/A'}</p>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem; margin-left: 1rem;">
                    <button onclick={() => { 
                        formData = { ...athlete }; 
                        editingAthlete = athlete; 
                    }} style="background: #f59e0b; color: white; padding: 0.3rem 0.8rem; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;" title="Editar atleta en v2">
                        ✏️ Editar
                    </button>
                    <button onclick={() => { 
                        deleteTarget = { name: athlete.name, year: athlete.year };
                        showDeleteModal = true;
                    }} style="background: #dc2626; color: white; padding: 0.3rem 0.8rem; border: none; border-radius: 4px; cursor: pointer; font-size: 1rem;" title="Eliminar atleta de v2">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        </div>
    {/each}
    
    <!-- Controles de paginación inferiores -->
    {#if !searchMode && athletes.length > 0}
        <div style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 2rem;">
            <button 
                onclick={() => goToPage(1)} 
                disabled={currentPage === 1}
                style="background: #64748b; color: white; padding: 0.3rem 0.8rem; border: none; border-radius: 4px; cursor: pointer;">
                ⏮ Primera
            </button>
            <button 
                onclick={() => goToPage(currentPage - 1)} 
                disabled={currentPage === 1}
                style="background: #64748b; color: white; padding: 0.3rem 0.8rem; border: none; border-radius: 4px; cursor: pointer;">
                ◀ Anterior
            </button>
            <span style="padding: 0.3rem 0.8rem; background: #e0f2fe; border-radius: 4px; font-weight: bold;">
                Página {currentPage} de {totalPages}
            </span>
            <button 
                onclick={() => goToPage(currentPage + 1)} 
                disabled={currentPage === totalPages}
                style="background: #64748b; color: white; padding: 0.3rem 0.8rem; border: none; border-radius: 4px; cursor: pointer;">
                Siguiente ▶
            </button>
            <button 
                onclick={() => goToPage(totalPages)} 
                disabled={currentPage === totalPages}
                style="background: #64748b; color: white; padding: 0.3rem 0.8rem; border: none; border-radius: 4px; cursor: pointer;">
                ⏭ Última
            </button>
        </div>
    {/if}
    
    <hr style="margin: 2rem 0; border: none; border-top: 2px solid #0284c7;">
    
    <div style="display: flex; gap: 2rem; justify-content: center;">
        <a href="/" style="color: #0284c7; text-decoration: none; font-weight: bold;">🏠 Página principal</a>
        <a href="/about" style="color: #0284c7; text-decoration: none; font-weight: bold;">ℹ️ Acerca del proyecto</a>
        <a href="/api/v2/olympics-athlete-events/docs" target="_blank" style="color: #0284c7; text-decoration: none; font-weight: bold;">📄 Documentación v2</a>
    </div>
{:else if !loading && !searchMode}
    <p style="text-align: center; color: #64748b; padding: 2rem;">No hay atletas en v2. Puedes cargar datos de ejemplo o añadir uno nuevo.</p>
{/if}

<!-- Modal de confirmación para eliminar -->
{#if showDeleteModal && deleteTarget}
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
        <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 400px; width: 90%;">
            <h3 style="color: #dc2626; margin-top: 0;">⚠️ Confirmar eliminación</h3>
            <p>¿Estás seguro de que quieres eliminar de v2 a <strong>{deleteTarget.name}</strong> ({deleteTarget.year})?</p>
            <p style="color: #64748b; font-size: 0.9rem;">Esta acción no se puede deshacer.</p>
            <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
                <button onclick={() => showDeleteModal = false} 
                    style="background: #64748b; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
                    Cancelar
                </button>
                <button onclick={() => deleteAthlete(deleteTarget.name, deleteTarget.year)} 
                    style="background: #dc2626; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
                    Sí, eliminar de v2
                </button>
            </div>
        </div>
    </div>
{/if}