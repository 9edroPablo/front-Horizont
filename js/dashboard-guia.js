document.addEventListener('DOMContentLoaded', async () => {
    
    // --- 1. CONFIGURACIÓN Y NAVEGACIÓN DE PESTAÑAS ---
    const controlesTab = document.querySelectorAll('.tab-control');
    const contenedoresTab = document.querySelectorAll('.tab-wrapper');

    controlesTab.forEach(boton => {
        boton.addEventListener('click', () => {
            controlesTab.forEach(b => b.classList.remove('active'));
            contenedoresTab.forEach(c => c.classList.remove('active'));

            boton.classList.add('active');
            document.getElementById(boton.dataset.tab).classList.add('active');
        });
    });

    // --- 2. SOLICITUD Y CARGA DE DATOS ASÍNCRONOS ---
    try {
        const respuesta = await fetch('../assets/data/guides.json');
        if (!respuesta.ok) throw new Error("No se pudo mapear la base de guías");
        
        const data = await respuesta.json();
        
        // Simulamos la sesión iniciada del guía Carlos Mendoza (ID: 1)
        const guia = data.guides[0];

        // Rellenar Datos Maestros
        document.getElementById('guide-cover').style.backgroundImage = `url('${guia.cover_image}')`;
        document.getElementById('guide-avatar').src = guia.profile_image;
        document.getElementById('guide-badge-title').textContent = guia.title;
        document.getElementById('guide-name').textContent = guia.name;
        document.getElementById('guide-location').textContent = guia.location;
        document.getElementById('guide-rating-summary').textContent = `${guia.rating} (${guia.total_routes} rutas) • ${guia.total_clients.toLocaleString()} clientes atendidos`;

        // Contadores Estadísticos
        document.getElementById('stat-routes').textContent = guia.total_routes;
        document.getElementById('stat-clients').textContent = guia.total_clients.toLocaleString();
        document.getElementById('stat-rating').textContent = guia.rating;
        document.getElementById('stat-years').textContent = guia.years_exp;

        // Biografía y Certificados Fijos
        document.getElementById('guide-bio').textContent = $.bio || guia.bio;
        const listaCerts = document.getElementById('guide-certs');
        listaCerts.innerHTML = guia.certifications.map(cert => `<li>${cert}</li>`).join('');

        // RENDER: Pestaña Rutas Activas
        const contenedorRutas = document.getElementById('lista-rutas-activas');
        contenedorRutas.innerHTML = guia.rutas_activas.map(ruta => `
            <div class="group-card">
                <div class="group-card-top">
                    <div class="group-info">
                        <h4>${ruta.titulo}</h4>
                        <p class="group-meta">🏕️ ${ruta.deporte} • ${ruta.lugar} • 📅 ${ruta.fecha} (${ruta.horario})</p>
                    </div>
                    <span class="group-status-pill ${ruta.estado.toLowerCase().replace(/\s+/g, '.')}">${ruta.estado}</span>
                </div>
                <div class="progress-container">
                    <div class="progress-bar-bg">
                        <div class="progress-bar-fill" style="width: ${ruta.porcentaje}%;"></div>
                    </div>
                    <div class="progress-labels">
                        <span>${ruta.inscritos}/${ruta.cupo_max} inscritos</span>
                        <span>${ruta.porcentaje}% del cupo</span>
                    </div>
                </div>
                <div class="group-actions">
                    <span class="estimated-value">$${ruta.ganancia_estimada} estimado</span>
                    <button class="btn-text-action">Ver lista de participantes</button>
                    <button class="btn-text-action">Gestionar grupo</button>
                    <button class="btn-text-action">Detalles</button>
                </div>
            </div>
        `).join('');

        // RENDER: Pestaña Reseñas de Clientes
        document.getElementById('review-score-big').textContent = guia.rating;
        const contenedorResenas = document.getElementById('lista-resenas');
        contenedorResenas.innerHTML = guia.resenas.map(res => `
            <div class="review-card">
                <div class="review-card-header">
                    <strong>${res.cliente}</strong>
                    <span>${res.fecha}</span>
                </div>
                <div class="review-sub">Clasificación: <span class="stars">${'★'.repeat(res.estrellas)}</span> • ${res.ruta}</div>
                <p>"${res.comentario}"</p>
            </div>
        `).join('');

        // RENDER: Pestaña Finanzas e Ingresos
        document.getElementById('earn-month').textContent = `$${guia.ganancias.mes_actual.toLocaleString()}`;
        document.getElementById('earn-month-sub').textContent = `${guia.ganancias.rutas_completadas_mes} rutas completadas`;
        document.getElementById('earn-total').textContent = `$${guia.ganancias.total_cuatro_meses.toLocaleString()}`;
        document.getElementById('earn-future').textContent = `$${guia.ganancias.proximas_ganancias.toLocaleString()}`;
        document.getElementById('earn-future-sub').textContent = `de ${guia.ganancias.proximas_rutas_cant} rutas programadas`;

        const contenedorDesglose = document.getElementById('lista-desglose-ganancias');
        contenedorDesglose.innerHTML = guia.rutas_activas.map(ruta => `
            <div class="breakdown-row">
                <span class="route-name">🏕️ ${ruta.titulo} (${ruta.fecha})</span>
                <span class="amount">$${ruta.ganancia_estimada} estimado</span>
            </div>
        `).join('');

    } catch (error) {
        console.error("Error inicializando los datos del guía:", error);
    }
});