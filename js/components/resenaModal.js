// js/components/resenaModal.js
// Modal de calificación. Se construye e inyecta al vuelo con sus propios
// estilos, para no depender de marcado ni CSS en cada página que lo use.

const ESTILOS = `
.resena-overlay {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(17, 24, 39, 0.55);
    display: flex; align-items: center; justify-content: center;
    padding: 20px;
}
.resena-modal {
    background: #fff; border-radius: 14px;
    width: 100%; max-width: 440px; padding: 28px;
    box-shadow: 0 20px 45px rgba(0,0,0,.22);
    font-family: 'Montserrat', system-ui, sans-serif;
}
.resena-modal h3 { margin: 0 0 4px; font-size: 19px; color: #111827; }
.resena-modal .resena-sub {
    margin: 0 0 22px; font-size: 13px; color: #6B7280;
}
.resena-estrellas {
    display: flex; gap: 6px; justify-content: center; margin-bottom: 8px;
}
.resena-estrella {
    background: none; border: none; cursor: pointer;
    font-size: 34px; line-height: 1; color: #D1D5DB;
    padding: 0; transition: color .12s, transform .12s;
}
.resena-estrella:hover { transform: scale(1.12); }
.resena-estrella.activa { color: #F59E0B; }
.resena-etiqueta {
    text-align: center; font-size: 13px; color: #6B7280;
    min-height: 20px; margin-bottom: 16px;
}
.resena-modal textarea {
    width: 100%; box-sizing: border-box; min-height: 96px;
    padding: 11px 13px; border: 1px solid #D1D5DB; border-radius: 8px;
    font-family: inherit; font-size: 14px; resize: vertical; color: #111827;
}
.resena-modal textarea:focus {
    outline: none; border-color: #0F5B46;
    box-shadow: 0 0 0 3px rgba(15,91,70,.12);
}
.resena-contador { font-size: 11px; color: #9CA3AF; text-align: right; margin-top: 4px; }
.resena-error { color: #B91C1C; font-size: 13px; min-height: 18px; margin-top: 8px; }
.resena-acciones { display: flex; gap: 10px; margin-top: 16px; }
.resena-acciones button {
    flex: 1; padding: 11px; border-radius: 8px; font-size: 14px;
    font-weight: 600; cursor: pointer; font-family: inherit;
    border: 1px solid transparent; transition: opacity .15s;
}
.resena-cancelar { background: #fff; border-color: #D1D5DB !important; color: #374151; }
.resena-enviar { background: #0F5B46; color: #fff; }
.resena-enviar:disabled { opacity: .55; cursor: not-allowed; }
`;

const ETIQUETAS = {
    1: 'Muy decepcionante',
    2: 'No cumplió lo esperado',
    3: 'Estuvo bien',
    4: 'Muy buena experiencia',
    5: 'Excelente, la recomiendo'
};

const MAX_COMENTARIO = 500;

const asegurarEstilos = () => {
    if (document.getElementById('resena-modal-estilos')) return;
    const tag = document.createElement('style');
    tag.id = 'resena-modal-estilos';
    tag.textContent = ESTILOS;
    document.head.appendChild(tag);
};

/**
 * Abre el modal y resuelve con { calificacion, comentario } cuando el
 * usuario envía, o con null si cancela.
 * La promesa deja que quien llama decida qué hacer con el resultado:
 * el modal no sabe nada del backend.
 */
export const pedirResena = (tituloActividad) => {
    asegurarEstilos();

    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'resena-overlay';
        overlay.innerHTML = `
            <div class="resena-modal" role="dialog" aria-modal="true">
                <h3>¿Cómo estuvo tu experiencia?</h3>
                <p class="resena-sub">${tituloActividad}</p>

                <div class="resena-estrellas">
                    ${[1,2,3,4,5].map(n =>
                        `<button type="button" class="resena-estrella" data-valor="${n}" aria-label="${n} estrellas">★</button>`
                    ).join('')}
                </div>
                <div class="resena-etiqueta"></div>

                <textarea placeholder="Cuéntale a otros exploradores cómo fue la actividad (opcional)" maxlength="${MAX_COMENTARIO}"></textarea>
                <div class="resena-contador">0 / ${MAX_COMENTARIO}</div>

                <div class="resena-error"></div>

                <div class="resena-acciones">
                    <button type="button" class="resena-cancelar">Cancelar</button>
                    <button type="button" class="resena-enviar" disabled>Enviar reseña</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const estrellas = overlay.querySelectorAll('.resena-estrella');
        const etiqueta = overlay.querySelector('.resena-etiqueta');
        const textarea = overlay.querySelector('textarea');
        const contador = overlay.querySelector('.resena-contador');
        const error = overlay.querySelector('.resena-error');
        const btnEnviar = overlay.querySelector('.resena-enviar');
        const btnCancelar = overlay.querySelector('.resena-cancelar');

        let calificacion = 0;

        const pintar = (valor) => {
            estrellas.forEach(e => {
                e.classList.toggle('activa', Number(e.dataset.valor) <= valor);
            });
        };

        estrellas.forEach(estrella => {
            // Vista previa al pasar el cursor, sin comprometer la selección
            estrella.addEventListener('mouseenter', () => pintar(Number(estrella.dataset.valor)));
            estrella.addEventListener('click', () => {
                calificacion = Number(estrella.dataset.valor);
                pintar(calificacion);
                etiqueta.textContent = ETIQUETAS[calificacion];
                btnEnviar.disabled = false;
                error.textContent = '';
            });
        });

        // Al salir del grupo, vuelve a mostrar lo elegido
        overlay.querySelector('.resena-estrellas')
               .addEventListener('mouseleave', () => pintar(calificacion));

        textarea.addEventListener('input', () => {
            contador.textContent = `${textarea.value.length} / ${MAX_COMENTARIO}`;
        });

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

        btnEnviar.addEventListener('click', () => {
            if (calificacion === 0) {
                error.textContent = 'Elige una calificación del 1 al 5.';
                return;
            }
            cerrar({
                calificacion,
                comentario: textarea.value.trim() || null
            });
        });
    });
};
