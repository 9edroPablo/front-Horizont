// js/components/actividadModal.js
// Formulario para que el guía publique una actividad nueva.
//
// Hay dos tipos y la diferencia importa:
//   Evento -> se realiza en una zona registrada del guía (idZona)
//   Clase  -> el guía indica la ubicación como texto libre
// Un guía recién registrado no tiene zonas, así que sólo puede
// crear clases hasta que se le asigne una.

const ESTILOS = `
.am-overlay {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(17,24,39,.55);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; overflow-y: auto;
}
.am-modal {
    background: #fff; border-radius: 14px;
    width: 100%; max-width: 520px; padding: 28px;
    box-shadow: 0 20px 45px rgba(0,0,0,.22);
    font-family: 'Montserrat', system-ui, sans-serif;
    max-height: 90vh; overflow-y: auto;
}
.am-modal h3 { margin: 0 0 4px; font-size: 19px; color: #111827; }
.am-modal .am-sub { margin: 0 0 20px; font-size: 13px; color: #6B7280; line-height: 1.45; }
.am-tipos { display: flex; gap: 10px; margin-bottom: 20px; }
.am-tipo {
    flex: 1; padding: 12px 14px; border: 1.5px solid #D1D5DB;
    border-radius: 8px; cursor: pointer; text-align: left;
    background: #fff; font-family: inherit;
}
.am-tipo.activo { border-color: #0F5B46; background: rgba(15,91,70,.05); }
.am-tipo strong { display: block; font-size: 14px; color: #111827; margin-bottom: 2px; }
.am-tipo span { font-size: 11px; color: #6B7280; line-height: 1.3; }
.am-tipo:disabled { opacity: .45; cursor: not-allowed; }
.am-campo { margin-bottom: 15px; }
.am-fila { display: flex; gap: 12px; }
.am-fila .am-campo { flex: 1; }
.am-campo label {
    display: block; font-size: 11px; font-weight: 600;
    letter-spacing: .04em; text-transform: uppercase;
    color: #374151; margin-bottom: 6px;
}
.am-campo input, .am-campo select, .am-campo textarea {
    width: 100%; box-sizing: border-box; padding: 10px 13px;
    border: 1px solid #D1D5DB; border-radius: 8px;
    font-family: inherit; font-size: 14px; color: #111827; background: #fff;
}
.am-campo textarea { min-height: 76px; resize: vertical; }
.am-campo input:focus, .am-campo select:focus, .am-campo textarea:focus {
    outline: none; border-color: #0F5B46; box-shadow: 0 0 0 3px rgba(15,91,70,.12);
}
.am-ayuda { font-size: 11px; color: #9CA3AF; margin-top: 4px; }
.am-error { color: #B91C1C; font-size: 13px; min-height: 18px; margin: 4px 0 8px; }
.am-acciones { display: flex; gap: 10px; }
.am-acciones button {
    flex: 1; padding: 11px; border-radius: 8px; font-size: 14px;
    font-weight: 600; cursor: pointer; font-family: inherit;
    border: 1px solid transparent;
}
.am-cancelar { background: #fff; border-color: #D1D5DB !important; color: #374151; }
.am-guardar { background: #0F5B46; color: #fff; }
.oculto { display: none !important; }
`;

const DURACIONES = ['2 Horas', '3 Horas', '4 Horas', '5 Horas', '6 Horas',
                    'Día Completo', '2 Días', '3 Días'];

const asegurarEstilos = () => {
    if (document.getElementById('am-modal-estilos')) return;
    const tag = document.createElement('style');
    tag.id = 'am-modal-estilos';
    tag.textContent = ESTILOS;
    document.head.appendChild(tag);
};

// Fecha mínima: mañana. Publicar una actividad en el pasado no tiene
// sentido y nadie podría reservarla.
const manana = () => {
    const f = new Date();
    f.setDate(f.getDate() + 1);
    return f.toISOString().slice(0, 10);
};

/**
 * Abre el formulario. Resuelve con los datos capturados y el tipo
 * elegido, o con null si se cancela. No llama al backend.
 *
 * @param actividadExistente  si se pasa, el modal abre en modo edición
 *        precargado con sus datos, y el tipo (evento/clase) queda fijo:
 *        convertir una clase en evento (o viceversa) no tiene sentido,
 *        son tablas distintas en el esquema.
 */
export const crearActividadModal = ({ zonas = [], deportes = [], actividadExistente = null }) => {
    asegurarEstilos();
    const tieneZonas = zonas.length > 0;
    const editando = actividadExistente !== null;
    const tipoFijo = editando ? actividadExistente.tipo : null;

    // Separa la fecha ISO guardada en fecha + hora para los inputs.
    const [fechaPrecargada, horaPrecargada] = editando && actividadExistente.fechaISO
        ? actividadExistente.fechaISO.split('T')
        : [manana(), '08:00'];

    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'am-overlay';
        overlay.innerHTML = `
            <div class="am-modal" role="dialog" aria-modal="true">
                <h3>${editando ? 'Editar actividad' : 'Publicar una actividad'}</h3>
                <p class="am-sub">Los exploradores la verán en el catálogo y podrán reservarla.</p>

                <div class="am-tipos ${editando ? 'oculto' : ''}">
                    <button type="button" class="am-tipo ${tieneZonas ? 'activo' : ''}"
                            data-tipo="evento" ${tieneZonas ? '' : 'disabled'}>
                        <strong>Evento</strong>
                        <span>${tieneZonas ? 'En una de tus zonas registradas' : 'Necesitas una zona asignada'}</span>
                    </button>
                    <button type="button" class="am-tipo ${tieneZonas ? '' : 'activo'}" data-tipo="clase">
                        <strong>Clase</strong>
                        <span>Tú indicas el punto de encuentro</span>
                    </button>
                </div>

                <div class="am-campo">
                    <label for="am-titulo">Título</label>
                    <input type="text" id="am-titulo" placeholder="Ej. Travesía en kayak por el Cañón del Sumidero"
                           value="${editando ? actividadExistente.titulo.replace(/"/g, '&quot;') : ''}">
                </div>

                <div class="am-campo">
                    <label for="am-descripcion">Descripción</label>
                    <textarea id="am-descripcion" placeholder="Qué van a hacer, qué nivel se necesita, qué deben llevar.">${editando ? (actividadExistente.descripcion || '') : ''}</textarea>
                </div>

                <div class="am-fila">
                    <div class="am-campo">
                        <label for="am-deporte">Deporte</label>
                        <select id="am-deporte">
                            ${deportes.map(d =>
                                `<option value="${d.idDeporte}" ${editando && actividadExistente.idDeporte === d.idDeporte ? 'selected' : ''}>${d.tipo}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="am-campo" id="am-campo-zona">
                        <label for="am-zona">Zona</label>
                        <select id="am-zona">
                            ${zonas.map(z =>
                                `<option value="${z.id}" ${editando && actividadExistente.idZona === z.id ? 'selected' : ''}>${z.nombre}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>

                <div class="am-campo ${(editando ? tipoFijo === 'evento' : tieneZonas) ? 'oculto' : ''}" id="am-campo-ubicacion">
                    <label for="am-ubicacion">Punto de encuentro</label>
                    <input type="text" id="am-ubicacion" placeholder="Ej. Embarcadero Cahuaré, Chiapa de Corzo"
                           value="${editando ? (actividadExistente.ubicacion || '') : ''}">
                </div>

                <div class="am-fila">
                    <div class="am-campo">
                        <label for="am-fecha">Fecha</label>
                        <input type="date" id="am-fecha" min="${manana()}" value="${fechaPrecargada}">
                    </div>
                    <div class="am-campo">
                        <label for="am-hora">Hora de inicio</label>
                        <input type="time" id="am-hora" value="${(horaPrecargada || '08:00:00').slice(0, 5)}">
                    </div>
                </div>

                <div class="am-fila">
                    <div class="am-campo">
                        <label for="am-duracion">Duración</label>
                        <select id="am-duracion">
                            ${DURACIONES.map(d =>
                                `<option value="${d}" ${editando && actividadExistente.duracion === d ? 'selected' : ''}>${d}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="am-campo">
                        <label for="am-precio">Precio por persona</label>
                        <input type="number" id="am-precio" min="0" step="10" placeholder="850"
                               value="${editando ? actividadExistente.precio : ''}">
                    </div>
                    <div class="am-campo">
                        <label for="am-capacidad">Cupo</label>
                        <input type="number" id="am-capacidad" min="1" max="100"
                               value="${editando ? actividadExistente.capacidad : 10}">
                    </div>
                </div>

                <div class="am-campo">
                    <label for="am-foto">Imagen (URL)</label>
                    <input type="url" id="am-foto" placeholder="https://..."
                           value="${editando ? (actividadExistente.fotoUrl || '') : ''}">
                    <div class="am-ayuda">La subida de archivos aún no está disponible: por ahora se usa un enlace.</div>
                </div>

                <div class="am-error"></div>

                <div class="am-acciones">
                    <button type="button" class="am-cancelar">Cancelar</button>
                    <button type="button" class="am-guardar">${editando ? 'Guardar cambios' : 'Publicar actividad'}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const campoZona = overlay.querySelector('#am-campo-zona');
        const campoUbicacion = overlay.querySelector('#am-campo-ubicacion');
        const error = overlay.querySelector('.am-error');

        let tipo = editando ? tipoFijo : (tieneZonas ? 'evento' : 'clase');

        if (editando) {
            campoZona.classList.toggle('oculto', tipo === 'clase');
        } else {
            overlay.querySelectorAll('.am-tipo').forEach(boton => {
                boton.addEventListener('click', () => {
                    if (boton.disabled) return;
                    overlay.querySelectorAll('.am-tipo').forEach(b => b.classList.remove('activo'));
                    boton.classList.add('activo');
                    tipo = boton.dataset.tipo;

                    // Un evento vive en una zona; una clase, en un lugar libre.
                    campoZona.classList.toggle('oculto', tipo === 'clase');
                    campoUbicacion.classList.toggle('oculto', tipo === 'evento');
                });
            });
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
        overlay.querySelector('.am-cancelar').addEventListener('click', () => cerrar(null));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cerrar(null);
        });

        overlay.querySelector('.am-guardar').addEventListener('click', () => {
            const valor = (id) => overlay.querySelector(id).value.trim();

            const titulo = valor('#am-titulo');
            const descripcion = valor('#am-descripcion');
            const fecha = valor('#am-fecha');
            const hora = valor('#am-hora');
            const precio = valor('#am-precio');
            const capacidad = valor('#am-capacidad');
            const foto = valor('#am-foto');
            const ubicacion = valor('#am-ubicacion');

            if (titulo.length < 8) {
                error.textContent = 'El título debe describir la actividad (mínimo 8 caracteres).';
                return;
            }
            if (!fecha || !hora) {
                error.textContent = 'Indica la fecha y la hora de inicio.';
                return;
            }
            if (new Date(`${fecha}T${hora}`) <= new Date()) {
                error.textContent = 'La actividad debe programarse a futuro.';
                return;
            }
            if (precio === '' || Number(precio) < 0) {
                error.textContent = 'Indica el precio por persona.';
                return;
            }
            if (Number(capacidad) < 1) {
                error.textContent = 'El cupo debe ser de al menos una persona.';
                return;
            }
            if (tipo === 'clase' && ubicacion === '') {
                error.textContent = 'Indica el punto de encuentro.';
                return;
            }
            if (foto && !foto.startsWith('http')) {
                error.textContent = 'La imagen debe ser un enlace que empiece con http.';
                return;
            }

            cerrar({
                tipo,
                id: editando ? actividadExistente.id : null,
                datos: {
                    titulo,
                    descripcion: descripcion || null,
                    idDeporte: Number(overlay.querySelector('#am-deporte').value),
                    idZona: tipo === 'evento' ? Number(overlay.querySelector('#am-zona').value) : null,
                    ubicacion: tipo === 'clase' ? ubicacion : null,
                    // El backend espera LocalDateTime: "2026-08-15T07:00:00"
                    fecha: `${fecha}T${hora}:00`,
                    duracion: overlay.querySelector('#am-duracion').value,
                    precio: Number(precio),
                    capacidad: Number(capacidad),
                    fotoUrl: foto || null
                }
            });
        });
    });
};
