const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(__dirname));

// Initial seed data generator
function getInitialData() {
  return {
    currentUser: {
      id: 'USR101',
      firstName: 'Ananya',
      lastName: 'Sharma',
      email: 'ananya.sharma@example.in',
      phone: '+91 98765 43210',
      address: '1247, 100 Feet Road, Indiranagar, Bengaluru 560038',
      avatarText: 'AS',
      memberSince: 'January 2024',
      rating: 4.98,
      preferences: {
        smsUpdates: true,
        safetyNotifications: true,
        promoOffers: false
      }
    },
    users: [
      {
        id: 'USR101',
        firstName: 'Ananya',
        lastName: 'Sharma',
        email: 'ananya.sharma@example.in',
        password: 'password123',
        phone: '+91 98765 43210',
        address: '1247, 100 Feet Road, Indiranagar, Bengaluru 560038',
        avatarText: 'AS',
        memberSince: 'January 2024',
        rating: 4.98
      }
    ],
    wallet: {
      balance: 2850,
      autoReload: false,
      cards: [
        {
          id: 'card-1',
          bank: 'HDFC Bank',
          last4: '4242',
          brand: 'Visa',
          expiry: '08/27',
          holder: 'Ananya Sharma',
          isDefault: true
        },
        {
          id: 'card-2',
          bank: 'ICICI Bank',
          last4: '8801',
          brand: 'Mastercard',
          expiry: '03/26',
          holder: 'Ananya Sharma',
          isDefault: false
        },
        {
          id: 'card-3',
          bank: 'SBI Card',
          last4: '1005',
          brand: 'Rupay',
          expiry: '11/28',
          holder: 'Ananya Sharma',
          isDefault: false
        }
      ],
      transactions: [
        {
          id: 'TXN-901',
          type: 'ride',
          title: 'Ride — Koramangala → MG Road',
          subtitle: 'Today, 9:14 AM · HDFC •••• 4242',
          amount: -180,
          date: '2025-06-15T09:14:00Z',
          method: 'HDFC •••• 4242'
        },
        {
          id: 'TXN-902',
          type: 'topup',
          title: 'Wallet top-up',
          subtitle: 'Yesterday, 8:02 PM · HDFC •••• 4242',
          amount: 500,
          date: '2025-06-14T20:02:00Z',
          method: 'HDFC •••• 4242'
        },
        {
          id: 'TXN-903',
          type: 'ride',
          title: 'Ride — Home → Cubbon Park',
          subtitle: 'Yesterday, 6:42 PM · Wallet',
          amount: -220,
          date: '2025-06-14T18:42:00Z',
          method: 'Wallet'
        },
        {
          id: 'TXN-904',
          type: 'referral',
          title: 'Referral bonus — Aisha K.',
          subtitle: 'Mar 15, 2:10 PM',
          amount: 100,
          date: '2025-03-15T14:10:00Z',
          method: 'Referral'
        }
      ]
    },
    rides: [
      {
        id: 'CAB1029',
        status: 'on_the_way',
        statusLabel: 'Driver on the way',
        pickup: '1247, 100 Feet Road, Indiranagar, Bengaluru',
        dropoff: 'Kempegowda International Airport (BLR)',
        date: 'Today',
        time: 'Just now',
        distanceKm: 38.5,
        durationMins: 45,
        vehicleClass: 'Comfort',
        vehicleModel: 'Maruti Suzuki Dzire',
        vehicleColor: 'White',
        plateNumber: 'DL 01 AB 1234',
        driverName: 'Rajesh K.',
        driverInitials: 'RK',
        driverPhoto: 'cab 1.png',
        driverPhone: '+91 80794 12662',
        driverRating: 4.97,
        driverTotalRides: 2318,
        etaMinutes: 3,
        ridePin: '4892',
        fare: {
          base: 50,
          distanceFare: 240,
          timeCharge: 45,
          bookingFee: 20,
          gst: 25,
          total: 380
        },
        paymentMethod: 'InstantCab Wallet'
      },
      {
        id: 'CAB1025',
        status: 'completed',
        statusLabel: 'Completed',
        pickup: 'Koramangala 4th Block',
        dropoff: 'MG Road Metro Station',
        date: 'Today, 9:14 AM',
        time: '9:14 AM',
        distanceKm: 5.2,
        durationMins: 12,
        vehicleClass: 'Comfort',
        vehicleModel: 'Honda Amaze',
        vehicleColor: 'White',
        plateNumber: 'KA 03 MX 9021',
        driverName: 'Rajesh K.',
        driverInitials: 'RK',
        driverPhone: '+91 80794 12662',
        driverRating: 4.97,
        driverTotalRides: 2318,
        fare: {
          base: 50,
          distanceFare: 62.4,
          timeCharge: 24,
          bookingFee: 20,
          gst: 23.6,
          total: 180
        },
        paymentMethod: 'HDFC •••• 4242'
      },
      {
        id: 'CAB1026',
        status: 'completed',
        statusLabel: 'Completed',
        pickup: 'Home (Indiranagar)',
        dropoff: 'Cubbon Park Entrance',
        date: 'Yesterday, 6:42 PM',
        time: '6:42 PM',
        distanceKm: 8.4,
        durationMins: 18,
        vehicleClass: 'Economy',
        vehicleModel: 'Maruti Suzuki WagonR',
        vehicleColor: 'Silver',
        plateNumber: 'KA 01 EK 4410',
        driverName: 'Suresh M.',
        driverInitials: 'SM',
        driverPhone: '+91 98451 12340',
        driverRating: 4.88,
        driverTotalRides: 1420,
        fare: {
          base: 40,
          distanceFare: 110,
          timeCharge: 36,
          bookingFee: 20,
          gst: 14,
          total: 220
        },
        paymentMethod: 'InstantCab Wallet'
      },
      {
        id: 'CAB1024',
        status: 'completed',
        statusLabel: 'Completed',
        pickup: 'Downtown Indiranagar',
        dropoff: 'Kempegowda International Airport',
        date: 'June 15, 2025',
        time: '10:30 AM',
        distanceKm: 36.0,
        durationMins: 42,
        vehicleClass: 'Comfort',
        vehicleModel: 'Honda Amaze',
        vehicleColor: 'White',
        plateNumber: 'KA 05 AB 1024',
        driverName: 'Ramesh Gowda',
        driverInitials: 'RG',
        driverPhone: '+91 98860 55432',
        driverRating: 4.95,
        driverTotalRides: 3104,
        fare: {
          base: 60,
          distanceFare: 290,
          timeCharge: 40,
          bookingFee: 25,
          gst: 35,
          total: 450
        },
        paymentMethod: 'SBI Card •••• 1005'
      },
      {
        id: 'CAB1027',
        status: 'upcoming',
        statusLabel: 'Upcoming',
        pickup: 'Manyata Tech Park, Office',
        dropoff: '100 Feet Road, Indiranagar',
        date: 'Thu, 7:30 PM',
        time: '7:30 PM',
        distanceKm: 4.2,
        durationMins: 14,
        vehicleClass: 'Comfort',
        vehicleModel: 'Hyundai Aura',
        vehicleColor: 'Grey',
        plateNumber: 'KA 04 NC 7812',
        driverName: 'Priya N.',
        driverInitials: 'PN',
        driverPhone: '+91 97400 98765',
        driverRating: 4.96,
        driverTotalRides: 1850,
        fare: {
          base: 50,
          distanceFare: 55,
          timeCharge: 20,
          bookingFee: 20,
          gst: 15,
          total: 160
        },
        paymentMethod: 'InstantCab Wallet'
      },
      {
        id: 'CAB1028',
        status: 'refunded',
        statusLabel: 'Refunded',
        pickup: 'Downtown Hyderabad',
        dropoff: 'Rajiv Gandhi International Airport',
        date: 'Mar 8, 11:02 AM',
        time: '11:02 AM',
        distanceKm: 42.0,
        durationMins: 55,
        vehicleClass: 'Premium SUV',
        vehicleModel: 'Toyota Innova Crysta',
        vehicleColor: 'White',
        plateNumber: 'TS 09 UB 5678',
        driverName: 'Ravi L.',
        driverInitials: 'RL',
        driverPhone: '+91 91234 56780',
        driverRating: 4.92,
        driverTotalRides: 940,
        fare: {
          base: 150,
          distanceFare: 580,
          timeCharge: 60,
          bookingFee: 40,
          gst: 60,
          total: 890
        },
        paymentMethod: 'HDFC •••• 4242'
      }
    ],
    notifications: [
      {
        id: 'NOTIF-1',
        title: 'Driver Assigned',
        message: 'Rajesh K. (DL 01 AB 1234) is on the way in a White Dzire.',
        pickup: 'Indiranagar',
        dropoff: 'Airport (BLR)',
        eta: '3 min',
        read: false,
        time: 'Just now',
        route: '#/tracking'
      },
      {
        id: 'NOTIF-2',
        title: 'Trip Completed',
        message: 'You arrived at MG Road. ₹180 charged to HDFC •••• 4242.',
        pickup: 'Koramangala',
        dropoff: 'MG Road',
        eta: null,
        read: true,
        time: 'Today, 9:26 AM',
        route: 'details.html?id=CAB1025'
      },
      {
        id: 'NOTIF-3',
        title: 'Wallet Reloaded',
        message: '₹500 added to your InstantCab wallet successfully.',
        pickup: null,
        dropoff: null,
        eta: null,
        read: true,
        time: 'Yesterday, 8:02 PM',
        route: '#/wallet'
      }
    ],
    contactInquiries: [],
    availableDrivers: [
      { name: 'Rajesh K.', rating: 4.97, vehicle: 'Maruti Suzuki Dzire', class: 'Comfort', plate: 'DL 01 AB 1234', photo: 'cab 1.png' },
      { name: 'Arun Kumar', rating: 4.94, vehicle: 'Toyota Innova Crysta', class: 'Premium SUV', plate: 'KA 03 MH 8844', photo: 'cab 2.png' },
      { name: 'Vikram Singh', rating: 4.89, vehicle: 'Maruti Suzuki WagonR', class: 'Economy', plate: 'KA 02 TR 2110', photo: 'cab 1.png' },
      { name: 'Deepak Rao', rating: 4.96, vehicle: 'Honda Amaze', class: 'Comfort', plate: 'KA 04 PB 5519', photo: 'cab 1.png' }
    ]
  };
}

// Load data from file or init
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading data file, falling back to seed:', err);
  }
  const initial = getInitialData();
  saveData(initial);
  return initial;
}

// Save data to file
function saveData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving data file:', err);
  }
}

// Initialize data in memory
let db = loadData();

// ============================================================
// API ROUTES
// ============================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'InstantCab API', timestamp: new Date().toISOString() });
});

// ------------------------------------------------------------
// AUTH
// ------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Find user by email or allow demo login
  let user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    // Demo auto-account creation for instant usability
    const nameParts = email.split('@')[0].split('.');
    const firstName = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : 'Rider';
    const lastName = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : 'User';
    user = {
      id: 'USR' + Math.floor(100 + Math.random() * 900),
      firstName,
      lastName,
      email,
      phone: '+91 98000 00000',
      address: 'Bengaluru, Karnataka',
      avatarText: firstName.charAt(0) + (lastName ? lastName.charAt(0) : ''),
      memberSince: 'Today',
      rating: 5.0
    };
    db.users.push(user);
  }

  db.currentUser = {
    ...user,
    preferences: db.currentUser.preferences || { smsUpdates: true, safetyNotifications: true, promoOffers: false }
  };
  saveData(db);

  res.json({
    success: true,
    message: 'Logged in successfully',
    user: db.currentUser,
    token: 'cab-token-' + Date.now()
  });
});

app.post('/api/auth/signup', (req, res) => {
  const { firstName, lastName, email, phone, password } = req.body;
  if (!firstName || !email) {
    return res.status(400).json({ error: 'First name and email are required' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  const newUser = {
    id: 'USR' + Math.floor(100 + Math.random() * 900),
    firstName,
    lastName: lastName || '',
    email,
    phone: phone || '+91 98000 00000',
    address: 'Bengaluru, India',
    avatarText: (firstName.charAt(0) + (lastName ? lastName.charAt(0) : firstName.charAt(1) || '')).toUpperCase(),
    memberSince: 'Just joined',
    rating: 5.0
  };

  db.users.push(newUser);
  db.currentUser = {
    ...newUser,
    preferences: { smsUpdates: true, safetyNotifications: true, promoOffers: false }
  };
  saveData(db);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    user: db.currentUser,
    token: 'cab-token-' + Date.now()
  });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ success: true, user: db.currentUser });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ------------------------------------------------------------
// RIDES & BOOKING
// ------------------------------------------------------------

// Fare estimation
app.post('/api/rides/estimate', (req, res) => {
  const { pickup, dropoff } = req.body;
  if (!pickup || !dropoff) {
    return res.status(400).json({ error: 'Pickup and dropoff locations are required' });
  }

  // Calculate distance based on string lengths or common routes
  let distanceKm = 8.5;
  const combined = (pickup + dropoff).toLowerCase();
  if (combined.includes('airport')) distanceKm = 36.4;
  else if (combined.includes('koramangala') && combined.includes('mg road')) distanceKm = 5.2;
  else if (combined.includes('indiranagar') && combined.includes('cubbon')) distanceKm = 7.8;
  else if (combined.includes('whitefield')) distanceKm = 18.2;
  else {
    distanceKm = Math.max(3.5, Math.min(45, (pickup.length + dropoff.length) * 0.45));
    distanceKm = Math.round(distanceKm * 10) / 10;
  }

  const durationMins = Math.round(distanceKm * 2.2 + 5);

  const estimates = [
    {
      type: 'Economy',
      description: 'Compact & affordable hatchback',
      icon: 'fas fa-car',
      image: 'cab 1.png',
      seats: 4,
      etaMins: 3,
      fare: Math.round(60 + distanceKm * 14 + durationMins * 1.5),
      currency: '₹'
    },
    {
      type: 'Comfort',
      description: 'Sedan with extra legroom & A/C',
      icon: 'fas fa-car-side',
      image: 'cab 1.png',
      seats: 4,
      etaMins: 4,
      popular: true,
      fare: Math.round(90 + distanceKm * 18 + durationMins * 2.0),
      currency: '₹'
    },
    {
      type: 'Premium SUV',
      description: 'Spacious SUV for groups & luggage',
      icon: 'fas fa-truck-pickup',
      image: 'cab 2.png',
      seats: 6,
      etaMins: 5,
      fare: Math.round(150 + distanceKm * 24 + durationMins * 3.0),
      currency: '₹'
    }
  ];

  res.json({
    pickup,
    dropoff,
    distanceKm,
    durationMins,
    estimates
  });
});

// Book a ride
app.post('/api/rides/book', (req, res) => {
  const { pickup, dropoff, vehicleClass, paymentMethod } = req.body;
  if (!pickup || !dropoff) {
    return res.status(400).json({ error: 'Pickup and dropoff are required' });
  }

  const selectedClass = vehicleClass || 'Comfort';
  let distanceKm = 8.5;
  const combined = (pickup + dropoff).toLowerCase();
  if (combined.includes('airport')) distanceKm = 36.4;
  else {
    distanceKm = Math.max(3.5, Math.min(40, (pickup.length + dropoff.length) * 0.4));
    distanceKm = Math.round(distanceKm * 10) / 10;
  }
  const durationMins = Math.round(distanceKm * 2.2 + 5);

  let baseRate = 80;
  let kmRate = 16;
  if (selectedClass === 'Economy') { baseRate = 50; kmRate = 13; }
  else if (selectedClass === 'Premium SUV') { baseRate = 150; kmRate = 22; }

  const base = baseRate;
  const distanceFare = Math.round(distanceKm * kmRate);
  const timeCharge = Math.round(durationMins * 1.8);
  const bookingFee = 20;
  const gst = Math.round((base + distanceFare + timeCharge + bookingFee) * 0.05);
  const total = base + distanceFare + timeCharge + bookingFee + gst;

  // Pick random driver from available
  const drivers = db.availableDrivers;
  const driverMatch = drivers.find(d => d.class === selectedClass) || drivers[0];

  const rideId = 'CAB' + Math.floor(1030 + Math.random() * 8900);
  const newRide = {
    id: rideId,
    status: 'on_the_way',
    statusLabel: 'Driver on the way',
    pickup,
    dropoff,
    date: 'Today',
    time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    distanceKm,
    durationMins,
    vehicleClass: selectedClass,
    vehicleModel: driverMatch.vehicle,
    vehicleColor: 'White',
    plateNumber: driverMatch.plate,
    driverName: driverMatch.name,
    driverInitials: driverMatch.name.split(' ').map(n => n[0]).join(''),
    driverPhoto: driverMatch.photo,
    driverPhone: '+91 80794 12662',
    driverRating: driverMatch.rating,
    driverTotalRides: 1800 + Math.floor(Math.random() * 1200),
    etaMinutes: 3,
    ridePin: String(Math.floor(1000 + Math.random() * 9000)),
    fare: {
      base,
      distanceFare,
      timeCharge,
      bookingFee,
      gst,
      total
    },
    paymentMethod: paymentMethod || 'InstantCab Wallet'
  };

  // Add to rides list (at top)
  db.rides.unshift(newRide);

  // If paid by wallet, deduct
  if (newRide.paymentMethod.toLowerCase().includes('wallet')) {
    db.wallet.balance = Math.max(0, db.wallet.balance - total);
    db.wallet.transactions.unshift({
      id: 'TXN-' + Math.floor(900 + Math.random() * 900),
      type: 'ride',
      title: `Ride — ${pickup} → ${dropoff}`,
      subtitle: `Today, ${newRide.time} · Wallet`,
      amount: -total,
      date: new Date().toISOString(),
      method: 'Wallet'
    });
  }

  // Push notification
  db.notifications.unshift({
    id: 'NOTIF-' + Date.now(),
    title: 'Driver Assigned',
    message: `${newRide.driverName} (${newRide.plateNumber}) accepted your ride. ETA 3 min.`,
    pickup,
    dropoff,
    eta: '3 min',
    read: false,
    time: 'Just now',
    route: '#/tracking'
  });

  saveData(db);

  res.status(201).json({
    success: true,
    message: 'Ride booked successfully!',
    ride: newRide
  });
});

// List all rides with optional filter
app.get('/api/rides', (req, res) => {
  const { status, search } = req.query;
  let list = [...db.rides];

  if (status && status !== 'all') {
    list = list.filter(r => r.status.toLowerCase() === status.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(r =>
      r.id.toLowerCase().includes(q) ||
      r.pickup.toLowerCase().includes(q) ||
      r.dropoff.toLowerCase().includes(q) ||
      r.driverName.toLowerCase().includes(q)
    );
  }

  res.json({
    total: list.length,
    rides: list
  });
});

// Get active ride
app.get('/api/rides/active', (req, res) => {
  const active = db.rides.find(r => r.status === 'on_the_way' || r.status === 'arrived' || r.status === 'in_progress');
  if (!active) {
    return res.json({ active: null, message: 'No active ride currently' });
  }
  res.json({ active });
});

// Get single ride details (crucial for details.html)
app.get('/api/rides/:id', (req, res) => {
  const id = req.params.id.replace('#', '').toUpperCase();
  const ride = db.rides.find(r => r.id.toUpperCase() === id);

  if (!ride) {
    return res.status(404).json({ error: `Ride with ID #${id} not found` });
  }

  res.json({ ride });
});

// Cancel ride
app.post('/api/rides/:id/cancel', (req, res) => {
  const id = req.params.id.replace('#', '').toUpperCase();
  const ride = db.rides.find(r => r.id.toUpperCase() === id);

  if (!ride) {
    return res.status(404).json({ error: 'Ride not found' });
  }

  ride.status = 'cancelled';
  ride.statusLabel = 'Cancelled';

  // Refund if wallet
  if (ride.paymentMethod.toLowerCase().includes('wallet')) {
    db.wallet.balance += ride.fare.total;
    db.wallet.transactions.unshift({
      id: 'TXN-' + Math.floor(900 + Math.random() * 900),
      type: 'refund',
      title: `Refund for Ride #${ride.id}`,
      subtitle: `Cancelled · Refunded to Wallet`,
      amount: ride.fare.total,
      date: new Date().toISOString(),
      method: 'Wallet'
    });
  }

  saveData(db);
  res.json({ success: true, message: 'Ride cancelled successfully', ride });
});

// Rate ride
app.post('/api/rides/:id/rate', (req, res) => {
  const { rating, feedback } = req.body;
  const id = req.params.id.replace('#', '').toUpperCase();
  const ride = db.rides.find(r => r.id.toUpperCase() === id);

  if (!ride) {
    return res.status(404).json({ error: 'Ride not found' });
  }

  ride.userRating = Number(rating) || 5;
  ride.userFeedback = feedback || '';
  saveData(db);

  res.json({ success: true, message: 'Thank you for your rating!', rating: ride.userRating });
});

// ------------------------------------------------------------
// WALLET
// ------------------------------------------------------------
app.get('/api/wallet', (req, res) => {
  res.json({
    balance: db.wallet.balance,
    autoReload: db.wallet.autoReload,
    cards: db.wallet.cards,
    transactions: db.wallet.transactions
  });
});

app.post('/api/wallet/topup', (req, res) => {
  const amount = Number(req.body.amount);
  const paymentMethod = req.body.paymentMethod || 'HDFC Bank •••• 4242';

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Please enter a valid amount' });
  }

  db.wallet.balance += amount;
  const txn = {
    id: 'TXN-' + Math.floor(900 + Math.random() * 900),
    type: 'topup',
    title: 'Wallet top-up',
    subtitle: `Today, ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} · ${paymentMethod}`,
    amount: amount,
    date: new Date().toISOString(),
    method: paymentMethod
  };
  db.wallet.transactions.unshift(txn);

  db.notifications.unshift({
    id: 'NOTIF-' + Date.now(),
    title: 'Wallet Top-up Successful',
    message: `₹${amount.toLocaleString('en-IN')} added to your wallet. New balance: ₹${db.wallet.balance.toLocaleString('en-IN')}.`,
    pickup: null,
    dropoff: null,
    eta: null,
    read: false,
    time: 'Just now',
    route: '#/wallet'
  });

  saveData(db);

  res.json({
    success: true,
    message: `₹${amount.toLocaleString('en-IN')} added successfully!`,
    balance: db.wallet.balance,
    transaction: txn
  });
});

app.post('/api/wallet/cards', (req, res) => {
  const { bank, last4, expiry, holder } = req.body;
  if (!bank || !last4) {
    return res.status(400).json({ error: 'Bank name and last 4 digits are required' });
  }

  const newCard = {
    id: 'card-' + Date.now(),
    bank: bank || 'Bank Card',
    last4: last4.slice(-4),
    brand: 'Visa',
    expiry: expiry || '12/28',
    holder: holder || db.currentUser.firstName + ' ' + db.currentUser.lastName,
    isDefault: db.wallet.cards.length === 0
  };

  db.wallet.cards.push(newCard);
  saveData(db);

  res.status(201).json({ success: true, message: 'Card added successfully', card: newCard });
});

app.put('/api/wallet/cards/:id/default', (req, res) => {
  const cardId = req.params.id;
  db.wallet.cards.forEach(c => {
    c.isDefault = c.id === cardId;
  });
  saveData(db);
  res.json({ success: true, message: 'Default payment card updated', cards: db.wallet.cards });
});

app.delete('/api/wallet/cards/:id', (req, res) => {
  const cardId = req.params.id;
  db.wallet.cards = db.wallet.cards.filter(c => c.id !== cardId);
  saveData(db);
  res.json({ success: true, message: 'Card removed', cards: db.wallet.cards });
});

// ------------------------------------------------------------
// PROFILE
// ------------------------------------------------------------
app.get('/api/profile', (req, res) => {
  const totalRides = db.rides.length;
  const totalSpent = db.rides.reduce((sum, r) => sum + (r.fare ? r.fare.total : 0), 0);

  res.json({
    user: db.currentUser,
    stats: {
      totalTrips: totalRides + 140, // historical count
      totalSpent: totalSpent + 124000,
      totalDistanceKm: 2842,
      savedRides: 9,
      rating: db.currentUser.rating || 4.98
    }
  });
});

app.put('/api/profile', (req, res) => {
  const { firstName, lastName, email, phone, address } = req.body;

  if (firstName) db.currentUser.firstName = firstName;
  if (lastName) db.currentUser.lastName = lastName;
  if (email) db.currentUser.email = email;
  if (phone) db.currentUser.phone = phone;
  if (address) db.currentUser.address = address;

  db.currentUser.avatarText = (db.currentUser.firstName[0] + (db.currentUser.lastName[0] || '')).toUpperCase();

  // sync to users list
  const u = db.users.find(u => u.email.toLowerCase() === db.currentUser.email.toLowerCase());
  if (u) {
    Object.assign(u, db.currentUser);
  }

  saveData(db);
  res.json({ success: true, message: 'Profile updated successfully!', user: db.currentUser });
});

app.put('/api/profile/preferences', (req, res) => {
  const { smsUpdates, safetyNotifications, promoOffers } = req.body;
  if (!db.currentUser.preferences) db.currentUser.preferences = {};

  if (smsUpdates !== undefined) db.currentUser.preferences.smsUpdates = !!smsUpdates;
  if (safetyNotifications !== undefined) db.currentUser.preferences.safetyNotifications = !!safetyNotifications;
  if (promoOffers !== undefined) db.currentUser.preferences.promoOffers = !!promoOffers;

  saveData(db);
  res.json({ success: true, message: 'Preferences saved', preferences: db.currentUser.preferences });
});

// ------------------------------------------------------------
// NOTIFICATIONS
// ------------------------------------------------------------
app.get('/api/notifications', (req, res) => {
  const unreadCount = db.notifications.filter(n => !n.read).length;
  res.json({
    unreadCount,
    notifications: db.notifications
  });
});

app.post('/api/notifications/clear', (req, res) => {
  db.notifications.forEach(n => { n.read = true; });
  saveData(db);
  res.json({ success: true, message: 'All notifications marked as read' });
});

// ------------------------------------------------------------
// CONTACT & SUPPORT
// ------------------------------------------------------------
app.post('/api/contact', (req, res) => {
  const { topic, firstName, lastName, email, subject, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: 'Email and message are required' });
  }

  const ticketId = 'TCK-' + Math.floor(10000 + Math.random() * 90000);
  const inquiry = {
    ticketId,
    topic: topic || 'General inquiry',
    name: `${firstName || ''} ${lastName || ''}`.trim(),
    email,
    subject: subject || 'No subject',
    message,
    createdAt: new Date().toISOString(),
    status: 'Open'
  };

  db.contactInquiries.push(inquiry);
  saveData(db);

  res.status(201).json({
    success: true,
    message: `Thank you! Your ticket #${ticketId} has been registered. Our support team will reply within 24 hours.`,
    ticketId
  });
});

// Fallback route for unknown API routes
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Start listening
app.listen(PORT, () => {
  console.log(`InstantCab Server running at http://localhost:${PORT}`);
});
