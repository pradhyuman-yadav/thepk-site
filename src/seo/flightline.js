/**
 * Flightline (Android game) content for /flightline, shared by the page (src/pages/Flightline.jsx)
 * and the server render. Facts come from the Unity project (Assets/Flightline/Scripts/Prog.cs and
 * ProjectSettings): keep them in sync when the game changes.
 *
 * To publish the download: set DOWNLOAD.url (e.g. the Google Play listing) and DOWNLOAD.label.
 */

export const FLIGHTLINE = {
  name: 'Flightline',
  tagline: 'Endless flight. Dodge the weather.',
  summary:
    'An endless arcade flyer for Android. Steer a jet through six weather zones, dodge storm cells, lightning and live electric arcs, and collect coins to upgrade your plane in the hangar.',
  platform: 'Android',
  packageId: 'com.pradhyuman.flightline',
  version: '1.0.0',
  icon: '/flightline/icon-512.png',
  feature: '/flightline/feature-1024x500.png',
  privacyAnchor: '/privacy#flightline',
};

// Not published yet: the page shows "coming soon" until a store URL is set here
export const DOWNLOAD = { url: null, label: 'Get it on Google Play' };

export const FACTS = [
  { label: 'No ads', value: 'None, ever.' },
  { label: 'Plays offline', value: 'No connection needed.' },
  { label: 'Your data', value: 'Stays on your phone.' },
];

export const ZONES = [
  { gate: 'A1', name: 'Cloud Nine', line: 'Clear skies ahead.' },
  { gate: 'B2', name: 'Jet Stream', line: 'Tailwind. Speed is picking up.' },
  { gate: 'C3', name: 'Storm Front', line: 'Turbulence ahead.' },
  { gate: 'D4', name: 'Aurora', line: 'Night flight. Keep your eyes open.' },
  { gate: 'E5', name: 'High Cirrus', line: 'Thin air. Stay sharp.' },
  { gate: 'F6', name: 'The Edge', line: 'Few flights make it this far.' },
];

export const UPGRADES = [
  { name: 'Fuel Tank', desc: 'Burn less fuel' },
  { name: 'Magnet', desc: 'Longer coin magnet' },
  { name: 'Shield', desc: 'Longer shield' },
  { name: 'Coin Value', desc: 'Coins worth more' },
  { name: 'Head Start', desc: 'Afterburner launch' },
];

export const PROGRESSION = [
  { name: 'Pilot rank', desc: 'Every flight earns XP toward the next rank, with coin rewards as you level up.' },
  { name: 'Logbook', desc: '22 achievements for distance, coins, close calls, zones reached and more.' },
  { name: 'Daily missions', desc: 'Fresh goals every day, with a streak for coming back.' },
];
