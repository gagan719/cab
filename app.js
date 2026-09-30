/**
 * InstantCab Frontend Application (app.js)
 * Complete client-side controller, API integration, routing, and interactive modals.
 */

(function () {
  'use strict';

  // ============================================================
  // API CLIENT
  // ============================================================
  const api = {
    async request(endpoint, options = {}) {
      const config = {
        headers: { 'Content-Type': 'application/json' },
        ...options
      };
      if (config.body && typeof config.body === 'object') {
        config.body = JSON.stringify(config.body);
      }
      try {
        const res = await fetch(endpoint, config);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Server error ' + res.status);
        return data;
      } catch (err) {
        console.warn(`API call to ${endpoint} failed:`, err.message);
        throw err;
      }
    },
    get(url) { return this.request(url, { method: 'GET' }); },
    post(url, body) { return this.request(url, { method: 'POST', body }); },
    put(url, body) { return this.request(url, { method: 'PUT', body }); },
    delete(url) { return this.request(url, { method: 'DELETE' }); }
  };

  // State
  let currentUser = {
    firstName: 'Ananya',
    lastName: 'Sharma',
    email: 'ananya.sharma@example.in',
    phone: '+91 98765 43210',
    avatarText: 'AS'
  };
  let currentTrips = [];
  let currentFilter = 'all';
  let activeRide = null;
  let activeEtaTimer = null;

  // ============================================================
  // ROUTING & NAVIGATION
  // ============================================================
  const pages = {
    'home': 'page-home',
    'about': 'page-about',
    'cities': 'page-cities',
    'blog': 'page-blog',
    'careers': 'page-careers',
    'press': 'page-press',
    'contact': 'page-contact',
    'notification': 'page-notification',
    'dashboard': 'page-dashboard',
    'trips': 'page-trips',
    'wallet': 'page-wallet',
    'profile': 'page-profile',
    'help': 'page-help',
    'safety': 'page-safety',
    'tracking': 'page-tracking',
    'login': 'page-login'
  };

  function normalizeRoute(route) {
    let normalized = (route || '').toString().trim();
    if (!normalized) return 'home';
    while (normalized.charAt(0) === '#' || normalized.charAt(0) === '/') {
      normalized = normalized.slice(1);
    }
    normalized = normalized.replace(/^\/+/, '').replace(/\/+$/, '');
    if (!normalized) return 'home';
    return normalized.split('/')[0] || 'home';
  }

  function navigate(route) {
    const safeRoute = normalizeRoute(route);
    const pageId = pages[safeRoute] || 'page-404';

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById(pageId);
    if (el) el.classList.add('active');

    // Update nav active link
    document.querySelectorAll('#mainNav a').forEach(a => {
      a.classList.toggle('active', a.dataset.route === safeRoute);
    });

    window.scrollTo(0, 0);

    // Close mobile menu if open
    const mm = document.getElementById('mobileMenu');
    if (mm && mm.classList.contains('open')) {
      mm.classList.remove('open');
      const mt = document.getElementById('menuToggle');
      if (mt) {
        mt.setAttribute('aria-expanded', 'false');
        const icon = mt.querySelector('i');
        if (icon) icon.className = 'fas fa-bars';
      }
    }

    // Trigger page-specific data fetchers
    handlePageActivation(safeRoute);
  }

  function handleHash() {
    const rawHash = window.location.hash || '';
    const hash = normalizeRoute(rawHash);
    navigate(hash);
  }

  function goToRoute(route, event) {
    if (event) event.preventDefault();
    if (!route) return;
    const safeRoute = normalizeRoute(route);
    const newHash = '#/' + safeRoute;
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    } else {
      navigate(safeRoute);
    }
  }

  window.addEventListener('hashchange', handleHash);

  // Hook all route links
  function bindRouteLinks() {
    document.querySelectorAll('a[href^="#/"]').forEach(anchor => {
      anchor.addEventListener('click', function (event) {
        const href = anchor.getAttribute('href') || '';
        const route = href.replace(/^#\/?/, '').trim();
        if (route && (pages[route] || route === '404')) {
          event.preventDefault();
          goToRoute(route, event);
        }
      });
    });
  }

  // ============================================================
  // USER & AUTHENTICATION
  // ============================================================
  async function initAuth() {
    try {
      const data = await api.get('/api/auth/me');
      if (data && data.user) {
        currentUser = data.user;
        updateUserUI();
      }
    } catch (e) {
      updateUserUI();
    }
  }

  function updateUserUI() {
    const avatarEls = document.querySelectorAll('.user-menu-avatar, #headerAvatar, .profile-avatar-large, .profile-photo');
    const nameEls = document.querySelectorAll('.user-name, #headerUserName, #dropdownUserName');
    const emailEls = document.querySelectorAll('#dropdownUserEmail');
    const greetingEl = document.querySelector('.dash-header h1');

    const fullName = `${currentUser.firstName} ${currentUser.lastName || ''}`.trim();
    const initials = currentUser.avatarText || (currentUser.firstName[0] + (currentUser.lastName ? currentUser.lastName[0] : '')).toUpperCase();

    avatarEls.forEach(el => { el.textContent = initials; });
    nameEls.forEach(el => { el.textContent = currentUser.firstName; });
    emailEls.forEach(el => { el.textContent = currentUser.email || 'ananya.sharma@example.in'; });

    if (greetingEl) {
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : (hour < 17 ? 'afternoon' : 'evening');
      greetingEl.innerHTML = `Good ${timeOfDay}, ${currentUser.firstName} 👋`;
    }

    // Toggle header sign in / profile
    const authBtn = document.getElementById('headerAuthBtn');
    const userMenuWrapper = document.getElementById('userMenuWrapper');
    if (authBtn && userMenuWrapper) {
      if (currentUser.id) {
        authBtn.style.display = 'none';
        userMenuWrapper.style.display = 'inline-block';
      } else {
        authBtn.style.display = 'inline-flex';
        userMenuWrapper.style.display = 'none';
      }
    }
  }

  window.toggleUserDropdown = function (event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const dropdown = document.getElementById('userDropdownMenu');
    if (dropdown) {
      dropdown.classList.toggle('show');
    }
  };

  // Close dropdown on outside click
  document.addEventListener('click', function (e) {
    const dropdown = document.getElementById('userDropdownMenu');
    const userMenuBtn = document.getElementById('userMenuBtn');
    if (dropdown && dropdown.classList.contains('show')) {
      if (userMenuBtn && !userMenuBtn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('show');
      }
    }
  });

  window.handleLogout = async function () {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {}
    currentUser = { firstName: 'Guest', lastName: '', email: '', avatarText: 'G' };
    updateUserUI();
    const dropdown = document.getElementById('userDropdownMenu');
    if (dropdown) dropdown.classList.remove('show');
    showToast('You have been signed out.');
    goToRoute('login');
  };

  // ============================================================
  // PAGE ACTIVATION HANDLERS
  // ============================================================
  function handlePageActivation(route) {
    switch (route) {
      case 'dashboard':
        loadDashboardData();
        break;
      case 'trips':
        loadTripsData();
        break;
      case 'wallet':
        loadWalletData();
        break;
      case 'profile':
        loadProfileData();
        break;
      case 'tracking':
        loadTrackingData();
        break;
      case 'notification':
        loadNotificationsData();
        break;
    }
    // Update unread notification count badge in header
    updateNotificationBadge();
  }

  // ============================================================
  // DASHBOARD PAGE
  // ============================================================
  async function loadDashboardData() {
    updateUserUI();
    try {
      // 1. Load active ride for 'Your next ride'
      const activeRes = await api.get('/api/rides/active');
      const activeContainer = document.querySelector('#page-dashboard .panel .ride-card');
      if (activeContainer && activeRes && activeRes.active) {
        const ride = activeRes.active;
        activeRide = ride;
        activeContainer.innerHTML = `
          <div class="ride-map" aria-hidden="true" style="cursor:pointer;" onclick="window.location.hash='#/tracking'"><i class="fas fa-map"></i></div>
          <div class="ride-info">
            <span class="ride-status"><span class="pulse" aria-hidden="true"></span> ${ride.statusLabel}</span>
            <h4>${ride.driverName} · ${ride.vehicleModel} · ${ride.plateNumber}</h4>
            <div class="ride-route"><i class="fas fa-circle" style="color:#2563eb;" aria-hidden="true"></i> ${ride.pickup} <i class="fas fa-arrow-right" aria-hidden="true"></i> <i class="fas fa-location-dot" style="color:#ef4444;" aria-hidden="true"></i> ${ride.dropoff}</div>
            <div class="ride-meta">
              <span><i class="fas fa-clock" aria-hidden="true"></i> Arrives in ${ride.etaMinutes || 3} min</span>
              <span><i class="fas fa-indian-rupee-sign" aria-hidden="true"></i> ₹${ride.fare.total} fixed</span>
              <span><i class="fas fa-star" style="color:#f59e0b;" aria-hidden="true"></i> ${ride.driverRating} (${ride.driverTotalRides} rides)</span>
            </div>
          </div>
          <div class="ride-actions">
            <button class="btn-sm outline" onclick="window.openChatModal();"><i class="fas fa-comment" aria-hidden="true"></i> Chat</button>
            <a href="tel:${ride.driverPhone || '+918079412662'}" class="btn-sm outline" style="text-decoration:none;"><i class="fas fa-phone" aria-hidden="true"></i> Call</a>
            <a href="details.html?id=${ride.id}" class="btn-sm primary" style="text-decoration:none;"><i class="fas fa-receipt"></i> Details</a>
          </div>
        `;
      }

      // 2. Load recent trips
      const tripsRes = await api.get('/api/rides');
      const recentList = document.querySelector('#page-dashboard .trip-list');
      if (recentList && tripsRes && tripsRes.rides) {
        const recents = tripsRes.rides.slice(0, 4);
        recentList.innerHTML = recents.map(r => `
          <div class="trip-item clickable" onclick="window.location.href='details.html?id=${r.id}'">
            <div class="trip-icon" aria-hidden="true"><i class="fas fa-car-side"></i></div>
            <div class="trip-details">
              <div class="route">${r.pickup} → ${r.dropoff}</div>
              <div class="meta"><span><i class="fas fa-calendar" aria-hidden="true"></i> ${r.date}</span><span><i class="fas fa-clock" aria-hidden="true"></i> ${r.durationMins || 15} min</span></div>
            </div>
            <div class="trip-amount">
              <div class="price">₹${r.fare ? r.fare.total : 180}</div>
              <div class="status ${r.status}">${r.statusLabel || r.status}</div>
            </div>
          </div>
        `).join('');
      }

      // 3. Load wallet balance in dashboard sidebar
      const walletRes = await api.get('/api/wallet');
      if (walletRes) {
        const walletBal = document.querySelector('#page-dashboard .wallet-amount');
        if (walletBal) walletBal.textContent = `₹${walletRes.balance.toLocaleString('en-IN')}`;
      }
    } catch (err) {
      console.warn('Dashboard load error:', err);
    }
  }

  // ============================================================
  // MY TRIPS PAGE
  // ============================================================
  async function loadTripsData() {
    try {
      const data = await api.get('/api/rides');
      if (data && data.rides) {
        currentTrips = data.rides;
        renderTripsList();
        updateTripsSummary();
      }
    } catch (err) {
      console.warn('Trips load error:', err);
    }
  }

  function renderTripsList() {
    const listEl = document.querySelector('#page-trips .trip-list');
    if (!listEl) return;

    const searchInput = document.querySelector('#page-trips .trip-search input');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let filtered = currentTrips;

    // Status filter
    if (currentFilter !== 'all') {
      filtered = filtered.filter(t => t.status.toLowerCase() === currentFilter.toLowerCase());
    }

    // Search query filter
    if (query) {
      filtered = filtered.filter(t =>
        t.id.toLowerCase().includes(query) ||
        t.pickup.toLowerCase().includes(query) ||
        t.dropoff.toLowerCase().includes(query) ||
        (t.driverName && t.driverName.toLowerCase().includes(query))
      );
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div style="padding:48px 20px; text-align:center; color:#6b7280;">
          <i class="fas fa-car-side" style="font-size:2.5rem; color:#cbd5e1; margin-bottom:12px; display:block;"></i>
          <h4 style="font-size:1.1rem; color:#111827; margin-bottom:4px;">No trips found</h4>
          <p style="font-size:0.9rem;">No rides match your current filter or search criteria.</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(t => {
      const isAirport = t.dropoff.toLowerCase().includes('airport') || t.pickup.toLowerCase().includes('airport');
      const icon = isAirport ? 'fa-plane' : 'fa-car-side';
      return `
        <div class="trip-item clickable" onclick="window.location.href='details.html?id=${t.id}'" title="Click to view full receipt & details">
          <div class="trip-icon" aria-hidden="true"><i class="fas ${icon}"></i></div>
          <div class="trip-details">
            <div class="route" style="display:flex; align-items:center; gap:8px;">
              <span>${t.pickup} → ${t.dropoff}</span>
              <span style="font-size:0.75rem; color:#2563eb; font-weight:700; background:#eff6ff; padding:1px 6px; border-radius:4px;">#${t.id}</span>
            </div>
            <div class="meta">
              <span><i class="fas fa-calendar" aria-hidden="true"></i> ${t.date}</span>
              <span>${t.vehicleClass || 'Comfort'} · ${t.driverName || 'Driver'} · ${t.distanceKm || 5} km</span>
            </div>
          </div>
          <div class="trip-amount">
            <div class="price">₹${t.fare ? t.fare.total : 180}</div>
            <div class="status ${t.status}">${t.statusLabel || t.status}</div>
          </div>
          <div style="color:#9ca3af; font-size:0.85rem; padding-left:12px;">
            <i class="fas fa-chevron-right"></i>
          </div>
        </div>
      `;
    }).join('');
  }

  function updateTripsSummary() {
    const countEl = document.querySelector('#page-trips .summary-card:nth-child(1) .value');
    const spentEl = document.querySelector('#page-trips .summary-card:nth-child(2) .value');
    const distEl = document.querySelector('#page-trips .summary-card:nth-child(3) .value');

    const totalCount = currentTrips.length + 140; // Historical base
    const totalSpent = currentTrips.reduce((sum, t) => sum + (t.fare ? t.fare.total : 0), 124000);
    const totalDist = currentTrips.reduce((sum, t) => sum + (t.distanceKm || 0), 2800);

    if (countEl) countEl.textContent = totalCount;
    if (spentEl) spentEl.textContent = `₹${totalSpent.toLocaleString('en-IN')}`;
    if (distEl) distEl.textContent = `${Math.round(totalDist).toLocaleString('en-IN')} km`;
  }

  // Trip Filter tabs
  const tripFilters = document.querySelectorAll('.trip-filter');
  tripFilters.forEach(btn => {
    btn.addEventListener('click', function () {
      tripFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const text = btn.textContent.trim().toLowerCase();
      currentFilter = text === 'all' ? 'all' : (text === 'refunds' ? 'refunded' : text);
      renderTripsList();
    });
  });

  // Search input in trips
  const tripSearch = document.querySelector('#page-trips .trip-search input');
  if (tripSearch) {
    tripSearch.addEventListener('input', renderTripsList);
  }

  // Export CSV
  window.exportTripsCSV = function () {
    if (!currentTrips || currentTrips.length === 0) {
      showToast('No trips to export.');
      return;
    }

    const headers = ['Trip ID', 'Date', 'Pickup', 'Dropoff', 'Vehicle Class', 'Driver', 'Fare (INR)', 'Status'];
    const rows = currentTrips.map(t => [
      t.id,
      `"${t.date}"`,
      `"${t.pickup}"`,
      `"${t.dropoff}"`,
      `"${t.vehicleClass}"`,
      `"${t.driverName}"`,
      t.fare ? t.fare.total : 0,
      t.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'instantcab_trips_' + new Date().toISOString().slice(0, 10) + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Trips exported successfully!');
  };

  // ============================================================
  // WALLET PAGE
  // ============================================================
  async function loadWalletData() {
    try {
      const data = await api.get('/api/wallet');
      if (!data) return;

      // Update balances
      const balEls = document.querySelectorAll('.wallet-hero .amount, .wallet-card .wallet-amount');
      balEls.forEach(el => { el.textContent = `₹${data.balance.toLocaleString('en-IN')}`; });

      // Update Saved Cards
      const cardsContainer = document.querySelector('#page-wallet .card-body');
      if (cardsContainer && data.cards) {
        const cardsHtml = data.cards.map(c => `
          <div class="trip-item" style="padding:16px 0; border-bottom:1px solid #f3f4f6;">
            <div class="trip-icon" style="background:#f0f4ff; color:#2563eb;" aria-hidden="true"><i class="fas fa-credit-card"></i></div>
            <div class="trip-details">
              <div class="route">${c.bank} •••• ${c.last4}</div>
              <div class="meta">Expires ${c.expiry} · ${c.holder} ${c.isDefault ? '· <span style="color:#2563eb; font-weight:700;">Default</span>' : ''}</div>
            </div>
            <div class="trip-actions" style="display:flex; gap:8px;">
              ${!c.isDefault ? `<button class="btn-sm outline" onclick="window.setDefaultCard('${c.id}')">Set default</button>` : ''}
              <button class="btn-sm outline" style="color:#ef4444; border-color:#fca5a5;" onclick="window.deleteCard('${c.id}')"><i class="fas fa-trash"></i></button>
            </div>
          </div>
        `).join('');

        cardsContainer.innerHTML = cardsHtml + `
          <button class="btn-secondary" style="width:100%; margin-top:16px; border-style:dashed;" onclick="window.openAddCardModal();">
            <i class="fas fa-plus" aria-hidden="true"></i> Add a new card
          </button>
        `;
      }

      // Update Transactions
      const txnsContainer = document.querySelector('#page-wallet .card:last-child .card-body');
      if (txnsContainer && data.transactions) {
        txnsContainer.innerHTML = data.transactions.map(t => {
          const isCredit = t.amount > 0;
          const color = isCredit ? '#16a34a' : '#111827';
          const icon = t.type === 'topup' ? 'fa-plus' : (t.type === 'referral' ? 'fa-gift' : 'fa-car-side');
          const iconBg = isCredit ? '#f0fdf4' : '#eff6ff';
          const iconColor = isCredit ? '#16a34a' : '#2563eb';
          return `
            <div class="trip-item" style="padding:16px 0; border-bottom:1px solid #f3f4f6;">
              <div class="trip-icon" style="background:${iconBg}; color:${iconColor};" aria-hidden="true"><i class="fas ${icon}"></i></div>
              <div class="trip-details">
                <div class="route">${t.title}</div>
                <div class="meta">${t.subtitle}</div>
              </div>
              <div class="trip-amount" style="color:${color}; font-weight:700; font-size:1rem;">
                ${isCredit ? '+' : ''}₹${Math.abs(t.amount).toLocaleString('en-IN')}
              </div>
            </div>
          `;
        }).join('');
      }
    } catch (err) {
      console.warn('Wallet load error:', err);
    }
  }

  window.setDefaultCard = async function (id) {
    try {
      await api.put(`/api/wallet/cards/${id}/default`);
      showToast('Default payment card updated.');
      loadWalletData();
    } catch (e) {
      showToast('Failed to update card.');
    }
  };

  window.deleteCard = async function (id) {
    if (!confirm('Are you sure you want to remove this card?')) return;
    try {
      await api.delete(`/api/wallet/cards/${id}`);
      showToast('Card removed.');
      loadWalletData();
    } catch (e) {
      showToast('Failed to remove card.');
    }
  };

  // ============================================================
  // PROFILE PAGE
  // ============================================================
  async function loadProfileData() {
    try {
      const data = await api.get('/api/profile');
      if (!data) return;

      if (data.user) {
        currentUser = data.user;
        updateUserUI();

        const fn = document.getElementById('profileFirstName');
        const ln = document.getElementById('profileLastName');
        const em = document.getElementById('profileEmail');
        const ph = document.getElementById('profilePhone');
        const ad = document.getElementById('profileAddress');

        if (fn) fn.value = currentUser.firstName || '';
        if (ln) ln.value = currentUser.lastName || '';
        if (em) em.value = currentUser.email || '';
        if (ph) ph.value = currentUser.phone || '';
        if (ad) ad.value = currentUser.address || '';
      }
    } catch (err) {
      console.warn('Profile load error:', err);
    }
  }

  window.saveProfileChanges = async function (event) {
    if (event) event.preventDefault();
    const firstName = document.getElementById('profileFirstName')?.value;
    const lastName = document.getElementById('profileLastName')?.value;
    const email = document.getElementById('profileEmail')?.value;
    const phone = document.getElementById('profilePhone')?.value;
    const address = document.getElementById('profileAddress')?.value;

    try {
      const res = await api.put('/api/profile', { firstName, lastName, email, phone, address });
      if (res && res.user) {
        currentUser = res.user;
        updateUserUI();
        showToast('Profile updated successfully!');
      }
    } catch (err) {
      showToast('Error saving profile: ' + err.message);
    }
  };

  // ============================================================
  // TRACKING PAGE
  // ============================================================
  async function loadTrackingData() {
    try {
      const data = await api.get('/api/rides/active');
      if (data && data.active) {
        activeRide = data.active;
        renderActiveRide();
      }
    } catch (err) {
      console.warn('Tracking load error:', err);
    }
  }

  function renderActiveRide() {
    if (!activeRide) return;

    // Driver details
    const driverName = document.querySelector('#page-tracking .sidebar div div div[style*="font-size:1.1rem"]');
    if (driverName) driverName.textContent = activeRide.driverName;

    const vehicleModel = document.querySelector('#page-tracking div[style*="font-size:0.92rem"]');
    if (vehicleModel) vehicleModel.textContent = activeRide.vehicleModel;

    const plate = document.querySelector('#page-tracking span[style*="border:1px solid #d1d5db"]');
    if (plate) plate.textContent = activeRide.plateNumber;

    // Route
    const pickupLoc = document.querySelector('#page-tracking div[style*="MG Road"]');
    const pickupDesc = document.querySelector('#page-tracking div[style*="1247, 100 Feet Road"]');
    if (pickupDesc) pickupDesc.textContent = activeRide.pickup;
    if (pickupLoc) pickupLoc.textContent = activeRide.dropoff;

    // ETA
    const etaVal = document.querySelector('#page-tracking .eta-value');
    if (etaVal) etaVal.textContent = (activeRide.etaMinutes || 3) + ' min';

    // Fare breakdown
    if (activeRide.fare) {
      const totalFare = document.querySelector('#page-tracking span[style*="color:#2563eb; font-size:1.25rem"]');
      if (totalFare) totalFare.textContent = `₹${activeRide.fare.total}`;
    }

    // Start simulated ETA countdown
    startEtaCountdown();
  }

  function startEtaCountdown() {
    if (activeEtaTimer) clearInterval(activeEtaTimer);
    let secondsLeft = (activeRide?.etaMinutes || 3) * 60;

    activeEtaTimer = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        clearInterval(activeEtaTimer);
        const etaVal = document.querySelector('#page-tracking .eta-value');
        if (etaVal) etaVal.textContent = 'Arrived!';
        showToast('Your driver Rajesh has arrived at the pickup location!');
      } else {
        const mins = Math.ceil(secondsLeft / 60);
        const etaVal = document.querySelector('#page-tracking .eta-value');
        if (etaVal) etaVal.textContent = mins + ' min';
      }
    }, 20000); // Progressively update
  }

  window.cancelActiveRide = async function () {
    if (!activeRide) return;
    if (!confirm('Are you sure you want to cancel this ride? Refund will be credited to your wallet.')) return;

    try {
      await api.post(`/api/rides/${activeRide.id}/cancel`);
      showToast('Ride cancelled. Fare refunded to your InstantCab Wallet.');
      activeRide = null;
      goToRoute('dashboard');
    } catch (err) {
      showToast('Failed to cancel: ' + err.message);
    }
  };

  // ============================================================
  // NOTIFICATIONS PAGE
  // ============================================================
  async function loadNotificationsData() {
    try {
      const data = await api.get('/api/notifications');
      if (!data) return;

      const card = document.querySelector('#page-notification .notification-card');
      if (card && data.notifications && data.notifications.length > 0) {
        const notif = data.notifications[0]; // Most recent
        card.innerHTML = `
          <div class="notification-header">
            <div class="brand-section">
              <div class="brand-icon"><i class="fas fa-car-side"></i></div>
              <div class="brand-text">InstantCab<span> · Updates</span></div>
            </div>
            <div class="timestamp">
              <i class="far fa-clock" style="margin-right: 5px; font-size: 0.7rem;"></i> ${notif.time || 'just now'}
            </div>
          </div>

          <div class="status-badge">
            <i class="fas fa-circle"></i> ${notif.title.toUpperCase()}
          </div>

          <div class="notification-message">
            <i class="fas fa-check-circle"></i> ${notif.message}
          </div>

          ${notif.pickup ? `
            <div class="ride-detail">
              <div class="detail-item">
                <i class="fas fa-map-pin"></i>
                <span class="detail-label">Pickup</span>
                <span class="detail-value">${notif.pickup}</span>
              </div>
              <div class="divider-dot"><i class="fas fa-arrow-right"></i></div>
              <div class="detail-item">
                <i class="fas fa-flag-checkered"></i>
                <span class="detail-label">Drop</span>
                <span class="detail-value">${notif.dropoff || 'Destination'}</span>
              </div>
            </div>
          ` : ''}

          <div class="notification-actions">
            <button class="btn btn-secondary" onclick="window.markNotificationsRead();">
              <i class="fas fa-check-double"></i> Mark all read
            </button>
            <a href="${notif.route || '#/tracking'}" class="btn btn-primary">
              <i class="fas fa-arrow-right"></i> Open Details
            </a>
          </div>
        `;
      }
    } catch (err) {
      console.warn('Notifications load error:', err);
    }
  }

  window.markNotificationsRead = async function () {
    try {
      await api.post('/api/notifications/clear');
      showToast('All notifications marked as read.');
      updateNotificationBadge();
    } catch (e) {}
  };

  async function updateNotificationBadge() {
    try {
      const data = await api.get('/api/notifications');
      const badge = document.getElementById('navNotifBadge');
      if (badge && data) {
        if (data.unreadCount > 0) {
          badge.style.display = 'flex';
          badge.textContent = data.unreadCount;
          badge.className = 'notif-badge count';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch (e) {}
  }

  // ============================================================
  // CONTACT FORM
  // ============================================================
  window.submitContactForm = async function (form) {
    const topic = document.getElementById('contactTopic')?.value;
    const firstName = document.getElementById('contactFirstName')?.value;
    const lastName = document.getElementById('contactLastName')?.value;
    const email = document.getElementById('contactEmail')?.value;
    const subject = document.getElementById('contactSubject')?.value;
    const message = document.getElementById('contactMessage')?.value;

    try {
      const res = await api.post('/api/contact', { topic, firstName, lastName, email, subject, message });
      showToast(res.message || 'Thank you! We received your message.');
      form.reset();
    } catch (err) {
      showToast('Error sending message: ' + err.message);
    }
  };

  // ============================================================
  // BOOKING MODAL & WORKFLOW
  // ============================================================
  let selectedVehicleClass = 'Comfort';
  let estimatedFares = {};

  window.openBookingModal = async function (preferredClass, defaultPickup, defaultDropoff) {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;

    if (preferredClass) selectedVehicleClass = preferredClass;

    const pickupInput = document.getElementById('modalPickup');
    const dropoffInput = document.getElementById('modalDropoff');

    const heroPickup = document.getElementById('pickup')?.value;
    const heroDropoff = document.getElementById('dropoff')?.value;
    const qbPickup = document.getElementById('qbPickup')?.value;
    const qbDropoff = document.getElementById('qbDropoff')?.value;

    if (pickupInput) pickupInput.value = defaultPickup || heroPickup || qbPickup || currentUser.address || 'Indiranagar, Bengaluru';
    if (dropoffInput) dropoffInput.value = defaultDropoff || heroDropoff || qbDropoff || 'Kempegowda International Airport';

    modal.classList.add('open');
    await calculateModalEstimates();
  };

  window.closeBookingModal = function () {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.classList.remove('open');
  };

  window.selectVehicleOption = function (vehicleClass) {
    selectedVehicleClass = vehicleClass;
    document.querySelectorAll('.fleet-option-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.class === vehicleClass);
    });
    updateBookingSummary();
  };

  async function calculateModalEstimates() {
    const pickup = document.getElementById('modalPickup')?.value || 'Indiranagar';
    const dropoff = document.getElementById('modalDropoff')?.value || 'Kempegowda Airport';

    try {
      const data = await api.post('/api/rides/estimate', { pickup, dropoff });
      if (data && data.estimates) {
        document.getElementById('modalDistanceMeta').textContent = `${data.distanceKm} km · ~${data.durationMins} min`;

        data.estimates.forEach(est => {
          estimatedFares[est.type] = est.fare;
          const priceEl = document.querySelector(`.fleet-option-card[data-class="${est.type}"] .fleet-option-price`);
          if (priceEl) priceEl.textContent = `₹${est.fare}`;
        });

        selectVehicleOption(selectedVehicleClass);
      }
    } catch (err) {
      console.warn('Fare estimate error:', err);
    }
  }

  function updateBookingSummary() {
    const price = estimatedFares[selectedVehicleClass] || 240;
    const summaryEl = document.getElementById('modalTotalFare');
    if (summaryEl) summaryEl.textContent = `₹${price}`;
  }

  window.confirmRideBooking = async function () {
    const pickup = document.getElementById('modalPickup')?.value;
    const dropoff = document.getElementById('modalDropoff')?.value;
    const paymentMethod = document.getElementById('modalPaymentMethod')?.value || 'InstantCab Wallet';

    if (!pickup || !dropoff) {
      showToast('Please enter both pickup and destination.');
      return;
    }

    const btn = document.getElementById('btnConfirmBooking');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Finding driver…';
    }

    try {
      const res = await api.post('/api/rides/book', {
        pickup,
        dropoff,
        vehicleClass: selectedVehicleClass,
        paymentMethod
      });

      if (res && res.ride) {
        activeRide = res.ride;
        closeBookingModal();
        showToast(`Ride booked! ${res.ride.driverName} is arriving in 3 min.`);
        goToRoute('tracking');
      }
    } catch (err) {
      showToast('Booking failed: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-bolt"></i> Confirm &amp; Book Taxi';
      }
    }
  };

  // ============================================================
  // WALLET TOP-UP MODAL
  // ============================================================
  window.openAddFundsModal = function () {
    const modal = document.getElementById('addFundsModal');
    if (modal) modal.classList.add('open');
  };

  window.closeAddFundsModal = function () {
    const modal = document.getElementById('addFundsModal');
    if (modal) modal.classList.remove('open');
  };

  window.selectAmountChip = function (amount, btn) {
    document.querySelectorAll('.amount-chip').forEach(c => c.classList.remove('active'));
    if (btn) btn.classList.add('active');
    const input = document.getElementById('topupAmountInput');
    if (input) input.value = amount;
  };

  window.submitWalletTopup = async function () {
    const input = document.getElementById('topupAmountInput');
    const amount = Number(input?.value);
    const method = document.getElementById('topupMethodSelect')?.value || 'HDFC Bank •••• 4242';

    if (!amount || amount <= 0) {
      showToast('Please enter a valid amount.');
      return;
    }

    try {
      const res = await api.post('/api/wallet/topup', { amount, paymentMethod: method });
      showToast(res.message);
      closeAddFundsModal();
      loadWalletData();
    } catch (err) {
      showToast('Topup failed: ' + err.message);
    }
  };

  // ============================================================
  // ADD CARD MODAL
  // ============================================================
  window.openAddCardModal = function () {
    const modal = document.getElementById('addCardModal');
    if (modal) modal.classList.add('open');
  };

  window.closeAddCardModal = function () {
    const modal = document.getElementById('addCardModal');
    if (modal) modal.classList.remove('open');
  };

  window.submitAddCard = async function () {
    const bank = document.getElementById('cardBankName')?.value;
    const number = document.getElementById('cardNumber')?.value;
    const expiry = document.getElementById('cardExpiry')?.value;
    const holder = document.getElementById('cardHolder')?.value;

    if (!bank || !number || number.length < 4) {
      showToast('Please enter valid bank and card number.');
      return;
    }

    try {
      await api.post('/api/wallet/cards', { bank, last4: number.slice(-4), expiry, holder });
      showToast('Payment card added successfully!');
      closeAddCardModal();
      loadWalletData();
    } catch (err) {
      showToast('Failed to add card: ' + err.message);
    }
  };

  // ============================================================
  // DRIVER CHAT MODAL
  // ============================================================
  window.openChatModal = function () {
    const modal = document.getElementById('chatModal');
    if (modal) modal.classList.add('open');
  };

  window.closeChatModal = function () {
    const modal = document.getElementById('chatModal');
    if (modal) modal.classList.remove('open');
  };

  window.sendChatMessage = function (customText) {
    const input = document.getElementById('chatMessageInput');
    const text = customText || input?.value;
    if (!text || !text.trim()) return;

    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;

    // Append rider bubble
    const riderBubble = document.createElement('div');
    riderBubble.className = 'chat-bubble rider';
    riderBubble.textContent = text;
    container.appendChild(riderBubble);
    if (input) input.value = '';
    container.scrollTop = container.scrollHeight;

    // Automated driver response simulation
    setTimeout(() => {
      const driverBubble = document.createElement('div');
      driverBubble.className = 'chat-bubble driver';

      const replies = [
        "Understood! I'm 2 minutes away, driving the White Dzire.",
        "Got it, looking out for you at the entrance!",
        "Traffic is light, almost there.",
        "Sure, no problem! Take your time.",
        "I'm pulling up right now with hazard lights on."
      ];
      driverBubble.textContent = replies[Math.floor(Math.random() * replies.length)];
      container.appendChild(driverBubble);
      container.scrollTop = container.scrollHeight;
    }, 1200);
  };

  // ============================================================
  // SCHEDULE, SAVED PLACES & SPLIT FARE MODALS
  // ============================================================
  window.openScheduleModal = function () {
    document.getElementById('scheduleRideModal')?.classList.add('open');
  };
  window.closeScheduleModal = function () {
    document.getElementById('scheduleRideModal')?.classList.remove('open');
  };

  window.openSavedPlacesModal = function () {
    document.getElementById('savedPlacesModal')?.classList.add('open');
  };
  window.closeSavedPlacesModal = function () {
    document.getElementById('savedPlacesModal')?.classList.remove('open');
  };

  window.openSplitFareModal = function () {
    document.getElementById('splitFareModal')?.classList.add('open');
  };
  window.closeSplitFareModal = function () {
    document.getElementById('splitFareModal')?.classList.remove('open');
  };

  // ============================================================
  // INJECT MODAL HTML ELEMENTS INTO DOM
  // ============================================================
  function injectAppModals() {
    if (document.getElementById('bookingModal')) return;

    const modalContainer = document.createElement('div');
    modalContainer.id = 'appModalsContainer';
    modalContainer.innerHTML = `
      <!-- Booking Modal -->
      <div class="app-modal-overlay" id="bookingModal" role="dialog" aria-modal="true" aria-labelledby="modalBookingTitle">
        <div class="app-modal-dialog">
          <div class="app-modal-header">
            <h3 id="modalBookingTitle"><i class="fas fa-car" style="color:#2563eb;"></i> Choose Your Ride</h3>
            <button class="app-modal-close" onclick="window.closeBookingModal();" aria-label="Close modal"><i class="fas fa-times"></i></button>
          </div>
          <div class="app-modal-body">
            <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:16px;">
              <div class="booking-input" style="border:1px solid #e5e7eb; background:#fff;">
                <i class="fas fa-circle-dot" style="color:#2563eb;"></i>
                <input id="modalPickup" type="text" placeholder="Pickup location" onchange="calculateModalEstimates();">
              </div>
              <div class="booking-input" style="border:1px solid #e5e7eb; background:#fff;">
                <i class="fas fa-location-dot" style="color:#ef4444;"></i>
                <input id="modalDropoff" type="text" placeholder="Where to?" onchange="calculateModalEstimates();">
              </div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem; color:#6b7280; margin-bottom:8px;">
              <span>Available options</span>
              <span id="modalDistanceMeta" style="font-weight:600; color:#111827;">8.5 km · ~24 min</span>
            </div>

            <div class="booking-fleet-options">
              <div class="fleet-option-card" data-class="Economy" onclick="window.selectVehicleOption('Economy');">
                <div class="fleet-option-left">
                  <div class="fleet-option-icon"><i class="fas fa-car"></i></div>
                  <div>
                    <div class="fleet-option-title">Economy</div>
                    <div class="fleet-option-meta">Compact &amp; affordable · 4 seats · 3m away</div>
                  </div>
                </div>
                <div>
                  <div class="fleet-option-price">₹180</div>
                  <div class="fleet-option-unit">Fixed fare</div>
                </div>
              </div>

              <div class="fleet-option-card selected" data-class="Comfort" onclick="window.selectVehicleOption('Comfort');">
                <div class="fleet-option-left">
                  <div class="fleet-option-icon"><i class="fas fa-car-side"></i></div>
                  <div>
                    <div class="fleet-option-title">Comfort <span style="font-size:0.7rem; background:#eff6ff; color:#2563eb; padding:2px 6px; border-radius:4px; font-weight:700;">POPULAR</span></div>
                    <div class="fleet-option-meta">Extra legroom &amp; A/C · 4 seats · 4m away</div>
                  </div>
                </div>
                <div>
                  <div class="fleet-option-price">₹240</div>
                  <div class="fleet-option-unit">Fixed fare</div>
                </div>
              </div>

              <div class="fleet-option-card" data-class="Premium SUV" onclick="window.selectVehicleOption('Premium SUV');">
                <div class="fleet-option-left">
                  <div class="fleet-option-icon"><i class="fas fa-truck-pickup"></i></div>
                  <div>
                    <div class="fleet-option-title">Premium SUV</div>
                    <div class="fleet-option-meta">Toyota Innova Crysta · 6 seats · 5m away</div>
                  </div>
                </div>
                <div>
                  <div class="fleet-option-price">₹380</div>
                  <div class="fleet-option-unit">Fixed fare</div>
                </div>
              </div>
            </div>

            <div style="margin-top:16px;">
              <label style="font-size:0.8rem; font-weight:700; color:#6b7280; text-transform:uppercase; margin-bottom:6px; display:block;">Payment Method</label>
              <select id="modalPaymentMethod" class="form-select" style="width:100%; padding:10px; border-radius:8px; border:1px solid #d1d5db; font-size:0.9rem;">
                <option value="InstantCab Wallet">InstantCab Wallet (Balance: ₹2,850)</option>
                <option value="HDFC Bank •••• 4242">HDFC Bank •••• 4242 (Default)</option>
                <option value="SBI Card •••• 1005">SBI Card •••• 1005</option>
                <option value="Cash">Cash to driver</option>
              </select>
            </div>
          </div>
          <div class="app-modal-footer" style="justify-content:space-between;">
            <div>
              <span style="font-size:0.75rem; color:#6b7280; display:block;">Total Upfront</span>
              <span id="modalTotalFare" style="font-size:1.3rem; font-weight:800; color:#2563eb;">₹240</span>
            </div>
            <button class="btn-primary" id="btnConfirmBooking" onclick="window.confirmRideBooking();" style="padding:12px 24px;">
              <i class="fas fa-bolt"></i> Confirm &amp; Book Taxi
            </button>
          </div>
        </div>
      </div>

      <!-- Add Funds Modal -->
      <div class="app-modal-overlay" id="addFundsModal" role="dialog" aria-modal="true">
        <div class="app-modal-dialog" style="max-width:440px;">
          <div class="app-modal-header">
            <h3><i class="fas fa-wallet" style="color:#2563eb;"></i> Add Funds to Wallet</h3>
            <button class="app-modal-close" onclick="window.closeAddFundsModal();"><i class="fas fa-times"></i></button>
          </div>
          <div class="app-modal-body">
            <p style="font-size:0.9rem; color:#6b7280; margin-bottom:14px;">Instant top-up for fast, one-tap payments on all rides.</p>
            
            <div class="amount-chips">
              <button type="button" class="amount-chip" onclick="window.selectAmountChip(100, this);">+₹100</button>
              <button type="button" class="amount-chip" onclick="window.selectAmountChip(250, this);">+₹250</button>
              <button type="button" class="amount-chip active" onclick="window.selectAmountChip(500, this);">+₹500</button>
              <button type="button" class="amount-chip" onclick="window.selectAmountChip(1000, this);">+₹1,000</button>
              <button type="button" class="amount-chip" onclick="window.selectAmountChip(2000, this);">+₹2,000</button>
            </div>

            <label style="font-size:0.8rem; font-weight:700; color:#6b7280; text-transform:uppercase; margin-bottom:6px; display:block;">Amount (₹)</label>
            <input type="number" id="topupAmountInput" value="500" min="50" step="50" class="form-input" style="width:100%; font-size:1.2rem; font-weight:700; padding:12px; margin-bottom:16px;">

            <label style="font-size:0.8rem; font-weight:700; color:#6b7280; text-transform:uppercase; margin-bottom:6px; display:block;">Payment Source</label>
            <select id="topupMethodSelect" class="form-select" style="width:100%; padding:10px; border-radius:8px; border:1px solid #d1d5db; font-size:0.9rem;">
              <option value="HDFC Bank •••• 4242">HDFC Bank •••• 4242</option>
              <option value="ICICI Bank •••• 8801">ICICI Bank •••• 8801</option>
              <option value="UPI / GPay / PhonePe">UPI (GPay / PhonePe / Paytm)</option>
              <option value="Net Banking">Net Banking (All Indian Banks)</option>
            </select>
          </div>
          <div class="app-modal-footer">
            <button class="btn-secondary" onclick="window.closeAddFundsModal();">Cancel</button>
            <button class="btn-primary" onclick="window.submitWalletTopup();"><i class="fas fa-check"></i> Add Funds Now</button>
          </div>
        </div>
      </div>

      <!-- Add Card Modal -->
      <div class="app-modal-overlay" id="addCardModal" role="dialog" aria-modal="true">
        <div class="app-modal-dialog" style="max-width:440px;">
          <div class="app-modal-header">
            <h3><i class="fas fa-credit-card" style="color:#2563eb;"></i> Add Payment Card</h3>
            <button class="app-modal-close" onclick="window.closeAddCardModal();"><i class="fas fa-times"></i></button>
          </div>
          <div class="app-modal-body">
            <div style="display:flex; flex-direction:column; gap:14px;">
              <div>
                <label class="form-label">Bank Name</label>
                <input class="form-input" id="cardBankName" type="text" placeholder="e.g. Axis Bank, Kotak Mahindra" required>
              </div>
              <div>
                <label class="form-label">Card Number</label>
                <input class="form-input" id="cardNumber" type="text" placeholder="•••• •••• •••• 4242" maxlength="19" required>
              </div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div>
                  <label class="form-label">Expiry (MM/YY)</label>
                  <input class="form-input" id="cardExpiry" type="text" placeholder="08/28" maxlength="5">
                </div>
                <div>
                  <label class="form-label">CVV</label>
                  <input class="form-input" id="cardCvv" type="password" placeholder="•••" maxlength="4">
                </div>
              </div>
              <div>
                <label class="form-label">Cardholder Name</label>
                <input class="form-input" id="cardHolder" type="text" placeholder="Ananya Sharma">
              </div>
            </div>
          </div>
          <div class="app-modal-footer">
            <button class="btn-secondary" onclick="window.closeAddCardModal();">Cancel</button>
            <button class="btn-primary" onclick="window.submitAddCard();"><i class="fas fa-lock"></i> Save Card</button>
          </div>
        </div>
      </div>

      <!-- Driver Chat Modal -->
      <div class="app-modal-overlay" id="chatModal" role="dialog" aria-modal="true">
        <div class="app-modal-dialog" style="max-width:460px;">
          <div class="app-modal-header">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="width:36px; height:36px; border-radius:50%; background:#2563eb; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700;">RK</span>
              <div>
                <h3 style="font-size:1.05rem; margin:0;">Rajesh K.</h3>
                <span style="font-size:0.75rem; color:#16a34a; font-weight:600;"><i class="fas fa-circle" style="font-size:0.5rem;"></i> Online · White Dzire (DL 01 AB 1234)</span>
              </div>
            </div>
            <button class="app-modal-close" onclick="window.closeChatModal();"><i class="fas fa-times"></i></button>
          </div>
          <div class="app-modal-body">
            <div class="chat-messages-container" id="chatMessagesContainer">
              <div class="chat-bubble driver">Hello Ananya! I have accepted your ride and am on my way to your pickup location.</div>
            </div>
            <div class="chat-quick-replies">
              <button class="chat-quick-pill" onclick="window.sendChatMessage('I am waiting at the main gate.');">At the gate</button>
              <button class="chat-quick-pill" onclick="window.sendChatMessage('Where are you right now?');">Where are you?</button>
              <button class="chat-quick-pill" onclick="window.sendChatMessage('Please wait 2 mins, coming down.');">Wait 2 mins</button>
              <button class="chat-quick-pill" onclick="window.sendChatMessage('I have 2 luggage bags.');">Have luggage</button>
            </div>
            <div class="chat-input-row">
              <input type="text" id="chatMessageInput" class="form-input" placeholder="Type a message to Rajesh…" onkeydown="if(event.key==='Enter') window.sendChatMessage();" style="flex:1;">
              <button class="btn-primary" onclick="window.sendChatMessage();" style="padding:10px 18px;"><i class="fas fa-paper-plane"></i></button>
            </div>
          </div>
        </div>
      </div>

      <!-- Schedule Ride Modal -->
      <div class="app-modal-overlay" id="scheduleRideModal" role="dialog" aria-modal="true">
        <div class="app-modal-dialog" style="max-width:440px;">
          <div class="app-modal-header">
            <h3><i class="fas fa-calendar-plus" style="color:#2563eb;"></i> Schedule Ride</h3>
            <button class="app-modal-close" onclick="window.closeScheduleModal();"><i class="fas fa-times"></i></button>
          </div>
          <div class="app-modal-body">
            <div style="display:flex; flex-direction:column; gap:14px;">
              <div>
                <label class="form-label">Pickup Location</label>
                <input class="form-input" id="schPickup" type="text" value="1247, 100 Feet Road, Indiranagar, Bengaluru">
              </div>
              <div>
                <label class="form-label">Drop-off Destination</label>
                <input class="form-input" id="schDropoff" type="text" placeholder="Where to? (e.g. Kempegowda Airport)">
              </div>
              <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div>
                  <label class="form-label">Date</label>
                  <input class="form-input" type="date" value="${new Date(Date.now() + 86400000).toISOString().slice(0, 10)}">
                </div>
                <div>
                  <label class="form-label">Time</label>
                  <input class="form-input" type="time" value="09:00">
                </div>
              </div>
            </div>
          </div>
          <div class="app-modal-footer">
            <button class="btn-secondary" onclick="window.closeScheduleModal();">Cancel</button>
            <button class="btn-primary" onclick="window.closeScheduleModal(); showToast('Ride scheduled! Driver will be assigned 15 mins prior.');">Confirm Schedule</button>
          </div>
        </div>
      </div>

      <!-- Saved Places Modal -->
      <div class="app-modal-overlay" id="savedPlacesModal" role="dialog" aria-modal="true">
        <div class="app-modal-dialog" style="max-width:440px;">
          <div class="app-modal-header">
            <h3><i class="fas fa-bookmark" style="color:#2563eb;"></i> Saved Places</h3>
            <button class="app-modal-close" onclick="window.closeSavedPlacesModal();"><i class="fas fa-times"></i></button>
          </div>
          <div class="app-modal-body">
            <div style="display:flex; flex-direction:column; gap:12px;">
              <div class="trip-item clickable" onclick="window.closeSavedPlacesModal(); window.openBookingModal('Comfort', 'Home', 'Kempegowda Airport');">
                <div class="trip-icon" style="background:#eff6ff; color:#2563eb;"><i class="fas fa-house"></i></div>
                <div class="trip-details">
                  <div class="route">Home</div>
                  <div class="meta">1247, 100 Feet Road, Indiranagar, Bengaluru</div>
                </div>
                <button class="btn-sm primary">Ride here</button>
              </div>

              <div class="trip-item clickable" onclick="window.closeSavedPlacesModal(); window.openBookingModal('Comfort', 'Home', 'Manyata Tech Park');">
                <div class="trip-icon" style="background:#f0fdf4; color:#16a34a;"><i class="fas fa-briefcase"></i></div>
                <div class="trip-details">
                  <div class="route">Work</div>
                  <div class="meta">Manyata Embassy Business Park, Outer Ring Rd</div>
                </div>
                <button class="btn-sm primary">Ride here</button>
              </div>

              <div class="trip-item clickable" onclick="window.closeSavedPlacesModal(); window.openBookingModal('Economy', 'Home', 'Cult.fit Indiranagar');">
                <div class="trip-icon" style="background:#fef3c7; color:#d97706;"><i class="fas fa-dumbbell"></i></div>
                <div class="trip-details">
                  <div class="route">Gym / Fitness</div>
                  <div class="meta">Cult.fit Indiranagar, 12th Main Rd</div>
                </div>
                <button class="btn-sm primary">Ride here</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Split Fare Modal -->
      <div class="app-modal-overlay" id="splitFareModal" role="dialog" aria-modal="true">
        <div class="app-modal-dialog" style="max-width:440px;">
          <div class="app-modal-header">
            <h3><i class="fas fa-users" style="color:#2563eb;"></i> Split Fare with Friends</h3>
            <button class="app-modal-close" onclick="window.closeSplitFareModal();"><i class="fas fa-times"></i></button>
          </div>
          <div class="app-modal-body">
            <p style="font-size:0.9rem; color:#6b7280; margin-bottom:14px;">Share your active trip fare equally with co-passengers.</p>
            <div style="display:flex; gap:8px; margin-bottom:16px;">
              <input type="text" readonly value="https://instantcab.in/split?ride=CAB1029" class="form-input" style="flex:1;">
              <button class="btn-primary" onclick="navigator.clipboard.writeText('https://instantcab.in/split?ride=CAB1029'); showToast('Split link copied to clipboard!');"><i class="fas fa-copy"></i> Copy</button>
            </div>
            <div class="form-group">
              <label class="form-label">Friend's Phone or Email</label>
              <input class="form-input" type="text" placeholder="+91 98765 00000 or friend@email.com">
            </div>
          </div>
          <div class="app-modal-footer">
            <button class="btn-secondary" onclick="window.closeSplitFareModal();">Close</button>
            <button class="btn-primary" onclick="window.closeSplitFareModal(); showToast('Split request sent!');">Send Request</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalContainer);

    // Close modals on overlay backdrop click
    document.querySelectorAll('.app-modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) {
          overlay.classList.remove('open');
        }
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.querySelectorAll('.app-modal-overlay.open').forEach(m => m.classList.remove('open'));
        const drop = document.getElementById('userDropdownMenu');
        if (drop) drop.classList.remove('show');
      }
    });
  }

  // ============================================================
  // OVERRIDE FORMS & INTERACTION HOOKS
  // ============================================================
  function hookForms() {
    // 1. Home booking widget form
    const homeForm = document.querySelector('.hero .booking-widget');
    if (homeForm) {
      homeForm.removeAttribute('onsubmit');
      homeForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const p = document.getElementById('pickup')?.value;
        const d = document.getElementById('dropoff')?.value;
        openBookingModal('Comfort', p, d);
      });
    }

    // 2. Dashboard quick-book form
    const qbForm = document.querySelector('.quick-book-form');
    if (qbForm) {
      qbForm.removeAttribute('onsubmit');
      qbForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const p = document.getElementById('qbPickup')?.value;
        const d = document.getElementById('qbDropoff')?.value;
        openBookingModal('Comfort', p, d);
      });
    }

    // 3. Fleet Cards buttons
    document.querySelectorAll('.btn-fleet').forEach(btn => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const text = btn.textContent.toLowerCase();
        let cls = 'Comfort';
        if (text.includes('economy')) cls = 'Economy';
        else if (text.includes('premium')) cls = 'Premium SUV';
        openBookingModal(cls);
      });
    });

    // 4. Contact Form
    const contactForm = document.querySelector('#page-contact form');
    if (contactForm) {
      contactForm.removeAttribute('onsubmit');
      contactForm.addEventListener('submit', function (e) {
        e.preventDefault();
        submitContactForm(contactForm);
      });
    }

    // 5. Auth Login Form
    const loginForm = document.querySelector('#loginForm form');
    if (loginForm) {
      loginForm.removeAttribute('onsubmit');
      loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail')?.value;
        const password = document.getElementById('loginPassword')?.value;
        try {
          const res = await api.post('/api/auth/login', { email, password });
          if (res && res.user) {
            currentUser = res.user;
            updateUserUI();
            showToast('Welcome back, ' + currentUser.firstName + '!');
            goToRoute('dashboard');
          }
        } catch (err) {
          showToast('Login failed: ' + err.message);
        }
      });
    }

    // 6. Auth Signup Form
    const signupForm = document.querySelector('#signupForm form');
    if (signupForm) {
      signupForm.removeAttribute('onsubmit');
      signupForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const firstName = document.getElementById('signupFirstName')?.value;
        const lastName = document.getElementById('signupLastName')?.value;
        const email = document.getElementById('signupEmail')?.value;
        const phone = document.getElementById('signupPhone')?.value;
        const password = document.getElementById('signupPassword')?.value;

        try {
          const res = await api.post('/api/auth/signup', { firstName, lastName, email, phone, password });
          if (res && res.user) {
            currentUser = res.user;
            updateUserUI();
            showToast('Account created successfully!');
            goToRoute('dashboard');
          }
        } catch (err) {
          showToast('Signup failed: ' + err.message);
        }
      });
    }

    // 7. Profile Save Button
    const saveProfileBtn = document.querySelector('#page-profile .card-body button.primary');
    if (saveProfileBtn) {
      saveProfileBtn.removeAttribute('onclick');
      saveProfileBtn.addEventListener('click', saveProfileChanges);
    }

    // 8. Export CSV button in Trips
    const exportBtn = document.querySelector('#page-trips .dash-header button');
    if (exportBtn) {
      exportBtn.removeAttribute('onclick');
      exportBtn.addEventListener('click', exportTripsCSV);
    }
  }

  // ============================================================
  // INITIALIZATION
  // ============================================================
  document.addEventListener('DOMContentLoaded', function () {
    injectAppModals();
    bindRouteLinks();
    hookForms();
    initAuth();
    handleHash();
  });

})();
