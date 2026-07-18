document.addEventListener("DOMContentLoaded", () => {
    
    // 1. Buscamos el ID en la URL y el contenedor donde inyectaremos todo
    const parametrosURL = new URLSearchParams(window.location.search);
    const rutaId = parseInt(parametrosURL.get('id'));
    const contenedor = document.getElementById('contenido-dinamico');

    // 2. Si no hay ID en la URL, mostramos mensaje de error
    if (!rutaId) {
        contenedor.innerHTML = `
            <div class="mensaje-estado">
                <h2>Ruta no encontrada</h2>
                <a href="actividades.html" class="enlace-volver">Volver a explorar</a>
            </div>
        `;
        return;
    }

    // 3. Función principal para cargar la base de datos y pintar la interfaz
    const cargarDetalleRuta = async () => {
        try {
            // Hacemos la petición al JSON
            const respuesta = await fetch('../assets/data/eventos.json');
            
            if (!respuesta.ok) {
                throw new Error("No se pudo cargar el archivo JSON");
            }

            const eventos = await respuesta.json();
            
            // Buscamos la ruta que coincida con el ID
            const ruta = eventos.find(e => e.id === rutaId);

            if (!ruta) {
                throw new Error("El ID no existe en la base de datos");
            }

            // ==========================================
            // PREPARAMOS LOS BLOQUES DE HTML DINÁMICOS
            // ==========================================
            
            const htmlItinerario = ruta.itinerario.map(item => `
                <div class="itinerario-item">
                    <div class="iti-hora">${item.hora}</div>
                    <div>
                        <h4 class="iti-titulo">${item.titulo}</h4>
                        <p class="iti-desc">${item.descripcion}</p>
                    </div>
                </div>
            `).join('');

            const htmlIncluye = ruta.incluye.map(item => `
                <li class="item-incluye">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ${item}
                </li>
            `).join('');

            const htmlNoIncluye = ruta.no_incluye.map(item => `
                <li class="item-no-incluye">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    ${item}
                </li>
            `).join('');

            // ==========================================
            // INYECTAMOS EL HTML PRINCIPAL
            // ==========================================
            
            contenedor.innerHTML = `
                <div class="hero-img-container">
                    <img src="${ruta.imagen}" alt="${ruta.titulo}">
                    <div class="hero-badge">
                        ${ruta.categoria} • ${ruta.dificultad}
                    </div>
                </div>

                <div class="detalle-layout">
                    <!-- COLUMNA IZQUIERDA -->
                    <div class="info-principal">
                        <h1 class="ruta-titulo">${ruta.titulo}</h1>
                        
                        <div class="ruta-meta">
                            <span class="meta-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                ${ruta.ubicacion}
                            </span>
                            <span class="meta-item">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                ${ruta.duracion}
                            </span>
                            <span class="meta-item meta-rating">
                                ⭐ ${ruta.calificacion} (${ruta.resenas} reseñas)
                            </span>
                        </div>

                        <div class="seccion-detalle">
                            <h2>Sobre esta ruta</h2>
                            <p class="descripcion-texto">${ruta.descripcion_larga}</p>
                        </div>

                        <!-- NUEVA TARJETA DE GUÍA -->
                        <div class="guia-card-container">
                            <h2>Tu Guía</h2>
                            <div class="guia-perfil">
                                <img src="${ruta.guia.imagen || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(ruta.guia.nombre) + '&background=E5E7EB&color=374151&size=200'}" alt="Foto de ${ruta.guia.nombre}" class="guia-foto">
                                
                                <div class="guia-detalles">
                                    <div class="guia-info-header">
                                        <h3>${ruta.guia.nombre}</h3>
                                        ${ruta.guia.verificado ? `
                                        <span class="badge-verificado">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                            Verificado
                                        </span>` : ''}
                                    </div>
                                    <p class="guia-experiencia">${ruta.guia.experiencia}</p>
                                    
                                    <div class="guia-stats-grid">
                                        <div class="stat-item">
                                            <span class="stat-valor">${ruta.guia.calificacion}</span>
                                            <span class="stat-label">Valoración</span>
                                        </div>
                                        <div class="stat-item">
                                            <span class="stat-valor">${ruta.guia.rutas_guiadas}</span>
                                            <span class="stat-label">Rutas guiadas</span>
                                        </div>
                                    </div>
                                    
                                    <p class="guia-bio-texto">${ruta.guia.bio}</p>
                                </div>
                            </div>
                        </div>

                        <div class="seccion-detalle">
                            <h2>Itinerario del día</h2>
                            <div class="contenedor-itinerario">
                                ${htmlItinerario}
                            </div>
                        </div>

                        <div class="seccion-detalle sin-borde">
                            <div class="lista-inclusiones">
                                <h3>Incluye</h3>
                                <ul class="lista-items">
                                    ${htmlIncluye}
                                </ul>
                            </div>
                            <div class="lista-inclusiones">
                                <h3>No incluye</h3>
                                <ul class="lista-items">
                                    ${htmlNoIncluye}
                                </ul>
                            </div>
                        </div>
                    </div>

                    <!-- COLUMNA DERECHA -->
                    <div>
                        <div class="reserva-card">
                            <div class="reserva-precio-contenedor">
                                <span class="reserva-precio">$${ruta.precio}</span>
                                <span class="reserva-persona">/ persona</span>
                            </div>
                            
                            <div class="reserva-detalles">
                                <div class="reserva-fila">
                                    <span class="reserva-label">Lugares disponibles</span>
                                    <span class="${ruta.lugaresDisponibles > 0 ? 'texto-verde' : 'texto-rojo'}">
                                        ${ruta.lugaresDisponibles > 0 ? ruta.lugaresDisponibles : 'Agotado'}
                                    </span>
                                </div>
                                <div class="reserva-fila">
                                    <span class="reserva-label">Seguro de actividad</span>
                                    <span class="texto-gris">Incluido</span>
                                </div>
                            </div>

                            <button class="btn-reservar" ${ruta.lugaresDisponibles === 0 ? 'disabled' : ''}>
                                ${ruta.lugaresDisponibles > 0 ? 'Reservar ahora' : 'Ruta Agotada'}
                            </button>
                            <p class="reserva-nota">
                                Cancelación gratuita hasta 48h antes
                            </p>
                        </div>
                    </div>
                </div>
            `;

        } catch (error) {
            console.error("Error cargando detalle:", error);
            contenedor.innerHTML = `
                <div class="mensaje-estado">
                    <h2>Ocurrió un error al cargar la ruta.</h2>
                    <p style="color: #6B7280; font-size: 14px; margin-top: 10px;">Intenta volver a Explorar Rutas y selecciona otra vez la tarjeta.</p>
                </div>
            `;
        }
    };

    // 4. Ejecutamos la función
    cargarDetalleRuta();
});