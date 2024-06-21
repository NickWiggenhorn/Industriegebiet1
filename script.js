import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

// Firebase-Konfiguration (ersetze mit deinen eigenen Daten)
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
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Referenz auf die Maschinen-Datenbank
const machinesRef = db.ref('machines');

// Maschinenliste DOM-Element
const machineList = document.getElementById('machine-items');

// Funktion zum Anzeigen der Maschinen in der Liste
function displayMachines(machines) {
    machineList.innerHTML = '';
    machines.forEach((machine) => {
        const { name, status, renter } = machine;
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${name}</strong> - Status: ${status === 'frei' ? 'Frei' : 'Vermietet'}${status === 'vermietet' ? ` an ${renter}` : ''}
        `;
        machineList.appendChild(li);
    });
}

// Daten von Firebase abrufen und anzeigen
machinesRef.on('value', (snapshot) => {
    const machinesData = snapshot.val();
    const machinesArray = machinesData ? Object.values(machinesData) : [];
    displayMachines(machinesArray);
});

// Formular zur Bearbeitung/Erstellung von Maschinen
const editMachineForm = document.getElementById('edit-machine-form');

editMachineForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const machineId = document.getElementById('machine-id').value;
    const machineName = document.getElementById('machine-name').value;
    const machineStatus = document.getElementById('machine-status').value;
    const machineRenter = document.getElementById('machine-renter').value;

    if (machineId) {
        // Maschine aktualisieren
        const machineRef = db.ref(`machines/${machineId}`);
        machineRef.set({
            name: machineName,
            status: machineStatus,
            renter: machineRenter
        }).then(() => {
            console.log('Maschine erfolgreich aktualisiert.');
        }).catch((error) => {
            console.error('Fehler beim Aktualisieren der Maschine:', error);
        });
    } else {
        // Neue Maschine hinzufügen
        const newMachineRef = machinesRef.push();
        newMachineRef.set({
            name: machineName,
            status: machineStatus,
            renter: machineRenter
        }).then(() => {
            console.log('Neue Maschine erfolgreich hinzugefügt.');
        }).catch((error) => {
            console.error('Fehler beim Hinzufügen der Maschine:', error);
        });
    }

    // Formular zurücksetzen
    editMachineForm.reset();
    document.getElementById('machine-id').value = '';
});

// Abbrechen-Button im Formular
const cancelButton = document.getElementById('cancel-edit');

cancelButton.addEventListener('click', () => {
    editMachineForm.reset();
    document.getElementById('machine-id').value = '';
});
