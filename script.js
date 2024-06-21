// Firebase-Konfiguration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js';
import { getDatabase, ref, onValue, update } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyDJS3FamxfMtJRUPFcZOfY3esmk3N7stiw",
    authDomain: "industriegebiet.firebaseapp.com",
    databaseURL: "https://industriegebiet-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "industriegebiet",
    storageBucket: "industriegebiet.appspot.com",
    messagingSenderId: "136611695529",
    appId: "1:136611695529:web:e72789d466425eef26d2b8"
};

// Firebase initialisieren
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Funktion, um Maschinen aus Firebase abzurufen und anzuzeigen
function fetchMachines() {
    const machineList = document.getElementById('machine-list');
    const machinesRef = ref(db, 'machines');
    onValue(machinesRef, (snapshot) => {
        machineList.innerHTML = ''; // Liste leeren
        snapshot.forEach((childSnapshot) => {
            const machineId = childSnapshot.key;
            const machineData = childSnapshot.val();
            const { name, status, renter } = machineData; // ES6 Destructuring

            const li = document.createElement('li');
            li.innerHTML = `
                <span>${name}</span>
                <span id="status-${machineId}">${status === 'frei' ? 'Frei' : 'Vermietet an ' + renter}</span>
                <button onclick="changeStatus('${machineId}', '${status}')">Status ändern</button>
                <input type="text" id="renter-${machineId}" style="display: none;" placeholder="Mietername">
            `;
            machineList.appendChild(li);
        });
    });
}

// Funktion, um Status der Maschine zu ändern
window.changeStatus = (id, currentStatus) => {
    const renterInput = document.getElementById(`renter-${id}`);
    if (currentStatus === 'frei') {
        const renter = prompt('Bitte geben Sie den Namen des Mieters ein:');
        if (renter) {
            saveStatus(id, 'vermietet', renter);
        }
    } else {
        renterInput.style.display = 'none';
        saveStatus(id, 'frei', '');
    }
};

// Funktion, um Status in Firebase zu speichern
window.saveStatus = (id, status, renter) => {
    const machineRef = ref(db, 'machines/' + id);
    update(machineRef, { status, renter });
    const statusSpan = document.getElementById(`status-${id}`);
    statusSpan.textContent = status === 'frei' ? 'Frei' : 'Vermietet an ' + renter;
}

// Maschinen bei Seitenaufruf laden
fetchMachines();
