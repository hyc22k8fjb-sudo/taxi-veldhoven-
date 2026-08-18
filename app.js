const $ = (id) => document.getElementById(id);
const form = $('bookingForm');
const pickup = $('pickup');
const destination = $('destination');
const date = $('date');
const time = $('time');
const persons = $('persons');
const priceEl = $('price');
const ctaPrice = $('ctaPrice');
const priceMessage = $('priceMessage');
const formError = $('formError');
const confirmation = $('confirmation');
const flightWrap = $('flightWrap');

$('year').textContent = new Date().getFullYear();

for (let i = 1; i <= 8; i++) {
  const option = document.createElement('option');
  option.value = String(i);
  option.textContent = `${i} ${i === 1 ? 'persoon' : 'personen'}`;
  persons.appendChild(option);
}

const today = new Date();
today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
date.min = today.toISOString().slice(0, 10);

const AIRPORT_PRICES = {
  'eindhoven airport': 39,
  'amsterdam schiphol': 229,
  'schiphol': 229,
  'brussel zaventem': 219,
  'brussels airport': 219,
  'düsseldorf airport': 219,
  'dusseldorf airport': 219
};

function normalise(value) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function airportPrice(value) {
  const text = normalise(value);
  for (const [name, price] of Object.entries(AIRPORT_PRICES)) {
    if (text.includes(name)) return price;
  }
  return null;
}

function isAirport(value) {
  const text = normalise(value);
  return Object.keys(AIRPORT_PRICES).some((name) => text.includes(name)) || text.includes('airport') || text.includes('luchthaven');
}

function updateFlightField() {
  flightWrap.classList.toggle('hidden', !isAirport(destination.value));
}

function formatPrice(price) {
  return `€${price.toFixed(0)}`;
}

function calculatePrice() {
  const from = pickup.value.trim();
  const to = destination.value.trim();
  if (!from || !to) {
    priceEl.textContent = '€—';
    ctaPrice.textContent = 'Vul uw ritgegevens in';
    priceMessage.textContent = 'Vul je ophaaladres en bestemming in voor de prijs.';
    return null;
  }

  const exact = airportPrice(to);
  if (exact !== null) {
    priceEl.textContent = formatPrice(exact);
    ctaPrice.textContent = `Vaste prijs: ${formatPrice(exact)}`;
    priceMessage.textContent = 'Vaste luchthavenprijs — geen verrassingen achteraf.';
    return { amount: exact, label: 'Vaste prijs' };
  }

  priceEl.textContent = '€37+';
  ctaPrice.textContent = 'Prijs vanaf €37';
  priceMessage.textContent = 'Lokale rit: vanaf €37. Voor de exacte prijs nemen we uw volledige adres en bestemming mee.';
  return { amount: 37, label: 'Vanafprijs' };
}

function setPaymentSelection() {
  document.querySelectorAll('.payment').forEach((card) => {
    const input = card.querySelector('input');
    card.classList.toggle('selected', input.checked);
  });
}

document.querySelectorAll('.payment input').forEach((input) => input.addEventListener('change', setPaymentSelection));

[pickup, destination, date, time].forEach((input) => {
  input.addEventListener('input', () => {
    updateFlightField();
    calculatePrice();
  });
});

document.querySelectorAll('.airport-card').forEach((card) => {
  card.addEventListener('click', () => {
    destination.value = card.dataset.destination || '';
    updateFlightField();
    calculatePrice();
    $('boeken').scrollIntoView({ behavior: 'smooth', block: 'start' });
    destination.focus({ preventScroll: true });
  });
});

function validPhone(value) {
  const compact = value.replace(/[()\-\s]/g, '');
  return /^(?:0\d{8,14}|\+\d{8,15})$/.test(compact);
}

function showError(message, fieldId) {
  formError.textContent = message;
  formError.hidden = false;
  if (fieldId) $(fieldId).focus();
}

function bookingText(data, price) {
  const lines = [
    '🚕 *Nieuwe ritaanvraag – Taxi Veldhoven*',
    '',
    `👤 Naam: ${data.name}`,
    `📞 Telefoon: ${data.phone}`,
    `📍 Ophaaladres: ${data.pickup}`,
    `🏁 Bestemming: ${data.destination}`,
    `🗓️ Datum: ${data.date}`,
    `⏰ Tijd: ${data.time}`,
    `👥 Personen: ${data.persons}`,
    `🧳 Bagage: ${data.luggage}`,
    `💳 Betaalwijze: ${data.payment}`,
    price.amount ? `💰 ${price.label}: ${formatPrice(price.amount)}` : '',
    data.flight ? `✈️ Vluchtnummer: ${data.flight}` : '',
    data.email ? `✉️ E-mail: ${data.email}` : '',
    data.note ? `💬 Opmerking: ${data.note}` : ''
  ];
  return lines.filter(Boolean).join('\n');
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  formError.hidden = true;
  confirmation.classList.add('hidden');

  const required = [
    ['pickup', 'Vul je ophaaladres in.'],
    ['destination', 'Vul je bestemming in.'],
    ['date', 'Kies een datum.'],
    ['time', 'Kies een ophaaltijd.'],
    ['name', 'Vul je naam in.'],
    ['phone', 'Vul je telefoonnummer in.']
  ];

  for (const [id, message] of required) {
    if (!$(id).value.trim()) {
      showError(message, id);
      return;
    }
  }

  if (!validPhone($('phone').value)) {
    showError('Vul een geldig telefoonnummer in, bijvoorbeeld 06 12345678 of +31 6 ...', 'phone');
    return;
  }

  if ($('email').value && !$('email').checkValidity()) {
    showError('Controleer het e-mailadres.', 'email');
    return;
  }

  const selectedDate = new Date(`${date.value}T${time.value}`);
  if (Number.isNaN(selectedDate.getTime()) || selectedDate < new Date()) {
    showError('Kies een datum en tijd in de toekomst.', 'date');
    return;
  }

  const price = calculatePrice();
  if (!price) {
    showError('Controleer je ophaaladres en bestemming.');
    return;
  }

  const data = {
    name: $('name').value.trim(),
    phone: $('phone').value.trim(),
    pickup: pickup.value.trim(),
    destination: destination.value.trim(),
    date: date.value,
    time: time.value,
    persons: persons.value,
    luggage: $('luggage').value,
    email: $('email').value.trim(),
    flight: $('flight').value.trim(),
    note: $('note').value.trim(),
    payment: document.querySelector('input[name="payment"]:checked').value
  };

  const message = bookingText(data, price);
  const whatsappUrl = `https://wa.me/31643143072?text=${encodeURIComponent(message)}`;

  confirmation.innerHTML = `<h2>✅ Aanvraag voorbereid</h2><p><b>${data.name}</b>, alle gegevens zijn gecontroleerd. Verstuur de aanvraag nu via WhatsApp zodat Taxi Veldhoven de rit kan bevestigen.</p><p>🚕 ${data.pickup} → ${data.destination}<br>🗓️ ${data.date} om ${data.time}<br>👥 ${data.persons} personen · 🧳 ${data.luggage}<br>💳 ${data.payment}<br>💰 <b>${price.label}: ${price.amount ? formatPrice(price.amount) : 'op aanvraag'}</b></p><a class="dark-book" href="${whatsappUrl}" target="_blank" rel="noopener">◉ Verstuur via WhatsApp</a><p class="address-help">Uw volledige ophaaladres en bestemming worden letterlijk meegestuurd, zodat er geen probleem ontstaat waarbij alleen een postcode of plaatsnaam wordt doorgestuurd.</p>`;
  confirmation.classList.remove('hidden');
  confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });

  // Open WhatsApp immediately after the user explicitly submits the booking form.
  window.open(whatsappUrl, '_blank', 'noopener');
});

const menuToggle = $('menuToggle');
const mobileMenu = $('mobileMenu');
const menuClose = $('menuClose');
function closeMenu() {
  mobileMenu.classList.remove('open');
  mobileMenu.setAttribute('aria-hidden', 'true');
  menuToggle.setAttribute('aria-expanded', 'false');
}
menuToggle?.addEventListener('click', () => {
  mobileMenu.classList.add('open');
  mobileMenu.setAttribute('aria-hidden', 'false');
  menuToggle.setAttribute('aria-expanded', 'true');
});
menuClose?.addEventListener('click', closeMenu);
mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

updateFlightField();
calculatePrice();
setPaymentSelection();
