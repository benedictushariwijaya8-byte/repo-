// State
let participants = [];
let itinerary = [];
let flights = [];
let packingList = [];
let chartInstance = null;

// DOM Elements
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

// Helper
const formatMoney = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// --- TAB SWITCHING ---
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.getAttribute('data-tab')).classList.add('active');
    });
});

// --- PARTICIPANTS ---
const pForm = document.getElementById('participant-form');
const pList = document.getElementById('participant-list');

pForm.addEventListener('submit', e => {
    e.preventDefault();
    participants.push({
        id: generateId(),
        name: document.getElementById('part-name').value,
        phone: document.getElementById('part-phone').value,
        gender: document.getElementById('part-gender').value
    });
    pForm.reset();
    renderParticipants();
    populateItineraryFormDropdowns();
    updateBudget();
});

const removeParticipant = (id) => {
    participants = participants.filter(p => p.id !== id);
    renderParticipants();
    populateItineraryFormDropdowns();
    updateBudget();
};
window.removeParticipant = removeParticipant;

const renderParticipants = () => {
    pList.innerHTML = '';
    participants.forEach(p => {
        const div = document.createElement('div');
        div.className = 'participant-card';
        div.innerHTML = `
            <strong>${p.name}</strong>
            <span style="font-size:0.85rem; color:#64748b;">${p.phone || 'No phone'} &bull; ${p.gender}</span>
            <button class="del-btn" onclick="removeParticipant('${p.id}')">&times;</button>
        `;
        pList.appendChild(div);
    });
};

// --- ITINERARY ---
const iForm = document.getElementById('add-form');
const iList = document.getElementById('itinerary-list');
const paidBySelect = document.getElementById('paid-by');
const splitBoxContainer = document.getElementById('split-checkboxes');

const populateItineraryFormDropdowns = () => {
    paidBySelect.innerHTML = participants.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    
    if (participants.length === 0) {
        splitBoxContainer.innerHTML = '<p style="font-size:0.8rem; color:#64748b;">Add participants first to see them here.</p>';
    } else {
        splitBoxContainer.innerHTML = participants.map(p => `
            <label class="checkbox-item">
                <input type="checkbox" value="${p.id}" class="split-check" checked> ${p.name}
            </label>
        `).join('');
    }
};

iForm.addEventListener('submit', e => {
    e.preventDefault();
    const splitBoxes = document.querySelectorAll('.split-check:checked');
    const splitAmong = Array.from(splitBoxes).map(cb => cb.value);
    
    if (splitAmong.length === 0) { alert('Please select at least one person who consumed this.'); return; }
    
    const editId = document.getElementById('edit-id').value;
    const itemData = {
        id: editId || generateId(),
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        category: document.getElementById('category').value,
        activity: document.getElementById('activity').value,
        place: document.getElementById('place').value,
        price: parseFloat(document.getElementById('price').value) || 0,
        paidBy: document.getElementById('paid-by').value,
        splitAmong: splitAmong,
        image: document.getElementById('image').value || null,
        notes: document.getElementById('notes').value
    };

    if (editId) {
        const idx = itinerary.findIndex(i => i.id === editId);
        if (idx !== -1) itinerary[idx] = itemData;
        
        // Reset edit UI
        document.getElementById('edit-id').value = '';
        document.getElementById('itinerary-form-title').textContent = 'Add Activity';
        document.getElementById('submit-btn').textContent = 'Add to Itinerary';
        document.getElementById('cancel-edit-btn').style.display = 'none';
        iForm.reset();
        populateItineraryFormDropdowns();
    } else {
        itinerary.push(itemData);
        // Soft reset
        document.getElementById('activity').value = '';
        document.getElementById('place').value = '';
        document.getElementById('price').value = '';
    }
    
    itinerary.sort((a,b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));
    renderItinerary();
    updateBudget();
});

document.getElementById('cancel-edit-btn').addEventListener('click', () => {
    document.getElementById('edit-id').value = '';
    document.getElementById('itinerary-form-title').textContent = 'Add Activity';
    document.getElementById('submit-btn').textContent = 'Add to Itinerary';
    document.getElementById('cancel-edit-btn').style.display = 'none';
    iForm.reset();
    populateItineraryFormDropdowns();
});

const removeItinerary = (id) => {
    itinerary = itinerary.filter(i => i.id !== id);
    renderItinerary();
    updateBudget();
};
window.removeItinerary = removeItinerary;

const editItinerary = (id) => {
    const item = itinerary.find(i => i.id === id);
    if (!item) return;
    
    document.getElementById('edit-id').value = item.id;
    document.getElementById('date').value = item.date;
    document.getElementById('time').value = item.time;
    document.getElementById('category').value = item.category;
    document.getElementById('activity').value = item.activity;
    document.getElementById('place').value = item.place;
    document.getElementById('price').value = item.price;
    document.getElementById('paid-by').value = item.paidBy;
    document.getElementById('image').value = item.image || '';
    document.getElementById('notes').value = item.notes || '';
    
    // Check boxes
    document.querySelectorAll('.split-check').forEach(cb => {
        cb.checked = item.splitAmong.includes(cb.value);
    });

    document.getElementById('itinerary-form-title').textContent = 'Edit Activity';
    document.getElementById('submit-btn').textContent = 'Save Changes';
    document.getElementById('cancel-edit-btn').style.display = 'block';
    
    // Switch to itinerary tab if not already there (smooth UI)
    tabs[1].click();
    window.scrollTo(0, document.getElementById('itinerary-form-title').offsetTop);
};
window.editItinerary = editItinerary;

const renderItinerary = () => {
    iList.innerHTML = '';
    if (itinerary.length === 0) {
        iList.innerHTML = '<p style="text-align:center; padding:2rem;">No activities planned yet!</p>';
        return;
    }

    itinerary.forEach(item => {
        const div = document.createElement('div');
        div.className = 'itinerary-item';
        
        let imageHtml = item.image ? `<img src="${item.image}" alt="Activity" class="item-image" onerror="this.style.display='none'">` : '';
        const paidByName = participants.find(p => p.id === item.paidBy)?.name || 'Someone';
        const splitNames = item.splitAmong.map(id => participants.find(p=>p.id===id)?.name).filter(Boolean).join(', ');

        div.innerHTML = `
            ${imageHtml}
            <div class="item-details">
                <div class="item-time-cat">${new Date(item.date).toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'})} at ${item.time} &bull; ${item.category}</div>
                <div class="item-title">${item.activity}</div>
                <div class="item-place">📍 ${item.place}</div>
                ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
            </div>
            <div class="item-right">
                <div class="item-price">${formatMoney(item.price)}</div>
                <div class="item-split">Paid by: ${paidByName}</div>
                <div class="item-split">Split with: ${splitNames || 'No one'}</div>
                <div class="action-btns">
                    <button class="edit-btn" onclick="editItinerary('${item.id}')">Edit</button>
                    <button class="remove-btn" onclick="removeItinerary('${item.id}')">Remove</button>
                </div>
            </div>
        `;
        iList.appendChild(div);
    });
};

// --- BUDGET & CHART ---
const updateBudget = () => {
    // 1. Total & Chart
    const totalGroup = itinerary.reduce((sum, i) => sum + i.price, 0);
    document.getElementById('total-cost').textContent = formatMoney(totalGroup);

    const breakdown = {};
    itinerary.forEach(item => {
        breakdown[item.category] = (breakdown[item.category] || 0) + item.price;
    });

    const categories = Object.keys(breakdown);
    const amounts = Object.values(breakdown);

    if (chartInstance) chartInstance.destroy();
    
    // Setup Chart.js
    const ctx = document.getElementById('categoryChart').getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categories.length ? categories : ['No Data'],
            datasets: [{
                data: amounts.length ? amounts : [1],
                backgroundColor: amounts.length ? ['#0ea87d', '#0284c7', '#f59e0b', '#8b5cf6', '#ef4444'] : ['#e2e8f0']
            }]
        },
        options: { plugins: { legend: { position: 'bottom' } } }
    });

    // 2. Splitwise Logic
    calculateSettlements();
};

const calculateSettlements = () => {
    if(participants.length === 0) {
        document.getElementById('settlements-list').innerHTML = '<p>No participants to settle.</p>';
        document.getElementById('balances-list').innerHTML = '';
        return;
    }

    const balances = {};
    participants.forEach(p => balances[p.id] = 0);

    itinerary.forEach(item => {
        if(balances[item.paidBy] !== undefined) {
            balances[item.paidBy] += item.price;
        }
        const perPersonEaten = item.price / item.splitAmong.length;
        item.splitAmong.forEach(id => {
            if(balances[id] !== undefined) balances[id] -= perPersonEaten;
        });
    });

    // Balances List Rendering
    const balList = document.getElementById('balances-list');
    balList.innerHTML = '';
    
    let debtors = [];
    let creditors = [];

    participants.forEach(p => {
        const bal = balances[p.id];
        const clr = bal > 0.01 ? 'positive' : (bal < -0.01 ? 'negative' : '');
        balList.innerHTML += `<div class="balance-card ${clr}"><span>${p.name}</span> <span>${formatMoney(bal)}</span></div>`;
        
        if (bal > 0.01) creditors.push({ id: p.id, name: p.name, amount: bal });
        else if (bal < -0.01) debtors.push({ id: p.id, name: p.name, amount: Math.abs(bal) });
    });

    // Greedy settlement
    const settlements = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
        const debt = debtors[i];
        const cred = creditors[j];
        const minAmt = Math.min(debt.amount, cred.amount);
        
        if (minAmt > 0) {
            settlements.push({ from: debt.name, to: cred.name, amount: minAmt });
        }
        
        debt.amount -= minAmt;
        cred.amount -= minAmt;
        
        if (debt.amount < 0.01) i++;
        if (cred.amount < 0.01) j++;
    }

    const setList = document.getElementById('settlements-list');
    if (settlements.length === 0) {
        setList.innerHTML = '<div class="settlement-card" style="justify-content:center;">Everyone is settled up!</div>';
    } else {
        setList.innerHTML = settlements.map(s => `
            <div class="settlement-card">
                <div><span>${s.from}</span> owes <span>${s.to}</span></div> 
                <div class="amount">${formatMoney(s.amount)}</div>
            </div>
        `).join('');
    }
};

// --- FLIGHTS ---
const fForm = document.getElementById('flight-form');
const fList = document.getElementById('flights-list');

fForm.addEventListener('submit', e => {
    e.preventDefault();
    flights.push({
        id: generateId(),
        pnr: document.getElementById('f-pnr').value,
        airline: document.getElementById('f-airline').value,
        num: document.getElementById('f-num').value,
        date: document.getElementById('f-date').value,
        dep: document.getElementById('f-dep').value,
        arr: document.getElementById('f-arr').value,
        status: document.getElementById('f-status').value,
        gate: document.getElementById('f-gate').value
    });
    fForm.reset();
    renderFlights();
});

const removeFlight = (id) => {
    flights = flights.filter(f => f.id !== id);
    renderFlights();
};
window.removeFlight = removeFlight;

const renderFlights = () => {
    fList.innerHTML = '';
    flights.forEach(f => {
        const div = document.createElement('div');
        div.className = 'flight-card';
        let stColor = f.status === 'On Time' ? 'green' : (f.status === 'Delayed' ? 'red' : 'gray');
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem; font-weight:bold;">
                <span style="font-size:1.2rem; color:var(--primary-blue)">${f.airline} &bull; ${f.num}</span>
                <span style="background:${f.status==='On Time'?'#dcfce7':(f.status==='Delayed'?'#fee2e2':'#f1f5f9')}; padding:0.2rem 0.5rem; border-radius:5px; color:${stColor}; font-size:0.8rem;">${f.status}</span>
            </div>
            <div style="font-size:0.9rem;"><strong>PNR:</strong> <span style="letter-spacing:1px">${f.pnr}</span></div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem; background:#f8fafc; padding:0.5rem; border-radius:5px; margin-top:0.5rem; font-size:0.9rem;">
                <div><strong>Dep:</strong> ${f.dep}</div>
                <div><strong>Arr:</strong> ${f.arr}</div>
                <div style="grid-column: span 2"><strong>Gate/Terminal:</strong> ${f.gate || 'TBA'}</div>
            </div>
            <button class="del-btn" onclick="removeFlight('${f.id}')">&times;</button>
        `;
        fList.appendChild(div);
    });
};

// --- NOTES ---
document.getElementById('save-notes-btn').addEventListener('click', () => {
    const msg = document.getElementById('notes-saved-msg');
    msg.style.display = 'block';
    setTimeout(() => msg.style.display='none', 2000);
});

// --- PACKING LIST ---
const pckForm = document.getElementById('packing-form');
const pckContainer = document.getElementById('packing-container');

pckForm.addEventListener('submit', e => {
    e.preventDefault();
    packingList.push({ id: generateId(), text: document.getElementById('pack-item').value, done: false });
    pckForm.reset();
    renderPacking();
});

const removePack = (id) => { packingList = packingList.filter(p=>p.id!==id); renderPacking(); };
window.removePack = removePack;

const togglePack = (id, state) => {
    const item = packingList.find(p=>p.id===id);
    if(item) item.done = state;
    renderPacking();
};
window.togglePack = togglePack;

const renderPacking = () => {
    pckContainer.innerHTML = '';
    packingList.forEach(p => {
        const div = document.createElement('div');
        div.className = `pack-item ${p.done ? 'checked' : ''}`;
        div.innerHTML = `
            <input type="checkbox" onchange="togglePack('${p.id}', this.checked)" ${p.done ? 'checked' : ''}>
            <span>${p.text}</span>
            <button class="del-btn" onclick="removePack('${p.id}')">&times;</button>
        `;
        pckContainer.appendChild(div);
    });
};

// --- INIT MOCK DATA ---
const initData = () => {
    const p1 = generateId(), p2 = generateId(), p3 = generateId();
    participants = [
        { id: p1, name: 'Ben', phone: '+1 234', gender: 'Male' },
        { id: p2, name: 'Rita', phone: '+1 456', gender: 'Female' },
        { id: p3, name: 'Lia', phone: '+1 789', gender: 'Female' }
    ];
    
    itinerary = [{
        id: generateId(), date: new Date().toISOString().split('T')[0], time: '18:00',
        category: 'Food', activity: 'Dinner', place: 'Riverside Cafe', price: 60,
        paidBy: p1, splitAmong: [p1, p2], // Lia didn't eat
        notes: 'Lia joined but did not eat'
    }];
    
    packingList = [
        { id: generateId(), text: 'Passport', done: true },
        { id: generateId(), text: 'Sunscreen', done: false }
    ];
    
    flights = [{
        id: generateId(), pnr: 'XYZ123', airline: 'Thai Airways', num: 'TG 101',
        date: new Date().toISOString().split('T')[0], dep: 'JFK 10:00 AM', arr: 'BKK 11:30 PM', status: 'On Time', gate: 'T4'
    }];
    
    renderParticipants();
    populateItineraryFormDropdowns();
    renderItinerary();
    updateBudget();
    renderFlights();
    renderPacking();
};

initData();
