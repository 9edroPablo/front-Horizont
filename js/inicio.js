document.addEventListener("DOMContentLoaded", () => {
    // 1. Capturamos los elementos del DOM
    const inputBuscador = document.getElementById("buscador-ciudad");
    const btnBuscar = document.getElementById("btn-buscar");
    const iframeMapa = document.getElementById("mapa-iframe");
    const mapaSection = document.querySelector(".mapa-section");

    // 2. Función que actualiza el mapa
    const buscarEnMapa = () => {
        // Obtenemos el texto y quitamos espacios en blanco extra
        const ciudad = inputBuscador.value.trim();

        if (ciudad !== "") {
            // Codificamos el texto para que sea seguro en una URL (ej: "San Cristobal" -> "San%20Cristobal")
            const ciudadCodificada = encodeURIComponent(ciudad);
            
            // ACTUALIZADO: Usamos la URL correcta de maps.google con el parámetro &iwloc= en blanco para ocultar el globo
            iframeMapa.src = `https://maps.google.com/maps?q=${ciudadCodificada}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

            // Hacemos que la página baje suavemente hasta la sección del mapa
            mapaSection.scrollIntoView({ behavior: "smooth" });
        }
    };

    // 3. Escuchamos el clic en el botón "Explorar"
    if (btnBuscar) {
        btnBuscar.addEventListener("click", buscarEnMapa);
    }

    // 4. Permitir buscar presionando la tecla "Enter"
    if (inputBuscador) {
        inputBuscador.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                e.preventDefault(); // Evitamos recargas innecesarias
                buscarEnMapa();
            }
        });
    }
});