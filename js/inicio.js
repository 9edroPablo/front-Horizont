document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // 1. INICIALIZACIÓN DEL MAPA
    // ==========================================
    const mapa = L.map('mapa-interactivo').setView([16.5, -92.8], 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(mapa);

    // Creamos una "Capa de Grupo". Esto nos permite borrar los pines viejos fácilmente al filtrar.
    const capaPines = L.layerGroup().addTo(mapa);

    // ==========================================
    // 2. DISEÑO DEL PIN PERSONALIZADO
    // ==========================================
    const pinPersonalizado = L.divIcon({
        className: 'custom-pin', // Clase CSS por si quieres animarlo después
        // Aquí dibujamos un pin SVG con el color verde de tu marca (#0F5B46)
        html: `<svg width="36" height="36" viewBox="0 0 24 24" fill="#0F5B46" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3" fill="#ffffff"></circle></svg>`,
        iconSize: [36, 36],
        iconAnchor: [18, 36], // Punto exacto que toca el mapa (centro-abajo)
        popupAnchor: [0, -32] // Donde sale el globo de texto
    });

    // ==========================================
    // 3. LÓGICA DE DATOS Y FILTROS
    // ==========================================
    let todasLasRutas = []; // Guardaremos la base de datos completa aquí
    let dificultadActiva = 'todos'; // Estado por defecto

    // Función que lee el JSON
    const cargarRutas = async () => {
        try {
            const respuesta = await fetch('assets/data/rutas.json');
            if (!respuesta.ok) throw new Error("Error al cargar JSON");
            
            todasLasRutas = await respuesta.json();
            aplicarFiltros(); // Pintamos los pines por primera vez
        } catch (error) {
            console.error("Error cargando los pines:", error);
        }
    };

    // Función que dibuja los pines en el mapa
    const renderizarPines = (rutasParaMostrar) => {
        capaPines.clearLayers(); // Borramos los pines anteriores del mapa

        rutasParaMostrar.forEach(ruta => {
            // Usamos nuestro pin personalizado en lugar del azul por defecto
            const pin = L.marker([ruta.lat, ruta.lng], { icon: pinPersonalizado }).addTo(capaPines);
            
            // Damos formato al popup (agregamos una etiqueta de dificultad)
            pin.bindPopup(`
                <strong style="color: #0F5B46; font-size: 16px;">${ruta.nombre}</strong><br>
                <em>${ruta.deporte}</em> 
                <span style="background:#eee; padding:2px 6px; border-radius:4px; font-size:11px; margin-left:5px; text-transform:uppercase;">
                    ${ruta.dificultad}
                </span><br>
                <div style="margin-top: 5px;">${ruta.descripcion}</div>
                <div style="margin-top: 5px;color: #0F5B46;">${ruta.creador}</div>
            `);
        });
    };

    // Función maestra que decide qué se muestra según los botones seleccionados
    const aplicarFiltros = () => {
        // 1. Obtenemos qué deportes están palomeados
        const checkboxes = document.querySelectorAll('.filtro-deporte');
        const deportesSeleccionados = Array.from(checkboxes)
                                           .filter(cb => cb.checked)
                                           .map(cb => cb.value);

        // 2. Filtramos la base de datos maestra
        const rutasFiltradas = todasLasRutas.filter(ruta => {
            const coincideDeporte = deportesSeleccionados.includes(ruta.deporte);
            const coincideDificultad = (dificultadActiva === 'todos') || (ruta.dificultad === dificultadActiva);
            
            return coincideDeporte && coincideDificultad;
        });

        // 3. Mandamos a dibujar solo las que pasaron el filtro
        renderizarPines(rutasFiltradas);
    };

    // ==========================================
    // 4. ESCUCHANDO CLICS EN LA INTERFAZ
    // ==========================================
    
    // Escuchar cambios en los Checkboxes de Deportes
    const checkboxesDeportes = document.querySelectorAll('.filtro-deporte');
    checkboxesDeportes.forEach(cb => {
        cb.addEventListener('change', aplicarFiltros);
    });

    // Escuchar clics en los Botones de Dificultad
    const botonesDificultad = document.querySelectorAll('.btn-dif');
    botonesDificultad.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Quitamos la clase 'active' de todos los botones
            botonesDificultad.forEach(b => b.classList.remove('active'));
            // Se la ponemos solo al que hicimos clic
            e.target.classList.add('active');
            
            // Actualizamos la variable de estado y volvemos a filtrar
            dificultadActiva = e.target.getAttribute('data-dificultad');
            aplicarFiltros();
        });
    });

    // Iniciamos la carga de la base de datos
    cargarRutas();

    // ==========================================
    // 5. LÓGICA DEL BUSCADOR DE CIUDADES
    // ==========================================
    const inputBuscador = document.getElementById("buscador-ciudad");
    const btnBuscar = document.getElementById("btn-buscar");
    const mapaSection = document.querySelector(".mapa-section");

    const buscarEnMapa = async () => {
        const ciudad = inputBuscador.value.trim();
        if (ciudad !== "") {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(ciudad)}`);
                const datos = await res.json();
                if (datos.length > 0) {
                    const lat = parseFloat(datos[0].lat);
                    const lon = parseFloat(datos[0].lon);
                    mapa.flyTo([lat, lon], 12);
                    mapaSection.scrollIntoView({ behavior: "smooth" });
                } else {
                    alert("No encontramos esa ubicación. Intenta con otra ciudad.");
                }
            } catch (error) {
                console.error("Error en la búsqueda:", error);
            }
        }
    };

    if (btnBuscar) btnBuscar.addEventListener("click", buscarEnMapa);
    if (inputBuscador) {
        inputBuscador.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                buscarEnMapa();
            }
        });
    }
});