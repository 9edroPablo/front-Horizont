// js/components/zonaModal.js
// Formulario para que un guía registre una zona nueva: un lugar del
// mapa donde podrá programar eventos.
//
// Incluye un mapa para elegir las coordenadas con un clic. Escribir
// latitud y longitud a mano es la forma más fácil de acabar con un pin
// en medio del Atlántico sin darse cuenta.

const ESTILOS = `
.zm-overlay {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(17,24,39,.55);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; overflow-y: auto;
}
.zm-modal {
    background: #fff; border-radius: 14px;
    width: 100%; max-width: 520px; padding: 28px;
    box-shadow: 0 20px 45px rgba(0,0,0,.22);
    font-family: 'Montserrat', system-ui, sans-serif;
    max-height: 90vh; overflow-y: auto;
}
.zm-modal h3 { margin: 0 0 4px; font-size: 19px; color: #111827; }
.zm-modal .zm-sub { margin: 0 0 20px; font-size: 13px; color: #6B7280; line-height: 1.45; }
.zm-campo { margin-bottom: 15px; }
.zm-fila { display: flex; gap: 12px; }
.zm-fila .zm-campo { flex: 1; }
.zm-campo label {
    display: block; font-size: 11px; font-weight: 600;
    letter-spacing: .04em; text-transform: uppercase;
    color: #374151; margin-bottom: 6px;
}
.zm-campo input, .zm-campo select, .zm-campo textarea {
    width: 100%; box-sizing: border-box; padding: 10px 13px;
    border: 1px solid #D1D5DB; border-radius: 8px;
    font-family: inherit; font-size: 14px; color: #111827; background: #fff;
}
.zm-campo textarea { min-height: 70px; resize: vertical; }
.zm-campo input:focus, .zm-campo select:focus, .zm-campo textarea:focus {
    outline: none; border-color: #0F5B46; box-shadow: 0 0 0 3px rgba(15,91,70,.12);
}
.zm-mapa {
    height: 220px; border-radius: 8px; border: 1px solid #D1D5DB;
    margin-bottom: 6px; background: #F3F4F6;
}
.zm-ayuda { font-size: 11px; color: #9CA3AF; margin-top: 4px; }
.zm-coords { font-size: 12px; color: #374151; font-weight: 600; }
.zm-error { color: #B91C1C; font-size: 13px; min-height: 18px; margin: 4px 0 8px; }
.zm-acciones { display: flex; gap: 10px; }
.zm-acciones button {
    flex: 1; padding: 11px; border-radius: 8px; font-size: 14px;
    font-weight: 600; cursor: pointer; font-family: inherit;
    border: 1px solid transparent;
}
.zm-cancelar { background: #fff; border-color: #D1D5DB !important; color: #374151; }
.zm-guardar { background: #0F5B46; color: #fff; }
`;

const DIFICULTADES = [
    ['FACIL', 'Fácil'],
    ['MEDIO', 'Medio'],
    ['DIFICIL', 'Difícil']
];

// Centro aproximado de Chiapas, que es donde opera la plataforma.
const CENTRO = [16.5, -92.8];

const asegurarEstilos = () => {
    if (document.getElementById('zm-modal-estilos')) return;
    const tag = document.createElement('style');
    tag.id = 'zm-modal-estilos';
    tag.textContent = ESTILOS;
    document.head.appendChild(tag);
};

// El panel del guía no carga Leaflet: sólo lo necesita este modal,
// así que se descarga la primera vez que se abre en vez de lastrar
// la carga de toda la página.
const asegurarLeaflet = () => new Promise((resolve, reject) => {
    if (window.L) return resolve();

    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(css);

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar el mapa.'));
    document.head.appendChild(script);
});

/**
 * @param zona      datos actuales si se está editando; vacío si es nueva
 * @param deportes  catálogo para el selector
 * Resuelve con los datos capturados, o con null si se cancela.
 */
export const editarZonaModal = async ({ zona = {}, deportes = [] }) => {
    asegurarEstilos();

    const esNueva = !zona.id;
    let lat = zona.lat ?? null;
    let lng = zona.lng ?? null;

    return new Promise(async (resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'zm-overlay';
        overlay.innerHTML = `
            <div class="zm-modal" role="dialog" aria-modal="true">
                <h3>${esNueva ? 'Registrar una zona' : 'Editar zona'}</h3>
                <p class="zm-sub">Las zonas son los lugares donde ofreces tus rutas. Aparecen como pines en el mapa de la portada.</p>

                <div class="zm-campo">
                    <label for="zm-nombre">Nombre de la zona</label>
                    <input type="text" id="zm-nombre" placeholder="Ej. Cañón del Sumidero"
                           value="${(zona.nombre || '').replace(/"/g, '&quot;')}">
                </div>

                <div class="zm-campo">
                    <label for="zm-ubicacion">Municipio o referencia</label>
                    <input type="text" id="zm-ubicacion" placeholder="Ej. Chiapa de Corzo, Chiapas"
                           value="${(zona.ubicacion || '').replace(/"/g, '&quot;')}">
                </div>

                <div class="zm-fila">
                    <div class="zm-campo">
                        <label for="zm-deporte">Deporte principal</label>
                        <select id="zm-deporte">
                            ${deportes.map(d =>
                                `<option value="${d.idDeporte}" ${zona.idDeporte === d.idDeporte ? 'selected' : ''}>${d.tipo}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="zm-campo">
                        <label for="zm-dificultad">Dificultad</label>
                        <select id="zm-dificultad">
                            ${DIFICULTADES.map(([v, t]) =>
                                `<option value="${v}" ${(zona.dificultad || '').toUpperCase() === v ? 'selected' : ''}>${t}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>

                <div class="zm-campo">
                    <label for="zm-descripcion">Descripción</label>
                    <textarea id="zm-descripcion" placeholder="Qué hace especial a este lugar.">${zona.descripcion || ''}</textarea>
                </div>

                <div class="zm-campo">
                    <label>Ubicación en el mapa</label>
                    <div class="zm-mapa" id="zm-mapa"></div>
                    <div class="zm-ayuda">
                        Toca el mapa para colocar el pin.
                        <span class="zm-coords" id="zm-coords">${lat !== null ? `${lat}, ${lng}` : 'Sin ubicación'}</span>
                    </div>
                </div>

                <div class="zm-error"></div>

                <div class="zm-acciones">
                    <button type="button" class="zm-cancelar">Cancelar</button>
                    <button type="button" class="zm-guardar">${esNueva ? 'Registrar zona' : 'Guardar cambios'}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const error = overlay.querySelector('.zm-error');
        const coords = overlay.querySelector('#zm-coords');

        // El mapa se monta después de insertar el modal: Leaflet necesita
        // que su contenedor ya tenga altura en pantalla.
        try {
            await asegurarLeaflet();

            const mapa = L.map('zm-mapa').setView(lat !== null ? [lat, lng] : CENTRO, lat !== null ? 12 : 8);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap', maxZoom: 18
            }).addTo(mapa);

            let pin = lat !== null ? L.marker([lat, lng]).addTo(mapa) : null;

            mapa.on('click', (e) => {
                lat = Number(e.latlng.lat.toFixed(7));
                lng = Number(e.latlng.lng.toFixed(7));
                if (pin) pin.setLatLng(e.latlng);
                else pin = L.marker(e.latlng).addTo(mapa);
                coords.textContent = `${lat}, ${lng}`;
                error.textContent = '';
            });

            // Sin esto el mapa se dibuja recortado dentro del modal.
            setTimeout(() => mapa.invalidateSize(), 120);

        } catch {
            overlay.querySelector('#zm-mapa').innerHTML =
                '<p style="padding:16px; color:#6B7280; font-size:13px;">No se pudo cargar el mapa. Revisa tu conexión.</p>';
        }

        const cerrar = (resultado) => {
            document.removeEventListener('keydown', alPresionarTecla);
            overlay.remove();
            resolve(resultado);
        };

        const alPresionarTecla = (e) => {
            if (e.key === 'Escape') cerrar(null);
        };

        document.addEventListener('keydown', alPresionarTecla);
        overlay.querySelector('.zm-cancelar').addEventListener('click', () => cerrar(null));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cerrar(null);
        });

        overlay.querySelector('.zm-guardar').addEventListener('click', () => {
            const nombre = overlay.querySelector('#zm-nombre').value.trim();
            const ubicacion = overlay.querySelector('#zm-ubicacion').value.trim();
            const descripcion = overlay.querySelector('#zm-descripcion').value.trim();

            if (nombre.length < 4) {
                error.textContent = 'Escribe el nombre de la zona.';
                return;
            }
            if (ubicacion === '') {
                error.textContent = 'Indica el municipio o una referencia.';
                return;
            }
            if (lat === null || lng === null) {
                error.textContent = 'Toca el mapa para marcar dónde está la zona.';
                return;
            }

            cerrar({
                nombre,
                ubicacion,
                descripcion: descripcion || null,
                idDeporte: Number(overlay.querySelector('#zm-deporte').value),
                nivelDificultad: overlay.querySelector('#zm-dificultad').value,
                latitud: lat,
                longitud: lng
            });
        });
    });
};
