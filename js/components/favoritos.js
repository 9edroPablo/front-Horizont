// js/components/favoritos.js
// Comportamiento compartido del botón de guardar que aparece en las
// tarjetas de actividad, tanto en la portada como en el catálogo.

import { obtenerIdsFavoritos, alternarFavorito } from '../api/favoritosService.js';

const ESTILOS = `
.btn-favorito {
    position: absolute; top: 12px; right: 12px; z-index: 2;
    width: 36px; height: 36px; border-radius: 50%;
    border: none; cursor: pointer;
    background: rgba(255,255,255,.92);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 6px rgba(0,0,0,.18);
    transition: transform .12s, background-color .15s;
}
.btn-favorito:hover { transform: scale(1.1); background: #fff; }
.btn-favorito svg { width: 18px; height: 18px; stroke: #374151; fill: none; stroke-width: 2; }
.btn-favorito.guardado svg { stroke: #DC2626; fill: #DC2626; }
.btn-favorito:disabled { opacity: .6; cursor: wait; }
`;

const ICONO = `<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`;

const asegurarEstilos = () => {
    if (document.getElementById('favoritos-estilos')) return;
    const tag = document.createElement('style');
    tag.id = 'favoritos-estilos';
    tag.textContent = ESTILOS;
    document.head.appendChild(tag);
};

/**
 * Coloca un botón de guardar sobre cada tarjeta del contenedor y deja
 * escuchando los clics. Se llama DESPUÉS de renderizar las tarjetas.
 *
 * Si no hay sesión no se pinta nada: guardar sin cuenta no tendría
 * dónde persistirse.
 */
export const activarFavoritos = async (contenedor) => {
    if (!contenedor) return;

    const sesion = JSON.parse(localStorage.getItem('horizon_user'));
    if (!sesion) return;

    asegurarEstilos();

    const guardados = await obtenerIdsFavoritos(sesion.id);

    contenedor.querySelectorAll('.ruta-card').forEach(tarjeta => {
        // El id (y el tipo) viajan en el href: ...ruta-detalle.html?id=3&tipo=evento
        const parametros = new URLSearchParams(tarjeta.search || tarjeta.href.split('?')[1]);
        const idEvento = Number(parametros.get('id'));
        if (!idEvento) return;

        // La tabla `favorito` solo tiene columna para idEvento: guardar
        // una clase guardaría el id equivocado, así que no se ofrece.
        if (parametros.get('tipo') === 'clase') return;

        const marco = tarjeta.querySelector('.ruta-img-wrapper');
        if (!marco || marco.querySelector('.btn-favorito')) return;

        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'btn-favorito' + (guardados.has(idEvento) ? ' guardado' : '');
        boton.setAttribute('aria-label', 'Guardar actividad');
        boton.innerHTML = ICONO;

        boton.addEventListener('click', async (e) => {
            // La tarjeta entera es un enlace: sin esto, el clic navegaría.
            e.preventDefault();
            e.stopPropagation();

            boton.disabled = true;
            const resultado = await alternarFavorito(sesion.id, idEvento);
            boton.disabled = false;

            if (resultado.success) {
                boton.classList.toggle('guardado', resultado.guardado);
            }
        });

        marco.appendChild(boton);
    });
};
