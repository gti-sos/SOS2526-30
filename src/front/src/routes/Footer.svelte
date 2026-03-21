<script>
    let { text = "Proyecto SOS 2025-26 - Grupo 30" } = $props();
</script>

<footer>
    <p>{text}</p>
</footer>

<style>
    footer {
        text-align: center;
        margin-top: 3rem;
        padding-top: 1.5rem;
        border-top: 2px solid var(--celeste-200);
        color: var(--celeste-600);
    }

    footer p {
        margin: 0;
        font-size: 0.9rem;
    }
</style>