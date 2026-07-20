document.addEventListener('DOMContentLoaded', async () => {
    
    // --- 1. LÓGICA DE LAS PESTAÑAS ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Quitar clase active de todos los botones y contenidos
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Añadir clase active al botón clickeado y su contenedor correspondiente
            btn.classList.add('active');
            document.getElementById(btn.dataset.target).classList.add('active');
        });
    });

    // --- 2. CARGAR DATOS DEL USUARIO ---
    try {
        const respuesta = await fetch('../assets/data/users.json');
        const data = await respuesta.json();
        
        // Recuperamos el usuario de la sesión actual
        const sessionActual = localStorage.getItem('horizon_user');
        
        // Si no hay sesión, lo devolvemos al inicio por seguridad
        if (!sessionActual) {
            window.location.href = '../index.html';
            return; 
        }

        const usuarioLogueado = JSON.parse(sessionActual);

        // Buscamos en el JSON al usuario que coincida con el email logueado
        const usuario = data.users.find(u => u.email === usuarioLogueado.email);

        // Si por alguna razón no existe en el JSON, mostramos un error
        if (!usuario) {
            console.error("Usuario no encontrado en la base de datos.");
            return;
        }

        // Poblar datos de cabecera
        document.getElementById('cover-img').style.backgroundImage = `url('${usuario.cover_image}')`;
        document.getElementById('user-avatar').src = usuario.profile_image;
        document.getElementById('user-name').textContent = usuario.name;
        document.getElementById('user-handle').textContent = usuario.username;
        document.getElementById('user-location').textContent = usuario.location;
        document.getElementById('user-bio').textContent = usuario.bio;
        
        document.getElementById('stat-rutas').textContent = usuario.stats.rutas;
        document.getElementById('stat-guias').textContent = usuario.stats.guias;
        document.getElementById('stat-resenas').textContent = usuario.stats.resenas;

        // Dibujar Badges
        const contenedorBadges = document.getElementById('user-badges');
        contenedorBadges.innerHTML = usuario.badges.map(badge => `
            <span class="badge-item">🏅 ${badge}</span>
        `).join('');

        // Dibujar Reservas
        const listaReservas = document.getElementById('lista-reservas');
        listaReservas.innerHTML = usuario.reservas.map(res => `
            <div class="list-item-card">
                <div class="item-main-info">
                    <h4>${res.titulo}</h4>
                    <p class="item-meta">🏕️ ${res.tipo} • ${res.fecha} • Guía: ${res.guia}</p>
                </div>
                <div class="item-actions">
                    <span class="item-price">$${res.precio}</span>
                    <span class="status-badge ${res.estado.toLowerCase()}">${res.estado}</span>
                </div>
            </div>
        `).join('');

        // Dibujar Historial
        const listaHistorial = document.getElementById('lista-historial');
        listaHistorial.innerHTML = usuario.historial.map(hist => `
            <div class="list-item-card">
                <div class="item-main-info">
                    <h4>${hist.titulo}</h4>
                    <p class="item-meta">🏕️ ${hist.tipo} • ${hist.fecha}</p>
                </div>
                <div class="item-actions">
                    <button class="btn-ghost" style="margin: 0;">${hist.estado_resena}</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error("Error cargando la información del perfil:", error);
    }

    // --- 3. LÓGICA DE CERRAR SESIÓN ---
    const btnCerrarSesion = document.getElementById('btn-cerrar-sesion');
    if (btnCerrarSesion) {
        btnCerrarSesion.addEventListener('click', () => {
            // Eliminar la sesión del almacenamiento local
            localStorage.removeItem('horizon_user');
            
            // Redireccionar al index
            window.location.href = '../index.html';
        });
    }
});