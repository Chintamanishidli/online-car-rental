// --- Database Helpers (LocalStorage) ---
const defaultCars = [
  { id: 1, name: "Maruti Suzuki Swift (KA-01-AB-1234)", type: "Small", pricePerDay: 1200, image: "images/sedan.png", seats: 5, transmission: "Manual" },
  { id: 2, name: "Hyundai i20 (KA-05-XY-9876)", type: "Medium", pricePerDay: 1500, image: "images/sedan.png", seats: 5, transmission: "Auto" },
  { id: 3, name: "Tata Nexon (KA-51-PQ-4567)", type: "SUV", pricePerDay: 2200, image: "images/suv.png", seats: 5, transmission: "Manual" },
  { id: 4, name: "Toyota Innova Crysta (KA-03-LM-5678)", type: "VAN", pricePerDay: 3500, image: "images/suv.png", seats: 7, transmission: "Auto" }
];

const DB = {
  getUsers: () => JSON.parse(localStorage.getItem('rentals_users') || '[]'),
  saveUsers: (users) => localStorage.setItem('rentals_users', JSON.stringify(users)),
  getCurrentUser: () => JSON.parse(localStorage.getItem('rentals_current_user') || 'null'),
  setCurrentUser: (user) => localStorage.setItem('rentals_current_user', JSON.stringify(user)),
  logoutUser: () => localStorage.removeItem('rentals_current_user'),
  getBookings: () => JSON.parse(localStorage.getItem('rentals_bookings') || '[]'),
  saveBookings: (bookings) => localStorage.setItem('rentals_bookings', JSON.stringify(bookings)),
  getCars: () => {
    let cars = JSON.parse(localStorage.getItem('rentals_cars'));
    if (!cars || cars.length === 0 || cars[0].name === "Nightshade SUV") {
      // Seed default cars if DB is empty or has old cars
      localStorage.setItem('rentals_cars', JSON.stringify(defaultCars));
      return defaultCars;
    }
    return cars;
  },
  saveCars: (cars) => localStorage.setItem('rentals_cars', JSON.stringify(cars))
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

// --- Navigation Management ---
const updateNavigation = () => {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;

  const currentUser = DB.getCurrentUser();
  const path = window.location.pathname;
  const isAdmin = currentUser && currentUser.email === 'admin@admin.com';
  
  let html = `
    <li><a href="index.html" class="${path.includes('index.html') || path === '/' ? 'active' : ''}">Home</a></li>
    <li><a href="cars.html" class="${path.includes('cars.html') ? 'active' : ''}">Fleet</a></li>
    <li><a href="list-car.html" class="${path.includes('list-car.html') ? 'active' : ''}">List Your Car</a></li>
    <li><a href="contact.html" class="${path.includes('contact.html') ? 'active' : ''}">Contact</a></li>
  `;

  if (currentUser) {
    if (isAdmin) {
      html += `<li><a href="admin.html" class="${path.includes('admin.html') ? 'active' : ''}">Admin Panel <span class="admin-badge">ADMIN</span></a></li>`;
    }
    html += `
      <li><a href="profile.html" class="${path.includes('profile.html') ? 'active' : ''}">Profile</a></li>
      <li><a href="#" id="logout-btn" style="color: var(--danger-color);">Logout</a></li>
    `;
  } else {
    html += `
      <li><a href="login.html" class="${path.includes('login.html') ? 'active' : ''}">Login / Register</a></li>
    `;
  }

  navLinks.innerHTML = html;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      DB.logoutUser();
      window.location.href = 'index.html';
    });
  }
};

// --- Page: Cars Listing ---
const initCarsPage = () => {
  const carsGrid = document.getElementById('cars-grid');
  const searchInput = document.getElementById('search-input');
  const filterBtns = document.querySelectorAll('.filter-btn');

  if (!carsGrid) return;

  const cars = DB.getCars();

  const renderCars = (carsToRender) => {
    carsGrid.innerHTML = '';
    if (carsToRender.length === 0) {
      carsGrid.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">No cars found matching your criteria.</p>';
      return;
    }

    carsToRender.forEach(car => {
      carsGrid.insertAdjacentHTML('beforeend', `
        <div class="car-card">
          <div class="car-img">
            <span class="car-badge">${car.type}</span>
            <img src="${car.image}" alt="${car.name}">
          </div>
          <div class="car-info">
            <h3 class="car-title">${car.name}</h3>
            <div class="car-price">${formatCurrency(car.pricePerDay)}<span>/day</span></div>
            <div class="car-features">
              <div>🚗 ${car.seats} Seats</div>
              <div>⚙️ ${car.transmission}</div>
            </div>
            <a href="booking.html?id=${car.id}" class="btn btn-primary btn-block">Book Now</a>
          </div>
        </div>
      `);
    });
  };

  renderCars(cars);
  let currentFilter = 'All';
  let searchQuery = '';

  const applyFilters = () => {
    let filtered = cars;
    if (currentFilter !== 'All') filtered = filtered.filter(car => car.type === currentFilter);
    if (searchQuery) filtered = filtered.filter(car => car.name.toLowerCase().includes(searchQuery.toLowerCase()));
    renderCars(filtered);
  };

  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    applyFilters();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => { b.classList.remove('btn-primary'); b.classList.add('btn-secondary'); });
      btn.classList.remove('btn-secondary'); btn.classList.add('btn-primary');
      currentFilter = btn.dataset.filter;
      applyFilters();
    });
  });
};

// --- Page: Booking ---
const initBookingPage = () => {
  const bookingForm = document.getElementById('booking-form');
  if (!bookingForm) return;

  const currentUser = DB.getCurrentUser();
  if (!currentUser) {
    alert("You must be logged in to make a booking.");
    window.location.href = 'login.html';
    return;
  }

  document.getElementById('name').value = currentUser.name;
  document.getElementById('email').value = currentUser.email;

  const urlParams = new URLSearchParams(window.location.search);
  const carId = parseInt(urlParams.get('id'));
  const cars = DB.getCars();
  const selectedCar = cars.find(c => c.id === carId);
  
  if (!selectedCar) {
    alert("Car not found.");
    window.location.href = 'cars.html';
    return;
  }

  document.getElementById('summary-img').src = selectedCar.image;
  document.getElementById('summary-name').textContent = selectedCar.name;
  document.getElementById('summary-price').textContent = `${formatCurrency(selectedCar.pricePerDay)} / day`;
  
  const pickupDate = document.getElementById('pickup-date');
  const dropDate = document.getElementById('drop-date');
  const today = new Date().toISOString().split('T')[0];
  pickupDate.min = today;
  dropDate.min = today;

  const calculateTotal = () => {
    if (!pickupDate.value || !dropDate.value) return;
    const start = new Date(pickupDate.value);
    const end = new Date(dropDate.value);
    const diffDays = Math.max(Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)), 1);
    
    if (end < start) {
      alert("Drop-off date must be after pickup date");
      dropDate.value = '';
      return;
    }
    const total = diffDays * selectedCar.pricePerDay;
    document.getElementById('summary-days').textContent = `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
    document.getElementById('summary-total').textContent = formatCurrency(total);
  };

  pickupDate.addEventListener('change', calculateTotal);
  dropDate.addEventListener('change', calculateTotal);

  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!pickupDate.value || !dropDate.value) return alert("Please select dates");

    const newBooking = {
      id: Date.now(),
      userEmail: currentUser.email,
      car: selectedCar,
      pickup: pickupDate.value,
      drop: dropDate.value,
      location: document.getElementById('location').value,
      total: document.getElementById('summary-total').textContent,
      status: 'Confirmed',
      dateBooked: new Date().toISOString()
    };

    const bookings = DB.getBookings();
    bookings.push(newBooking);
    DB.saveBookings(bookings);

    document.getElementById('success-modal').classList.add('active');
  });
};

// --- Page: Auth ---
const initAuthPage = () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  if (!loginForm || !registerForm) return;

  if (DB.getCurrentUser()) {
    window.location.href = 'profile.html';
  }

  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const viewLogin = document.getElementById('view-login');
  const viewRegister = document.getElementById('view-register');

  const switchTab = (tab) => {
    if (tab === 'login') {
      tabLogin.classList.add('active'); tabRegister.classList.remove('active');
      viewLogin.classList.remove('hidden'); viewRegister.classList.add('hidden');
    } else {
      tabRegister.classList.add('active'); tabLogin.classList.remove('active');
      viewRegister.classList.remove('hidden'); viewLogin.classList.add('hidden');
    }
  };

  tabLogin.addEventListener('click', () => switchTab('login'));
  tabRegister.addEventListener('click', () => switchTab('register'));

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    
    // Auto-create admin account if not exists
    const users = DB.getUsers();
    if (email === 'admin@admin.com' && !users.find(u => u.email === 'admin@admin.com')) {
        const adminUser = { name: 'Super Admin', email: 'admin@admin.com', password: pass, phone: '', address: '' };
        users.push(adminUser);
        DB.saveUsers(users);
        DB.setCurrentUser(adminUser);
        return window.location.href = 'admin.html';
    }

    const user = users.find(u => u.email === email && u.password === pass);
    if (user) {
      DB.setCurrentUser(user);
      window.location.href = user.email === 'admin@admin.com' ? 'admin.html' : 'profile.html';
    } else {
      alert("Invalid email or password");
    }
  });

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    
    const users = DB.getUsers();
    if (users.find(u => u.email === email)) return alert("Email is already registered");

    const newUser = { name, email, password: pass, phone: '', address: '' };
    users.push(newUser);
    DB.saveUsers(users);
    
    DB.setCurrentUser(newUser);
    window.location.href = email === 'admin@admin.com' ? 'admin.html' : 'profile.html';
  });
};

// --- Page: Profile ---
const initProfilePage = () => {
  const profileForm = document.getElementById('profile-form');
  const historyContainer = document.getElementById('history-container');
  if (!profileForm || !historyContainer) return;

  const currentUser = DB.getCurrentUser();
  if (!currentUser) return window.location.href = 'login.html';

  document.getElementById('prof-name').value = currentUser.name;
  document.getElementById('prof-email').value = currentUser.email;
  document.getElementById('prof-phone').value = currentUser.phone || '';
  document.getElementById('prof-address').value = currentUser.address || '';

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const phone = document.getElementById('prof-phone').value;
    const address = document.getElementById('prof-address').value;
    
    const users = DB.getUsers();
    const userIndex = users.findIndex(u => u.email === currentUser.email);
    
    if (userIndex !== -1) {
      users[userIndex].phone = phone;
      users[userIndex].address = address;
      DB.saveUsers(users);
      currentUser.phone = phone;
      currentUser.address = address;
      DB.setCurrentUser(currentUser);
      alert("Profile updated successfully!");
    }
  });

  const bookings = DB.getBookings();
  const userBookings = bookings.filter(b => b.userEmail === currentUser.email);
  
  if (userBookings.length === 0) {
    historyContainer.innerHTML = '<p class="text-muted">You have no booking history.</p>';
  } else {
    userBookings.sort((a,b) => new Date(b.dateBooked) - new Date(a.dateBooked));
    historyContainer.innerHTML = userBookings.map(b => `
      <div class="history-card">
        <div class="history-details">
          <h4>${b.car.name}</h4>
          <p><strong>Dates:</strong> ${b.pickup} to ${b.drop}</p>
          <p><strong>Location:</strong> ${b.location.toUpperCase()}</p>
          <p><strong>Status:</strong> <span style="color: var(--secondary-color);">${b.status}</span></p>
        </div>
        <div class="history-price">${b.total}</div>
      </div>
    `).join('');
  }
  
  const tabProf = document.getElementById('nav-profile');
  const tabHist = document.getElementById('nav-history');
  const viewProf = document.getElementById('view-profile');
  const viewHist = document.getElementById('view-history');

  const switchView = (view) => {
    if(view === 'profile') {
      tabProf.classList.add('active'); tabHist.classList.remove('active');
      viewProf.classList.remove('hidden'); viewHist.classList.add('hidden');
    } else {
      tabHist.classList.add('active'); tabProf.classList.remove('active');
      viewHist.classList.remove('hidden'); viewProf.classList.add('hidden');
    }
  };

  tabProf.addEventListener('click', () => switchView('profile'));
  tabHist.addEventListener('click', () => switchView('history'));
};

// --- Page: Admin ---
const initAdminPage = () => {
  const adminContainer = document.getElementById('admin-container');
  if (!adminContainer) return;

  const currentUser = DB.getCurrentUser();
  if (!currentUser || currentUser.email !== 'admin@admin.com') {
    alert("Unauthorized access");
    window.location.href = 'index.html';
    return;
  }

  // Populate Stats
  document.getElementById('stat-users').textContent = DB.getUsers().length;
  document.getElementById('stat-cars').textContent = DB.getCars().length;
  document.getElementById('stat-bookings').textContent = DB.getBookings().length;

  // Setup Fleet Table
  const renderFleetTable = () => {
    const tbody = document.getElementById('fleet-tbody');
    const cars = DB.getCars();
    tbody.innerHTML = cars.map(car => `
      <tr>
        <td><strong>${car.name}</strong></td>
        <td>${car.type}</td>
        <td>${formatCurrency(car.pricePerDay)}</td>
        <td>${car.seats} / ${car.transmission}</td>
        <td>
          <button class="action-btn" onclick="deleteCar(${car.id})">🗑️</button>
        </td>
      </tr>
    `).join('');
  };

  // Setup Bookings Table
  const renderBookingsTable = () => {
    const tbody = document.getElementById('bookings-tbody');
    const bookings = DB.getBookings();
    
    if(bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No bookings found</td></tr>';
        return;
    }
    
    bookings.sort((a,b) => new Date(b.dateBooked) - new Date(a.dateBooked));
    tbody.innerHTML = bookings.map(b => `
      <tr>
        <td>${b.userEmail}</td>
        <td>${b.car.name}</td>
        <td>${b.pickup} to ${b.drop}</td>
        <td>${b.total}</td>
        <td><span style="color: var(--secondary-color); font-weight: bold;">${b.status}</span></td>
      </tr>
    `).join('');
  };

  renderFleetTable();
  renderBookingsTable();

  // Expose delete to global scope for onclick
  window.deleteCar = (id) => {
    if(confirm("Are you sure you want to delete this car?")) {
      let cars = DB.getCars();
      cars = cars.filter(c => c.id !== id);
      DB.saveCars(cars);
      renderFleetTable();
      document.getElementById('stat-cars').textContent = cars.length;
    }
  };

  // Add Car Form
  const addCarForm = document.getElementById('add-car-form');
  addCarForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const cars = DB.getCars();
    const newCar = {
      id: Date.now(),
      name: document.getElementById('car-name').value,
      type: document.getElementById('car-type').value,
      pricePerDay: parseFloat(document.getElementById('car-price').value),
      seats: parseInt(document.getElementById('car-seats').value),
      transmission: document.getElementById('car-transmission').value,
      image: document.getElementById('car-image').value || 'images/suv.png'
    };

    cars.push(newCar);
    DB.saveCars(cars);
    
    addCarForm.reset();
    renderFleetTable();
    document.getElementById('stat-cars').textContent = cars.length;
    alert("Car added successfully!");
  });

  // Admin Tabs
  const tabs = ['nav-overview', 'nav-fleet', 'nav-bookings'];
  const views = ['view-overview', 'view-fleet', 'view-bookings'];

  tabs.forEach((tabId, index) => {
    document.getElementById(tabId).addEventListener('click', () => {
      tabs.forEach(t => document.getElementById(t).classList.remove('active'));
      views.forEach(v => document.getElementById(v).classList.add('hidden'));
      
      document.getElementById(tabId).classList.add('active');
      document.getElementById(views[index]).classList.remove('hidden');
    });
  });
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateNavigation();
  initCarsPage();
  initBookingPage();
  initAuthPage();
  initProfilePage();
  initAdminPage();
});
