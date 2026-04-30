if (!localStorage.getItem('nearnow_user')) {
    window.location.href = 'login.html';
}

let allEvents = [];
let activeCatFilter = 'All';

// Load all events including expired ones
function loadAllEvents() {
    fetch('/api/events/all')
        .then(r => r.json())
        .then(data => {
            allEvents = data;
            renderTables();
        });
}

function toggleCatFilter(cat, btn) {
    activeCatFilter = cat;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-active'));
    btn.classList.add('filter-active');
    renderTables();
}

function renderTables() {
    const search = document.getElementById('table-search').value.toLowerCase();

    let filtered = allEvents.filter(e => {
        const matchCat = activeCatFilter === 'All' || e.category === activeCatFilter;
        const matchSearch = !search ||
            e.title.toLowerCase().includes(search) ||
            e.createdBy.toLowerCase().includes(search);
        return matchCat && matchSearch;
    });

    const active  = filtered.filter(e => !e.expired);
    const expired = filtered.filter(e => e.expired);

    document.getElementById('active-count').textContent  = active.length;
    document.getElementById('expired-count').textContent = expired.length;

    renderRows('active-tbody', 'active-empty', active, false);
    renderRows('expired-tbody', 'expired-empty', expired, true);
}

function renderRows(tbodyId, emptyId, events, isExpired) {
    const tbody = document.getElementById(tbodyId);
    const empty = document.getElementById(emptyId);

    if (events.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    tbody.innerHTML = events.map((e, i) => {
        const postedAt  = e.createdAt ? new Date(e.createdAt).toLocaleString() : '—';
        const expiresAt = e.expiresAt ? new Date(e.expiresAt) : null;

        let timeCol = '—';
        if (!isExpired && expiresAt) {
            const diff = expiresAt - Date.now();
            if (diff > 0) {
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                timeCol = `<span class="expires-soon ${h < 1 ? 'red' : ''}">${h}h ${m}m left</span>`;
            } else {
                timeCol = '<span class="red">Expired</span>';
            }
        } else if (isExpired && expiresAt) {
            timeCol = expiresAt.toLocaleString();
        }

        const mapsUrl = `https://www.google.com/maps?q=${e.latitude},${e.longitude}`;

		return `
		    <tr class="${isExpired ? 'expired-row' : ''}">
		        <td>${i + 1}</td>
		        <td><strong>${e.title}</strong></td>
		        <td><span class="cat-badge cat-${e.category}">${e.category}</span></td>
		        <td class="desc-cell">${e.description || '—'}</td>
		        <td>${e.createdBy}</td>
		        <td>${postedAt}</td>
		        <td>${timeCol}</td>
		        <td><a href="${mapsUrl}" target="_blank" class="map-link">📍 View</a></td>
		        <td>
		            ${!isExpired ? `<button class="tbl-delete-btn" onclick="deleteFromTable(${e.id})">🗑 Delete</button>` : '—'}
		        </td>
		    </tr>`;
    }).join('');
}

// Real-time updates via WebSocket
function connectWebSocket() {
    const socket = new SockJS('http://localhost:8080/ws');
    const stomp = Stomp.over(socket);
    stomp.debug = null;
    stomp.connect({}, function() {
        stomp.subscribe('/topic/events', function(msg) {
            const event = JSON.parse(msg.body);
            allEvents.unshift(event);
            renderTables();
        });
        stomp.subscribe('/topic/expired', function(msg) {
            const data = JSON.parse(msg.body);
            const ev = allEvents.find(e => e.id === data.id);
            if (ev) { ev.expired = true; renderTables(); }
        });
    });
}

window.onload = function() {
    loadAllEvents();
    connectWebSocket();
};

function deleteFromTable(id) {
    if (!confirm('Delete this event?')) return;
    fetch(`/api/events/${id}`, { method: 'DELETE' })
        .then(r => {
            if (r.ok) {
                allEvents = allEvents.filter(e => e.id !== id);
                renderTables();
            }
        });
}