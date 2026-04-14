<script>
    let { title = "SOS2526-30"} = $props();
</script>

<header>
    <h1>{title}</h1>
    <nav>
        <a href="/">Inicio</a>
        <a href="/about">Acerca de</a>
        <a href="/analytics">Analytics</a>
    </nav>
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

    nav {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin-top: 0.5rem;
    }

    nav a {
        color: var(--celeste-600);
        text-decoration: none;
        font-weight: 500;
        padding: 0.3rem 0.8rem;
        border-radius: 16px;
        transition: all 0.2s ease;
    }

    nav a:hover {
        background-color: var(--celeste-100);
        color: var(--celeste-800);
        text-decoration: none;
    }

    @media (max-width: 640px) {
        h1 {
            font-size: 2rem;
        }
        
        nav {
            gap: 1rem;
        }
        
        nav a {
            padding: 0.2rem 0.5rem;
            font-size: 0.9rem;
        }
    }
</style>