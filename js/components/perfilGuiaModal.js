// js/components/perfilGuiaModal.js
// Formulario para completar o editar el perfil público del guía.
// Sólo incluye los campos que la base de datos puede guardar hoy:
// especialidad, años de experiencia, biografía y foto (por URL).

const ESTILOS = `
.pg-overlay {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(17, 24, 39, .55);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; overflow-y: auto;
}
.pg-modal {
    background: #fff; border-radius: 14px;
    width: 100%; max-width: 480px; padding: 28px;
    box-shadow: 0 20px 45px rgba(0,0,0,.22);
    font-family: 'Montserrat', system-ui, sans-serif;
    max-height: 90vh; overflow-y: auto;
}
.pg-modal h3 { margin: 0 0 4px; font-size: 19px; color: #111827; }
.pg-modal .pg-sub { margin: 0 0 22px; font-size: 13px; color: #6B7280; line-height: 1.45; }
.pg-campo { margin-bottom: 16px; }
.pg-campo label {
    display: block; font-size: 11px; font-weight: 600;
    letter-spacing: .04em; text-transform: uppercase;
    color: #374151; margin-bottom: 6px;
}
.pg-campo input, .pg-campo textarea, .pg-campo select {
    width: 100%; box-sizing: border-box; padding: 10px 13px;
    border: 1px solid #D1D5DB; border-radius: 8px;
    font-family: inherit; font-size: 14px; color: #111827;
}
.pg-campo textarea { min-height: 96px; resize: vertical; }
.pg-campo input:focus, .pg-campo textarea:focus, .pg-campo select:focus {
    outline: none; border-color: #0F5B46;
    box-shadow: 0 0 0 3px rgba(15,91,70,.12);
}
.pg-ayuda { font-size: 11px; color: #9CA3AF; margin-top: 4px; }
.pg-error { color: #B91C1C; font-size: 13px; min-height: 18px; margin-top: 4px; }
.pg-acciones { display: flex; gap: 10px; margin-top: 8px; }
.pg-acciones button {
    flex: 1; padding: 11px; border-radius: 8px; font-size: 14px;
    font-weight: 600; cursor: pointer; font-family: inherit;
    border: 1px solid transparent;
}
.pg-cancelar { background: #fff; border-color: #D1D5DB !important; color: #374151; }
.pg-guardar { background: #0F5B46; color: #fff; }
.pg-guardar:disabled { opacity: .55; cursor: not-allowed; }
`;

// Sugerencias alineadas con los deportes del catálogo.
const ESPECIALIDADES = [
    'Alta montaña y senderismo',
    'Escalada en roca',
    'Kayak y deportes acuáticos',
    'Pesca deportiva',
    'Espeleología',
    'Ciclismo de montaña'
];

const asegurarEstilos = () => {
    if (document.getElementById('pg-modal-estilos')) return;
    const tag = document.createElement('style');
    tag.id = 'pg-modal-estilos';
    tag.textContent = ESTILOS;
    document.head.appendChild(tag);
};

/**
 * Abre el formulario con los datos actuales del guía.
 * Resuelve con los campos editados, o con null si se cancela.
 * No habla con el backend: quien llama decide qué hacer con el resultado.
 */
export const editarPerfilGuia = (guia = {}) => {
    asegurarEstilos();

    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'pg-overlay';
        overlay.innerHTML = `
            <div class="pg-modal" role="dialog" aria-modal="true">
                <h3>Tu perfil público</h3>
                <p class="pg-sub">Esto es lo que ven los exploradores al abrir una de tus actividades.</p>

                <div class="pg-campo">
                    <label for="pg-especialidad">Especialidad</label>
                    <input list="pg-especialidades" id="pg-especialidad"
                           placeholder="Ej. Alta montaña y senderismo"
                           value="${(guia.especialidad || '').replace(/"/g, '&quot;')}">
                    <datalist id="pg-especialidades">
                        ${ESPECIALIDADES.map(e => `<option value="${e}">`).join('')}
                    </datalist>
                </div>

                <div class="pg-campo">
                    <label for="pg-anios">Años de experiencia</label>
                    <input type="number" id="pg-anios" min="0" max="70"
                           value="${guia.experienciaAnios ?? ''}">
                </div>

                <div class="pg-campo">
                    <label for="pg-bio">Biografía profesional</label>
                    <textarea id="pg-bio" placeholder="Cuenta tu trayectoria, tu relación con la naturaleza y qué te distingue como guía.">${guia.descripcion || ''}</textarea>
                    <div class="pg-ayuda">Mínimo 60 caracteres.</div>
                </div>

                <div class="pg-campo">
                    <label for="pg-foto">Foto de perfil (URL)</label>
                    <input type="url" id="pg-foto" placeholder="https://..."
                           value="${(guia.fotoUrl || '').replace(/"/g, '&quot;')}">
                    <div class="pg-ayuda">La subida de archivos aún no está disponible: por ahora se usa un enlace.</div>
                </div>

                <div class="pg-error"></div>

                <div class="pg-acciones">
                    <button type="button" class="pg-cancelar">Cancelar</button>
                    <button type="button" class="pg-guardar">Guardar cambios</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const especialidad = overlay.querySelector('#pg-especialidad');
        const anios = overlay.querySelector('#pg-anios');
        const bio = overlay.querySelector('#pg-bio');
        const foto = overlay.querySelector('#pg-foto');
        const error = overlay.querySelector('.pg-error');
        const btnGuardar = overlay.querySelector('.pg-guardar');
        const btnCancelar = overlay.querySelector('.pg-cancelar');

        const cerrar = (resultado) => {
            document.removeEventListener('keydown', alPresionarTecla);
            overlay.remove();
            resolve(resultado);
        };

        const alPresionarTecla = (e) => {
            if (e.key === 'Escape') cerrar(null);
        };

        document.addEventListener('keydown', alPresionarTecla);
        btnCancelar.addEventListener('click', () => cerrar(null));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cerrar(null);
        });

        btnGuardar.addEventListener('click', () => {
            const textoBio = bio.value.trim();

            if (especialidad.value.trim() === '') {
                error.textContent = 'Indica tu especialidad.';
                return;
            }
            if (textoBio.length > 0 && textoBio.length < 60) {
                error.textContent = `Faltan ${60 - textoBio.length} caracteres en la biografía.`;
                return;
            }
            if (foto.value.trim() && !foto.value.trim().startsWith('http')) {
                error.textContent = 'La foto debe ser un enlace que empiece con http.';
                return;
            }

            cerrar({
                especialidad: especialidad.value.trim(),
                experienciaAnios: anios.value === '' ? null : Number(anios.value),
                descripcion: textoBio || null,
                fotoUrl: foto.value.trim() || null
            });
        });
    });
};
