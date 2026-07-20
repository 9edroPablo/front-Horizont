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
        const esDashboardGuia = window.location.pathname.includes('dashboard-guia.html');

        if (isRoot) {
            const navInicio = document.getElementById('nav-inicio');
            if (navInicio) navInicio.classList.add('active');
        } else if (esActividades) {
            const navActividades = document.getElementById('nav-actividades');
            if (navActividades) navActividades.classList.add('active');
        } else if (esPerfil || esDashboardGuia) {
            const navPerfil = document.getElementById('nav-perfil');
            if (navPerfil) navPerfil.classList.add('active');
        }

        // ==========================================
        // LÓGICA DE SESIÓN EN EL HEADER (CORREGIDA)
        // ==========================================
        const loggedOutState = document.getElementById('logged-out-state');
        const loggedInState = document.getElementById('logged-in-state');
        
        const actualizarHeader = () => {
            const currentUser = JSON.parse(localStorage.getItem('horizon_user'));
            
            if (currentUser) {
                // 1. Ocultamos el estado de sesión cerrada
                if (loggedOutState) {
                    loggedOutState.classList.add('hidden');
                    loggedOutState.style.display = 'none';
                }
                
                // 2. Mostramos el estado logueado
                if (loggedInState) {
                    loggedInState.classList.remove('hidden');
                    loggedInState.style.display = 'flex';
                }
                
                // === NUEVO: CONTROL DE ENLACES SEGÚN EL ROL ===
                // Buscamos el contenedor o tag <a> que lleva al perfil dentro del estado logueado
                const profileLink = loggedInState.closest('a') || loggedInState.querySelector('a');
                if (profileLink) {
                    if (currentUser.role === 'guide') {
                        profileLink.href = basePath + 'pages/dashboard-guia.html';
                    } else {
                        profileLink.href = basePath + 'pages/perfil.html';
                    }
                }
                
                const userNameSpan = loggedInState.querySelector('.user-name');
                const avatarImg = loggedInState.querySelector('.avatar'); // Cambiado a img/selector correcto
                
                if (userNameSpan) userNameSpan.textContent = currentUser.name;
                
                // === SOLUCIÓN AL BUG VISUAL DEL TEXTO EXTRAÑO ===
                if (avatarImg) {
                    // Si el elemento es un <img> usamos .src, si es un contenedor con foto de fondo usamos style
                    if (avatarImg.tagName === 'IMG') {
                        avatarImg.src = currentUser.avatar;
                    } else {
                        avatarImg.style.backgroundImage = `url('${currentUser.avatar}')`;
                        avatarImg.textContent = ''; // Limpiamos cualquier residuo de texto
                    }
                }
            } else {
                // 3. Si no hay sesión, restauramos estados por defecto
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
            if (e.target.closest('#btn-cerrar-sesion')) {
                localStorage.removeItem('horizon_user'); 
                actualizarHeader(); 
                
                // Si está en áreas privadas, lo echamos al inicio
                if (window.location.pathname.includes('perfil.html') || window.location.pathname.includes('dashboard-guia.html')) {
                    window.location.href = basePath + 'index.html';
                }
            }
        });

    } catch (error) {
        console.error("No se pudo cargar el header.", error);
    }
});