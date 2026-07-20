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
        // LÓGICA DE SESIÓN EN EL HEADER
        // ==========================================
        const loggedOutState = document.getElementById('logged-out-state');
        const loggedInState = document.getElementById('logged-in-state');

        // Pinta el avatar: usa la foto real si el backend la mandó,
        // y si no, muestra las iniciales sobre el círculo verde.
        const pintarAvatar = (elemento, usuario) => {
            if (!elemento) return;

            const tieneFoto = usuario.fotoUrl && usuario.fotoUrl.startsWith('http');

            if (elemento.tagName === 'IMG') {
                // Si algún día el avatar pasa a ser <img>
                elemento.src = tieneFoto
                    ? usuario.fotoUrl
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.name)}&background=0f5b46&color=fff`;
                elemento.alt = usuario.name;
                return;
            }

            if (tieneFoto) {
                // Es un <div>: la foto va como fondo
                elemento.style.backgroundImage = `url('${usuario.fotoUrl}')`;
                elemento.style.backgroundSize = 'cover';
                elemento.style.backgroundPosition = 'center';
                elemento.textContent = '';
            } else {
                // Sin foto: iniciales sobre el círculo verde
                elemento.style.backgroundImage = 'none';
                elemento.textContent = usuario.avatar || '';
            }
        };

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

                // 3. El enlace del perfil cambia según el rol
                const profileLink = loggedInState.closest('a') || loggedInState.querySelector('a');
                if (profileLink) {
                    profileLink.href = currentUser.role === 'guide'
                        ? basePath + 'pages/dashboard-guia.html'
                        : basePath + 'pages/perfil.html';
                }

                // 4. Nombre y avatar
                const userNameSpan = loggedInState.querySelector('.user-name');
                if (userNameSpan) userNameSpan.textContent = currentUser.name;

                pintarAvatar(loggedInState.querySelector('.avatar'), currentUser);

            } else {
                // 5. Sin sesión: restauramos estados por defecto
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

                if (window.location.pathname.includes('perfil.html') ||
                    window.location.pathname.includes('dashboard-guia.html')) {
                    window.location.href = basePath + 'index.html';
                }
            }
        });

    } catch (error) {
        console.error("No se pudo cargar el header.", error);
    }
});