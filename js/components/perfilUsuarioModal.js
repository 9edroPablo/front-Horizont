// js/components/perfilUsuarioModal.js
// Dos formularios del perfil del explorador: editar datos y cambiar
// contraseña. Ambos devuelven una promesa y no hablan con el backend;
// quien los llama decide qué hacer con los datos.

const ESTILOS = `
.pu-overlay {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(17, 24, 39, .55);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; overflow-y: auto;
}
.pu-modal {
    background: #fff; border-radius: 14px;
    width: 100%; max-width: 440px; padding: 28px;
    box-shadow: 0 20px 45px rgba(0,0,0,.22);
    font-family: 'Montserrat', system-ui, sans-serif;
    max-height: 90vh; overflow-y: auto;
}
.pu-modal h3 { margin: 0 0 4px; font-size: 19px; color: #111827; }
.pu-modal .pu-sub { margin: 0 0 22px; font-size: 13px; color: #6B7280; line-height: 1.45; }
.pu-campo { margin-bottom: 16px; }
.pu-campo label {
    display: block; font-size: 11px; font-weight: 600;
    letter-spacing: .04em; text-transform: uppercase;
    color: #374151; margin-bottom: 6px;
}
.pu-campo input, .pu-campo select {
    width: 100%; box-sizing: border-box; padding: 10px 13px;
    border: 1px solid #D1D5DB; border-radius: 8px;
    font-family: inherit; font-size: 14px; color: #111827; background: #fff;
}
.pu-campo input:focus, .pu-campo select:focus {
    outline: none; border-color: #0F5B46;
    box-shadow: 0 0 0 3px rgba(15,91,70,.12);
}
.pu-ayuda { font-size: 11px; color: #9CA3AF; margin-top: 4px; }
.pu-error { color: #B91C1C; font-size: 13px; min-height: 18px; margin-top: 4px; }
.pu-acciones { display: flex; gap: 10px; margin-top: 8px; }
.pu-acciones button {
    flex: 1; padding: 11px; border-radius: 8px; font-size: 14px;
    font-weight: 600; cursor: pointer; font-family: inherit;
    border: 1px solid transparent;
}
.pu-cancelar { background: #fff; border-color: #D1D5DB !important; color: #374151; }
.pu-guardar { background: #0F5B46; color: #fff; }
`;

const asegurarEstilos = () => {
    if (document.getElementById('pu-modal-estilos')) return;
    const tag = document.createElement('style');
    tag.id = 'pu-modal-estilos';
    tag.textContent = ESTILOS;
    document.head.appendChild(tag);
};

// Estructura común: monta el overlay, gestiona el cierre y delega la
// validación al formulario concreto.
const montarModal = (contenidoHtml, validar) => {
    asegurarEstilos();

    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'pu-overlay';
        overlay.innerHTML = `<div class="pu-modal" role="dialog" aria-modal="true">${contenidoHtml}</div>`;
        document.body.appendChild(overlay);

        const error = overlay.querySelector('.pu-error');
        const btnGuardar = overlay.querySelector('.pu-guardar');
        const btnCancelar = overlay.querySelector('.pu-cancelar');

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
            const resultado = validar(overlay, error);
            if (resultado) cerrar(resultado);
        });
    });
};

const esCorreoValido = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);

/**
 * Edita nombre, correo, foto y nivel de experiencia.
 */
export const editarPerfilUsuario = (usuario = {}, nivelActual = 'PRINCIPIANTE') => {
    const html = `
        <h3>Editar tu perfil</h3>
        <p class="pu-sub">Tu correo también es el que usas para iniciar sesión.</p>

        <div class="pu-campo">
            <label for="pu-nombre">Nombre completo</label>
            <input type="text" id="pu-nombre" value="${(usuario.name || '').replace(/"/g, '&quot;')}">
        </div>

        <div class="pu-campo">
            <label for="pu-correo">Correo electrónico</label>
            <input type="email" id="pu-correo" value="${(usuario.email || '').replace(/"/g, '&quot;')}">
        </div>

        <div class="pu-campo">
            <label for="pu-ubicacion">Localidad</label>
            <input type="text" id="pu-ubicacion" placeholder="Ej. San Cristóbal de las Casas, Chiapas"
                   value="${(usuario.ubicacion || '').replace(/"/g, '&quot;')}">
        </div>

        <div class="pu-campo">
            <label for="pu-nivel">Nivel de experiencia</label>
            <select id="pu-nivel">
                <option value="PRINCIPIANTE" ${nivelActual === 'PRINCIPIANTE' ? 'selected' : ''}>Principiante</option>
                <option value="INTERMEDIO" ${nivelActual === 'INTERMEDIO' ? 'selected' : ''}>Intermedio</option>
                <option value="AVANZADO" ${nivelActual === 'AVANZADO' ? 'selected' : ''}>Avanzado</option>
            </select>
        </div>

        <div class="pu-campo">
            <label for="pu-foto">Foto de perfil (URL)</label>
            <input type="url" id="pu-foto" placeholder="https://..."
                   value="${(usuario.fotoUrl || '').replace(/"/g, '&quot;')}">
            <div class="pu-ayuda">La subida de archivos aún no está disponible: por ahora se usa un enlace.</div>
        </div>

        <div class="pu-error"></div>

        <div class="pu-acciones">
            <button type="button" class="pu-cancelar">Cancelar</button>
            <button type="button" class="pu-guardar">Guardar cambios</button>
        </div>
    `;

    return montarModal(html, (modal, error) => {
        const nombre = modal.querySelector('#pu-nombre').value.trim();
        const correo = modal.querySelector('#pu-correo').value.trim();
        const foto = modal.querySelector('#pu-foto').value.trim();
        const nivel = modal.querySelector('#pu-nivel').value;
        const ubicacion = modal.querySelector('#pu-ubicacion').value.trim();

        if (nombre.length < 3) {
            error.textContent = 'Escribe tu nombre completo.';
            return null;
        }
        if (!esCorreoValido(correo)) {
            error.textContent = 'Ingresa un correo electrónico válido.';
            return null;
        }
        if (foto && !foto.startsWith('http')) {
            error.textContent = 'La foto debe ser un enlace que empiece con http.';
            return null;
        }

        return { nombre, correo, fotoUrl: foto || null, ubicacion: ubicacion || null, nivel };
    });
};

/**
 * Cambio de contraseña. Se pide la actual porque, sin autenticación por
 * token, es la única prueba de que quien pide el cambio es el dueño.
 */
export const cambiarPasswordModal = () => {
    const html = `
        <h3>Cambiar contraseña</h3>
        <p class="pu-sub">Por seguridad, confirma tu contraseña actual antes de elegir una nueva.</p>

        <div class="pu-campo">
            <label for="pu-actual">Contraseña actual</label>
            <input type="password" id="pu-actual" autocomplete="current-password">
        </div>

        <div class="pu-campo">
            <label for="pu-nueva">Contraseña nueva</label>
            <input type="password" id="pu-nueva" autocomplete="new-password">
            <div class="pu-ayuda">Mínimo 6 caracteres.</div>
        </div>

        <div class="pu-campo">
            <label for="pu-repetir">Repetir contraseña nueva</label>
            <input type="password" id="pu-repetir" autocomplete="new-password">
        </div>

        <div class="pu-error"></div>

        <div class="pu-acciones">
            <button type="button" class="pu-cancelar">Cancelar</button>
            <button type="button" class="pu-guardar">Cambiar contraseña</button>
        </div>
    `;

    return montarModal(html, (modal, error) => {
        const actual = modal.querySelector('#pu-actual').value;
        const nueva = modal.querySelector('#pu-nueva').value;
        const repetir = modal.querySelector('#pu-repetir').value;

        if (actual === '') {
            error.textContent = 'Escribe tu contraseña actual.';
            return null;
        }
        if (nueva.length < 6) {
            error.textContent = 'La contraseña nueva debe tener al menos 6 caracteres.';
            return null;
        }
        if (nueva !== repetir) {
            error.textContent = 'Las contraseñas nuevas no coinciden.';
            return null;
        }
        if (nueva === actual) {
            error.textContent = 'La contraseña nueva debe ser distinta de la actual.';
            return null;
        }

        return { passwordActual: actual, passwordNueva: nueva };
    });
};
