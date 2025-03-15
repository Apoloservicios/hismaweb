document.addEventListener('DOMContentLoaded', function() {
    // Seleccionar elementos del DOM
    const dominioInput = document.getElementById('dominio-input');
    const searchButton = document.getElementById('search-button');
    const resultadoDiv = document.getElementById('resultado-consulta');
    
    // Agregar evento al botón de búsqueda
    if (searchButton) {
        searchButton.addEventListener('click', realizarBusqueda);
    }
    
    // Agregar evento para buscar al presionar Enter en el input
    if (dominioInput) {
        dominioInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                realizarBusqueda();
            }
        });
    }
    
    // Función principal de búsqueda
    function realizarBusqueda() {
        // Validar que el input no esté vacío
        if (!dominioInput || dominioInput.value.trim() === '') {
            mostrarError('Por favor, ingresa un dominio/patente válido.');
            return;
        }
        
        // Obtener el valor del dominio y normalizarlo
        const dominio = dominioInput.value.trim().toUpperCase();
        
        // Validar formato del dominio (patente)
        const formatoAntiguoRegex = /^[A-Z]{3}\d{3}$/; // Formato antiguo: ABC123
        const formatoNuevoRegex = /^[A-Z]{2}\d{3}[A-Z]{2}$/; // Formato nuevo: AB123CD
        
        if (!formatoAntiguoRegex.test(dominio) && !formatoNuevoRegex.test(dominio)) {
            mostrarError('El formato del dominio no es válido. Debe ser ABC123 o AB123CD.');
            return;
        }
        
        // Mostrar indicador de carga
        resultadoDiv.innerHTML = `
            <div class="text-center py-3">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <p class="mt-2">Buscando información...</p>
            </div>
        `;
        resultadoDiv.classList.remove('d-none');
        
        // Realizar la búsqueda en Firebase
        buscarDominioEnFirebase(dominio);
    }
    
    // Función para buscar en Firebase
   // Función para buscar en Firebase
   async function buscarDominioEnFirebase(dominio) {
    try {
        console.log("Buscando dominio:", dominio); // Para depuración
        
        // Intentar con collectionGroup (requiere el índice)
        const cambiosRef = db.collectionGroup('cambiosAceite')
            .where('dominio', '==', dominio);
        
        const snapshot = await cambiosRef.get();
        
        if (snapshot.empty) {
            console.log("No se encontraron resultados");
            mostrarNoEncontrado(dominio);
            return;
        }
        
        // Encontramos resultados
        console.log(`Se encontraron ${snapshot.size} resultados`);
        
        // Obtener los cambios y ordenarlos por fecha (si existe)
        const cambios = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        // Ordenar por createdAt si existe
        if (cambios.length > 0 && cambios[0].createdAt) {
            cambios.sort((a, b) => {
                if (a.createdAt && b.createdAt) {
                    // Si son objetos Timestamp de Firestore
                    if (typeof a.createdAt.toDate === 'function') {
                        return b.createdAt.toDate() - a.createdAt.toDate();
                    }
                    // Si son strings o Date
                    return new Date(b.createdAt) - new Date(a.createdAt);
                }
                return 0;
            });
        }
        
        // Mostrar el cambio más reciente
        const ultimoCambio = cambios[0];
        console.log("Mostrando último cambio:", ultimoCambio);
        mostrarResultado(ultimoCambio);
        
    } catch (error) {
        console.error("Error al buscar el dominio:", error);
        mostrarError('Ha ocurrido un error al realizar la consulta. Por favor, intenta nuevamente.');
    }
}
    
    // Función para mostrar el resultado encontrado
    // Función para mostrar el resultado encontrado
function mostrarResultado(cambio) {
    console.log("Mostrando resultado:", cambio); // Log para depuración
    
    // Determinar si hay próximo cambio programado
    const tieneProximo = cambio.proximaFecha && cambio.proximaFecha.trim() !== '';
    
    // Formatear fecha de creación si existe
    let fechaCreacion = "";
    if (cambio.createdAt) {
        // Si es un timestamp de Firestore
        if (typeof cambio.createdAt.toDate === 'function') {
            fechaCreacion = cambio.createdAt.toDate().toLocaleDateString();
        } else {
            // Si es una cadena o fecha
            fechaCreacion = new Date(cambio.createdAt).toLocaleDateString();
        }
    }
    
    // Obtener la fecha real del cambio, usar createdAt si fecha no existe
    const fechaCambio = cambio.fecha || fechaCreacion;
    
    // Construir HTML con los datos disponibles
    resultadoDiv.innerHTML = `
        <div class="resultado-card">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h3 class="h5 mb-0">Último cambio registrado</h3>
                <span class="badge bg-success">Encontrado</span>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Dominio:</strong> ${cambio.dominio}</p>
                    <p><strong>Fecha del cambio:</strong> ${fechaCambio}</p>
                    <p><strong>Kilometraje:</strong> ${cambio.km || 'No registrado'}</p>
                    ${tieneProximo ? `<p><strong>Próximo cambio:</strong> ${cambio.proximaFecha}</p>` : ''}
                </div>
                <div class="col-md-6">
                    <p><strong>Aceite:</strong> ${cambio.aceite || cambio.aceiteCustom || 'No especificado'}</p>
                    <p><strong>Tipo:</strong> ${cambio.tipo || 'No especificado'}</p>
                    <p><strong>SAE:</strong> ${cambio.sae || cambio.saeCustom || 'No especificado'}</p>
                </div>
            </div>
            
            <hr>
            
            <div class="d-flex justify-content-between align-items-center">
                <a href="#" class="btn btn-sm btn-outline-primary">
                    <i class="fas fa-print"></i> Ver comprobante
                </a>
                <a href="conductores.html" class="btn btn-sm btn-primary">
                    <i class="fas fa-info-circle"></i> Más información
                </a>
            </div>
        </div>
    `;
    
    resultadoDiv.classList.remove('d-none');
}
    
    // Función para mostrar mensaje cuando no se encuentra el dominio
    function mostrarNoEncontrado(dominio) {
        resultadoDiv.innerHTML = `
            <div class="alert alert-warning mb-0" role="alert">
                <h4 class="alert-heading">No encontramos registros</h4>
                <p>No hemos encontrado cambios de aceite registrados para el dominio <strong>${dominio}</strong>.</p>
                <hr>
                <p class="mb-0">¿Realizaste un cambio de aceite recientemente? Consulta con tu lubricentro si está registrado en HISMA.</p>
                <div class="mt-3">
                    <a href="lubricentros.html" class="btn btn-sm btn-outline-primary">Ver lubricentros adheridos</a>
                </div>
            </div>
        `;
        
        resultadoDiv.classList.remove('d-none');
    }
    
    // Función para mostrar errores
    function mostrarError(mensaje) {
        resultadoDiv.innerHTML = `
            <div class="alert alert-danger mb-0" role="alert">
                <i class="fas fa-exclamation-circle me-2"></i> ${mensaje}
            </div>
        `;
        
        resultadoDiv.classList.remove('d-none');
    }

    // Agregar al final de tu archivo consulta.js
            document.addEventListener('DOMContentLoaded', function() {
                const debugButton = document.getElementById('debug-button');
                
                if (debugButton) {
                    debugButton.addEventListener('click', async function() {
                        try {
                            console.log("Iniciando depuración...");
                            
                            // Probar a obtener todos los lubricentros
                            const lubricentrosRef = db.collection('lubricentros');
                            const lubricentrosSnapshot = await lubricentrosRef.get();
                            
                            console.log(`Se encontraron ${lubricentrosSnapshot.size} lubricentros`);
                            
                            // Para cada lubricentro, listar las colecciones cambiosAceite
                            for (const doc of lubricentrosSnapshot.docs) {
                                const lubricentroId = doc.id;
                                console.log(`Lubricentro ID: ${lubricentroId}, Nombre: ${doc.data().nombreFantasia || 'No especificado'}`);
                                
                                // Obtener cambios de aceite para este lubricentro
                                const cambiosRef = db.collection('lubricentros').doc(lubricentroId).collection('cambiosAceite');
                                const cambiosSnapshot = await cambiosRef.get();
                                
                                console.log(`  - Tiene ${cambiosSnapshot.size} cambios de aceite registrados`);
                                
                                // Listar dominios de los cambios
                                let dominios = [];
                                cambiosSnapshot.forEach(cambioDoc => {
                                    dominios.push(cambioDoc.data().dominio);
                                });
                                
                                console.log(`  - Dominios registrados: ${dominios.join(', ')}`);
                            }
                            
                            // Probar una consulta específica con collectionGroup
                            const testDominio = "AC190JG"; // El dominio que estás buscando
                            console.log(`\nProbando consulta específica para dominio: ${testDominio}`);
                            
                            const testQuery = db.collectionGroup('cambiosAceite').where('dominio', '==', testDominio);
                            const testSnapshot = await testQuery.get();
                            
                            console.log(`Resultados encontrados: ${testSnapshot.size}`);
                            testSnapshot.forEach(doc => {
                                console.log(`- ID: ${doc.id}, Datos:`, doc.data());
                            });
                        } catch (error) {
                            console.error("Error en depuración:", error);
                        }
                    });
                }
            });
});