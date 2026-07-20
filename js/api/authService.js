// js/api/authService.js

export const loginUser = async (email, password) => {
    // Calculamos la ruta correcta dependiendo de si estamos en index.html o en pages/
    const isRoot = !window.location.pathname.includes('/pages/');
    const usersPath = isRoot ? 'assets/data/users.json' : '../assets/data/users.json';
    
    // === CORRECCIÓN EXACTA BASADA EN TU IMAGEN ===
    const guidesPath = isRoot ? 'assets/data/guides.json' : '../assets/data/guides.json';

    try {
        // 1. Buscamos primero en el JSON de usuarios normales
        const responseUsers = await fetch(usersPath);
        if (!responseUsers.ok) throw new Error("No se pudo conectar a users.json");
        const dataUsers = await responseUsers.json();
        
        let user = dataUsers.users.find(u => u.email === email && u.password === password);
        let role = 'user'; // Rol por defecto

        // 2. Si no lo encuentra en usuarios, buscamos en el JSON de guías
        if (!user) {
            const responseGuides = await fetch(guidesPath);
            if (!responseGuides.ok) throw new Error("No se pudo conectar a guides.json");
            const dataGuides = await responseGuides.json();
            
            // Validamos si el arreglo por dentro del JSON se llama "guides" o "guias"
            const listaGuias = dataGuides.guides || dataGuides.guias; 
            
            user = listaGuias.find(g => g.email === email && g.password === password);
            if (user) {
                role = 'guide'; // Le asignamos el rol correcto
            }
        }

        // 3. Evaluamos si encontramos al usuario en alguno de los dos archivos
        if (user) {
            // Login exitoso
            return { 
                success: true, 
                user: { 
                    name: user.name, 
                    avatar: user.avatar || user.profile_image, 
                    email: user.email,
                    role: role // Mandamos el rol para que authModal.js sepa dónde redirigir
                } 
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