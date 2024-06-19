document.addEventListener('DOMContentLoaded', () => {
    const db = firebase.database();
    const machineList = document.getElementById('machine-items');

    const fetchMachines = async () => {
        const snapshot = await db.ref('machines').once('value');
        const machines = snapshot.val();
        machineList.innerHTML = '';
        for (const id in machines) {
            const machine = machines[id];
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${machine.name}</strong> - Status: <span id="status-${id}">${machine.status === 'frei' ? 'Frei' : 'Vermietet an ' + machine.renter}</span>
                <button onclick="updateStatus('${id}', 'frei')">Frei</button>
                <button onclick="updateStatus('${id}', 'vermietet')">Vermietet</button>
                <input type="text" id="renter-${id}" placeholder="Mieter" style="display: none;">
            `;
            machineList.appendChild(li);
        }
    };

    window.updateStatus = (id, status) => {
        const renterInput = document.getElementById(`renter-${id}`);
        if (status === 'vermietet') {
            renterInput.style.display = 'inline';
        } else {
            renterInput.style.display = 'none';
            saveStatus(id, status, '');
        }
    };

    window.saveStatus = (id, status, renter) => {
        db.ref('machines/' + id).update({ status, renter });
        const statusSpan = document.getElementById(`status-${id}`);
        statusSpan.textContent = status === 'frei' ? 'Frei' : 'Vermietet an ' + renter;
    };

    machineList.addEventListener('click', (event) => {
        if (event.target.tagName === 'BUTTON' && event.target.textContent === 'Vermietet') {
            const id = event.target.parentElement.querySelector('input').id.split('-')[1];
            const renter = prompt('Bitte geben Sie den Namen des Mieters ein:');
            if (renter) {
                saveStatus(id, 'vermietet', renter);
            }
        }
    });

    fetchMachines();
});
