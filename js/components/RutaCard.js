// js/components/RutaCard.js
// Plantilla única de tarjeta. La usan index.html y pages/actividades.html.

// La ruta al detalle cambia según desde dónde se renderice la tarjeta.
// El tipo (evento/clase) viaja en la URL porque comparten el mismo id
// autoincremental y ruta-detalle.js necesita saber a cuál API pedirle.
const rutaDetalle = (id, tipo = 'evento') => {
    const enPages = window.location.pathname.includes('/pages/');
    return `${enPages ? '' : 'pages/'}ruta-detalle.html?id=${id}&tipo=${tipo}`;
};

export const crearRutaCard = (ruta) => {
    // La calificación no existe para todos los eventos: si no hay,
    // se omite el bloque en vez de imprimir "null (null)".
    const bloqueCalificacion = ruta.calificacion
        ? `<div class="meta-item">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="#F59E0B" stroke="#F59E0B" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
               <span>${ruta.calificacion}${ruta.resenas ? ` (${ruta.resenas})` : ''}</span>
           </div>`
        : '';

    return `
    <a href="${rutaDetalle(ruta.id, ruta.tipo)}" class="ruta-card">
        <!-- Imagen y Etiquetas -->
        <div class="ruta-img-wrapper">
            <img src="${ruta.imagen}" alt="${ruta.titulo}">
            <div class="ruta-badges">
                <span class="badge badge-cat">${ruta.categoria}</span>
                ${ruta.dificultad ? `<span class="badge badge-dif">${ruta.dificultad}</span>` : ''}
            </div>
        </div>

        <!-- Información -->
        <div class="ruta-info">
            <h3 class="ruta-titulo">${ruta.titulo}</h3>

            <div class="ruta-meta">
                <!-- Fila Ubicación -->
                <div class="meta-line">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                    <span>${ruta.ubicacion || 'Chiapas, México'}</span>
                </div>

                <!-- Fila Tiempo y Rating -->
                <div class="meta-line inline-meta">
                    <div class="meta-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7280" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                        <span>${ruta.duracion}</span>
                    </div>
                    ${bloqueCalificacion}
                </div>
            </div>

            <!-- Línea separadora y Precios -->
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
    `;
};
