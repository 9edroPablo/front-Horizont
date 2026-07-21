// Utilidades de validación
import { esEmailValido, mostrarError, limpiarError } from '../utils/validators.js';

// Servicio que habla con el backend
import { loginUser, registrarUser } from '../api/authService.js';

document.addEventListener("DOMContentLoaded", async () => {
    const isRoot = !window.location.pathname.includes('/pages/');
    const basePath = isRoot ? '' : '../';
    const modalPath = basePath + 'pages/Components/authModal.html';

    try {
        const response = await fetch(modalPath);
        const html = await response.text();

        const modalContainer = document.getElementById('componente-auth-modal');
        if (modalContainer) {
            modalContainer.innerHTML = html;
        }

        // === LÓGICA DE INTERACCIÓN DEL MODAL ===
        const authOverlay = document.getElementById('auth-modal-overlay');
        const closeBtn = document.getElementById('close-auth-modal');

        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-iniciar-sesion')) {
                authOverlay.classList.add('active');
            }
        });

        closeBtn.addEventListener('click', () => authOverlay.classList.remove('active'));
        authOverlay.addEventListener('click', (e) => {
            if (e.target === authOverlay) authOverlay.classList.remove('active');
        });

        const tabLogin = document.getElementById('tab-login');
        const tabRegister = document.getElementById('tab-register');
        const formLogin = document.getElementById('form-login');
        const formRegister = document.getElementById('form-register');
        const textLogin = document.getElementById('header-text-login');
        const textRegister = document.getElementById('header-text-register');

        tabLogin.addEventListener('click', () => {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            formLogin.classList.remove('hidden');
            formRegister.classList.add('hidden');
            textLogin.classList.remove('hidden');
            textRegister.classList.add('hidden');
        });

        tabRegister.addEventListener('click', () => {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            formRegister.classList.remove('hidden');
            formLogin.classList.add('hidden');
            textRegister.classList.remove('hidden');
            textLogin.classList.add('hidden');
        });

        // Limpiar errores en cuanto el usuario empiece a escribir (ambos formularios)
        [formLogin, formRegister].forEach(form => {
            form.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', () => limpiarError(input));
            });
        });

        // Selector de tipo de cuenta: el radio real está oculto, así que
        // el resaltado visual se mueve a mano entre las dos opciones.
        const opcionesRol = formRegister.querySelectorAll('.rol-opcion');
        opcionesRol.forEach(opcion => {
            opcion.addEventListener('click', () => {
                opcionesRol.forEach(o => o.classList.remove('activa'));
                opcion.classList.add('activa');
                opcion.querySelector('input[type="radio"]').checked = true;
            });
        });

        // Guarda la sesión y decide a dónde mandar al usuario
        const iniciarSesionEnUI = (usuario, form) => {
            localStorage.setItem('horizon_user', JSON.stringify(usuario));

            if (usuario.role === 'guide') {
                window.location.href = basePath + 'pages/dashboard-guia.html';
                return;
            }

            if (typeof window.actualizarHeaderUI === 'function') {
                window.actualizarHeaderUI();
            }

            authOverlay.classList.remove('active');
            form.reset();
        };

        // Bloquea el botón mientras se espera al servidor
        const conBotonCargando = async (form, texto, accion) => {
            const btn = form.querySelector('.btn-submit');
            const original = btn.textContent;
            btn.textContent = texto;
            btn.disabled = true;
            try {
                return await accion();
            } finally {
                btn.textContent = original;
                btn.disabled = false;
            }
        };

        // ==========================================
        // INICIAR SESIÓN
        // ==========================================
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');

            let esValido = true;
            const emailValor = emailInput.value.trim();
            const passwordValor = passwordInput.value.trim();

            if (emailValor === '') {
                mostrarError(emailInput, 'El correo es obligatorio.');
                esValido = false;
            } else if (!esEmailValido(emailValor)) {
                mostrarError(emailInput, 'Ingresa un correo electrónico válido.');
                esValido = false;
            }

            if (passwordValor === '') {
                mostrarError(passwordInput, 'La contraseña es obligatoria.');
                esValido = false;
            }

            if (!esValido) return;

            const resultado = await conBotonCargando(formLogin, 'Conectando...',
                () => loginUser(emailValor, passwordValor));

            if (resultado.success) {
                iniciarSesionEnUI(resultado.user, formLogin);
            } else {
                mostrarError(passwordInput, resultado.message);
            }
        });

        // ==========================================
        // REGISTRARSE
        // ==========================================
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nombreInput = document.getElementById('register-name');
            const emailInput = document.getElementById('register-email');
            const passwordInput = document.getElementById('register-password');

            let esValido = true;
            const nombreValor = nombreInput.value.trim();
            const emailValor = emailInput.value.trim();
            const passwordValor = passwordInput.value;

            if (nombreValor === '') {
                mostrarError(nombreInput, 'El nombre es obligatorio.');
                esValido = false;
            } else if (nombreValor.length < 3) {
                mostrarError(nombreInput, 'Escribe tu nombre completo.');
                esValido = false;
            }

            if (emailValor === '') {
                mostrarError(emailInput, 'El correo es obligatorio.');
                esValido = false;
            } else if (!esEmailValido(emailValor)) {
                mostrarError(emailInput, 'Ingresa un correo electrónico válido.');
                esValido = false;
            }

            if (passwordValor === '') {
                mostrarError(passwordInput, 'La contraseña es obligatoria.');
                esValido = false;
            } else if (passwordValor.length < 6) {
                mostrarError(passwordInput, 'Mínimo 6 caracteres.');
                esValido = false;
            }

            if (!esValido) return;

            const seleccionRol = formRegister.querySelector('input[name="tipo-cuenta"]:checked');
            const esGuia = seleccionRol ? seleccionRol.value === 'guia' : false;

            const resultado = await conBotonCargando(formRegister, 'Creando cuenta...', async () => {
                const registro = await registrarUser({
                    nombre: nombreValor,
                    email: emailValor,
                    password: passwordValor,
                    esGuia
                });

                // Si el registro salió bien, entramos automáticamente
                if (registro.success) {
                    return await loginUser(emailValor, passwordValor);
                }
                return registro;
            });

            if (resultado.success) {
                iniciarSesionEnUI(resultado.user, formRegister);
            } else {
                mostrarError(emailInput, resultado.message);
            }
        });

    } catch (error) {
        console.error("No se pudo cargar el modal de autenticación.", error);
    }
});
