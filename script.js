import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js';
import { getDatabase, ref, set, get, onValue } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js';

// Firebase-Konfiguration
const firebaseConfig = {
  apiKey: "AIzaSyCMWK0HDhzHstFW0jboW3PJJKVZqGGdUNM",
  authDomain: "test-9c709.firebaseapp.com",
  databaseURL: "https://test-9c709-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "test-9c709",
  storageBucket: "test-9c709.appspot.com",
  messagingSenderId: "658779221508",
  appId: "1:658779221508:web:24b3a2cdc6de02383bcf51"
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
    LKW: [],
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
        // Speichere die geöffneten Kategorien
        const openCategories = saveOpenCategories();

        // Maschinen in Kategorien einordnen
        for (const category in machineCategories) {
            machineCategories[category] = [];
        }

        snapshot.forEach((childSnapshot) => {
            const machineId = childSnapshot.key;
            const machineData = childSnapshot.val();
            const { name, renters = [], category } = machineData;

            const li = document.createElement('li');
            li.innerHTML = `
                <div>
                    <span>${name}</span>
                    <div id="renters-container-${machineId}"></div>
                    <input type="text" id="new-renter-${machineId}" placeholder="Neuer Mietername" style="display:none;">
                    <button onclick="changeStatus('${machineId}')">Neuen Mieter hinzufügen</button>
                </div>
            `;

            if (category in machineCategories) {
                machineCategories[category].push(li);
            }

            machineSections.innerHTML = ''; // Abschnitt leeren

            for (const category in machineCategories) {
                const section = document.createElement('section');
                section.innerHTML = `<h2>${category}</h2>`;
                section.querySelector('h2').addEventListener('click', toggleCategory);
                const ul = document.createElement('ul');
                ul.style.display = 'none';
                machineCategories[category].forEach(li => ul.appendChild(li));
                section.appendChild(ul);
                machineSections.appendChild(section);
            }

            // Wichtig: updateRentersUI erst nach dem Hinzufügen des Elements aufrufen
            updateRentersUI(machineId, renters);
        });

        // Wiederherstellen der geöffneten Kategorien
        restoreOpenCategories(openCategories);
    });
}

function updateRentersUI(machineId, renters) {
    const rentersContainer = document.getElementById(`renters-container-${machineId}`);
    rentersContainer.innerHTML = ''; // Leere den Container

    if (renters && renters.length > 0) {
        renters.forEach((renter, index) => {
            const renterElement = document.createElement('div');
            renterElement.className = 'renter-item';

            renterElement.innerHTML = `
                <span>${renter.name}</span>
                <span id="renter-status-${machineId}-${index}" class="status ${renter.status === 'frei' ? 'status-frei' : 'status-vermietet'}">${renter.status === 'frei' ? 'Frei' : 'Vermietet'}</span>
                <button onclick="changeRenterStatus('${machineId}', ${index})">Status ändern</button>
            `;

            rentersContainer.appendChild(renterElement);
        });
    } else {
        rentersContainer.innerHTML = '<p>Keine Mieter vorhanden</p>';
    }
}

// Funktion zum Ein- und Ausklappen der Kategorien
function toggleCategory(event) {
    const ul = event.target.nextElementSibling;
    ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
}

window.changeStatus = (machineId) => {
    const newRenterInput = document.getElementById(`new-renter-${machineId}`);
    newRenterInput.style.display = 'block';

    newRenterInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            saveStatus(machineId);
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    // Maschinen bei Seitenaufruf laden
    fetchMachines();
});

window.changeRenterStatus = async (machineId, renterIndex) => {
    // Speichere den Zustand der geöffneten Kategorien
    const openCategories = saveOpenCategories();

    const machineRef = ref(db, `machines/${machineId}/renters`);

    try {
        const snapshot = await get(machineRef);

        if (snapshot.exists()) {
            let renters = snapshot.val();

            // Mieter löschen
            renters.splice(renterIndex, 1);

            // Aktualisiere die Datenbank
            await set(machineRef, renters);

            // Aktualisiere die UI
            updateRentersUI(machineId, renters);

            // Stelle die geöffneten Kategorien wieder her
            restoreOpenCategories(openCategories);
        } else {
            console.error('No renters found for this machine.');
        }
    } catch (error) {
        console.error('Error changing renter status:', error);
    }
};

window.saveStatus = (machineId) => {
    const newRenterInput = document.getElementById(`new-renter-${machineId}`);
    const renterName = newRenterInput.value.trim();

    if (renterName === '') return;

    const machineRef = ref(db, `machines/${machineId}/renters`);
    
    // Zuerst aktuelle Liste der Mieter abrufen
    get(machineRef).then(snapshot => {
        const renters = snapshot.exists() ? snapshot.val() : [];
        
        renters.push({ name: renterName, status: 'vermietet' });

        // Aktualisierte Liste der Mieter speichern
        set(machineRef, renters).then(() => {
            updateRentersUI(machineId, renters);
            newRenterInput.value = '';  // Eingabefeld leeren
            newRenterInput.style.display = 'none';
        });
    }).catch(error => {
        console.error('Error adding renter:', error);
    });
};

// Hilfsfunktionen zum Speichern und Wiederherstellen der geöffneten Kategorien
function saveOpenCategories() {
    const openCategories = new Set();
    document.querySelectorAll('section').forEach(section => {
        const h2 = section.querySelector('h2');
        const ul = section.querySelector('ul');
        if (ul.style.display === 'block') {
            openCategories.add(h2.textContent);
        }
    });
    return openCategories;
}

function restoreOpenCategories(openCategories) {
    document.querySelectorAll('section').forEach(section => {
        const h2 = section.querySelector('h2');
        const ul = section.querySelector('ul');
        if (openCategories.has(h2.textContent)) {
            ul.style.display = 'block';
        } else {
            ul.style.display = 'none';
        }
    });
}
