// Ya no usamos DOMContentLoaded porque el script es un "module" y el HTML ya está cargado.

const inicializarActividades = async () => {
    console.log("1. El script actividades.js ha arrancado.");

    // Usamos el ID exacto que tienes en tu HTML
    const contenedor = document.getElementById('grid-todas-rutas');

    if (!contenedor) {
        console.error("2. ERROR: No se encontró el contenedor en el HTML.");
        return;
    }
    console.log("2. Contenedor HTML encontrado con éxito.");

    try {
        console.log("3. Intentando obtener el archivo JSON...");
        // Veo en tu captura que tienes eventos.json y rutas.json. 
        // Si tus datos están en rutas.json, cambia la palabra aquí abajo:
        const respuesta = await fetch('../assets/data/eventos.json'); 
        
        if (!respuesta.ok) {
            console.error("ERROR: No se pudo leer el archivo JSON. Código de estado:", respuesta.status);
            return;
        }

        const eventos = await respuesta.json();
        console.log("4. JSON cargado correctamente. Cantidad de rutas:", eventos.length);

        contenedor.innerHTML = eventos.map(ruta => `
            <a href="ruta-detalle.html?id=${ruta.id}" class="ruta-card">
                <div class="ruta-img-wrapper">
                    <img src="${ruta.imagen}" alt="${ruta.titulo}">
                    <div class="ruta-badges">
                        <span class="badge badge-cat">${ruta.categoria}</span>
                        <span class="badge badge-dif">${ruta.dificultad}</span>
                    </div>
                </div>
                
                <div class="ruta-info">
                    <h3 class="ruta-titulo">${ruta.titulo}</h3>
                    
                    <div class="ruta-meta">
                        <div class="meta-line">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                            <span>${ruta.ubicacion}</span>
                        </div>
                        
                        <div class="meta-line inline-meta">
                            <div class="meta-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                <span>${ruta.duracion}</span>
                            </div>
                            <div class="meta-item">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                <span>${ruta.calificacion} (${ruta.resenas})</span>
                            </div>
                        </div>
                    </div>

                    <div class="ruta-footer">
                        <div class="precio-caja">
                            <span class="precio-monto">$${ruta.precio}</span>
                            <span class="precio-label">/ persona</span>
                        </div>
                        <div class="lugares-pill ${ruta.lugaresDisponibles === 0 ? 'agotado' : ''}">
                            ${ruta.lugaresDisponibles > 0 ? ruta.lugaresDisponibles + ' lugares' : 'Agotado'}
                        </div>
                    </div>
                </div>
            </a>
        `).join('');
        
        console.log("5. ¡Éxito! Tarjetas inyectadas en la pantalla.");

    } catch (error) {
        console.error('Error crítico al cargar las rutas:', error);
    }
};

// Arrancamos la función
inicializarActividades();