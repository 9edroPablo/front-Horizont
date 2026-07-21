// js/components/participantesModal.js
// Lista de personas inscritas en una actividad, con acciones para
// confirmar o rechazar cada reserva.

const ESTILOS = `
.pt-overlay {
    position: fixed; inset: 0; z-index: 2000;
    background: rgba(17,24,39,.55);
    display: flex; align-items: center; justify-content: center;
    padding: 20px; overflow-y: auto;
}
.pt-modal {
    background: #fff; border-radius: 14px;
    width: 100%; max-width: 540px; padding: 28px;
    box-shadow: 0 20px 45px rgba(0,0,0,.22);
    font-family: 'Montserrat', system-ui, sans-serif;
    max-height: 90vh; overflow-y: auto;
}
.pt-modal h3 { margin: 0 0 4px; font-size: 19px; color: #111827; }
.pt-modal .pt-sub { margin: 0 0 20px; font-size: 13px; color: #6B7280; }
.pt-fila {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; padding: 14px 0; border-bottom: 1px solid #F3F4F6;
}
.pt-fila:last-of-type { border-bottom: none; }
.pt-datos strong { display: block; font-size: 14px; color: #111827; }
.pt-datos span { font-size: 12px; color: #6B7280; }
.pt-acciones { display: flex; gap: 6px; align-items: center; flex-shrink: 0; }
.pt-btn {
    padding: 6px 11px; border-radius: 6px; font-size: 12px;
    font-weight: 600; cursor: pointer; font-family: inherit;
    border: 1px solid transparent;
}
.pt-confirmar { background: #0F5B46; color: #fff; }
.pt-rechazar { background: #fff; border-color: #D1D5DB !important; color: #B91C1C; }
.pt-btn:disabled { opacity: .5; cursor: not-allowed; }
.pt-estado {
    font-size: 11px; font-weight: 700; letter-spacing: .04em;
    text-transform: uppercase; padding: 4px 9px; border-radius: 20px;
}
.pt-estado.confirmada { background: #D1FAE5; color: #065F46; }
.pt-estado.pendiente  { background: #FEF3C7; color: #92400E; }
.pt-estado.cancelada  { background: #FEE2E2; color: #991B1B; }
.pt-vacio { color: #6B7280; font-size: 14px; padding: 20px 0; text-align: center; }
.pt-resumen {
    background: #F9FAFB; border-radius: 8px; padding: 12px 14px;
    font-size: 13px; color: #374151; margin-bottom: 16px;
}
.pt-cerrar {
    width: 100%; margin-top: 18px; padding: 11px; border-radius: 8px;
    background: #fff; border: 1px solid #D1D5DB; color: #374151;
    font-size: 14px; font-weight: 600; cursor: pointer; font-family: inherit;
}
`;

const asegurarEstilos = () => {
    if (document.getElementById('pt-modal-estilos')) return;
    const tag = document.createElement('style');
    tag.id = 'pt-modal-estilos';
    tag.textContent = ESTILOS;
    document.head.appendChild(tag);
};

/**
 * @param actividad   { titulo, capacidad }
 * @param inscritos   [{ idReserva, cliente, precio, estado, fecha }]
 * @param alCambiar   async (idReserva, nuevoEstado) => { success, message }
 *
 * La promesa se resuelve al cerrar, indicando si hubo algún cambio,
 * para que el panel se repinte sólo cuando haga falta.
 */
export const verParticipantes = (actividad, inscritos, alCambiar) => {
    asegurarEstilos();

    return new Promise((resolve) => {
        let huboCambios = false;

        const overlay = document.createElement('div');
        overlay.className = 'pt-overlay';

        const confirmadas = inscritos.filter(i => i.estado === 'CONFIRMADA').length;
        const pendientes = inscritos.filter(i => i.estado === 'PENDIENTE').length;

        const filaHtml = (i) => `
            <div class="pt-fila" data-reserva="${i.idReserva}">
                <div class="pt-datos">
                    <strong>${i.cliente}</strong>
                    <span>$${i.precio.toLocaleString()} • reservó el ${i.fecha}</span>
                </div>
                <div class="pt-acciones">
                    <span class="pt-estado ${i.estado.toLowerCase()}">${i.estado}</span>
                    ${i.estado === 'PENDIENTE' ? `
                        <button class="pt-btn pt-confirmar" data-id="${i.idReserva}" data-estado="CONFIRMADA">Confirmar</button>
                        <button class="pt-btn pt-rechazar" data-id="${i.idReserva}" data-estado="CANCELADA">Rechazar</button>
                    ` : ''}
                </div>
            </div>
        `;

        overlay.innerHTML = `
            <div class="pt-modal" role="dialog" aria-modal="true">
                <h3>${actividad.titulo}</h3>
                <p class="pt-sub">Personas inscritas en esta actividad</p>

                <div class="pt-resumen">
                    <strong>${confirmadas}</strong> confirmadas ·
                    <strong>${pendientes}</strong> por revisar ·
                    cupo de <strong>${actividad.capacidad}</strong>
                </div>

                <div class="pt-lista">
                    ${inscritos.length === 0
                        ? '<p class="pt-vacio">Todavía nadie se ha inscrito en esta actividad.</p>'
                        : inscritos.map(filaHtml).join('')}
                </div>

                <button type="button" class="pt-cerrar">Cerrar</button>
            </div>
        `;

        document.body.appendChild(overlay);

        const cerrar = () => {
            document.removeEventListener('keydown', alPresionarTecla);
            overlay.remove();
            resolve(huboCambios);
        };

        const alPresionarTecla = (e) => {
            if (e.key === 'Escape') cerrar();
        };

        document.addEventListener('keydown', alPresionarTecla);
        overlay.querySelector('.pt-cerrar').addEventListener('click', cerrar);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cerrar();
        });

        // Delegación: los botones desaparecen al cambiar el estado,
        // así que no conviene asignarles listeners individuales.
        overlay.querySelector('.pt-lista').addEventListener('click', async (e) => {
            const btn = e.target.closest('.pt-btn');
            if (!btn) return;

            const fila = btn.closest('.pt-fila');
            const nuevoEstado = btn.dataset.estado;

            fila.querySelectorAll('.pt-btn').forEach(b => b.disabled = true);

            const resultado = await alCambiar(btn.dataset.id, nuevoEstado);

            if (resultado.success) {
                huboCambios = true;
                const badge = fila.querySelector('.pt-estado');
                badge.textContent = nuevoEstado;
                badge.className = `pt-estado ${nuevoEstado.toLowerCase()}`;
                fila.querySelectorAll('.pt-btn').forEach(b => b.remove());
            } else {
                fila.querySelectorAll('.pt-btn').forEach(b => b.disabled = false);
                alert(resultado.message);
            }
        });
    });
};
