// js/utils/validators.js

// Verifica si el formato del correo es válido
export const esEmailValido = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
};

// Muestra el mensaje de error debajo del input
export const mostrarError = (inputElement, mensaje) => {
    limpiarError(inputElement); // Limpiamos primero por si ya había un error
    
    inputElement.classList.add('error');
    
    const errorSpan = document.createElement('span');
    errorSpan.classList.add('error-message');
    errorSpan.textContent = mensaje;
    
    // Lo insertamos dentro del .input-group (el div padre del input)
    inputElement.parentElement.appendChild(errorSpan);
};

// Quita el borde rojo y elimina el mensaje de texto
export const limpiarError = (inputElement) => {
    inputElement.classList.remove('error');
    
    const padre = inputElement.parentElement;
    const errorSpan = padre.querySelector('.error-message');
    
    if (errorSpan) {
        errorSpan.remove();
    }
};