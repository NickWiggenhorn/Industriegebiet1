import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-app.js';
import { getDatabase, ref, set, get, onValue } from 'https://www.gstatic.com/firebasejs/9.17.1/firebase-database.js';

// Firebase-Konfiguration
const firebaseConfig = {
    apiKey: "AIzaSyB5tD2KDBZbGs7oB4WdoMkqmAlgxM7sySo",
    authDomain: "maschinenverwaltung-90424.firebaseapp.com",
    databaseURL: "https://maschinenverwaltung-90424-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "maschinenverwaltung-90424",
    storageBucket: "maschinenverwaltung-90424.appspot.com",
    messagingSenderId: "376541257307",
    appId: "1:376541257307:web:4da50eb9759e7c728e697e"
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
        const openCategories = saveOpenCategories();

        // Setze die Kategorien zurück
        for (const category in machineCategories) {
            machineCategories[category] = [];
        }

        // Iteriere durch die Maschinen und füge sie der jeweiligen Kategorie hinzu
        snapshot.forEach((childSnapshot) => {
            const machineId = childSnapshot.key;
            const machineData = childSnapshot.val();
            const { name, renters = [], category } = machineData;

            const li = document.createElement('li');

            // Zeige die richtigen Eingaben nur für die Container-Kategorie
            let additionalInputs = '';
            if (category === 'Container') {
                additionalInputs = `
                    <input type="text" id="new-renter-field1-${machineId}" placeholder="von" style="display:none;">
                    <input type="text" id="new-renter-field2-${machineId}" placeholder="zu" style="display:none;">
                    <input type="date" id="new-renter-date-${machineId}" placeholder="Datum" style="display:none;">
                    <input type="time" id="new-renter-time-${machineId}" placeholder="Uhrzeit" style="display:none;">
                `;
            } else {
                // Nur Mieternamen und Datum für andere Kategorien
                additionalInputs = `
                    <input type="text" id="new-renter-${machineId}" placeholder="Mieternamen" style="display:none;">
                    <input type="date" id="new-renter-date-${machineId}" placeholder="Datum" style="display:none;">
                `;
            }

            li.innerHTML = `
                <div>
                    <span>${name}</span>
                    <div id="renters-container-${machineId}"></div>
                    ${additionalInputs}
                    <button onclick="changeStatus('${machineId}', '${category}')">Neuen Mieter hinzufügen</button>
                    <button onclick="saveRenterWithDetails('${machineId}', '${category}')">Speichern</button>
                </div>
            `;

            // Maschine der richtigen Kategorie zuordnen
            if (category in machineCategories) {
                machineCategories[category].push(li);
            }

            // Abschnitt für jede Kategorie erstellen
            machineSections.innerHTML = '';
            for (const category in machineCategories) {
                const section = document.createElement('section');

                // Spezielle Klasse für Container-Kategorie hinzufügen
                if (category === 'Container') {
                    section.classList.add('container-category');
                }

                section.innerHTML = `<h2>${category}</h2>`;
                section.querySelector('h2').addEventListener('click', toggleCategory);

                const ul = document.createElement('ul');
                ul.style.display = 'none';  // Anfangs ausblenden
                machineCategories[category].forEach(li => ul.appendChild(li));
                section.appendChild(ul);
                machineSections.appendChild(section);
            }

            updateRentersUI(machineId, renters, category);
        });
        restoreOpenCategories(openCategories);
    });
}








function updateRentersUI(machineId, renters, category) {
    const rentersContainer = document.getElementById(`renters-container-${machineId}`);
    rentersContainer.className = 'renters-container';  
    rentersContainer.innerHTML = '';  // Leert den Container zuerst
    
    const rentersButton = document.createElement('button');
    rentersButton.textContent = renters.length > 0 ? 'Mieter anzeigen/verstecken' : 'Keine Mieter vorhanden';
    if(renters.length > 0){
        rentersButton.classList.add('toggle-renters');
    }else{
        rentersButton.classList.add('toggle-renters2');
    }
    rentersContainer.appendChild(rentersButton);

    // Erstelle einen Container für Mieter, der zunächst versteckt ist
    const rentersList = document.createElement('div');
    rentersList.style.display = 'none'; // Versteckt die Mieter zunächst
    
    rentersButton.addEventListener('click', () => {
        rentersList.style.display = rentersList.style.display === 'none' ? 'block' : 'none';
    });

    // Füge jeden Mieter hinzu
    if (renters && renters.length > 0) {
        renters.forEach((renter, index) => {
            const renterElement = document.createElement('div');
            renterElement.className = 'renter-item';

            let renterHTML = '';
            // Zusätzliche Felder für Container
            if (category === 'Container') {
                renterHTML = `
                    <span>von: ${renter.from}</span>
                    <span>zu: ${renter.to}</span>
                    <span>Datum: ${formatDate(renter.date)}</span>
                    <span>Uhrzeit: ${renter.time}</span>
                `;
            } else {
                renterHTML = `
                    <span>Mietername: ${renter.name}</span>
                    <span>Datum: ${formatDate(renter.date)}</span>
                `;
            }

            renterElement.innerHTML = renterHTML + `
                <button onclick="changeRenterStatus('${machineId}', ${index}, '${category}')">Status ändern</button>
            `;
            rentersList.appendChild(renterElement);
        });
    } else {
        rentersList.innerHTML = '<p>Keine Mieter vorhanden</p>';
    }

    rentersContainer.appendChild(rentersList);
}



// Funktion zum Ein- und Ausklappen der Kategorien
function toggleCategory(event) {
    const ul = event.target.nextElementSibling;
    ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
}

window.changeStatus = (machineId, category) => {
    console.log('changeStatus aufgerufen für:', machineId, category);
    
    const nameInput = document.getElementById(`new-renter-${machineId}`);
    const dateInput = document.getElementById(`new-renter-date-${machineId}`);
    const fromInput = document.getElementById(`new-renter-field1-${machineId}`);
    const toInput = document.getElementById(`new-renter-field2-${machineId}`);
    const timeInput = document.getElementById(`new-renter-time-${machineId}`);

    if (category === 'Container') {
        // Zeige "von", "zu", Datum und Uhrzeit für Container
        fromInput.style.display = 'block';  // Zeige das "von"-Feld
        toInput.style.display = 'block';    // Zeige das "zu"-Feld
        dateInput.style.display = 'block';  // Zeige das Datumsfeld
        timeInput.style.display = 'block';  // Zeige das Uhrzeitfeld
        nameInput.style.display = 'none';   // Verstecke das Mieternamenfeld für Container
    } else {
        // Zeige nur Mieternamen und Datum für andere Kategorien
        nameInput.style.display = 'block';  // Mieternamenfeld anzeigen
        dateInput.style.display = 'block';  // Datumsfeld anzeigen

        // Verstecke die Felder "von", "zu" und Uhrzeit für andere Kategorien
        fromInput.style.display = 'none';   // Verstecke "von"
        toInput.style.display = 'none';     // Verstecke "zu"
        timeInput.style.display = 'none';   // Verstecke Uhrzeit
    }
};










document.addEventListener('DOMContentLoaded', () => {
    // Maschinen bei Seitenaufruf laden
    fetchMachines();
});

window.changeRenterStatus = async (machineId, renterIndex, category) => {
    // Zeige eine Bestätigungsaufforderung, bevor der Mieter gelöscht wird
    const confirmation = confirm('Sind Sie sicher, dass Sie diesen Mieter löschen möchten?');
    
    if (!confirmation) {
        // Wenn der Benutzer nicht bestätigt, wird das Löschen abgebrochen
        return;
    }

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

            // Aktualisiere die UI, übergebe die Kategorie, damit es bei Container korrekt funktioniert
            updateRentersUI(machineId, renters, category);

            // Stelle die geöffneten Kategorien wieder her
            restoreOpenCategories(openCategories);
        } else {
            console.error('Keine Mieter für diese Maschine gefunden.');
        }
    } catch (error) {
        console.error('Fehler beim Ändern des Mieterstatus:', error);
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

window.saveTransport = (machineId) => {
    const dateInput = document.getElementById(`date-${machineId}`);
    const statusSelect = document.getElementById(`status-${machineId}`);
    const transportDate = dateInput.value;
    const transportStatus = statusSelect.value;

    if (!transportDate || !transportStatus) {
        alert('Bitte Datum und Status eingeben.');
        return;
    }

    const machineRef = ref(db, `machines/${machineId}/transports`);

    get(machineRef).then(snapshot => {
        const transports = snapshot.exists() ? snapshot.val() : [];

        transports.push({ date: transportDate, status: transportStatus });

        set(machineRef, transports).then(() => {
            alert('Transportdaten erfolgreich gespeichert.');
            dateInput.value = '';
            statusSelect.selectedIndex = 0;
        });
    }).catch(error => {
        console.error('Error adding transport:', error);
    });
};

window.saveRenterWithDetails = (machineId, category) => {
    let renterName = '';
    let rentDate = '';
    let rentTime = '';
    let fromField = '';
    let toField = '';

    if (category === 'Container') {
        // Für Container: "von", "zu", Datum und Uhrzeit erfassen
        const fromInput = document.getElementById(`new-renter-field1-${machineId}`);
        const toInput = document.getElementById(`new-renter-field2-${machineId}`);
        const dateInput = document.getElementById(`new-renter-date-${machineId}`);
        const timeInput = document.getElementById(`new-renter-time-${machineId}`);
        
        fromField = fromInput.value;
        toField = toInput.value;
        rentDate = dateInput.value;
        rentTime = timeInput.value;

        if (!fromField || !toField || !rentDate || !rentTime) {
            alert('Bitte füllen Sie alle Felder aus.');
            return;
        }
    } else {
        // Für andere Kategorien: Mieternamen und Datum erfassen
        const nameInput = document.getElementById(`new-renter-${machineId}`);
        const dateInput = document.getElementById(`new-renter-date-${machineId}`);
        
        renterName = nameInput ? nameInput.value.trim() : '';
        rentDate = dateInput.value;

        if (!renterName || !rentDate) {
            alert('Bitte Mieternamen und Datum eingeben.');
            return;
        }
    }

    const machineRef = ref(db, `machines/${machineId}/renters`);

    get(machineRef).then(snapshot => {
        const renters = snapshot.exists() ? snapshot.val() : [];

        let renterDetails;

        if (category === 'Container') {
            // Speichern der Container-Daten
            renterDetails = {
                from: fromField,
                to: toField,
                date: rentDate,
                time: rentTime
            };
        } else {
            // Speichern der Daten für andere Kategorien (nur Name und Datum)
            renterDetails = {
                name: renterName,
                date: rentDate
            };
        }

        renters.push(renterDetails);

        set(machineRef, renters).then(() => {
            updateRentersUI(machineId, renters, category);
            
            // Felder zurücksetzen
            if (category === 'Container') {
                document.getElementById(`new-renter-field1-${machineId}`).value = '';
                document.getElementById(`new-renter-field2-${machineId}`).value = '';
                document.getElementById(`new-renter-date-${machineId}`).value = '';
                document.getElementById(`new-renter-time-${machineId}`).value = '';
            } else {
                document.getElementById(`new-renter-${machineId}`).value = '';
                document.getElementById(`new-renter-date-${machineId}`).value = '';
            }
        });
    }).catch(error => {
        console.error('Fehler beim Hinzufügen des Mieters:', error);
    });
};

// Hilfsfunktion zum Formatieren des Datums
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');  // Monate beginnen bei 0
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;  // Format: TT-MM-JJJJ
}











