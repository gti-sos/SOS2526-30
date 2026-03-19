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
        }, 5000);
    }

    // ============================================
    // API v2 - TODAS LAS OPERACIONES (LECTURA Y MODIFICACIÓN)
    // ============================================
    
    // Cargar todos los atletas desde v2
    async function getAthletes() {
        loading = true;
        error = null;
        successMessage = null;
        try {
            const res = await fetch('/api/v2/olympics-athlete-events?t=' + Date.now());
            
            if (!res.ok) {
                if (res.status === 404) {
                    throw new Error('No se encontraron atletas en la base de datos');
                } else {
                    throw new Error(`Error del servidor: ${res.status}`);
                }
            }
            
            const data = await res.json();
            athletes = data.data || data;
            
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

    // Cargar datos de ejemplo (v2)
    async function loadSampleData() {
        loading = true;
        error = null;
        successMessage = null;
        try {
            // Primero borramos todos los datos existentes en v2
            await fetch('/api/v2/olympics-athlete-events', {
                method: 'DELETE'
            });
            
            // Luego cargamos los datos de ejemplo en v2
            const res = await fetch('/api/v2/olympics-athlete-events/loadInitialData');
            
            if (!res.ok) {
                if (res.status === 500) {
                    throw new Error('Error al cargar los datos de ejemplo. Por favor, inténtalo de nuevo.');
                } else {
                    throw new Error(`Error inesperado: ${res.status}`);
                }
            }
            
            // Recargar la lista desde v2
            await getAthletes();
            successMessage = '✅ Se han cargado 15 atletas de ejemplo correctamente.';
        } catch (e) {
            // @ts-ignore
            error = e.message;
        } finally {
            loading = false;
            clearMessages();
        }
    }

    // Guardar nuevo atleta (v2)
    async function saveNewAthlete() {
        try {
            // Validar campos obligatorios
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
            
            // Recargar la lista desde v2
            await getAthletes();
            showCreateForm = false;
            resetForm();
            successMessage = `✅ El atleta "${formData.name}" ha sido añadido correctamente.`;
        } catch (e) {
            alert('❌ No se pudo guardar el atleta. Por favor, inténtalo de nuevo.');
        } finally {
            clearMessages();
        }
    }

    // Guardar cambios del atleta (v2)
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
            
            // Recargar la lista desde v2
            await getAthletes();
            editingAthlete = null;
            resetForm();
            successMessage = `✅ Los cambios en "${formData.name}" han sido guardados correctamente.`;
        } catch (e) {
            alert('❌ No se pudieron guardar los cambios. Por favor, inténtalo de nuevo.');
        } finally {
            clearMessages();
        }
    }

    // Eliminar un atleta (v2)
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
            
            // Recargar la lista desde v2
            await getAthletes();
            showDeleteModal = false;
            deleteTarget = null;
            successMessage = `✅ El atleta "${name}" (${year}) ha sido eliminado correctamente.`;
        } catch (e) {
            alert('❌ No se pudo eliminar el atleta. Por favor, inténtalo de nuevo.');
        } finally {
            clearMessages();
        }
    }

    // Eliminar TODOS los atletas (v2)
    async function deleteAllAthletes() {
        if (!confirm('⚠️ ¿Estás seguro de que quieres eliminar TODOS los atletas?\n\nEsta acción no se puede deshacer.')) return;
        
        try {
            const res = await fetch('/api/v2/olympics-athlete-events', {
                method: 'DELETE'
            });
            
            if (!res.ok) {
                throw new Error('Error al eliminar todos');
            }
            
            // Recargar la lista desde v2
            await getAthletes();
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
    getAthletes();
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

<!-- BARRA DE BOTONES - TODO SOBRE v2 -->
<div style="margin-bottom: 2rem; display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center;">
    <button onclick={loadSampleData} disabled={loading} style="background: #10b981; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        📥 Cargar datos de ejemplo
    </button>
    
    <button onclick={() => { resetForm(); showCreateForm = true; }} style="background: #0284c7; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        ➕ Añadir nuevo atleta
    </button>
    
    <button onclick={getAthletes} disabled={loading} style="background: #64748b; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        {loading ? 'Cargando...' : '🔄 Actualizar lista'}
    </button>
    
    <button onclick={deleteAllAthletes} style="background: #dc2626; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        🗑️ Eliminar todos
    </button>
</div>

<!-- Formulario para añadir/editar atleta -->
{#if showCreateForm || editingAthlete}
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
        <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <h2 style="color: #0284c7; margin-top: 0;">{editingAthlete ? '✏️ Editar atleta' : '➕ Añadir nuevo atleta'}</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label style="display: block; font-weight: bold;">Nombre completo *</label>
                    <input type="text" bind:value={formData.name} style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;" placeholder="Ej: A Dijiang">
                </div>
                <div>
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label style="display: block; font-weight: bold;">Sexo</label>
                    <select bind:value={formData.sex} style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                    </select>
                </div>
                <div>
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label style="display: block; font-weight: bold;">Edad</label>
                    <input type="number" bind:value={formData.age} style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;" placeholder="Ej: 25">
                </div>
                <div>
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label style="display: block; font-weight: bold;">Altura (cm)</label>
                    <input type="number" bind:value={formData.height} style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;" placeholder="Ej: 180">
                </div>
                <div>
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label style="display: block; font-weight: bold;">Peso (kg)</label>
                    <input type="number" step="0.1" bind:value={formData.weight} style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;" placeholder="Ej: 75.5">
                </div>
                <div>
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label style="display: block; font-weight: bold;">País *</label>
                    <input type="text" bind:value={formData.team} style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;" placeholder="Ej: China">
                </div>
                <div>
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label style="display: block; font-weight: bold;">Código del país</label>
                    <input type="text" bind:value={formData.noc} style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;" placeholder="Ej: CHN">
                </div>
                <div>
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label style="display: block; font-weight: bold;">Año *</label>
                    <input type="number" bind:value={formData.year} style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;" placeholder="Ej: 1992">
                </div>
                <div>
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label style="display: block; font-weight: bold;">Temporada</label>
                    <select bind:value={formData.season} style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="Summer">Verano</option>
                        <option value="Winter">Invierno</option>
                    </select>
                </div>
                <div>
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label style="display: block; font-weight: bold;">Ciudad</label>
                    <input type="text" bind:value={formData.city} style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;" placeholder="Ej: Barcelona">
                </div>
                <div>
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label style="display: block; font-weight: bold;">Deporte *</label>
                    <input type="text" bind:value={formData.sport} style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;" placeholder="Ej: Baloncesto">
                </div>
                <div>
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label style="display: block; font-weight: bold;">Evento *</label>
                    <input type="text" bind:value={formData.event} style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;" placeholder="Ej: Baloncesto masculino">
                </div>
                <div style="grid-column: span 2;">
                    <!-- svelte-ignore a11y_label_has_associated_control -->
                    <label style="display: block; font-weight: bold;">Medalla</label>
                    <select bind:value={formData.medal} style="width: 100%; padding: 0.3rem; border: 1px solid #ccc; border-radius: 4px;">
                        <option value="NA">Ninguna</option>
                        <option value="Gold">Oro 🥇</option>
                        <option value="Silver">Plata 🥈</option>
                        <option value="Bronze">Bronce 🥉</option>
                    </select>
                </div>
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
{:else if athletes.length > 0}
    <p style="text-align: center; font-weight: bold;">📊 Total de atletas en v2: {athletes.length}</p>
    
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
                        <p style="margin: 0;"><strong>Edad:</strong> {athlete.age ?? 'No especificada'}</p>
                        <p style="margin: 0;"><strong>Altura:</strong> {athlete.height ?? 'No especificada'} cm</p>
                        <p style="margin: 0;"><strong>Peso:</strong> {athlete.weight ?? 'No especificado'} kg</p>
                        <p style="margin: 0;"><strong>Temporada:</strong> {athlete.season === 'Summer' ? 'Verano' : 'Invierno'}</p>
                        <p style="margin: 0;"><strong>Ciudad:</strong> {athlete.city ?? 'No especificada'}</p>
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
    
    <hr style="margin: 2rem 0; border: none; border-top: 2px solid #0284c7;">
    
    <div style="display: flex; gap: 2rem; justify-content: center;">
        <a href="/" style="color: #0284c7; text-decoration: none; font-weight: bold;">🏠 Página principal</a>
        <a href="/about" style="color: #0284c7; text-decoration: none; font-weight: bold;">ℹ️ Acerca del proyecto</a>
        <a href="/api/v2/olympics-athlete-events/docs" target="_blank" style="color: #0284c7; text-decoration: none; font-weight: bold;">📄 Documentación v2</a>
    </div>
{:else if !loading}
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