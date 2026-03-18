<script>
    // @ts-ignore
    let athletes = $state([]);
    let loading = $state(false);
    let error = $state(null);
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

    // Cargar todos los atletas (NO solo los iniciales)
    async function getAthletes() {
        loading = true;
        error = null;
        try {
            const res = await fetch('/api/v1/olympics-athlete-events');
            
            if (!res.ok) {
                throw new Error(`Error ${res.status}`);
            }
            
            const data = await res.json();
            athletes = data.data || data; // Manejar paginación si existe
        } catch (e) {
            // @ts-ignore
            error = e.message;
        } finally {
            loading = false;
        }
    }

    // Crear nuevo atleta
    async function createAthlete() {
        try {
            const res = await fetch('/api/v1/olympics-athlete-events', {
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
                alert('Ya existe un atleta con ese nombre, año y evento');
                return;
            }
            
            if (!res.ok) throw new Error('Error al crear');
            
            await getAthletes();
            showCreateForm = false;
            resetForm();
        } catch (e) {
            alert('Error al crear atleta');
        }
    }

    // Actualizar atleta
    async function updateAthlete() {
        try {
            const res = await fetch(
                `/api/v1/olympics-athlete-events/${encodeURIComponent(editingAthlete.name)}/${editingAthlete.year}`,
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
            
            if (!res.ok) throw new Error('Error al actualizar');
            
            await getAthletes();
            editingAthlete = null;
            resetForm();
        } catch (e) {
            alert('Error al actualizar atleta');
        }
    }

    // Borrar un atleta específico
    async function deleteAthlete(name, year) {
        try {
            const res = await fetch(`/api/v1/olympics-athlete-events/${encodeURIComponent(name)}/${year}`, {
                method: 'DELETE'
            });
            
            if (!res.ok) throw new Error('Error al borrar');
            
            await getAthletes();
            showDeleteModal = false;
            deleteTarget = null;
        } catch (e) {
            alert('Error al borrar atleta');
        }
    }

    // Borrar TODOS los atletas
    async function deleteAllAthletes() {
        if (!confirm('¿Estás seguro de que quieres borrar TODOS los atletas?')) return;
        
        try {
            const res = await fetch('/api/v1/olympics-athlete-events', {
                method: 'DELETE'
            });
            
            if (!res.ok) throw new Error('Error al borrar todos');
            
            await getAthletes();
        } catch (e) {
            alert('Error al borrar todos los atletas');
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

    // Cargar datos al iniciar
    getAthletes();
</script>

<svelte:head>
    <title>Atletas Olímpicos - Gestión</title>
</svelte:head>

<h1>🏅 Atletas Olímpicos</h1>

<!-- Botones de acción -->
<div style="margin-bottom: 2rem; display: flex; gap: 1rem; flex-wrap: wrap;">
    <button onclick={() => { resetForm(); showCreateForm = true; }} style="background: #0284c7; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
        ➕ Nuevo Atleta
    </button>
    <button onclick={deleteAllAthletes} style="background: #dc2626; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
        🗑️ Borrar Todos
    </button>
    <button onclick={getAthletes} disabled={loading} style="background: #64748b; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
        {loading ? 'Cargando...' : '🔄 Recargar'}
    </button>
</div>

<!-- Formulario de creación/edición -->
{#if showCreateForm || editingAthlete}
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
        <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <h2>{editingAthlete ? '✏️ Editar Atleta' : '➕ Nuevo Atleta'}</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div>
                    <label style="display: block; font-weight: bold;">Nombre *</label>
                    <input type="text" bind:value={formData.name} style="width: 100%; padding: 0.3rem;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold;">Sexo</label>
                    <select bind:value={formData.sex} style="width: 100%; padding: 0.3rem;">
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; font-weight: bold;">Edad</label>
                    <input type="number" bind:value={formData.age} style="width: 100%; padding: 0.3rem;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold;">Altura (cm)</label>
                    <input type="number" bind:value={formData.height} style="width: 100%; padding: 0.3rem;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold;">Peso (kg)</label>
                    <input type="number" step="0.1" bind:value={formData.weight} style="width: 100%; padding: 0.3rem;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold;">Equipo/País *</label>
                    <input type="text" bind:value={formData.team} style="width: 100%; padding: 0.3rem;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold;">Código NOC</label>
                    <input type="text" bind:value={formData.noc} style="width: 100%; padding: 0.3rem;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold;">Año *</label>
                    <input type="number" bind:value={formData.year} style="width: 100%; padding: 0.3rem;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold;">Temporada</label>
                    <select bind:value={formData.season} style="width: 100%; padding: 0.3rem;">
                        <option value="Summer">Verano</option>
                        <option value="Winter">Invierno</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; font-weight: bold;">Ciudad</label>
                    <input type="text" bind:value={formData.city} style="width: 100%; padding: 0.3rem;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold;">Deporte *</label>
                    <input type="text" bind:value={formData.sport} style="width: 100%; padding: 0.3rem;">
                </div>
                <div>
                    <label style="display: block; font-weight: bold;">Evento *</label>
                    <input type="text" bind:value={formData.event} style="width: 100%; padding: 0.3rem;">
                </div>
                <div style="grid-column: span 2;">
                    <label style="display: block; font-weight: bold;">Medalla</label>
                    <select bind:value={formData.medal} style="width: 100%; padding: 0.3rem;">
                        <option value="NA">Ninguna</option>
                        <option value="Gold">Oro</option>
                        <option value="Silver">Plata</option>
                        <option value="Bronze">Bronce</option>
                    </select>
                </div>
            </div>
            
            <div style="margin-top: 2rem; display: flex; gap: 1rem; justify-content: flex-end;">
                <button onclick={() => { showCreateForm = false; editingAthlete = null; resetForm(); }} 
                    style="background: #64748b; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
                    Cancelar
                </button>
                <button onclick={editingAthlete ? updateAthlete : createAthlete}
                    style="background: #0284c7; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
                    {editingAthlete ? 'Actualizar' : 'Crear'}
                </button>
            </div>
        </div>
    </div>
{/if}

<!-- Lista de atletas -->
{#if loading}
    <p>Cargando atletas...</p>
{:else if error}
    <p style="color: red;">Error: {error}</p>
{:else if athletes.length > 0}
    <p><strong>Total:</strong> {athletes.length} atletas</p>
    
    {#each athletes as athlete}
        <div style="margin: 1rem 0; padding: 1rem; border: 1px solid #ccc; border-radius: 4px;">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div>
                    <h3 style="margin: 0 0 0.5rem 0;">{athlete.name}</h3>
                    <p style="margin: 0.2rem 0;"><strong>ID:</strong> {athlete.id}</p>
                    <p style="margin: 0.2rem 0;"><strong>Sexo:</strong> {athlete.sex}</p>
                    <p style="margin: 0.2rem 0;"><strong>Edad:</strong> {athlete.age ?? 'N/A'}</p>
                    <p style="margin: 0.2rem 0;"><strong>Altura:</strong> {athlete.height ?? 'N/A'} cm</p>
                    <p style="margin: 0.2rem 0;"><strong>Peso:</strong> {athlete.weight ?? 'N/A'} kg</p>
                    <p style="margin: 0.2rem 0;"><strong>Equipo:</strong> {athlete.team}</p>
                    <p style="margin: 0.2rem 0;"><strong>NOC:</strong> {athlete.noc}</p>
                    <p style="margin: 0.2rem 0;"><strong>Juegos:</strong> {athlete.games}</p>
                    <p style="margin: 0.2rem 0;"><strong>Año:</strong> {athlete.year}</p>
                    <p style="margin: 0.2rem 0;"><strong>Temporada:</strong> {athlete.season}</p>
                    <p style="margin: 0.2rem 0;"><strong>Ciudad:</strong> {athlete.city}</p>
                    <p style="margin: 0.2rem 0;"><strong>Deporte:</strong> {athlete.sport}</p>
                    <p style="margin: 0.2rem 0;"><strong>Evento:</strong> {athlete.event}</p>
                    <p style="margin: 0.2rem 0;"><strong>Medalla:</strong> {athlete.medal}</p>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick={() => { 
                        formData = { ...athlete }; 
                        editingAthlete = athlete; 
                    }} style="background: #f59e0b; color: white; padding: 0.3rem 0.8rem; border: none; border-radius: 4px; cursor: pointer;">
                        ✏️
                    </button>
                    <button onclick={() => { 
                        deleteTarget = { name: athlete.name, year: athlete.year };
                        showDeleteModal = true;
                    }} style="background: #dc2626; color: white; padding: 0.3rem 0.8rem; border: none; border-radius: 4px; cursor: pointer;">
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    {/each}
    
    <hr>
    
    <p>
        <a href="/">Home</a> | 
        <a href="/about">About</a>
    </p>
{/if}

<!-- Modal de confirmación para borrar -->
{#if showDeleteModal && deleteTarget}
    <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;">
        <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 400px;">
            <h3 style="color: #dc2626;">Confirmar borrado</h3>
            <p>¿Borrar a <strong>{deleteTarget.name}</strong> ({deleteTarget.year})?</p>
            <div style="display: flex; gap: 1rem; justify-content: flex-end; margin-top: 2rem;">
                <button onclick={() => showDeleteModal = false} 
                    style="background: #64748b; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
                    Cancelar
                </button>
                <button onclick={() => deleteAthlete(deleteTarget.name, deleteTarget.year)} 
                    style="background: #dc2626; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
                    Confirmar
                </button>
            </div>
        </div>
    </div>
{/if}