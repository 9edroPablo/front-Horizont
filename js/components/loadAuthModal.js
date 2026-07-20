// Importamos nuestras utilidades
import { esEmailValido, mostrarError, limpiarError } from '../utils/validators.js';

// === NUEVO: Importamos el servicio que lee el JSON ===
import { loginUser } from '../api/authService.js';

document.addEventListener("DOMContentLoaded", async () => {
    const isRoot = !window.location.pathname.includes('/pages/');
    const basePath = isRoot ? '' : '../';
    const modalPath = basePath + 'pages/Components/authModal.html'; // Aseguré la ruta correcta a tu carpeta

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

        // Escuchador global ajustado para interceptar clics en cualquier botón de inicio de sesión
        document.addEventListener('click', (e) => {
            const btnAbrir = e.target.closest('.btn-iniciar-sesion');
            if (btnAbrir) {
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

        // === LÓGICA DE VALIDACIÓN (LOGIN) ===
        
        // Limpiar errores en cuanto el usuario empiece a escribir
        const inputs = formLogin.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => limpiarError(input));
        });

        // Validar al dar clic en "Entrar a Horizon"
        // === NUEVO: Agregamos "async" al evento submit ===
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault(); // Evitamos que la página se recargue
            
            let esValido = true;
            const emailInput = document.getElementById('login-email');
            const passwordInput = document.getElementById('login-password');

            // 1. Validar Correo
            const emailValor = emailInput.value.trim();
            if (emailValor === '') {
                mostrarError(emailInput, 'El correo es obligatorio.');
                esValido = false;
            } else if (!esEmailValido(emailValor)) {
                mostrarError(emailInput, 'Ingresa un correo electrónico válido.');
                esValido = false;
            }

            // 2. Validar Contraseña
            const passwordValor = passwordInput.value.trim();
            if (passwordValor === '') {
                mostrarError(passwordInput, 'La contraseña es obligatoria.');
                esValido = false;
            }

            // === NUEVO: Conexión con el JSON simulando el Backend ===
            if (esValido) {
                const btnSubmit = formLogin.querySelector('.btn-submit');
                const textOriginal = btnSubmit.textContent;
                
                // Mostramos estado de carga
                btnSubmit.textContent = 'Conectando...';
                btnSubmit.disabled = true;

                // Llamamos a nuestro servicio pasando los datos
                const resultado = await loginUser(emailValor, passwordValor);

                if (resultado.success) {
                    // Guardamos la sesión en el navegador
                    localStorage.setItem('horizon_user', JSON.stringify(resultado.user));
                    
                    // === NUEVO: CONTROL DE REDIRECCIÓN SEGÚN EL ROL ===
                    if (resultado.user.role === 'guide') {
                        // Si es un guía, lo mandamos de inmediato a su Dashboard dedicado
                        window.location.href = basePath + 'pages/dashboard-guia.html';
                        return; // Detenemos la ejecución del resto del script de inicio
                    }

                    // Si es un usuario común, procedemos con la actualización dinámica en tiempo real
                    if (typeof window.actualizarHeaderUI === 'function') {
                        window.actualizarHeaderUI();
                    }
                    
                    // Cerramos el modal y limpiamos el formulario
                    authOverlay.classList.remove('active');
                    formLogin.reset();
                } else {
                    // Si falla (credenciales incorrectas), mostramos el error
                    mostrarError(passwordInput, resultado.message);
                }

                // Restauramos el botón a su estado normal
                btnSubmit.textContent = textOriginal;
                btnSubmit.disabled = false;
            }
        });

    } catch (error) {
        console.error("No se pudo cargar el modal de autenticación.", error);
    }
});