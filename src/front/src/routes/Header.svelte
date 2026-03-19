<script>
    let { title = "SOS2526-30", subtitle = "Panel de Control del Proyecto" } = $props();
</script>

<header>
    <h1>{title}</h1>
    <p class="subtitle">{subtitle}</p>
</header>

<style>
    header {
        text-align: center;
        margin-bottom: 3rem;
    }

    h1 {
        font-size: 3rem;
        color: var(--celeste-800);
        margin-bottom: 0.5rem;
        text-shadow: 2px 2px 4px rgba(2, 132, 199, 0.2);
    }

    .subtitle {
        font-size: 1.2rem;
        color: var(--celeste-600);
        font-weight: 300;
        margin-top: 0;
    }

    @media (max-width: 640px) {
        h1 {
            font-size: 2rem;
        }
    }
</style>