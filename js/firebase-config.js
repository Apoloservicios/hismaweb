// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDho-fqLpI4xTeoHng9Hu3qSPTo42WIV",  // Esta es la API key parcial que veo en tu imagen
    authDomain: "hisma-lubricentro.firebaseapp.com",
    projectId: "hisma-lubricentro",   // Asegúrate de que este sea el ID correcto de tu proyecto
    storageBucket: "hisma-lubricentro.appspot.com",
    messagingSenderId: "tu-messaging-sender-id",
    appId: "1:256699100715:web:287e4304b4331326B046e"  // Este es el App ID que veo en tu imagen  
    
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Configuración de consultas en línea/offline
firebase.firestore().enablePersistence()
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.log('Múltiples pestañas abiertas, la persistencia solo puede ser habilitada en una pestaña a la vez.');
        } else if (err.code == 'unimplemented') {
            console.log('El navegador actual no soporta las características de persistencia.');
        }
    });