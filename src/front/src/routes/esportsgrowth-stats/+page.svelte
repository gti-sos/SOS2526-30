<script>
    import { onMount } from 'svelte';

    let estadisticas = [];
    let mensaje = "";
    let esError = false;

    let nuevoDato = {
        country: "", year: "", active_player_no: "", viewership: "", 
        top_genre: "", top_platform: "", tournament_no: "", 
        pro_player_no: "", internet_penetration: "", company_no: ""
    };

    const API_URL = "/api/v1/esportsgrowth-stats";

    onMount(async () => {
        await cargarDatos();
    });

    function notificar(texto, error = false) {
        mensaje = texto;
        esError = error;
        setTimeout(() => mensaje = "", 5000);
    }

    async function cargarDatos() {
        const res = await fetch(API_URL);
        if (res.ok) {
            estadisticas = await res.json();
        }
    }

    async function cargarIniciales() {
        const res = await fetch(`${API_URL}/loadInitialData`);
        if (res.ok) {
            notificar("Datos iniciales cargados con éxito.");
            await cargarDatos();
        } else {
            notificar("No se han podido cargar los datos iniciales.", true);
        }
    }

    async function añadirDato() {
        if (!nuevoDato.country || !nuevoDato.year) {
            notificar("Por favor, rellena al menos el País y el Año.", true);
            return;
        }

        const res = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoDato)
        });

        if (res.status === 201) {
            notificar("¡Estadística guardada correctamente!");
            await cargarDatos();
            nuevoDato = { country: "", year: "", active_player_no: "", viewership: "", top_genre: "", top_platform: "", tournament_no: "", pro_player_no: "", internet_penetration: "", company_no: "" };
        } else if (res.status === 409) {
            notificar("Ya existe una estadística para ese país y año.", true);
        } else {
            notificar("Revisa que todos los campos sean correctos.", true);
        }
    }

    async function borrarDato(country, year) {
        if (confirm(`¿Estás seguro de que quieres borrar los datos de ${country} en ${year}?`)) {
            const res = await fetch(`${API_URL}/${country}/${year}`, { method: "DELETE" });
            if (res.ok) {
                notificar("Dato eliminado correctamente.");
                await cargarDatos();
            } else {
                notificar("No se ha encontrado el dato para eliminar.", true);
            }
        }
    }

    async function borrarTodos() {
        if (confirm("¡ATENCIÓN! ¿Seguro que quieres borrar absolutamente todos los datos?")) {
            const res = await fetch(API_URL, { method: "DELETE" });
            if (res.ok) {
                notificar("Toda la base de datos ha sido vaciada.");
                estadisticas = [];
            } else {
                notificar("Hubo un problema al vaciar los datos.", true);
            }
        }
    }
</script>

<main style="padding: 20px; font-family: sans-serif;">
    <h1>Estadísticas de Crecimiento de eSports</h1>

    {#if mensaje}
        <div style="padding: 10px; margin-bottom: 20px; border-radius: 5px; color: white; background-color: {esError ? '#e74c3c' : '#2ecc71'};">
            {mensaje}
        </div>
    {/if}

    <div style="margin-bottom: 20px;">
        <button on:click={cargarIniciales} style="background-color: #3498db; color: white; padding: 10px; border: none; cursor: pointer;">Cargar datos de prueba</button>
        <button on:click={borrarTodos} style="background-color: #c0392b; color: white; padding: 10px; border: none; cursor: pointer;">Borrar TODOS los datos</button>
    </div>

    <div style="background: #f9f9f9; padding: 15px; margin-bottom: 20px; border-radius: 8px;">
        <h3>Añadir nueva estadística</h3>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 10px;">
            <input type="text" placeholder="País" bind:value={nuevoDato.country} />
            <input type="number" placeholder="Año" bind:value={nuevoDato.year} />
            <input type="number" placeholder="Jugadores Activos" bind:value={nuevoDato.active_player_no} />
            <input type="number" placeholder="Espectadores" bind:value={nuevoDato.viewership} />
            <input type="text" placeholder="Género Top" bind:value={nuevoDato.top_genre} />
            <input type="text" placeholder="Plataforma Top" bind:value={nuevoDato.top_platform} />
            <input type="number" placeholder="Nº Torneos" bind:value={nuevoDato.tournament_no} />
            <input type="number" placeholder="Nº Pro Players" bind:value={nuevoDato.pro_player_no} />
            <input type="number" placeholder="Penetración Internet (%)" bind:value={nuevoDato.internet_penetration} />
            <input type="number" placeholder="Nº Compañías" bind:value={nuevoDato.company_no} />
        </div>
        <button on:click={añadirDato} style="background-color: #2ecc71; color: white; padding: 8px 15px; border: none; cursor: pointer;">Añadir Registro</button>
    </div>

    <table style="width: 100%; border-collapse: collapse; text-align: left;">
        <thead>
            <tr style="background-color: #2c3e50; color: white;">
                <th style="padding: 10px; border: 1px solid #ddd;">País</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Año</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Jugadores Act.</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Espectadores</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Género</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Plataforma</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Acciones</th>
            </tr>
        </thead>
        <tbody>
            {#each estadisticas as stat}
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 10px; border: 1px solid #ddd;">{stat.country}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">{stat.year}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">{stat.active_player_no}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">{stat.viewership}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">{stat.top_genre}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;">{stat.top_platform}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">
                        <button on:click={() => borrarDato(stat.country, stat.year)} style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; cursor: pointer; border-radius: 3px;">Borrar</button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>
</main>