document.addEventListener("DOMContentLoaded", async () => {
    const isRoot = !window.location.pathname.includes('/pages/');
    const basePath = isRoot ? '' : '../';
    const footerPath = basePath + 'pages/Components/footer.html';

    try {
        const response = await fetch(footerPath);
        const html = await response.text();

        const footerContainer = document.getElementById('componente-footer');
        if (!footerContainer) return;

        footerContainer.innerHTML = html;

        const enlaces = footerContainer.querySelectorAll('a[data-href]');
        enlaces.forEach(enlace => {
            const ruta = enlace.getAttribute('data-href');
            enlace.href = basePath + ruta;
        });

        const anioSpan = document.getElementById('footer-anio');
        if (anioSpan) anioSpan.textContent = new Date().getFullYear();

        // Enlaces que todavía no tienen una página real detrás (redes
        // sociales, Comunidad, Normas de Seguridad, etc.): en vez de no
        // hacer nada al hacer clic, se avisa que está en construcción.
        const avisar = (mensaje) => {
            const existente = document.getElementById('footer-toast');
            if (existente) existente.remove();

            const toast = document.createElement('div');
            toast.id = 'footer-toast';
            toast.textContent = mensaje;
            toast.style.cssText = `
                position: fixed; left: 50%; bottom: 30px; transform: translateX(-50%);
                background: #0F172A; color: #FFFFFF; padding: 12px 22px;
                border-radius: 999px; font-family: 'Montserrat', sans-serif;
                font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.25); z-index: 9999;
                opacity: 0; transition: opacity 0.2s ease;
            `;
            document.body.appendChild(toast);
            requestAnimationFrame(() => { toast.style.opacity = '1'; });

            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 2200);
        };

        footerContainer.querySelectorAll('a[href="#"]').forEach(enlace => {
            enlace.addEventListener('click', (e) => {
                e.preventDefault();
                avisar('Esta sección está en construcción.');
            });
        });

    } catch (error) {
        console.error("No se pudo cargar el footer.", error);
    }
});
