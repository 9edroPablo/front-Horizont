document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('form-contacto');
    const responseMessage = document.getElementById('form-response');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Prevenir el envío tradicional de HTML

            // Captura de datos (por si deseas conectarlo a una API)
            const formData = {
                nombre: document.getElementById('nombre').value,
                correo: document.getElementById('correo').value,
                telefono: document.getElementById('telefono').value,
                mensaje: document.getElementById('mensaje').value
            };

            console.log('Datos listos para enviar:', formData);

            // Simulación de respuesta de backend exitosa
            responseMessage.textContent = `¡Gracias por tu interés, ${formData.nombre}! Hemos recibido tu solicitud. Pronto nos comunicaremos contigo al correo ${formData.correo}.`;
            responseMessage.className = 'hidden-message success';

            // Limpiar el formulario
            contactForm.reset();
        });
    }
});