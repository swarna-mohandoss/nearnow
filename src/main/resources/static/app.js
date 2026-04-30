const API = 'http://localhost:8080/api/events';
const WS  = 'http://localhost:8080/ws';

let map, stompClient, pinDropMode = false, tempMarker = null;
let allMarkers = [];
let activeFilters = new Set(['Music','Food','Sports','Meetup','Art','Other']);

const categoryColors = {
  Music: '#8e24aa', Food: '#e65100', Sports: '#2e7d32',
  Meetup: '#1565c0', Art: '#c62828', Other: '#555'
};

function deleteEvent(id, e) {
    if (e) e.stopPropagation();
    if (!confirm('Delete this event?')) return;

    fetch(`${API}/${id}`, { method: 'DELETE' })
        .then(r => {
            if (r.ok) removeEventFromUI(id);
        });
}

function removeEventFromUI(id) {
    // Remove marker
    const idx = allMarkers.findIndex(m => m.event.id === id);
    if (idx !== -1) {
        map.removeLayer(allMarkers[idx].marker);
        allMarkers.splice(idx, 1);
    }
    // Remove card
    const card = document.querySelector(`.event-card[data-id="${id}"]`);
    if (card) card.remove();
}

function logout() {
  localStorage.removeItem('nearnow_user');
  window.location.href = 'login.html';
}

function loadUserCount() {
    fetch('/api/users/count')
        .then(r => r.json())
        .then(data => {
            document.getElementById('user-count').textContent = '👥 ' + data.count;
        });
}

function initMap() {
  map = L.map('map').setView([13.0827, 80.2707], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  map.on('click', function(e) {
    if (!pinDropMode) return;
    if (tempMarker) map.removeLayer(tempMarker);
    tempMarker = L.marker(e.latlng).addTo(map)
      .bindPopup('Your event here').openPopup();
    submitEvent(e.latlng.lat, e.latlng.lng);
  });
}

function connectWebSocket() {
  const socket = new SockJS(WS);
  stompClient = Stomp.over(socket);
  stompClient.debug = null;
  stompClient.connect({}, function() {
	// Listen for live user count updates
	stompClient.subscribe('/topic/users', function(msg) {
	    const count = JSON.parse(msg.body);
	    document.getElementById('user-count').textContent = '👥 ' + count;
	});
	// Listen for expired events
	stompClient.subscribe('/topic/expired', function(msg) {
	    const data = JSON.parse(msg.body);
	    removeExpiredEvent(data.id);
	});
	
	stompClient.subscribe('/topic/deleted', function(msg) {
	    const data = JSON.parse(msg.body);
	    removeEventFromUI(data.id);
	});
  });
}

function loadExistingEvents() {
  fetch(API)
    .then(r => r.json())
    .then(events => {
      events.forEach(e => {
        addEventToMap(e);
        addEventCard(e);
      });
    });
}

function addEventToMap(event) {
  const color = categoryColors[event.category] || '#555';
  const icon = L.divIcon({
    className: '',
    html: `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
    iconSize: [14, 14]
  });

  const marker = L.marker([event.latitude, event.longitude], { icon })
    .bindPopup(`<b>${event.title}</b><br>${event.category}<br><small>by ${event.createdBy}</small>`);

  // Show or hide immediately based on current filter state
  if (activeFilters.has(event.category)) {
    marker.addTo(map);
  }

  allMarkers.push({ event, marker });
}

function startPinDrop() {
  const title = document.getElementById('title').value.trim();
  const name  = document.getElementById('createdBy').value.trim();
  if (!title || !name) {
    alert('Please enter an event title and your name first!');
    return;
  }
  pinDropMode = true;
  document.getElementById('pin-btn').textContent = 'Click the map...';
  document.getElementById('pin-btn').classList.add('active');
  document.getElementById('pin-hint').style.display = 'block';
}

function submitEvent(lat, lng) {
    const eventDateTime = document.getElementById('eventDateTime').value;
    if (!eventDateTime) {
        alert('Please select the event date and time!');
        pinDropMode = false;
        document.getElementById('pin-btn').textContent = '📍 Drop a Pin';
        document.getElementById('pin-btn').classList.remove('active');
        document.getElementById('pin-hint').style.display = 'none';
        if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
        return;
    }

    const event = {
        title:       document.getElementById('title').value.trim(),
        description: document.getElementById('description').value.trim(),
        category:    document.getElementById('category').value,
        createdBy:   document.getElementById('createdBy').value.trim(),
        expiresAt:   eventDateTime,
        latitude:    lat,
        longitude:   lng
    };

    fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
    }).then(() => {
        pinDropMode = false;
        document.getElementById('pin-btn').textContent = '📍 Drop a Pin';
        document.getElementById('pin-btn').classList.remove('active');
        document.getElementById('pin-hint').style.display = 'none';
        document.getElementById('title').value = '';
        document.getElementById('description').value = '';
        document.getElementById('createdBy').value = '';
        document.getElementById('eventDateTime').value = '';
        if (tempMarker) { map.removeLayer(tempMarker); tempMarker = null; }
    });
}

function toggleFilter(category, btn) {
  const allCategories = ['Music','Food','Sports','Meetup','Art','Other'];
  const allActive = activeFilters.size === allCategories.length;

  if (allActive) {
    // First click on any button — show only that category
    activeFilters.clear();
    activeFilters.add(category);
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-active'));
    btn.classList.add('filter-active');
  } else if (activeFilters.has(category) && activeFilters.size === 1) {
    // Clicking the already-selected category — reset to show all
    allCategories.forEach(c => activeFilters.add(c));
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.add('filter-active'));
  } else {
    // Clicking a different category — switch to that one
    activeFilters.clear();
    activeFilters.add(category);
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-active'));
    btn.classList.add('filter-active');
  }

  // Apply to markers
  allMarkers.forEach(({ event, marker }) => {
    if (activeFilters.has(event.category)) {
      if (!map.hasLayer(marker)) marker.addTo(map);
    } else {
      if (map.hasLayer(marker)) map.removeLayer(marker);
    }
  });

  // Apply to cards
  document.querySelectorAll('.event-card').forEach(card => {
    card.style.display = activeFilters.has(card.getAttribute('data-category'))
      ? 'block' : 'none';
  });
}

function addEventCard(event) {
    const container = document.getElementById('events-container');
    const card = document.createElement('div');
    card.className = 'event-card';
    card.setAttribute('data-category', event.category);
    card.setAttribute('data-id', event.id);
    card.style.display = activeFilters.has(event.category) ? 'block' : 'none';

    const expiresAt = event.expiresAt ? new Date(event.expiresAt) : null;
    const expiresStr = expiresAt
        ? expiresAt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        : 'No expiry set';

    card.innerHTML = `
        <div class="card-top">
            <span class="cat-badge cat-${event.category}">${event.category}</span>
            <button class="delete-btn" onclick="deleteEvent(${event.id}, event)">🗑</button>
        </div>
        <h4>${event.title}</h4>
        <p>${event.description || ''}</p>
        <div class="meta">
            <span>by ${event.createdBy}</span>
            <span class="countdown" data-expires="${expiresAt ? expiresAt.getTime() : ''}">
                📅 ${expiresStr}
            </span>
        </div>
    `;
    card.onclick = (e) => {
        if (e.target.classList.contains('delete-btn')) return;
        map.setView([event.latitude, event.longitude], 15);
    };
    container.prepend(card);
}

window.onload = function() {
  if (!localStorage.getItem('nearnow_user')) {
    window.location.href = 'login.html';
    return;
  }
  initMap();
  connectWebSocket();
  loadExistingEvents();
  updateCountdowns();
  loadUserCount();
};

function removeExpiredEvent(id) {
    // Remove marker from map
    const idx = allMarkers.findIndex(m => m.event.id === id);
    if (idx !== -1) {
        map.removeLayer(allMarkers[idx].marker);
        allMarkers.splice(idx, 1);
    }
    // Remove card from sidebar
    const card = document.querySelector(`.event-card[data-id="${id}"]`);
    if (card) card.remove();
}

function updateCountdowns() {
    const now = Date.now();
    document.querySelectorAll('.countdown').forEach(el => {
        const expires = parseInt(el.getAttribute('data-expires'));
        const diff = expires - now;
        if (diff <= 0) {
            el.textContent = 'Expired';
            el.style.color = '#e74c3c';
        } else {
            const hours = Math.floor(diff / 3600000);
            const mins  = Math.floor((diff % 3600000) / 60000);
            el.textContent = hours > 0 ? `Expires in ${hours}h ${mins}m` : `Expires in ${mins}m`;
            el.style.color = hours < 1 ? '#e67e22' : '#aaa';
        }
    });
}

// Update countdowns every minute
setInterval(updateCountdowns, 60000);

let searchMarker = null;
let searchTimeout = null;

function searchPlace() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    const resultsBox = document.getElementById('search-results');
    resultsBox.innerHTML = '<p class="search-hint">Searching...</p>';

    fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=4&lang=en`)
        .then(r => r.json())
        .then(data => {
            resultsBox.innerHTML = '';
            if (!data.features || data.features.length === 0) {
                resultsBox.innerHTML = '<p class="search-hint">No results found.</p>';
                return;
            }
            data.features.forEach(function(feature) {
                const props = feature.properties;
                const coords = feature.geometry.coordinates;
                const name = [props.name, props.city, props.country]
                    .filter(Boolean).join(', ');

                const item = document.createElement('div');
                item.className = 'search-result-item';
                item.textContent = name;
                item.onclick = function() {
                    const latlng = L.latLng(coords[1], coords[0]);
                    map.flyTo(latlng, 15, { duration: 1.0 });

                    if (searchMarker) map.removeLayer(searchMarker);
                    searchMarker = L.marker(latlng, {
                        icon: L.divIcon({
                            className: '',
                            html: `<div style="background:#4a90e2;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
                            iconSize: [16, 16]
                        })
                    }).addTo(map).bindPopup(`<b>${name}</b>`).openPopup();

                    resultsBox.innerHTML = '';
                    document.getElementById('search-input').value = name;
                };
                resultsBox.appendChild(item);
            });
        })
        .catch(() => {
            resultsBox.innerHTML = '<p class="search-hint">Search failed. Try again.</p>';
        });
}