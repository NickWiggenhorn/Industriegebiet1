import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js';
import { getDatabase, ref, onValue, update } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js';

// Firebase-Konfiguration
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

// Maschinen in Abschnitte gruppieren
const machineCategories = {
    Minibagger: [],
    'Minibagger-Anbaugeräte': [],
    Radlader: [],
    'Radlader-Anbaugeräte': [],
    Dumper: [],
    Rüttelplatten: [],
    Hebebühnen: [],
    Anhänger: [],
    Kleingeräte: []
};

// Funktion, um Maschinen aus Firebase abzurufen und anzuzeigen
function fetchMachines() {
    const machineSections = document.getElementById('machine-sections');
    const machinesRef = ref(db, 'machines');
    onValue(machinesRef, (snapshot) => {
        // Maschinenkategorien leeren
        for (const category in machineCategories) {
            machineCategories[category] = [];
        }

        snapshot.forEach((childSnapshot) => {
            const machineId = childSnapshot.key;
            const machineData = childSnapshot.val();
            const { name, status, renter, category } = machineData;

            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <span>${name}</span>
                    <span id="status-${machineId}" class="status ${status === 'frei' ? 'status-frei' : 'status-vermietet'}">${status === 'frei' ? 'Frei' : 'Vermietet an ' + renter}</span>
                    <button onclick="changeStatus('${machineId}', '${status}')">Status ändern</button>
                    <input type="text" id="renter-${machineId}" placeholder="Mietername">
                </div>
            `;

            if (category in machineCategories) {
                machineCategories[category].push(li);
            }
        });

        machineSections.innerHTML = ''; // Alle Abschnitte leeren
        for (const category in machineCategories) {
            const section = document.createElement('section');
            section.innerHTML = `<h2>${category}</h2>`;
            const ul = document.createElement('ul');
            machineCategories[category].forEach(li => ul.appendChild(li));
            section.appendChild(ul);
            machineSections.appendChild(section);
        }
    });
}

// Funktion, um Status der Maschine zu ändern
window.changeStatus = (id, currentStatus) => {
    const renterInput = document.getElementById(`renter-${id}`);
    if (currentStatus === 'frei') {
        renterInput.style.display = 'block';
        renterInput.focus();
        renterInput.onblur = () => {
            const renter = renterInput.value;
            if (renter) {
                saveStatus(id, 'vermietet', renter);
            }
            renterInput.style.display = 'none';
        };
    } else {
        saveStatus(id, 'frei', '');
    }
};

// Funktion, um Status in Firebase zu speichern
window.saveStatus = (id, status, renter) => {
    const machineRef = ref(db, 'machines/' + id);
    update(machineRef, { status, renter });
    const statusSpan = document.getElementById(`status-${id}`);
    statusSpan.textContent = status === 'frei' ? 'Frei' : 'Vermietet an ' + renter;
    statusSpan.className = `status ${status === 'frei' ? 'status-frei' : 'status-vermietet'}`;
}

// Maschinen bei Seitenaufruf laden
fetchMachines();


