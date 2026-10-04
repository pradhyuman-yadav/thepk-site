/**
 * Privacy policy for every app published by Pradhyuman Yadav. Rendered at /privacy by the React
 * page (src/pages/Privacy.jsx) and as full HTML by the server, so store reviewers and crawlers can
 * read it without JavaScript.
 *
 * To publish a new app: add an entry to APPS (its anchor becomes thepk.in/privacy#<id>) and bump
 * UPDATED. If an app adds analytics, ads, purchases, accounts or network features, its entry must
 * say so before release.
 */

export const DEVELOPER = 'Pradhyuman Yadav';
export const CONTACT_EMAIL = 'pradhyuman680@gmail.com';
export const UPDATED = '2026-10-04';

// One entry per published app. Keep every field true for the shipped build.
export const APPS = [
  {
    id: 'flightline',
    name: 'Flightline',
    platforms: 'Android',
    packageId: 'com.pradhyuman.flightline',
    storedOnDevice: 'Game progress and settings: coins, scores, miles flown, levels, upgrades, achievements, daily missions and streaks, and the sound and haptics switches.',
    sentOffDevice: 'Nothing. The app does not connect to the internet.',
    thirdParties: 'None. Analytics, advertising, in-app purchase and crash reporting services are not used.',
    permissions: 'None beyond what the operating system grants every app.',
  },
];

// General policy, in reading order. Each section: heading and paragraphs (plain text).
export const SECTIONS = [
  {
    heading: 'Who this policy covers',
    paragraphs: [
      `This policy applies to every app and game published by ${DEVELOPER} ("I", "me"), as an individual developer, on any app store or platform. The details for each app are listed under "App details" below.`,
      'If an app does something this general policy does not describe, its entry under App details says so, and that entry takes priority for that app.',
    ],
  },
  {
    heading: 'The short version',
    paragraphs: [
      'My apps do not ask you to create an account, do not ask for your name, email address, phone number or location, and do not sell or share personal information with anyone.',
      'Unless an app’s details say otherwise, everything the app saves stays on your device.',
    ],
  },
  {
    heading: 'Information stored on your device',
    paragraphs: [
      'Apps may save things like your progress, scores and settings on your device so they are there the next time you open the app. This information stays on your device, is not sent to me, and is removed when you uninstall the app or clear its data.',
    ],
  },
  {
    heading: 'Information I collect',
    paragraphs: [
      'I do not collect personal information through my apps unless an app’s details state otherwise. If a future app needs to collect anything, its entry will say what is collected, why, and how long it is kept, before that version is released.',
    ],
  },
  {
    heading: 'App stores and platforms',
    paragraphs: [
      'You download my apps through app stores such as Google Play and the Apple App Store. Those stores process information about you (for example your account, downloads, payments and, if you allow it, crash and usage reports) under their own privacy policies, not this one.',
      'The stores may show me aggregated, anonymous statistics, such as install counts, ratings and crash reports. These do not identify you, and I use them only to fix problems and improve the apps.',
    ],
  },
  {
    heading: 'Third-party services',
    paragraphs: [
      'Unless an app’s details list them, my apps do not include third-party analytics, advertising, social or tracking services. If an app ever does, its entry will name each service and link to that service’s privacy policy.',
    ],
  },
  {
    heading: 'Permissions',
    paragraphs: [
      'Apps only request the device permissions they need to work, and each app’s details list them. You can review or revoke permissions at any time in your device settings.',
    ],
  },
  {
    heading: 'Children',
    paragraphs: [
      'My apps do not knowingly collect personal information from anyone, including children under 13 (or the equivalent minimum age where you live). If you believe a child has sent me personal information, contact me and I will delete it.',
    ],
  },
  {
    heading: 'Security and retention',
    paragraphs: [
      'Because the apps keep your information on your device, it is protected by your device’s own security and kept until you remove the app or its data. If I ever receive information from you directly, for example in a support email, I keep it only as long as needed to respond and then delete it.',
    ],
  },
  {
    heading: 'Your rights',
    paragraphs: [
      'Depending on where you live (for example under the GDPR in Europe or the CCPA in California), you may have the right to ask what personal information is held about you, to have it corrected or deleted, and to object to its use. Since my apps do not collect personal information, there is usually nothing to provide, but you can always contact me with a request and I will answer it.',
    ],
  },
  {
    heading: 'Changes to this policy',
    paragraphs: [
      'If this policy changes, the updated version will be posted on this page with a new date. If a change affects what an app collects, the app’s entry will be updated before the version that makes the change is released.',
    ],
  },
];

export const APP_FIELDS = [
  ['storedOnDevice', 'Stored on your device'],
  ['sentOffDevice', 'Sent off your device'],
  ['thirdParties', 'Third-party services'],
  ['permissions', 'Permissions'],
];
