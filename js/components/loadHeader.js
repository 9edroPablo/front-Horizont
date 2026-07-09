document.addEventListener("DOMContentLoaded", async () => {
    const isRoot = !window.location.pathname.includes('/pages/');
    const basePath = isRoot ? '' : '../';
    const headerPath = basePath + 'pages/Components/header.html';

    try {
        const response = await fetch(headerPath);
        const html = await response.text();
        
        const headerContainer = document.getElementById('componente-header');
        if (headerContainer) {
            headerContainer.innerHTML = html;
        }

        const enlaces = headerContainer.querySelectorAll('a[data-href]');
        enlaces.forEach(enlace => {
            const ruta = enlace.getAttribute('data-href');
            enlace.href = basePath + ruta;
        });

        const esActividades = window.location.pathname.includes('actividades.html');
        const esPerfil = window.location.pathname.includes('perfil.html');

        if (isRoot) {
            const navInicio = document.getElementById('nav-inicio');
            if (navInicio) navInicio.classList.add('active');
        } else if (esActividades) {
            const navActividades = document.getElementById('nav-actividades');
            if (navActividades) navActividades.classList.add('active');
        } else if (esPerfil) {
            const navPerfil = document.getElementById('nav-perfil');
            if (navPerfil) navPerfil.classList.add('active');
        }

        // ==========================================
        // LÓGICA DE SESIÓN EN EL HEADER
        // ==========================================
        // ==========================================
        // LÓGICA DE SESIÓN EN EL HEADER
        // ==========================================
        const loggedOutState = document.getElementById('logged-out-state');
        const loggedInState = document.getElementById('logged-in-state');
        
        const actualizarHeader = () => {
            const currentUser = JSON.parse(localStorage.getItem('horizon_user'));
            
            if (currentUser) {
                // 1. Ocultamos el botón de iniciar sesión
                if (loggedOutState) {
                    loggedOutState.classList.add('hidden');
                    loggedOutState.style.display = 'none';
                }
                
                // 2. Mostramos el perfil (quitando la clase hidden y forzando flex)
                if (loggedInState) {
                    loggedInState.classList.remove('hidden');
                    loggedInState.style.display = 'flex';
                }
                
                const userNameSpan = loggedInState.querySelector('.user-name');
                const avatarSpan = loggedInState.querySelector('.avatar');
                
                if (userNameSpan) userNameSpan.textContent = currentUser.name;
                if (avatarSpan) avatarSpan.textContent = currentUser.avatar;
            } else {
                // 3. Si no hay sesión, regresamos el botón y ocultamos el perfil
                if (loggedOutState) {
                    loggedOutState.classList.remove('hidden');
                    loggedOutState.style.display = 'block';
                }
                if (loggedInState) {
                    loggedInState.classList.add('hidden');
                    loggedInState.style.display = 'none';
                }
            }
        };

        actualizarHeader();
        window.actualizarHeaderUI = actualizarHeader;

        // Escuchador global para cualquier botón de cerrar sesión
        document.addEventListener('click', (e) => {
            // Buscamos si el elemento clicado tiene el ID btn-cerrar-sesion
            if (e.target.closest('#btn-cerrar-sesion')) {
                localStorage.removeItem('horizon_user'); 
                actualizarHeader(); 
                
                // Si está en el perfil, lo mandamos al inicio
                if (window.location.pathname.includes('perfil.html')) {
                    window.location.href = basePath + 'index.html';
                }
            }
        });

    } catch (error) {
        console.error("No se pudo cargar el header.", error);
    }
});