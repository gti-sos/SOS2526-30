<script>
// @ts-nocheck
import { onMount } from 'svelte';
import { 
  Button, Card, CardBody, Modal, ModalHeader, ModalBody,
  Table, Pagination, PaginationItem, PaginationLink,
  Row, Col, Form, FormGroup, Label, Input,
  Alert, Badge, Container, Spinner
} from 'sveltestrap';

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
    name: '', year: '', from: '', to: '', team: '', sport: '',
    event: '', season: '', medal: '', sex: '', city: ''
});

// Formulario para nuevo/editar atleta
let formData = $state({
    name: '', sex: 'M', age: '', height: '', weight: '', team: '',
    noc: '', year: '', season: 'Summer', city: '', sport: '',
    event: '', medal: 'NA'
});

function clearMessages() {
    setTimeout(() => {
        error = null;
        successMessage = null;
        searchError = null;
    }, 5000);
}

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

async function aplicarValorUnico(valor) {
    mostrarValoresUnicos = false;
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

function cerrarValoresUnicos() {
    mostrarValoresUnicos = false;
    campoSeleccionado = null;
    valoresUnicos = [];
}

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
        name: '', year: '', from: '', to: '', team: '', sport: '',
        event: '', season: '', medal: '', sex: '', city: ''
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
        await fetch('/api/v2/olympics-athlete-events', { method: 'DELETE' });
        const res = await fetch('/api/v2/olympics-athlete-events/loadInitialData');
        if (!res.ok) throw new Error('Error al cargar los datos de ejemplo.');
        await getAthletes(1);
        successMessage = 'Se han cargado 15 atletas de ejemplo correctamente.';
    } catch (e) {
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
        const res = await fetch(`/api/v2/olympics-athlete-events/${encodeURIComponent(name)}/${year}`, { method: 'DELETE' });
        
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
        const res = await fetch('/api/v2/olympics-athlete-events', { method: 'DELETE' });
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
    if (athletes.length === 0) await loadSampleData();
});
</script>

<svelte:head>
    <title>Gestion de Atletas Olimpicos</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
</svelte:head>

<Container class="py-4">
    <Card class="shadow-sm border-primary">
        <CardBody>
            <h1 class="text-center text-primary border-bottom pb-2">Gestión de Atletas Olímpicos <Badge color="info" pill>API v2</Badge></h1>

            {#if successMessage}<Alert color="success">{successMessage}</Alert>{/if}
            {#if error}<Alert color="danger">{error}</Alert>{/if}

            <!-- Valores únicos -->
            <Card class="mb-4 bg-light">
                <CardBody>
                    <h5 class="text-primary">📋 Ver valores únicos por campo</h5>
                    <div class="d-flex flex-wrap gap-2">
                        <Button color="secondary" size="sm" onclick={() => cargarValoresUnicos('year')}>Años</Button>
                        <Button color="secondary" size="sm" onclick={() => cargarValoresUnicos('team')}>Países</Button>
                        <Button color="secondary" size="sm" onclick={() => cargarValoresUnicos('sport')}>Deportes</Button>
                        <Button color="secondary" size="sm" onclick={() => cargarValoresUnicos('event')}>Eventos</Button>
                        <Button color="secondary" size="sm" onclick={() => cargarValoresUnicos('season')}>Temporadas</Button>
                        <Button color="secondary" size="sm" onclick={() => cargarValoresUnicos('medal')}>Medallas</Button>
                        <Button color="secondary" size="sm" onclick={() => cargarValoresUnicos('sex')}>Sexos</Button>
                        <Button color="secondary" size="sm" onclick={() => cargarValoresUnicos('city')}>Ciudades</Button>
                    </div>
                </CardBody>
            </Card>

            <!-- Búsqueda avanzada -->
            <Card class="mb-4 bg-light">
                <CardBody>
                    <h5 class="text-primary">🔍 Búsqueda avanzada</h5>
                    <div class="row g-2">
                        <div class="col-md-3"><Input placeholder="Nombre" bind:value={searchFilters.name}/></div>
                        <div class="col-md-2"><Input type="number" placeholder="Año exacto" bind:value={searchFilters.year}/></div>
                        <div class="col-md-2"><Input type="number" placeholder="Desde año" bind:value={searchFilters.from}/></div>
                        <div class="col-md-2"><Input type="number" placeholder="Hasta año" bind:value={searchFilters.to}/></div>
                        <div class="col-md-3"><Input placeholder="País" bind:value={searchFilters.team}/></div>
                        <div class="col-md-3"><Input placeholder="Deporte" bind:value={searchFilters.sport}/></div>
                        <div class="col-md-3"><Input placeholder="Evento" bind:value={searchFilters.event}/></div>
                        <div class="col-md-2">
                            <select class="form-select" bind:value={searchFilters.season}>
                                <option value="">Temporada</option><option value="Summer">Verano</option><option value="Winter">Invierno</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" bind:value={searchFilters.medal}>
                                <option value="">Medalla</option><option value="Gold">Oro</option><option value="Silver">Plata</option><option value="Bronze">Bronce</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <select class="form-select" bind:value={searchFilters.sex}>
                                <option value="">Sexo</option><option value="M">M</option><option value="F">F</option>
                            </select>
                        </div>
                        <div class="col-md-2"><Input placeholder="Ciudad" bind:value={searchFilters.city}/></div>
                    </div>
                    <div class="mt-3 d-flex gap-2">
                        <Button color="primary" onclick={advancedSearch} disabled={searching}>{searching ? 'Buscando...' : '🔍 Buscar'}</Button>
                        <Button color="secondary" onclick={clearSearch}>🗑️ Limpiar búsqueda</Button>
                    </div>
                    
                    {#if searchError}<Alert color="danger" class="mt-3">{searchError}</Alert>{/if}
                    
                    {#if searchResults !== null && searchResults.length > 0}
                        <div class="mt-3 border-top pt-3">
                            <h6 class="text-primary">📋 Resultados ({searchResults.length}):</h6>
                            {#each searchResults as athlete}
                                <Card class="mb-2">
                                    <CardBody class="p-3">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong class="text-primary">{athlete.name}</strong> <span class="text-muted">({athlete.year})</span>
                                                <div class="small">{athlete.team} • {athlete.sport} • {athlete.event}</div>
                                            </div>
                                            <div>
                                                <Button color="warning" size="sm" onclick={() => startEditing(athlete)}>✏️ Editar</Button>
                                                <Button color="danger" size="sm" onclick={() => { deleteTarget = { name: athlete.name, year: athlete.year }; showDeleteModal = true; }}>🗑️ Borrar</Button>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            {/each}
                        </div>
                    {/if}
                </CardBody>
            </Card>

            <!-- Botones principales -->
            <div class="d-flex gap-2 justify-content-center mb-4">
                <Button color="success" onclick={loadSampleData} disabled={loading}>📥 Cargar datos ejemplo</Button>
                <Button color="primary" onclick={() => { resetForm(); showCreateForm = true; }}>➕ Añadir nuevo atleta</Button>
                <Button color="danger" onclick={deleteAllAthletes}>🗑️ Eliminar todos</Button>
            </div>

            <!-- Paginación -->
            {#if !searchMode && athletes.length > 0}
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div class="d-flex align-items-center gap-2">
                        <span>Mostrar:</span>
                        <select class="form-select w-auto" bind:value={itemsPerPage} onchange={changeItemsPerPage}>
                            <option value={5}>5</option><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option>
                        </select>
                        <span>por página</span>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <Button color="secondary" size="sm" onclick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>◀ Anterior</Button>
                        <span class="badge bg-info">Pág. {currentPage} de {totalPages} ({totalAthletes} total)</span>
                        <Button color="secondary" size="sm" onclick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Siguiente ▶</Button>
                    </div>
                </div>
            {/if}

            <!-- Lista de atletas -->
            {#if loading}
                <div class="text-center py-4"><Spinner color="primary"/> Cargando...</div>
            {:else if athletes.length > 0 && !searchMode}
                <p class="text-center"><strong>Mostrando {athletes.length} atletas (página {currentPage} de {totalPages})</strong></p>
                
                {#each athletes as athlete}
                    <Card class="mb-3">
                        <CardBody>
                            <div class="d-flex justify-content-between align-items-start">
                                <div class="flex-grow-1">
                                    <h5 class="text-primary">{athlete.name}</h5>
                                    <div class="row small">
                                        <div class="col-md-3"><strong>País:</strong> {athlete.team}</div>
                                        <div class="col-md-2"><strong>Año:</strong> {athlete.year}</div>
                                        <div class="col-md-3"><strong>Deporte:</strong> {athlete.sport}</div>
                                        <div class="col-md-4"><strong>Evento:</strong> {athlete.event}</div>
                                        <div class="col-md-2"><strong>Medalla:</strong> {athlete.medal === 'Gold' ? '🥇 Oro' : athlete.medal === 'Silver' ? '🥈 Plata' : athlete.medal === 'Bronze' ? '🥉 Bronce' : 'Ninguna'}</div>
                                    </div>
                                </div>
                                <div class="d-flex gap-2">
                                    <Button color="warning" size="sm" onclick={() => startEditing(athlete)}>✏️ Editar</Button>
                                    <Button color="danger" size="sm" onclick={() => { deleteTarget = { name: athlete.name, year: athlete.year }; showDeleteModal = true; }}>🗑️ Borrar</Button>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                {/each}

                <div class="d-flex justify-content-center gap-2 mt-3">
                    <Button color="secondary" size="sm" onclick={() => goToPage(1)} disabled={currentPage === 1}>⏮️</Button>
                    <Button color="secondary" size="sm" onclick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>◀</Button>
                    <span class="align-self-center">{currentPage}/{totalPages}</span>
                    <Button color="secondary" size="sm" onclick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>▶</Button>
                    <Button color="secondary" size="sm" onclick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>⏭️</Button>
                </div>

                <hr class="my-4">
                <div class="d-flex justify-content-center gap-4">
                    <a href="/">🏠 Inicio</a>
                    <a href="/about">📖 Acerca de</a>
                    <a href="/api/v2/olympics-athlete-events/docs" target="_blank">📚 Docs v2</a>
                </div>
            {:else if !loading && !searchMode}
                <div class="text-center py-4 text-muted">📭 No hay atletas. Carga datos de ejemplo o añade uno nuevo.</div>
            {/if}
        </CardBody>
    </Card>

    <!-- Modal para crear/editar -->
    {#if showCreateForm || editingAthlete}
        <Modal isOpen={true} toggle={() => { showCreateForm = false; editingAthlete = null; resetForm(); }}>
            <ModalHeader>{editingAthlete ? '✏️ Editar atleta' : '➕ Nuevo atleta'}</ModalHeader>
            <ModalBody>
                <div class="row g-2">
                    <div class="col-md-6"><Label>Nombre *</Label><Input bind:value={formData.name} disabled={editingAthlete !== null}/></div>
                    <div class="col-md-3"><Label>Sexo</Label><select class="form-select" bind:value={formData.sex}><option value="M">M</option><option value="F">F</option></select></div>
                    <div class="col-md-3"><Label>Edad</Label><Input type="number" bind:value={formData.age}/></div>
                    <div class="col-md-3"><Label>Altura (cm)</Label><Input type="number" bind:value={formData.height}/></div>
                    <div class="col-md-3"><Label>Peso (kg)</Label><Input type="number" step="0.1" bind:value={formData.weight}/></div>
                    <div class="col-md-4"><Label>País *</Label><Input bind:value={formData.team}/></div>
                    <div class="col-md-2"><Label>Año *</Label><Input type="number" bind:value={formData.year} disabled={editingAthlete !== null}/></div>
                    <div class="col-md-3"><Label>Ciudad</Label><Input bind:value={formData.city}/></div>
                    <div class="col-md-4"><Label>Deporte *</Label><Input bind:value={formData.sport}/></div>
                    <div class="col-md-4"><Label>Evento *</Label><Input bind:value={formData.event}/></div>
                    <div class="col-md-4"><Label>Medalla</Label>
                        <select class="form-select" bind:value={formData.medal}>
                            <option value="NA">Ninguna</option><option value="Gold">Oro</option><option value="Silver">Plata</option><option value="Bronze">Bronce</option>
                        </select>
                    </div>
                </div>
                <div class="d-flex gap-2 justify-content-end mt-3">
                    <Button color="secondary" onclick={() => { showCreateForm = false; editingAthlete = null; resetForm(); }}>Cancelar</Button>
                    <Button color="primary" onclick={editingAthlete ? saveAthleteChanges : saveNewAthlete}>{editingAthlete ? 'Guardar cambios' : 'Guardar'}</Button>
                </div>
            </ModalBody>
        </Modal>
    {/if}

    <!-- Modal de confirmación de eliminación -->
    {#if showDeleteModal && deleteTarget}
        <Modal isOpen={true} toggle={() => { showDeleteModal = false; deleteTarget = null; }}>
            <ModalHeader class="text-danger">⚠️ Confirmar eliminación</ModalHeader>
            <ModalBody>
                <p>¿Estás seguro de que quieres eliminar a <strong>{deleteTarget.name}</strong> ({deleteTarget.year})?</p>
                <p class="small text-muted">Esta acción no se puede deshacer.</p>
                <div class="d-flex gap-2 justify-content-end">
                    <Button color="secondary" onclick={() => { showDeleteModal = false; deleteTarget = null; }}>Cancelar</Button>
                    <Button color="danger" onclick={() => deleteAthlete(deleteTarget.name, deleteTarget.year)}>Sí, eliminar</Button>
                </div>
            </ModalBody>
        </Modal>
    {/if}

    <!-- Modal para valores únicos -->
    {#if mostrarValoresUnicos}
        <Modal isOpen={true} toggle={cerrarValoresUnicos}>
            <ModalHeader>Valores únicos: {campoSeleccionado}</ModalHeader>
            <ModalBody>
                <div class="d-flex flex-wrap gap-2" style="max-height: 400px; overflow-y: auto;">
                    {#each valoresUnicos as valor}
                        <Button color="primary" size="sm" onclick={() => aplicarValorUnico(valor)}>{valor}</Button>
                    {/each}
                </div>
            </ModalBody>
        </Modal>
    {/if}
</Container>