// js/api/authService.js

export const loginUser = async (email, password) => {
    // Calculamos la ruta correcta dependiendo de si estamos en index.html o en pages/
    const isRoot = !window.location.pathname.includes('/pages/');
    const dataPath = isRoot ? 'assets/data/users.json' : '../assets/data/users.json';

    try {
        // Hacemos el fetch a nuestro JSON simulando una petición a un servidor
        const response = await fetch(dataPath);
        
        if (!response.ok) {
            throw new Error("No se pudo conectar a la base de datos");
        }

        const data = await response.json();
        
        // Buscamos si existe un usuario con ese correo y esa contraseña
        const user = data.users.find(u => u.email === email && u.password === password);

        if (user) {
            // Login exitoso
            return { 
                success: true, 
                user: { name: user.name, avatar: user.avatar, email: user.email } 
            };
        } else {
            // Credenciales incorrectas
            return { 
                success: false, 
                message: "Correo o contraseña incorrectos" 
            };
        }
    } catch (error) {
        console.error("Error en el servidor:", error);
        return { success: false, message: "Error interno. Intenta más tarde." };
    }
};