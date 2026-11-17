import React, { createContext, useContext, useMemo } from 'react';

export type AppCurrency = 'RWF' | 'USD';
export type AppLanguage = 'EN' | 'RW' | 'FR';

export const USD_RATE = 1350;

let globalCurrency: AppCurrency = 'RWF';
let globalLanguage: AppLanguage = 'EN';

export function setGlobalCurrency(currency: AppCurrency): void {
  globalCurrency = currency === 'USD' ? 'USD' : 'RWF';
}

export function getGlobalCurrency(): AppCurrency {
  return globalCurrency;
}

export function setGlobalLanguage(language: AppLanguage): void {
  if (language === 'RW' || language === 'FR') {
    globalLanguage = language;
  } else {
    globalLanguage = 'EN';
  }
}

export function getGlobalLanguage(): AppLanguage {
  return globalLanguage;
}

/**
 * Formats an amount stored in RWF into either RWF ("180,000 RWF")
 * or USD ("$133 USD") based on the active global currency or explicit override.
 */
export function formatCurrency(amountRwf: number, currencyOverride?: AppCurrency): string {
  const safeAmount = Number.isFinite(amountRwf) ? amountRwf : 0;
  const active = currencyOverride || globalCurrency;

  if (active === 'USD') {
    const abs = Math.abs(safeAmount);
    const sign = safeAmount < 0 ? '-' : '';
    if (abs === 0) return '$0 USD';
    const usd = Math.max(1, Math.round(abs / USD_RATE));
    return `${sign}$${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(usd)} USD`;
  }

  return (
    new Intl.NumberFormat('en-RW', {
      style: 'decimal',
      maximumFractionDigits: 0,
    }).format(safeAmount) + ' RWF'
  );
}

/**
 * Compact format without currency suffix for tight table cells or charts if needed
 */
export function formatCurrencyValue(amountRwf: number, currencyOverride?: AppCurrency): string {
  const safeAmount = Number.isFinite(amountRwf) ? amountRwf : 0;
  const active = currencyOverride || globalCurrency;
  if (active === 'USD') {
    const abs = Math.abs(safeAmount);
    const sign = safeAmount < 0 ? '-' : '';
    if (abs === 0) return '$0';
    const usd = Math.max(1, Math.round(abs / USD_RATE));
    return `${sign}$${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(usd)}`;
  }
  return new Intl.NumberFormat('en-RW', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(safeAmount);
}

type TranslationTuple = { RW: string; FR: string };

const DICTIONARY: Record<string, TranslationTuple> = {
  // Brand & Top Header / Navigation
  'KigaliFleet': { RW: 'KigaliFleet', FR: 'KigaliFleet' },
  'Simple car rental, driver, and booking management': {
    RW: 'Gucunga imodoka zikodeshwa, abashoferi n’ingendo mu buryo bworoshye',
    FR: 'Gestion simple des voitures de location, chauffeurs et réservations',
  },
  'Manage your cars, drivers, and bookings': {
    RW: 'Gucunga imodoka zawe, abashoferi n’ingendo',
    FR: 'Gérez vos voitures, chauffeurs et réservations',
  },
  'Dashboard': { RW: 'Incamake', FR: 'Tableau de bord' },
  'Home': { RW: 'Ahabanza', FR: 'Accueil' },
  'Home Page': { RW: 'Urupapuro rw’Itangiriro', FR: 'Page d’accueil' },
  'Overview': { RW: 'Incamake', FR: 'Aperçu' },
  'Today’s cars, drivers, bookings, and airport flights': {
    RW: 'Imodoka z’uyu munsi, abashoferi, ingendo n’indege ziri kuza',
    FR: 'Voitures du jour, chauffeurs, réservations et vols à l’arrivée',
  },
  'Trip Calendar': { RW: 'Kalendari y’Ingendo', FR: 'Calendrier' },
  'Calendar': { RW: 'Kalendari', FR: 'Calendrier' },
  'My Calendar': { RW: 'Kalendari Yanjye', FR: 'Mon calendrier' },
  'See which cars are booked or free on any day': {
    RW: 'Reba imodoka zafashwe cyangwa zidegembye ku munsi wose',
    FR: 'Voyez quelles voitures sont réservées ou libres chaque jour',
  },
  'Cars': { RW: 'Imodoka', FR: 'Voitures' },
  'All your cars, daily prices in RWF, and car check dates': {
    RW: 'Imodoka zawe zose, ibiciro by’umunsi n’igihe cyo gusuzumisha',
    FR: 'Toutes vos voitures, tarifs journaliers et dates de contrôle',
  },
  'All your cars, daily prices, and car check dates': {
    RW: 'Imodoka zawe zose, ibiciro by’umunsi n’igihe cyo gusuzumisha',
    FR: 'Toutes vos voitures, tarifs journaliers et dates de contrôle',
  },
  'Repairs': { RW: 'Igaraje', FR: 'Réparations' },
  'Track cars in the garage so nobody books a broken car': {
    RW: 'Kurikirana imodoka ziri mu igaraje kugira ngo ntawuzikodesha zidakora',
    FR: 'Suivez les voitures au garage pour éviter toute réservation en panne',
  },
  'Drivers': { RW: 'Abashoferi', FR: 'Chauffeurs' },
  'Driver Home': { RW: 'Ahabanza h’Umushoferi', FR: 'Espace Chauffeur' },
  'Your driver list, phone numbers, and current trips': {
    RW: 'Urutonde rw’abashoferi, telefoni zabo n’ingendo barimo',
    FR: 'Votre liste de chauffeurs, numéros et trajets en cours',
  },
  'Bookings': { RW: 'Ingendo', FR: 'Réservations' },
  'Trips': { RW: 'Ingendo', FR: 'Trajets' },
  'My Trips': { RW: 'Ingendo Zanjye', FR: 'Mes trajets' },
  'All customer trips, dates, prices, and payment status': {
    RW: 'Ingendo zose z’abakiriya, amatariki, ibiciro n’uko bishyuye',
    FR: 'Tous les trajets clients, dates, tarifs et paiements',
  },
  'Send Drivers': { RW: 'Kohereza Umushoferi', FR: 'Envoi Chauffeurs' },
  'Send': { RW: 'Ohereza', FR: 'Envoyer' },
  'Driver Screen': { RW: 'Aho Umushoferi Arebera', FR: 'Écran Chauffeur' },
  'Assign a driver and send trip details by SMS': {
    RW: 'Gena umushoferi hanyuma umwoherereze amakuru y’urugendo kuri SMS',
    FR: 'Assignez un chauffeur et envoyez les détails du trajet par SMS',
  },
  'Customers': { RW: 'Abakiriya', FR: 'Clients' },
  'Repeat guests, tour companies, and unpaid balances': {
    RW: 'Abakiriya bahoraho, ibigo by’ubukerarugendo n’amadeni asigaye',
    FR: 'Clients réguliers, agences de voyage et soldes dus',
  },
  'Payments': { RW: 'Kwishyura', FR: 'Paiements' },
  'Money': { RW: 'Amafaranga', FR: 'Argent' },
  'Mobile Money, bank payments, and customer receipts': {
    RW: 'Mobile Money, banki n’inyemezabuguzi z’abakiriya',
    FR: 'Mobile Money, virements bancaires et reçus clients',
  },
  'Reports': { RW: 'Raporo', FR: 'Rapports' },
  'How much money your cars earned and monthly totals': {
    RW: 'Amafaranga imodoka zawe zinjije n’igiteranyo cy’ukwezi',
    FR: 'Revenus générés par vos voitures et totaux mensuels',
  },
  'Settings & Staff': { RW: 'Igenamiterere & Abakozi', FR: 'Paramètres & Équipe' },
  'Company details, staff access, and business rules': {
    RW: 'Amakuru y’ikigo, uburenganzira bw’abakozi n’amategeko y’akazi',
    FR: 'Infos société, accès de l’équipe et règles de gestion',
  },
  'Admin Control': { RW: 'Ubuyobozi Bukuru', FR: 'Administration' },
  'Admin': { RW: 'Admin', FR: 'Admin' },
  'Manage all companies, plans, money, and safety logs': {
    RW: 'Cunga ibigo byose, ibiciro, amafaranga n’umutekano w’urubuga',
    FR: 'Gérez les sociétés, forfaits, paiements et journaux de sécurité',
  },
  'SMS Test': { RW: 'Igerageza rya SMS', FR: 'Test SMS' },
  'Test sending trip text messages to drivers': {
    RW: 'Gerageza kohereza ubutumwa bwa SMS ku bashoferi',
    FR: 'Testez l’envoi de SMS de mission aux chauffeurs',
  },
  'Booking Website': { RW: 'Urubuga rw’Abakiriya', FR: 'Site de Réservation' },
  'The page where customers pick a car and book online': {
    RW: 'Aho abakiriya bahitamo imodoka bagafata gahunda kuri interineti',
    FR: 'La page où vos clients choisissent une voiture et réservent en ligne',
  },
  'Car Checks': { RW: 'Isuzuma ry’Imodoka', FR: 'Contrôles Auto' },
  'Check fuel, mileage, and scratches before and after each trip': {
    RW: 'Reba lisansi, ibirometero n’ubusembwa mbere na nyuma y’urugendo',
    FR: 'Vérifiez carburant, kilométrage et état avant et après chaque trajet',
  },
  'Costs': { RW: 'Ibiciro & Amafaranga Yasohotse', FR: 'Dépenses' },
  'Fuel, repairs, driver allowances, and daily costs': {
    RW: 'Lisansi, igaraje, amafaranga y’umushoferi n’ibindi byasohotse',
    FR: 'Carburant, réparations, indemnités chauffeurs et frais quotidiens',
  },
  'To-Do List': { RW: 'Imirimo y’Umunsi', FR: 'Tâches à faire' },
  'Daily jobs for your team like car washes and airport pickups': {
    RW: 'Imirimo ya buri munsi nko koza imodoka no kwakira abava ku kibuga',
    FR: 'Tâches quotidiennes comme le lavage et l’accueil à l’aéroport',
  },
  'Plans': { RW: 'Ibiciro & Gahunda', FR: 'Forfaits' },
  'Pick a monthly plan that fits the number of cars you own': {
    RW: 'Hitamo gahunda y’ukwezi ijyanye n’umubare w’imodoka utunze',
    FR: 'Choisissez un forfait mensuel adapté à la taille de votre flotte',
  },
  'Repair Desk': { RW: 'Ameza y’Igaraje', FR: 'Atelier Réparation' },
  'All Pages': { RW: 'Paji Zose', FR: 'Toutes les pages' },
  'More': { RW: 'Ibindi', FR: 'Plus' },
  'Menu': { RW: 'Ibikubiyemo', FR: 'Menu' },
  'Main Admin': { RW: 'Ubuyobozi Bukuru', FR: 'Admin Principal' },
  'Share Booking Link': { RW: 'Sangiza Urubuga rwo Gukodesha', FR: 'Partager le lien client' },
  'Kigali, Rwanda': { RW: 'Kigali, u Rwanda', FR: 'Kigali, Rwanda' },
  'Start Over': { RW: 'Tangira Bushya', FR: 'Réinitialiser' },
  'Car Rental App': { RW: 'Sisitemu yo Gukodesha Imodoka', FR: 'App Location Auto' },

  // Roles
  'Owner': { RW: 'Nyir’Ikigo', FR: 'Propriétaire' },
  'Manager': { RW: 'Umuyobozi', FR: 'Gérant' },
  'Booking Staff': { RW: 'Uwakira Ingendo', FR: 'Agent Réservation' },
  'Accountant': { RW: 'Umubaruramari', FR: 'Comptable' },
  'Car Manager': { RW: 'Ushinzwe Imodoka', FR: 'Chef de Parc' },
  'Mechanic': { RW: 'Umukanishi', FR: 'Mécanicien' },
  'Driver': { RW: 'Umushoferi', FR: 'Chauffeur' },
  'Front Desk': { RW: 'Uwakira Abakiriya', FR: 'Réceptionniste' },
  'Platform Owner': { RW: 'Nyir’Urubuga', FR: 'Propriétaire Plateforme' },

  // TopHeader User Popover & Actions
  'New Booking': { RW: 'Gahunda Nshya', FR: 'Nouvelle Réservation' },
  'Book': { RW: 'Fata', FR: 'Réserver' },
  'Alerts & Updates': { RW: 'Ubutumwa n’Amakuru', FR: 'Alertes & Mises à jour' },
  'All caught up': { RW: 'Byose byasomwe', FR: 'Tout est à jour' },
  'Screen & Colors': { RW: 'Imigaragarire & Amabara', FR: 'Écran & Couleurs' },
  'Dark': { RW: 'Umukara', FR: 'Sombre' },
  'Light': { RW: 'Umweru', FR: 'Clair' },
  'Screen Mode': { RW: 'Uko Mugaragaza', FR: 'Mode d’affichage' },
  'Pick a Color': { RW: 'Hitamo Ibara', FR: 'Choisir une couleur' },
  'Super Admin Settings': { RW: 'Igenamiterere rya Admin', FR: 'Paramètres Super Admin' },
  'Owner Access': { RW: 'Uburenganzira bw’Umuyobozi', FR: 'Accès Propriétaire' },
  'Main Settings': { RW: 'Igenamiterere Rikuru', FR: 'Réglages Principaux' },
  'Admin Desk': { RW: 'Ameza ya Admin', FR: 'Bureau Admin' },
  'Companies': { RW: 'Ibigo', FR: 'Entreprises' },
  'Admin Team': { RW: 'Itsinda rya Admin', FR: 'Équipe Admin' },
  'Switch View': { RW: 'Hindura Uko Urebera', FR: 'Changer de vue' },
  'Switch Google Account': { RW: 'Hindura Konti ya Google', FR: 'Changer de compte Google' },
  'Continue with Google': { RW: 'Komeza na Google', FR: 'Continuer avec Google' },
  'Sign Out': { RW: 'Sohoka', FR: 'Déconnexion' },
  'Back': { RW: 'Subira inyuma', FR: 'Retour' },
  'Read all': { RW: 'Soma byose', FR: 'Tout lire' },
  'All': { RW: 'Byose', FR: 'Tous' },
  'Flights': { RW: 'Indege', FR: 'Vols' },
  'No alerts here.': { RW: 'Nta makuru mashya ahari.', FR: 'Aucune alerte ici.' },
  'Open →': { RW: 'Fungura →', FR: 'Ouvrir →' },
  'Mark unread': { RW: 'Bishyire mubitasomwe', FR: 'Marquer non lu' },
  'Mark read': { RW: 'Byasomwe', FR: 'Marquer lu' },
  'Private Admin Area': { RW: 'Ahabugenewe Abayobozi gusa', FR: 'Zone Admin Privée' },
  'Return Home': { RW: 'Subira Ahabanza', FR: 'Retour à l’accueil' },
  'Sign in as Admin': { RW: 'Injira nka Admin', FR: 'Connexion Admin' },

  // Common UI Words & Statuses
  'Available': { RW: 'Iraboneka', FR: 'Disponible' },
  'Free': { RW: 'Irasohoka', FR: 'Libre' },
  'Booked': { RW: 'Yafashwe', FR: 'Réservée' },
  'On Trip': { RW: 'Mu rugendo', FR: 'En trajet' },
  'In Garage': { RW: 'Mu igaraje', FR: 'Au garage' },
  'Confirmed': { RW: 'Byemejwe', FR: 'Confirmée' },
  'Pending': { RW: 'Bitegereje', FR: 'En attente' },
  'Completed': { RW: 'Byarangiye', FR: 'Terminée' },
  'Done': { RW: 'Byarangiye', FR: 'Terminé' },
  'Cancelled': { RW: 'Byahagaritswe', FR: 'Annulée' },
  'Paid': { RW: 'Yishyuwe', FR: 'Payé' },
  'Unpaid': { RW: 'Ntiyishyuwe', FR: 'Impayé' },
  'Partial': { RW: 'Yishyuwe Igice', FR: 'Partiel' },
  'Overdue': { RW: 'Byarenze Igihe', FR: 'En retard' },
  'Active': { RW: 'Irakora', FR: 'Actif' },
  'Suspended': { RW: 'Yahagaritswe', FR: 'Suspendu' },
  'Automatic': { RW: 'Otomatiki', FR: 'Automatique' },
  'Manual': { RW: 'Manyuweli', FR: 'Manuelle' },
  'Diesel': { RW: 'Mazutu', FR: 'Diesel' },
  'Petrol': { RW: 'Lisansi', FR: 'Essence' },
  'Hybrid': { RW: 'Hybride', FR: 'Hybride' },
  'Save': { RW: 'Bika', FR: 'Enregistrer' },
  'Cancel': { RW: 'Hagarika', FR: 'Annuler' },
  'Delete': { RW: 'Siba', FR: 'Supprimer' },
  'Edit': { RW: 'Hindura', FR: 'Modifier' },
  'Close': { RW: 'Funga', FR: 'Fermer' },
  'Search': { RW: 'Shaka', FR: 'Rechercher' },
  'Filter': { RW: 'Yungurura', FR: 'Filtrer' },
  'Reset': { RW: 'Subiza uko byari', FR: 'Réinitialiser' },
  'Apply': { RW: 'Emeza', FR: 'Appliquer' },
  'Print': { RW: 'Sohora ku Rupapuro', FR: 'Imprimer' },
  'Download': { RW: 'Kuramo', FR: 'Télécharger' },
  'Total': { RW: 'Igiteranyo', FR: 'Total' },
  'Subtotal': { RW: 'Igiteranyo mbere y’umusoro', FR: 'Sous-total' },
  'Status': { RW: 'Imiterere', FR: 'Statut' },
  'Actions': { RW: 'Ibikorwa', FR: 'Actions' },
  'Notes': { RW: 'Inyongera', FR: 'Notes' },
  'Per day': { RW: 'Ku munsi', FR: 'Par jour' },
  '/day': { RW: '/umunsi', FR: '/jour' },

  // Landing Page
  'How it works': { RW: 'Uko ikora', FR: 'Fonctionnement' },
  'Try it': { RW: 'Gerageza', FR: 'Essayer' },
  'Prices': { RW: 'Ibiciro', FR: 'Tarifs' },
  'Help': { RW: 'Ubufasha', FR: 'Aide' },
  'Sign in': { RW: 'Injira', FR: 'Connexion' },
  'Start now': { RW: 'Tangira nonaha', FR: 'Commencer' },
  'Open Dashboard': { RW: 'Fungura Sisitemu', FR: 'Ouvrir le tableau de bord' },
  'Try Booking Page': { RW: 'Reba Urubuga rw’Abakiriya', FR: 'Voir le site client' },
  'Made for Car Rental Companies in Rwanda': {
    RW: 'Yagenewe Ibigo Bikodesha Imodoka mu Rwanda',
    FR: 'Conçu pour les loueurs de voitures au Rwanda',
  },
  'Run your car rental business without double bookings.': {
    RW: 'Cunga ibikorwa byo gukodesha imodoka nta kugongana kw’ingendo.',
    FR: 'Gérez votre agence de location sans aucune double réservation.',
  },
  'One simple app for your cars, drivers, customer bookings, and Mobile Money payments. Easy to use on any phone or computer.': {
    RW: 'Porogaramu imwe yoroshye y’imodoka zawe, abashoferi, gahunda z’abakiriya no kwishyura kuri Mobile Money. Ikora kuri telefoni na mudasobwa.',
    FR: 'Une application simple pour vos voitures, chauffeurs, réservations clients et paiements Mobile Money. Facile sur téléphone et ordinateur.',
  },
  'Everything you need in one place': {
    RW: 'Ibikoresho byose ukeneye ahantu hamwe',
    FR: 'Tout ce dont vous avez besoin au même endroit',
  },
  'Stop double bookings': { RW: 'Hagarika kugongana kw’ingendo', FR: 'Zéro double réservation' },
  'Send SMS to drivers': { RW: 'Ohereza SMS ku bashoferi', FR: 'SMS aux chauffeurs' },
  'Your own booking page': { RW: 'Urubuga rwawe rwo gukodesha', FR: 'Votre page de réservation' },
  'Simple monthly plans': { RW: 'Ibiciro byoroshye by’ukwezi', FR: 'Forfaits mensuels simples' },
  'One flat monthly price. No extra booking fees.': {
    RW: 'Igiciro kimwe ku kwezi. Nta kiguzi cy’inyongera kuri buri rugendo.',
    FR: 'Un tarif mensuel fixe. Aucun frais supplémentaire par réservation.',
  },
  'How many cars do you own?': {
    RW: 'Ufite imodoka zingahe?',
    FR: 'Combien de voitures avez-vous ?',
  },
  'Recommended plan': { RW: 'Gahunda ikubereye', FR: 'Forfait recommandé' },
  'Common questions': { RW: 'Ibibazo bikunze kubazwa', FR: 'Questions fréquentes' },
  'Ready to organize your cars and drivers?': {
    RW: 'Witeguye gushyira imodoka n’abashoferi bawe ku murongo?',
    FR: 'Prêt à organiser vos voitures et chauffeurs ?',
  },
  'Create Company Account': { RW: 'Fungura Konti y’Ikigo', FR: 'Créer un compte agence' },

  // Login & Register
  'Welcome back': { RW: 'Ikaze nanone', FR: 'Bon retour' },
  'Sign in to manage your cars, drivers, and bookings.': {
    RW: 'Injira kugira ngo ucunge imodoka, abashoferi n’ingendo.',
    FR: 'Connectez-vous pour gérer vos voitures, chauffeurs et réservations.',
  },
  'Create Account': { RW: 'Fungura Konti', FR: 'Créer un compte' },
  'Sign In': { RW: 'Injira', FR: 'Se connecter' },
  'Email address': { RW: 'Imeri (Email)', FR: 'Adresse e-mail' },
  'Password': { RW: 'Ijambobanga', FR: 'Mot de passe' },
  'Forgot password?': { RW: 'Wibagiwe ijambobanga?', FR: 'Mot de passe oublié ?' },
  'Quick Demo Sign-In': { RW: 'Injira mu Igerageza Vuba', FR: 'Connexion démo rapide' },
  'Business Details': { RW: 'Amakuru y’Ikigo', FR: 'Infos Entreprise' },
  'Owner Account': { RW: 'Konti ya Nyir’Ikigo', FR: 'Compte Propriétaire' },
  'Choose a Plan': { RW: 'Hitamo Gahunda', FR: 'Choisir un forfait' },
  'Company Name': { RW: 'Izina ry’Ikigo', FR: 'Nom de l’agence' },
  'Launch Company Workspace': { RW: 'Fungura Urubuga rw’Ikigo', FR: 'Lancer l’espace agence' },
  'Already have an account?': { RW: 'Usanzwe ufite konti?', FR: 'Déjà un compte ?' },
  'New rental company?': { RW: 'Ikigo gishya gikodesha imodoka?', FR: 'Nouvelle agence ?' },
  'Register Company': { RW: 'Andikisha Ikigo', FR: 'Inscrire l’agence' },

  // Public Storefront
  'Call 24/7:': { RW: 'Hamagara 24/7:', FR: 'Appelez 24h/7 :' },
  'Kigali Airport & Remera Office': {
    RW: 'Ikibuga cy’Indege Kigali & Remera',
    FR: 'Aéroport de Kigali & Bureau Remera',
  },
  'Cars & Prices': { RW: 'Imodoka & Ibiciro', FR: 'Voitures & Tarifs' },
  'Airport Pickup': { RW: 'Kwakira ku Kibuga', FR: 'Accueil Aéroport' },
  'Safari Trips': { RW: 'Ingendo za Safari', FR: 'Voyages Safari' },
  'Check Booking': { RW: 'Reba Gahunda Yawe', FR: 'Suivre ma réservation' },
  'Book a Car': { RW: 'Kodesha Imodoka', FR: 'Louer une voiture' },
  'Return to Office': { RW: 'Subira mu Biro', FR: 'Retour au bureau' },
  'Self-Drive': { RW: 'Witwara', FR: 'Sans chauffeur' },
  'With Driver': { RW: 'N’umushoferi', FR: 'Avec chauffeur' },
  'Pickup Place': { RW: 'Aho Ufatira Imodoka', FR: 'Lieu de prise en charge' },
  'Return Place': { RW: 'Aho Uyisubiza', FR: 'Lieu de retour' },
  'Pickup Date': { RW: 'Itariki yo Gufata', FR: 'Date de départ' },
  'Return Date': { RW: 'Itariki yo Gusubiza', FR: 'Date de retour' },
  'Search Available Cars': { RW: 'Shaka Imodoka Ziboneka', FR: 'Voir les voitures libres' },
  'All Cars': { RW: 'Imodoka Zose', FR: 'Toutes les voitures' },
  'Booked Only': { RW: 'Izafashwe Gusa', FR: 'Réservées uniquement' },
  'All Types': { RW: 'Ubwoko Bwose', FR: 'Tous les types' },
  'Full Month': { RW: 'Ukwezi Kose', FR: 'Mois complet' },
  'Days 1–15': { RW: 'Iminsi 1–15', FR: 'Jours 1–15' },
  'Days 16–30': { RW: 'Iminsi 16–30', FR: 'Jours 16–30' },
  'Block a Car': { RW: 'Funga Imodoka', FR: 'Bloquer une voiture' },
  'Filters': { RW: 'Mushunguzi', FR: 'Filtres' },
  'Car Type': { RW: 'Ubwoko bw’Imodoka', FR: 'Type de voiture' },
  'Automatic Only': { RW: 'Otomatiki Gusa', FR: 'Automatique uniquement' },
  'Seats Needed': { RW: 'Imyanya Ikenewe', FR: 'Places nécessaires' },
  'Fuel': { RW: 'Lisansi / Mazutu', FR: 'Carburant' },
  'Max Price / Day': { RW: 'Igiciro Ntarengwa / Umunsi', FR: 'Prix max / jour' },
  '4WD Safari Only': { RW: '4WD Safari Gusa', FR: '4x4 Safari uniquement' },
  'Pop-Up Roof': { RW: 'Igisenge Gifunguka', FR: 'Toit ouvrant safari' },
  'Clear All': { RW: 'Hanagura Byose', FR: 'Tout effacer' },
  'Book Now': { RW: 'Fata Nonaha', FR: 'Réserver' },
  'View Details': { RW: 'Reba Birambuye', FR: 'Voir détails' },
  'Booking Confirmed!': { RW: 'Gahunda Yemejwe!', FR: 'Réservation confirmée !' },
  'My Voucher': { RW: 'Urwandiko Rwo Gufata', FR: 'Mon bon' },
  'Find Your Booking': { RW: 'Shaka Gahunda Yawe', FR: 'Trouver votre réservation' },
  'Need Help?': { RW: 'Ukeneye Ubufasha?', FR: 'Besoin d’aide ?' },

  // Dashboard / Views Headings & Labels
  'Cars Free Today': { RW: 'Imodoka Zidegembye Uyu Munsi', FR: 'Voitures libres aujourd’hui' },
  'Cars on Road': { RW: 'Imodoka Ziri mu Muhanda', FR: 'Voitures en route' },
  'Drivers Ready': { RW: 'Abashoferi Biteguye', FR: 'Chauffeurs prêts' },
  'Bookings Today': { RW: 'Ingendo z’Uyu Munsi', FR: 'Trajets du jour' },
  'Money Earned': { RW: 'Amafaranga Yinjiye', FR: 'Revenus encaissés' },
  'Total Money Earned': { RW: 'Amafaranga Yose Yinjiye', FR: 'Total des revenus' },
  'Money Paid': { RW: 'Amafaranga Yishyuwe', FR: 'Montant payé' },
  'Still Owed': { RW: 'Asigaye Kwishyurwa', FR: 'Reste à payer' },
  'Add New Car': { RW: 'Ongeraho Imodoka Nshya', FR: 'Ajouter une voiture' },
  'Add Car': { RW: 'Ongeraho Imodoka', FR: 'Ajouter' },
  'Open Work Order': { RW: 'Fungura Igaraje', FR: 'Ouvrir un ordre' },
  'Record Payment': { RW: 'Andika Ubwishyu', FR: 'Enregistrer un paiement' },
  'Record Cost': { RW: 'Andika Ibikoreshejwe', FR: 'Ajouter une dépense' },
  'Assign Driver': { RW: 'Shyiraho Umushoferi', FR: 'Assigner un chauffeur' },
  'Zero Double Bookings': { RW: 'Nta Kugongana kw’Ingendo', FR: 'Zéro double réservation' },
  'Cars Shown on Website': {
    RW: 'Imodoka Zigaragara ku Rubuga rw’Abakiriya',
    FR: 'Voitures visibles sur le site client',
  },
  'Save Changes': { RW: 'Bika Impinduka', FR: 'Enregistrer' },
  'Company Profile': { RW: 'Amakuru y’Ikigo', FR: 'Profil de l’agence' },
  'Team & Access': { RW: 'Abakozi n’Uburenganzira', FR: 'Équipe & Accès' },
  'Website & Booking Rules': {
    RW: 'Urubuga n’Amategeko yo Gukodesha',
    FR: 'Site web & Règles de réservation',
  },
  'Open Booking Website': { RW: 'Fungura Urubuga rw’Abakiriya', FR: 'Ouvrir le site client' },
  'Download Report (CSV)': { RW: 'Kuramo Raporo (CSV)', FR: 'Télécharger le rapport (CSV)' },
  'Print Agreement': { RW: 'Sohora Amasezerano', FR: 'Imprimer le contrat' },

  // SMS & *134# Simulator
  'Driver Text & Phone Line Active': { RW: 'Umurongo wa SMS na Telefoni y’Umushoferi Urakora', FR: 'Ligne SMS et téléphone chauffeur active' },
  'Driver Text & Phone Demo': { RW: 'Igerageza rya SMS na Telefoni y’Umushoferi', FR: 'Démo SMS & téléphone chauffeur' },
  'Send trip texts to your driver in Kinyarwanda or English, and test how drivers check in with *134# with zero internet.': {
    RW: 'Ohereza ubutumwa bw’urugendo mu Kinyarwanda cyangwa Icyongereza, unarebe uko umushoferi yemeza akoresheje *134# nta interineti.',
    FR: 'Envoyez des SMS de trajet en kinyarwanda ou en anglais, et testez la confirmation par *134# sans internet.',
  },
  'Phone Line': { RW: 'Umurongo wa Telefoni', FR: 'Ligne téléphonique' },
  'Speed': { RW: 'Umuvuduko', FR: 'Vitesse' },
  'Pick a Trip': { RW: 'Hitamo Urugendo', FR: 'Choisir un trajet' },
  'Send Text to Driver': { RW: 'Ohereza SMS ku Mushoferi', FR: 'Envoyer un SMS au chauffeur' },
  'SMS Ready': { RW: 'SMS Iteguye', FR: 'SMS prêt' },
  'Not picked': { RW: 'Ntaratoranywa', FR: 'Non choisi' },
  'Car': { RW: 'Imodoka', FR: 'Voiture' },
  'Pick Language': { RW: 'Hitamo Ururimi', FR: 'Choisir la langue' },
  'Auto': { RW: 'Otomatiki', FR: 'Auto' },
  'Message Preview': { RW: 'Uko Ubutumwa Bugaragara', FR: 'Aperçu du message' },
  'Not Sent': { RW: 'Ntibwoherejwe', FR: 'Non envoyé' },
  'Airport Flight Delay Test': { RW: 'Igerageza ry’Indege Yakererewe', FR: 'Test de retard de vol' },
  'Kigali Airport': { RW: 'Ikibuga cy’Indege Kigali', FR: 'Aéroport de Kigali' },
  "If a guest's plane is late, the driver gets a text right away with the new pickup time.": {
    RW: 'Indege y’umukiriya nikererwa, umushoferi ahita abona SMS y’igihe gishya cyo kumufata.',
    FR: "Si l'avion d'un client a du retard, le chauffeur reçoit aussitôt un SMS avec la nouvelle heure.",
  },
  'Flight': { RW: 'Indege', FR: 'Vol' },
  'No flight on this trip': { RW: 'Nta ndege iri kuri uru rugendo', FR: 'Aucun vol sur ce trajet' },
  'Test Late Flight': { RW: 'Gerageza Indege Yakererewe', FR: 'Tester un retard de vol' },
  'Text Sent to Driver About Late Flight': { RW: 'SMS Yoherejwe ku Mushoferi ku Bw’indege Yakererewe', FR: 'SMS envoyé au chauffeur pour retard de vol' },
  'Driver Phone (*134#)': { RW: 'Telefoni y’Umushoferi (*134#)', FR: 'Téléphone chauffeur (*134#)' },
  'No Internet Needed': { RW: 'Ntibisaba Interineti', FR: 'Sans internet' },
  'Drivers dial *134# on any phone to confirm they got the job — no mobile data needed.': {
    RW: 'Abashoferi bakanda *134# kuri telefoni iyo ari yo yose kwemeza urugendo — nta interineti ikenewe.',
    FR: 'Les chauffeurs composent *134# sur tout téléphone pour confirmer la course — sans internet.',
  },
  'READY': { RW: 'BYITEGUYE', FR: 'PRÊT' },
  'Phone Screen Ready': { RW: 'Ecran ya Telefoni Iteguye', FR: 'Écran téléphone prêt' },
  'Dial *134# to confirm trip': { RW: 'Kanda *134# wemeze urugendo', FR: 'Composez *134# pour confirmer' },
  'Dial': { RW: 'Kanda', FR: 'Appeler' },
  'Test Driver Updates': { RW: 'Gerageza Amakuru y’Umushoferi', FR: 'Tester les statuts chauffeur' },
  '1. Driver Got Text (*134#)': { RW: '1. Umushoferi Yabonye SMS (*134#)', FR: '1. Chauffeur a reçu le SMS (*134#)' },
  '2. Driver Waiting at Airport': { RW: '2. Umushoferi Ategereje ku Kibuga', FR: '2. Chauffeur attend à l’aéroport' },
  '3. Guest In Car (Trip Started)': { RW: '3. Umukiriya Ali mu Modoka (Urugendo Rwatangiye)', FR: '3. Client dans la voiture (Trajet démarré)' },

  // Bookings, Calendar, Garages
  'total': { RW: 'yose', FR: 'total' },
  'All customer trips, dates, prices, and payments in one simple list.': {
    RW: 'Ingendo zose z’abakiriya, amatariki, ibiciro n’ubwishyu ku rutonde rumwe rworoshye.',
    FR: 'Tous les trajets clients, dates, tarifs et paiements dans une seule liste simple.',
  },
  'All Bookings': { RW: 'Ingendo Zose', FR: 'Toutes les réservations' },
  'Total Money': { RW: 'Amafaranga Yose', FR: 'Montant total' },
  'Still Unpaid': { RW: 'Atarishyurwa', FR: 'Reste impayé' },
  'Search customer, car plate, flight, or place...': {
    RW: 'Shaka umukiriya, pulaki, indege, cyangwa ahantu...',
    FR: 'Chercher client, plaque, vol ou lieu...',
  },
  'All Payments': { RW: 'Ubwishyu Bwose', FR: 'Tous les paiements' },
  'Fully Paid': { RW: 'Yishyuwe Yose', FR: 'Payé en totalité' },
  'Deposit Paid': { RW: 'Yatanze Avanse', FR: 'Acompte payé' },
  'Customer': { RW: 'Umukiriya', FR: 'Client' },
  'Car & Driver': { RW: 'Imodoka & Umushoferi', FR: 'Voiture & Chauffeur' },
  'Trip & Flight': { RW: 'Urugendo & Indege', FR: 'Trajet & Vol' },
  'Payment': { RW: 'Kwishyura', FR: 'Paiement' },
  'Status & Actions': { RW: 'Imiterere & Ibikorwa', FR: 'Statut & Actions' },
  'Same Car Booked Twice on Same Days!': {
    RW: 'Imodoka Imwe Yafashwe Kabiri ku Matariki Amwe!',
    FR: 'Même voiture réservée deux fois aux mêmes dates !',
  },
  'Check': { RW: 'Reba', FR: 'Vérifier' },
  'out today': { RW: 'zasohotse uyu munsi', FR: 'sorties aujourd’hui' },
  'Today': { RW: 'Uyu munsi', FR: 'Aujourd’hui' },
  'Select car': { RW: 'Hitamo imodoka', FR: 'Choisir une voiture' },
  '7d': { RW: 'Iminsi 7', FR: '7j' },
  'Month': { RW: 'Ukwezi', FR: 'Mois' },
  'Block': { RW: 'Funga', FR: 'Bloquer' },
  'Search car or plate...': { RW: 'Shaka imodoka cyangwa pulaki...', FR: 'Chercher voiture ou plaque...' },
  'VIP Car': { RW: 'Imodoka ya VIP', FR: 'Voiture VIP' },
  'Previous car': { RW: 'Imodoka ibanza', FR: 'Voiture précédente' },
  'Next car': { RW: 'Imodoka ikurikira', FR: 'Voiture suivante' },
  'Tap car': { RW: 'Kanda imodoka', FR: 'Toucher une voiture' },
  'No cars match your filters.': { RW: 'Nta modoka ihura n’ibyo washakishije.', FR: 'Aucune voiture ne correspond à vos filtres.' },
  'Show all cars': { RW: 'Erekana imodoka zose', FR: 'Afficher toutes les voitures' },
  'Trips & Garage': { RW: 'Ingendo & Igaraje', FR: 'Trajets & Garage' },
  'Tap any trip bar or row': { RW: 'Kanda ku murongo w’urugendo', FR: 'Touchez un trajet pour voir' },
  'Tap any empty day to book': { RW: 'Kanda ku munsi udafite ikintu uhite ufata imodoka', FR: 'Touchez un jour libre pour réserver' },
  'Tap any empty day to book · Tap any colored bar for details': {
    RW: 'Kanda umunsi udegenbye ufate imodoka · Kanda ibara urebe amakuru y’urugendo',
    FR: 'Touchez un jour libre pour réserver · Touchez une barre colorée pour les détails',
  },
  'Trip Details': { RW: 'Amakuru y’Urugendo', FR: 'Détails du trajet' },
  'Going to': { RW: 'Aho bajya', FR: 'Destination' },
  'Guest': { RW: 'Umukiriya', FR: 'Client' },
  'Price & Status': { RW: 'Igiciro & Imiterere', FR: 'Prix & Statut' },
  'Dates': { RW: 'Amatariki', FR: 'Dates' },
  'Airport Flight': { RW: 'Indege ku Kibuga', FR: 'Vol à l’aéroport' },
  'On Time': { RW: 'Ku Igihe', FR: 'À l’heure' },
  'City Pickup': { RW: 'Kwakira mu Mujyi', FR: 'Prise en charge en ville' },
  'Driver for This Trip': { RW: 'Umushoferi w’Uru Rugendo', FR: 'Chauffeur pour ce trajet' },
  'No Driver': { RW: 'Nta Mushoferi', FR: 'Sans chauffeur' },
  'Busy': { RW: 'Arafashwe', FR: 'Occupé' },
  'Send Driver SMS': { RW: 'Ohereza SMS ku Mushoferi', FR: 'Envoyer SMS au chauffeur' },
  'Mark Trip Done': { RW: 'Emeza ko Urugendo Rwarangiye', FR: 'Terminer le trajet' },
  'Lock a car so nobody can book it while it is in the garage or being checked.': {
    RW: 'Funga imodoka kugira ngo hatagira uyifata mu gihe iri mu igaraje cyangwa isuzumwa.',
    FR: 'Bloquez une voiture pour empêcher toute réservation pendant sa réparation ou révision.',
  },
  'Choose Car': { RW: 'Hitamo Imodoka', FR: 'Choisir la voiture' },
  'Why is it blocked?': { RW: 'Impamvu ifunzwe?', FR: 'Raison du blocage ?' },
  'Police Safety Check': { RW: 'Isuzuma rya Polisi (Contrôle)', FR: 'Contrôle technique Police' },
  'Oil & Filter Service': { RW: 'Guhindura Amavuta & Filtre', FR: 'Vidange & Filtres' },
  'Brakes & Wheel Repair': { RW: 'Gukora Feri n’Amapine', FR: 'Réparation Freins & Roues' },
  'New Tires': { RW: 'Amapine Mashya', FR: 'Pneus neufs' },
  'Deep Wash & Inside Clean': { RW: 'Koza Imbere n’Inyuma', FR: 'Lavage complet intérieur' },
  'Body Paint & Dent Repair': { RW: 'Gusiga Irangi no Gukosora', FR: 'Peinture & Carrosserie' },
  'Garage Name or Note': { RW: 'Izina ry’Igaraje cyangwa Inyongera', FR: 'Nom du garage ou note' },
  'Block Car Now': { RW: 'Funga Imodoka Nonaha', FR: 'Bloquer maintenant' },

  // Customers
  'Everyone': { RW: 'Bose', FR: 'Tous' },
  'NGOs & Embassies': { RW: 'Imiryango & Ambasade', FR: 'ONG & Ambassades' },
  'Visitors': { RW: 'Abasura u Rwanda', FR: 'Visiteurs' },
  'Tour Partners': { RW: 'Abafatanyabikorwa ba Safari', FR: 'Partenaires Tourisme' },
  'People': { RW: 'Abantu', FR: 'Particuliers' },
  'Customers & Groups': { RW: 'Abakiriya n’Amatsinda', FR: 'Clients & Groupes' },
  'Save people, companies, and tour groups you work with. Track what they paid and what they still owe.': {
    RW: 'Bika abakiriya, ibigo n’amatsinda mukorana. Kurikirana ibyo bishyuye n’amadeni asigaye.',
    FR: 'Enregistrez particuliers, sociétés et agences partenaires. Suivez paiements et soldes dus.',
  },
  'Add Customer': { RW: 'Ongeraho Umukiriya', FR: 'Ajouter un client' },
  'All Customers': { RW: 'Abakiriya Bose', FR: 'Tous les clients' },
  'Company Accounts': { RW: 'Konti z’Ibigo', FR: 'Comptes entreprises' },
  'Total Paid': { RW: 'Ayishyuwe Yose', FR: 'Total payé' },
  'Everything is paid': { RW: 'Byose byishyuwe', FR: 'Tout est payé' },
  'owed': { RW: 'asigaye', FR: 'dû' },
  'Amount Paid (RWF)': { RW: 'Amafaranga Yishyuwe (RWF)', FR: 'Montant payé (RWF)' },

  // Dispatch & Bon de Mission
  'Driver Trips & Live Updates': { RW: 'Ingendo z’Abashoferi n’Amakuru Ako Kanya', FR: 'Trajets Chauffeurs & Suivi en direct' },
  'Follow every trip from start to finish, text drivers on any phone, and print trip papers.': {
    RW: 'Kurikirana buri rugendo kuva rutangiye kugeza rurangira, wandikire abashoferi kuri telefoni yose, unasohore impapuro z’urugendo.',
    FR: 'Suivez chaque trajet du début à la fin, envoyez des SMS aux chauffeurs et imprimez les ordres de mission.',
  },
  'Active Trips': { RW: 'Ingendo Ziriho', FR: 'Trajets actifs' },
  'Needs Driver': { RW: 'Bukeneye Umushoferi', FR: 'Sans chauffeur' },
  'All Covered': { RW: 'Bose Barahari', FR: 'Tous assignés' },
  'Open Driver Phone (*134#)': { RW: 'Fungura Telefoni y’Umushoferi (*134#)', FR: 'Ouvrir téléphone chauffeur (*134#)' },
  'Search guest, driver, place, or plate...': {
    RW: 'Shaka umukiriya, umushoferi, ahantu cyangwa pulaki...',
    FR: 'Chercher client, chauffeur, lieu ou plaque...',
  },
  'Every trip has a driver!': { RW: 'Buri rugendo rufite umushoferi!', FR: 'Chaque trajet a un chauffeur !' },
  'Pick Driver': { RW: 'Hitamo Umushoferi', FR: 'Choisir chauffeur' },
  'Text Sent': { RW: 'SMS Yoherejwe', FR: 'SMS envoyé' },
  'No drivers waiting to reply.': { RW: 'Nta mushoferi utegereje gusubiza.', FR: 'Aucun chauffeur en attente de réponse.' },
  'Waiting Reply': { RW: 'Ategereje Gusubiza', FR: 'En attente de réponse' },
  'Send SMS': { RW: 'Ohereza SMS', FR: 'Envoyer SMS' },
  'Phone': { RW: 'Telefoni', FR: 'Téléphone' },
  'Mark Ready': { RW: 'Emeza ko Yiteguye', FR: 'Marquer prêt' },
  'Switch Driver': { RW: 'Hindura Umushoferi', FR: 'Changer de chauffeur' },
  'Driver Waiting': { RW: 'Umushoferi Ategereje', FR: 'Chauffeur sur place' },
  'No drivers waiting at pickup.': { RW: 'Nta mushoferi utegereje aho bafatira abashyitsi.', FR: 'Aucun chauffeur en attente au lieu de prise en charge.' },
  'At Pickup': { RW: 'Ari Aho Bafatira', FR: 'Sur place' },
  'Late': { RW: 'Yakererewe', FR: 'En retard' },
  'Call Driver': { RW: 'Hamagara Umushoferi', FR: 'Appeler le chauffeur' },
  'Guest Is Inside Car': { RW: 'Umushyitsi Ali mu Modoka', FR: 'Client à bord' },
  'On the Road': { RW: 'Mu Muhanda', FR: 'En route' },
  'No cars on the road right now.': { RW: 'Nta modoka iri mu muhanda ubu.', FR: 'Aucune voiture sur la route actuellement.' },
  'Driving Now': { RW: 'Aratwaye Ubu', FR: 'En conduite' },
  'Trip Paper': { RW: 'Urupapuro rw’Urugendo', FR: 'Ordre de mission' },
  'Finish Trip': { RW: 'Rangiza Urugendo', FR: 'Terminer le trajet' },
  'Trip Done': { RW: 'Urugendo Rwarangiye', FR: 'Trajet terminé' },
  'No finished trips yet.': { RW: 'Nta rugendo rurangira rurahari.', FR: 'Aucun trajet terminé pour le moment.' },
  'Print Trip Paper': { RW: 'Sohora Urupapuro rw’Urugendo', FR: 'Imprimer l’ordre de mission' },
  'Trip Paper (Bon de Mission)': { RW: 'Urupapuro rw’Urugendo (Bon de Mission)', FR: 'Ordre de Mission (Bon de Mission)' },
  'For police road checks across Rwanda': { RW: 'Rwerekwa polisi ku muhanda mu Rwanda hose', FR: 'Pour les contrôles routiers de police au Rwanda' },
  'REPUBLIC OF RWANDA · CITY OF KIGALI': { RW: 'REPUBULIKA Y’U RWANDA · UMUJYI WA KIGALI', FR: 'RÉPUBLIQUE DU RWANDA · VILLE DE KIGALI' },
  'OFFICIAL TRIP PAPER · BON DE MISSION': { RW: 'URUPAPURO RWEMEWE RW’URUGENDO · BON DE MISSION', FR: 'ORDRE DE MISSION OFFICIEL · BON DE MISSION' },
  '1. Driver': { RW: '1. Umushoferi', FR: '1. Chauffeur' },
  'Name': { RW: 'Izina', FR: 'Nom' },
  'Assigned Driver': { RW: 'Umushoferi Washyizweho', FR: 'Chauffeur assigné' },
  'National ID': { RW: 'Indangamuntu', FR: 'Carte nationale' },
  'License': { RW: 'Perimi yo Gutwara', FR: 'Permis de conduire' },
  '2. Car': { RW: '2. Imodoka', FR: '2. Voiture' },
  'Plate': { RW: 'Pulaki', FR: 'Plaque' },
  'Safety Check': { RW: 'Contrôle Technique', FR: 'Contrôle technique' },
  'Valid until': { RW: 'Izarangira', FR: 'Valable jusqu’au' },
  'Insurance': { RW: 'Ubwishingizi', FR: 'Assurance' },
  'Valid': { RW: 'Birakora', FR: 'Valide' },
  '3. Guest & Trip': { RW: '3. Umukiriya & Urugendo', FR: '3. Client & Trajet' },
  'Place': { RW: 'Ahantu', FR: 'Lieu' },
  'Office Desk': { RW: 'Ibiro by’Ikigo', FR: 'Bureau de l’agence' },
  'Driver Signature': { RW: 'Umukono w’Umushoferi', FR: 'Signature du chauffeur' },
  'Send SMS to Driver': { RW: 'Ohereza SMS ku Mushoferi', FR: 'Envoyer un SMS au chauffeur' },
  'Language': { RW: 'Ururimi', FR: 'Langue' },
  'Sending to': { RW: 'Yoherezwa kuri', FR: 'Envoi vers' },
  'Making message...': { RW: 'Ubutumwa burimo gutegurwa...', FR: 'Préparation du message...' },
  'Send Text Now': { RW: 'Ohereza SMS Nonaha', FR: 'Envoyer le SMS' },
  'Works on any small button phone with no internet. Driver dials *134#.': {
    RW: 'Ikora kuri telefoni ntoya zose nta interineti. Umushoferi akanda *134#.',
    FR: 'Fonctionne sur tout téléphone simple sans internet. Le chauffeur compose *134#.',
  },
  'Dialing *134#...': { RW: 'Birimo guhamagara *134#...', FR: 'Composition de *134#...' },
  '1. Accept Trip': { RW: '1. Emera Urugendo', FR: '1. Accepter le trajet' },
  '2. At Airport': { RW: '2. Ku Kibuga cy’Indege', FR: '2. À l’aéroport' },
  '3. Guest in Car': { RW: '3. Umushyitsi mu Modoka', FR: '3. Client à bord' },
  '4. Trip Done': { RW: '4. Urugendo Rwarangiye', FR: '4. Trajet terminé' },
  'Choose a Free Driver': { RW: 'Hitamo Umushoferi Udegembye', FR: 'Choisir un chauffeur libre' },
  'Choose Driver': { RW: 'Hitamo Umushoferi', FR: 'Choisir chauffeur' },
  'Save Driver': { RW: 'Bika Umushoferi', FR: 'Enregistrer le chauffeur' },
  'Flight Late?': { RW: 'Indege Yakererewe?', FR: 'Vol en retard ?' },
  'Tell the driver the new wait time at Kigali Airport.': {
    RW: 'Bwira umushoferi igihe gishya cyo gutegereza ku Kibuga cy’Indege i Kigali.',
    FR: 'Informez le chauffeur du nouvel horaire d’attente à l’aéroport de Kigali.',
  },
  'How Many Minutes Late?': { RW: 'Ikerereweho Iminota Ingahe?', FR: 'Combien de minutes de retard ?' },
  'On Time Again': { RW: 'Yongeye Kuba ku Igihe', FR: 'À l’heure de nouveau' },
  'Tell Driver': { RW: 'Menyesha Umushoferi', FR: 'Prévenir le chauffeur' },

  // Drivers & Expenses
  'drivers': { RW: 'abashoferi', FR: 'chauffeurs' },
  'All your drivers, phone numbers, active trips, and driver phone screen.': {
    RW: 'Abashoferi bawe bose, nimero za telefoni, ingendo barimo n’ibyo barebera kuri telefoni zabo.',
    FR: 'Tous vos chauffeurs, numéros, trajets actifs et écran mobile chauffeur.',
  },
  'Phone View': { RW: 'Uko Telefoni Igaragara', FR: 'Vue téléphone' },
  'Add Driver': { RW: 'Ongeraho Umushoferi', FR: 'Ajouter un chauffeur' },
  'All Drivers': { RW: 'Abashoferi Bose', FR: 'Tous les chauffeurs' },
  'Off Duty': { RW: 'Mu Kiruhuko', FR: 'Hors service' },
  'Rating': { RW: 'Amanota', FR: 'Note' },
  'Trips Done': { RW: 'Ingendo Zarangiye', FR: 'Trajets terminés' },
  'Search driver by name, phone (+250...), or license...': {
    RW: 'Shaka umushoferi ukoresheje izina, telefoni (+250...) cyangwa perimi...',
    FR: 'Chercher par nom, téléphone (+250...) ou permis...',
  },
  'All Languages': { RW: 'Indimi Zose', FR: 'Toutes langues' },
  'French': { RW: 'Igifaransa', FR: 'Français' },
  'Rest Day': { RW: 'Umunsi w’Ikiruhuko', FR: 'Jour de repos' },
  'On Leave': { RW: 'Mu Kiruhuko', FR: 'En congé' },
  'Usual Car': { RW: 'Imodoka Amenyereye', FR: 'Voiture habituelle' },
  'Any Car': { RW: 'Imodoka Iyo Ari Yo Yose', FR: 'Toute voiture' },
  'Languages': { RW: 'Indimi', FR: 'Langues' },
  'Active Trip': { RW: 'Urugendo Arimo', FR: 'Trajet en cours' },
  'Details & History': { RW: 'Amakuru & Amateka', FR: 'Détails & Historique' },
  'Open driver phone screen': { RW: 'Fungura uko umushoferi abibona kuri telefoni', FR: 'Ouvrir l’écran mobile du chauffeur' },
  'Trips Needing a Driver': { RW: 'Ingendo Zikeneye Umushoferi', FR: 'Trajets sans chauffeur' },
  'Pick or change the driver for each trip. Busy drivers on the same dates are blocked automatically.': {
    RW: 'Hitamo cyangwa uhindure umushoferi kuri buri rugendo. Abafite izindi ngendo kuri ayo matariki ntibaboneka.',
    FR: 'Choisissez ou changez le chauffeur par trajet. Ceux déjà pris aux mêmes dates sont bloqués.',
  },
  'No Driver Yet': { RW: 'Nta Mushoferi Urahari', FR: 'Pas encore de chauffeur' },
  'Driver Phone Screen & SMS Check-In': { RW: 'Ecran ya Telefoni y’Umushoferi & Kwemeza kuri SMS', FR: 'Écran téléphone chauffeur & Confirmation SMS' },
  'See what the driver sees on their phone on the road in Rwanda.': {
    RW: 'Reba ibyo umushoferi abona kuri telefoni ye ari mu muhanda mu Rwanda.',
    FR: 'Voyez ce que le chauffeur voit sur son téléphone sur la route au Rwanda.',
  },
  'Remove Driver': { RW: 'Kura Umushoferi ku Rugendo', FR: 'Retirer le chauffeur' },
  'Open Phone View': { RW: 'Fungura Telefoni', FR: 'Voir vue mobile' },
  'Add New Driver': { RW: 'Ongeraho Umushoferi Mushya', FR: 'Nouveau chauffeur' },
  'Enter driver details and driving license': { RW: 'Andika amakuru y’umushoferi na perimi ye', FR: 'Saisissez les infos du chauffeur et son permis' },
  'Costs & Profit': { RW: 'Ibiciro Byasohotse & Inyungu', FR: 'Dépenses & Bénéfices' },
  'Write down fuel, repairs, and driver costs to see how much profit each car makes.': {
    RW: 'Andika lisansi, igaraje n’amafaranga y’umushoferi urebe inyungu buri modoka yinjiza.',
    FR: 'Notez carburant, réparations et frais chauffeurs pour voir le profit de chaque voiture.',
  },
  'All Costs': { RW: 'Ibikoreshejwe Byose', FR: 'Toutes dépenses' },
  'Profit Per Car': { RW: 'Inyungu kuri Buri Modoka', FR: 'Profit par voiture' },
  'Add Cost': { RW: 'Andika Icyasohotse', FR: 'Ajouter une dépense' },
  'Money In': { RW: 'Amafaranga Yinjiye', FR: 'Entrées d’argent' },
  'Paid by guests': { RW: 'Yishyuwe n’abakiriya', FR: 'Payé par les clients' },
  'Money Spent': { RW: 'Amafaranga Yasohotse', FR: 'Dépenses' },
  'Fuel, repairs & staff': { RW: 'Lisansi, igaraje & abakozi', FR: 'Carburant, garage & équipe' },
  'Money Left': { RW: 'Ayasigaye (Inyungu)', FR: 'Bénéfice net' },
  'profit': { RW: 'inyungu', FR: 'bénéfice' },
  'Amount (RWF)': { RW: 'Umubare w’Amafaranga (RWF)', FR: 'Montant (RWF)' },

  // Forgot Password
  'Reset Your Password': { RW: 'Hindura Ijambobanga', FR: 'Réinitialiser le mot de passe' },
  'Code Sent!': { RW: 'Kode Yoherejwe!', FR: 'Code envoyé !' },
  'We sent a 6-digit code to': { RW: 'Twohereje kode y’imibare 6 kuri', FR: 'Nous avons envoyé un code à 6 chiffres à' },
  'Use it to pick a new password.': { RW: 'Yikoreshe uhitemo ijambobanga rishya.', FR: 'Utilisez-le pour choisir un nouveau mot de passe.' },
  'Text preview': { RW: 'Uko ubutumwa bugaragara', FR: 'Aperçu du SMS' },
  'Your reset code is': { RW: 'Kode yawe yo guhindura ijambobanga ni', FR: 'Votre code de réinitialisation est' },
  'Back to Sign In': { RW: 'Subira aho Binjirira', FR: 'Retour à la connexion' },
  'Type your phone number or email. We will send you a code to reset your password.': {
    RW: 'Andika nimero ya telefoni cyangwa imeri yawe. Turakoherereza kode yo guhindura ijambobanga.',
    FR: 'Entrez votre téléphone ou e-mail. Nous vous enverrons un code de réinitialisation.',
  },
  'Phone Text': { RW: 'Ubutumwa bwa Telefoni', FR: 'SMS' },
  'Email': { RW: 'Imeri', FR: 'E-mail' },
  'Phone Number': { RW: 'Nimero ya Telefoni', FR: 'Numéro de téléphone' },
  'Email Address': { RW: 'Aderesi ya Imeri', FR: 'Adresse e-mail' },
  'Send Code': { RW: 'Ohereza Kode', FR: 'Envoyer le code' },

  // Handovers / Car Checks
  'Car Check-Out & Return': { RW: 'Isuzuma ry’Imodoka Igenda & Igarutse', FR: 'Contrôle départ & retour voiture' },
  'Check fuel, km, and scratches before giving out a car and when it comes back.': {
    RW: 'Reba lisansi, ibirometero n’ubusembwa mbere yo gutanga imodoka na nyuma y’uko igarutse.',
    FR: 'Vérifiez carburant, kilométrage et état au départ et au retour du véhicule.',
  },
  'Car Paper': { RW: 'Urupapuro rw’Imodoka', FR: 'Fiche véhicule' },
  'New Car Check': { RW: 'Isuzuma Rishya', FR: 'Nouveau contrôle' },
  'All Checks': { RW: 'Amasuzuma Yose', FR: 'Tous les contrôles' },
  'Saved digitally': { RW: 'Bibitswe muri sisitemu', FR: 'Enregistrés numériquement' },
  'Cars Given Out': { RW: 'Imodoka Zatanzwe', FR: 'Voitures remises' },
  'Signed by guest': { RW: 'Zasinywe n’umukiriya', FR: 'Signées par le client' },
  'Cars Returned': { RW: 'Imodoka Zagarutse', FR: 'Voitures retournées' },
  'Fuel & km checked': { RW: 'Lisansi na km byasuzumwe', FR: 'Carburant & km vérifiés' },
  'Safety Kits': { RW: 'Ibikoresho by’Ubutabazi', FR: 'Kits de sécurité' },
  'Ready in all cars': { RW: 'Biri mu modoka zose', FR: 'Prêts dans chaque voiture' },
  'Car Going Out': { RW: 'Imodoka Igenda', FR: 'Départ voiture' },
  'Car Coming Back': { RW: 'Imodoka Igarutse', FR: 'Retour voiture' },
  'Search plate, guest, or staff...': { RW: 'Shaka pulaki, umukiriya cyangwa umukozi...', FR: 'Chercher plaque, client ou agent...' },
  'Going Out': { RW: 'Irasohotse', FR: 'Départ' },
  'Coming Back': { RW: 'Igarutse', FR: 'Retour' },
  'Km Reading': { RW: 'Ibirometero', FR: 'Kilométrage' },
  'Fuel Tank': { RW: 'Ikigega cya Lisansi', FR: 'Niveau carburant' },
  'Checks passed': { RW: 'Ibyasuzumwe byemejwe', FR: 'Points validés' },
  'Guest Signed': { RW: 'Umukiriya Yasinyiye', FR: 'Client signé' },
  'Extra Fee': { RW: 'Ikiguzi cy’Inyongera', FR: 'Frais supplémentaires' },
  'Checked by': { RW: 'Uwayisuzumye', FR: 'Vérifié par' },
  'No Car Checks Yet': { RW: 'Nta Suzuma Rirahari', FR: 'Aucun contrôle enregistré' },
  'Tap "New Car Check" before giving keys to a guest.': {
    RW: 'Kanda "Isuzuma Rishya" mbere yo guha umukiriya imfunguzo.',
    FR: 'Appuyez sur « Nouveau contrôle » avant de remettre les clés au client.',
  },
  'Record fuel, km, and condition': { RW: 'Andika lisansi, ibirometero n’uko imodoka imeze', FR: 'Notez carburant, km et état du véhicule' },
  'Giving car to guest': { RW: 'Guha umukiriya imodoka', FR: 'Remise au client' },
  'Guest returning car': { RW: 'Umukiriya agaruye imodoka', FR: 'Retour par le client' },
  'Before': { RW: 'Mbere', FR: 'Avant' },
  'How Clean Is It?': { RW: 'Isuku Yayo Imeze Ite?', FR: 'Propreté du véhicule' },
  'Fuel Level': { RW: 'Urwego rwa Lisansi', FR: 'Niveau de carburant' },
  'Full Tank': { RW: 'Yuzuye (Full)', FR: 'Plein' },
  'Half Tank': { RW: 'Igice (1/2)', FR: 'Moitié' },
  'Tank': { RW: 'Ikigega', FR: 'Réservoir' },
  '9-Point Car Check': { RW: 'Isuzuma ry’Ingingo 9 z’Imodoka', FR: 'Contrôle en 9 points' },
  'Scratches or Notes': { RW: 'Ubusembwa cyangwa Inyongera', FR: 'Rayures ou remarques' },
  'Write down any scratches, dents, or missing items...': {
    RW: 'Andika aho yangiritse, ikomye cyangwa ibikoresho bibura...',
    FR: 'Notez toute rayure, bosse ou objet manquant...',
  },
  'Extra Fee (Km or Fuel)': { RW: 'Ikiguzi cy’Inyongera (Km cyangwa Lisansi)', FR: 'Frais extra (Km ou Carburant)' },
  'Extra distance': { RW: 'Ibirometero byarenze', FR: 'Distance extra' },
  'Missing fuel': { RW: 'Lisansi yabuzemo', FR: 'Carburant manquant' },
  'The guest checked the car and agrees with the fuel, km, and notes above.': {
    RW: 'Umukiriya yasuzumye imodoka kandi yemeye lisansi, ibirometero n’ibyo hejuru.',
    FR: 'Le client a inspecté la voiture et approuve le carburant, les km et les notes ci-dessus.',
  },
  'Save Car Check': { RW: 'Bika Isuzuma ry’Imodoka', FR: 'Enregistrer le contrôle' },

  // Landing Page Full Copy
  'How does it stop double bookings?': { RW: 'Ikumira ite ko imodoka ifatwa kabiri?', FR: 'Comment éviter les doubles réservations ?' },
  'Each car in your garage is tracked by its plate number. If a car is already booked from Nov 5 to Nov 8, nobody can book that same car on those days.': {
    RW: 'Buri modoka ikurikiranwa hakoreshejwe pulaki yayo. Iyo yafashwe kuva tariki 5 kugeza 8 Ugushyingo, ntawundi ushobora kuyifata kuri ayo matariki.',
    FR: 'Chaque voiture est suivie par sa plaque. Si elle est réservée du 5 au 8 nov., personne ne peut la réserver aux mêmes dates.',
  },
  'Do drivers need a smartphone or internet?': { RW: 'Abashoferi bakeneye smartphone cyangwa interineti?', FR: 'Les chauffeurs ont-ils besoin d’un smartphone ou d’internet ?' },
  'No. Your driver gets a normal text message (SMS) in Kinyarwanda or English on any simple phone. They can reply YES or ARRIVED without internet.': {
    RW: 'Oya. Umushoferi abona SMS isanzwe mu Kinyarwanda cyangwa Icyongereza kuri telefoni yose. Ashobora gusubiza nta interineti.',
    FR: 'Non. Le chauffeur reçoit un simple SMS en kinyarwanda ou anglais sur n’importe quel téléphone, sans connexion internet.',
  },
  'How do customers book a car online?': { RW: 'Abakiriya bafata bate imodoka kuri interineti?', FR: 'Comment les clients réservent-ils en ligne ?' },
  'You get your own simple website link. Tourists and companies see which cars are free, pick their dates, and book in a few taps.': {
    RW: 'Uhabwa urubuga rwawe rworoshye. Ba mukerarugendo n’ibigo bareba imodoka zidegembye, bagahitamo amatariki bagafata gahunda vuba.',
    FR: 'Vous recevez votre propre lien web. Touristes et entreprises voient les voitures libres, choisissent leurs dates et réservent en quelques clics.',
  },
  'Can customers pay with Mobile Money?': { RW: 'Abakiriya bashobora kwishyura kuri Mobile Money?', FR: 'Les clients peuvent-ils payer par Mobile Money ?' },
  'Yes. It works with MTN MoMo, Airtel Money, Bank Transfer, and Card, with all prices clearly shown in RWF or USD.': {
    RW: 'Yego. Ikora na MTN MoMo, Airtel Money, Banki n’Ikarita, ibiciro bigaragara neza muri RWF cyangwa USD.',
    FR: 'Oui. Compatible MTN MoMo, Airtel Money, virement bancaire et carte, avec prix clairs en RWF ou USD.',
  },
  'What happens if a flight at Kigali Airport is late?': { RW: 'Bigenda bite iyo indege i Kigali ikererewe?', FR: 'Que se passe-t-il si un vol à Kigali a du retard ?' },
  'When you add a flight number, the app watches the plane time. If the flight is late, it alerts your office and updates your driver.': {
    RW: 'Iyo wanditse nimero y’indege, sisitemu ikurikirana igihe izira. Iyo ikererewe, ihita imenyesha ibiro n’umushoferi.',
    FR: 'Lorsque vous saisissez un numéro de vol, l’app suit son horaire. En cas de retard, elle alerte votre bureau et le chauffeur.',
  },
  'No double bookings': { RW: 'Nta kugongana kw’ingendo', FR: 'Zéro double réservation' },
  'Works on basic driver phones': { RW: 'Ikora kuri telefoni ntoya z’abashoferi', FR: 'Compatible téléphones basiques' },
  'MTN & Airtel MoMo ready': { RW: 'Yiteguye MTN & Airtel MoMo', FR: 'Prêt pour MTN & Airtel MoMo' },
  'Airport flight alerts': { RW: 'Amakuru y’indege ku Kibuga', FR: 'Alertes vols aéroport' },
  "Today's Cars & Trips": { RW: 'Imodoka & Ingendo z’Uyu Munsi', FR: 'Voitures & Trajets du jour' },
  'See all': { RW: 'Reba byose', FR: 'Voir tout' },
  'Driver alerted': { RW: 'Umushoferi yamenyeshejwe', FR: 'Chauffeur prévenu' },
  'Double bookings are blocked automatically': { RW: 'Kugongana kw’ingendo guhagarikwa na sisitemu', FR: 'Les doubles réservations sont bloquées automatiquement' },
  'If a car is booked, no one else can book it on the same day.': { RW: 'Iyo imodoka yafashwe, nta wundi uyifata kuri uwo munsi.', FR: 'Si une voiture est prise, personne ne peut la réserver le même jour.' },
  'Three simple tools in one place': { RW: 'Ibikoresho bitatu byoroshye ahantu hamwe', FR: 'Trois outils simples au même endroit' },
  'Everything your office, your drivers, and your customers need.': { RW: 'Ibyo ibiro byawe, abashoferi n’abakiriya bose bakeneye.', FR: 'Tout ce dont votre bureau, vos chauffeurs et clients ont besoin.' },
  'See every car on one calendar': { RW: 'Reba buri modoka kuri kalendari imwe', FR: 'Voyez chaque voiture sur un seul calendrier' },
  'Look at your whole week in seconds. Know right away which car is out on a trip, which car is in repair, and which car is ready.': {
    RW: 'Reba icyumweru cyawe cyose mu masegonda make. Menya ako kanya imodoka iri mu rugendo, iri mu igaraje n’iyiteguye.',
    FR: 'Visualisez toute votre semaine en quelques secondes : voitures en trajet, au garage ou prêtes.',
  },
  'Blocks double bookings before they happen': { RW: 'Ikumira kugongana mbere y’uko biba', FR: 'Bloque les doubles réservations avant qu’elles n’arrivent' },
  'Hides cars that are in the garage for repair': { RW: 'Ihisha imodoka ziri gukorerwa mu igaraje', FR: 'Masque les voitures en réparation au garage' },
  'Calculates total price automatically': { RW: 'Ibara igiciro cyose mu buryo bwikora', FR: 'Calcule le prix total automatiquement' },
  'Open Calendar': { RW: 'Fungura Kalendari', FR: 'Ouvrir le calendrier' },
  'Send trips to drivers by text message': { RW: 'Ohereza ingendo ku bashoferi kuri SMS', FR: 'Envoyez les trajets aux chauffeurs par SMS' },
  'Your drivers do not need internet bundles or an app. One click sends the pickup place, time, and customer name by normal SMS.': {
    RW: 'Abashoferi ntibakeneye megabyte cyangwa porogaramu. Kanda rimwe gusa wohereze aho bafata umushyitsi, isaha n’izina kuri SMS.',
    FR: 'Vos chauffeurs n’ont besoin ni de forfait data ni d’app. Un clic envoie lieu, heure et client par simple SMS.',
  },
  'Messages in Kinyarwanda or English': { RW: 'Ubutumwa mu Kinyarwanda cyangwa Icyongereza', FR: 'Messages en kinyarwanda ou anglais' },
  'Drivers confirm by simple SMS reply': { RW: 'Abashoferi bemeza basubiza SMS yoroshye', FR: 'Les chauffeurs confirment par simple SMS' },
  'Updates drivers when a flight is late': { RW: 'Imenyesha umushoferi iyo indege ikererewe', FR: 'Prévient le chauffeur si un vol a du retard' },
  'Try SMS Sender': { RW: 'Gerageza Kohereza SMS', FR: 'Tester l’envoi SMS' },
  'Let customers book online anytime': { RW: 'Emerera abakiriya gufata imodoka igihe cyose', FR: 'Laissez vos clients réserver en ligne 24h/24' },
  'Share your booking page link on WhatsApp or your website. Tourists and NGOs see free cars and pay with Mobile Money or Card.': {
    RW: 'Sangiza urubuga rwawe kuri WhatsApp. Ba mukerarugendo n’imiryango bareba imodoka zihari bakishyura kuri MoMo cyangwa Ikarita.',
    FR: 'Partagez votre lien sur WhatsApp ou votre site. Touristes et ONG voient les voitures libres et paient par MoMo ou carte.',
  },
  'Shows only cars that are really free': { RW: 'Yerekana gusa imodoka zidegembye koko', FR: 'Affiche uniquement les voitures vraiment libres' },
  'Clear daily prices in RWF or USD': { RW: 'Ibiciro by’umunsi bisobanutse muri RWF cyangwa USD', FR: 'Tarifs journaliers clairs en RWF ou USD' },
  'MTN MoMo, Airtel Money & Card': { RW: 'MTN MoMo, Airtel Money & Ikarita', FR: 'MTN MoMo, Airtel Money & Carte' },
  'Try it right here': { RW: 'Gerageza aha ngaha', FR: 'Essayez ici même' },
  'Pick dates to test double-booking protection, or switch the driver SMS language.': {
    RW: 'Hitamo amatariki ugerageze uburyo ikumira kugongana, cyangwa uhindure ururimi rwa SMS.',
    FR: 'Choisissez des dates pour tester la protection anti-doublon ou changez la langue du SMS.',
  },
  '1. Check if a car is free': { RW: '1. Reba niba imodoka idegembye', FR: '1. Vérifier la disponibilité' },
  'Pick a car': { RW: 'Hitamo imodoka', FR: 'Choisir une voiture' },
  'Start date': { RW: 'Itariki yo gutangira', FR: 'Date de début' },
  'End date': { RW: 'Itariki yo kurangiza', FR: 'Date de fin' },
  'Already booked on these dates': { RW: 'Yafashwe kuri aya matariki', FR: 'Déjà réservée à ces dates' },
  'Booked by': { RW: 'Yafashwe na', FR: 'Réservée par' },
  'Choose other dates.': { RW: 'Hitamo andi matariki.', FR: 'Choisissez d’autres dates.' },
  'Car is free — Ready to book': { RW: 'Imodoka iraboneka — Yiteguye gufatwa', FR: 'Voiture libre — Prête à réserver' },
  'No other trip on these days. Safe to confirm.': { RW: 'Nta rundi rugendo kuri iyi minsi. Ushobora kwemeza.', FR: 'Aucun autre trajet ces jours-là. Vous pouvez confirmer.' },
  'Try Nov 05–08 to see a blocked date': { RW: 'Gerageza 05–08 Ugushyingo urebe itariki ifunze', FR: 'Testez 05–08 nov. pour voir un blocage' },
  'Pick free dates': { RW: 'Hitamo amatariki adafashwe', FR: 'Choisir des dates libres' },
  '2. Driver text message (SMS)': { RW: '2. Ubutumwa bw’umushoferi (SMS)', FR: '2. Message texte chauffeur (SMS)' },
  'Made for how transport works in Rwanda': { RW: 'Yakozwe ijyanye n’uko akazi ko gutwara abantu gakorwa mu Rwanda', FR: 'Pensé pour la location auto au Rwanda' },
  'Mobile Money & Bank Pay': { RW: 'Kwishyura kuri Mobile Money & Banki', FR: 'Mobile Money & Banque' },
  'Track MTN MoMo, Airtel Money, bank transfers, and cards cleanly in RWF or USD.': {
    RW: 'Kurikirana MTN MoMo, Airtel Money, banki n’ikarita neza muri RWF cyangwa USD.',
    FR: 'Suivez MTN MoMo, Airtel Money, virements et cartes clairement en RWF ou USD.',
  },
  'Know when a plane is late at Kigali Airport so drivers wait at the right time.': {
    RW: 'Menya igihe indege ikererewe i Kigali kugira ngo abashoferi bategereze ku gihe nyacyo.',
    FR: 'Sachez quand un vol a du retard à Kigali pour ajuster l’attente des chauffeurs.',
  },
  'City & Safari Trips': { RW: 'Ingendo z’Umujyi & Safari', FR: 'Ville & Safaris' },
  'Ready for Kigali city rides, Volcanoes, Akagera, Nyungwe, and Lake Kivu trips.': {
    RW: 'Yiteguye ingendo z’umujyi wa Kigali, Ibirunga, Akagera, Nyungwe n’Ikiyaga cya Kivu.',
    FR: 'Prêt pour Kigali, les Volcans, l’Akagera, Nyungwe et le lac Kivu.',
  },
  'Small Fleet': { RW: 'Imodoka Nkeya', FR: 'Petite flotte' },
  'mo': { RW: 'ukw', FR: 'mois' },
  'For small owners with up to 5 cars.': { RW: 'Ku bafite imodoka kugeza kuri 5.', FR: 'Pour les agences jusqu’à 5 voitures.' },
  'Up to 5 cars': { RW: 'Kugeza ku modoka 5', FR: 'Jusqu’à 5 voitures' },
  'Driver list & SMS alerts': { RW: 'Urutonde rw’abashoferi & ubutumwa bwa SMS', FR: 'Liste chauffeurs & alertes SMS' },
  'Growing Fleet': { RW: 'Ikigo Gikura', FR: 'Flotte en croissance' },
  'Most popular': { RW: 'Ikunzwe cyane', FR: 'La plus populaire' },
  'For rental companies with up to 20 cars.': { RW: 'Ku bigo bifite imodoka kugeza kuri 20.', FR: 'Pour les agences jusqu’à 20 voitures.' },
  'Up to 20 cars': { RW: 'Kugeza ku modoka 20', FR: 'Jusqu’à 20 voitures' },
  'Weekly trip calendar': { RW: 'Kalendari y’ingendo y’icyumweru', FR: 'Calendrier hebdomadaire' },
  'Driver SMS (Kinyarwanda & English)': { RW: 'SMS z’abashoferi (Kinyarwanda & Icyongereza)', FR: 'SMS chauffeurs (Kinyarwanda & Anglais)' },
  'Online booking website': { RW: 'Urubuga rwo gufata imodoka kuri interineti', FR: 'Site de réservation en ligne' },
  'Large Fleet': { RW: 'Ikigo Kinini', FR: 'Grande flotte' },
  'For big safari & company fleets with unlimited cars.': { RW: 'Ku bigo binini bya safari n’ibifite imodoka zitagira umubare.', FR: 'Pour grandes flottes safari et agences sans limite de véhicules.' },
  'Unlimited cars & drivers': { RW: 'Imodoka n’abashoferi batagira umubare', FR: 'Voitures & chauffeurs illimités' },
  'Multiple offices & towns': { RW: 'Amashami n’imijyi myinshi', FR: 'Plusieurs bureaux et villes' },
  'Tax & payment reports': { RW: 'Raporo z’imisoro n’ubwishyu', FR: 'Rapports fiscaux et paiements' },
  'Direct help in Kigali': { RW: 'Ubufasha bwihuse i Kigali', FR: 'Support direct à Kigali' },
  'Ready to try KigaliFleet?': { RW: 'Witeguye kugerageza KigaliFleet?', FR: 'Prêt à essayer KigaliFleet ?' },
  'Open the app now or see how your customers book a car online.': {
    RW: 'Fungura sisitemu nonaha cyangwa urebe uko abakiriya bafata imodoka kuri interineti.',
    FR: 'Ouvrez l’application maintenant ou voyez comment vos clients réservent en ligne.',
  },
  'Open App': { RW: 'Fungura Sisitemu', FR: 'Ouvrir l’app' },

  // Maintenance / Garage
  'Car Repairs & Garages': { RW: 'Gukoresha Imodoka & Igaraje', FR: 'Réparations & Garages' },
  'Track cars in the garage, repair bills, and block bookings while a car is being fixed.': {
    RW: 'Kurikirana imodoka ziri mu igaraje, fagitire z’ubukanishi, kandi ufunge ingendo zayo igihe irimo gukorwa.',
    FR: 'Suivez les voitures au garage, les factures et bloquez les réservations pendant les travaux.',
  },
  'New Repair': { RW: 'Igaraje Rishya', FR: 'Nouvelle réparation' },
  'In Garage Now': { RW: 'Mu Igaraje Ubu', FR: 'Au garage maintenant' },
  'cars': { RW: 'imodoka', FR: 'voitures' },
  'Blocked from bookings': { RW: 'Zifunzwe ku ngendo', FR: 'Bloquées aux réservations' },
  'Planned Repairs': { RW: 'Igaraje Riri imbere', FR: 'Réparations prévues' },
  'jobs': { RW: 'imirimo', FR: 'tâches' },
  'cars due soon': { RW: 'imodoka zitegerejwe vuba', FR: 'voitures bientôt dues' },
  'Fixed & Ready': { RW: 'Zarakozwe & Ziriteguye', FR: 'Réparées & Prêtes' },
  'done': { RW: 'byarangiye', FR: 'terminés' },
  'Back on the road': { RW: 'Zasubiye mu muhanda', FR: 'De retour sur la route' },
  'Total Repair Cost': { RW: 'Igiteranyo cy’Igaraje', FR: 'Coût total réparations' },
  'All garage bills': { RW: 'Fagitire zose z’igaraje', FR: 'Toutes factures garage' },
  'Planned': { RW: 'Biteganijwe', FR: 'Prévu' },
  'All Repair Types': { RW: 'Ubwoko Bwose bw’Igaraje', FR: 'Tous types de réparation' },
  'What Is Fixed': { RW: 'Ikigomba Gukorwa', FR: 'Travaux' },
  'Garage': { RW: 'Igaraje', FR: 'Garage' },
  'Dates & Cost': { RW: 'Amatariki & Igiciro', FR: 'Dates & Coût' },
  'Action': { RW: 'Igikorwa', FR: 'Action' },
  'Release Car': { RW: 'Sohora Imodoka', FR: 'Libérer la voiture' },
  'See Info': { RW: 'Reba Amakuru', FR: 'Voir infos' },
  'Cost (RWF)': { RW: 'Igiciro (RWF)', FR: 'Coût (RWF)' },
  'Final Bill (RWF)': { RW: 'Fagitire ya Nyuma (RWF)', FR: 'Facture finale (RWF)' },
  'Total Cost': { RW: 'Igiciro Cyose', FR: 'Coût total' },

  // NewBookingModal & OverviewView & Payments & RentalAgreement
  'Checks automatically so two people never book the same car on the same day.': {
    RW: 'Igenzura mu buryo bwikora kugira ngo abantu babiri batafata imodoka imwe ku munsi umwe.',
    FR: 'Vérifie automatiquement qu’une même voiture n’est jamais réservée deux fois le même jour.',
  },
  'Days & Total': { RW: 'Iminsi & Igiteranyo', FR: 'Jours & Total' },
  'Busy Season': { RW: 'Igihe cy’Ubwitabire Bwinshi', FR: 'Haute saison' },
  'Outside Kigali': { RW: 'Hanze ya Kigali', FR: 'Hors de Kigali' },
  '18% Tax (VAT)': { RW: 'Umusoro wa 18% (TVA)', FR: 'TVA 18%' },
  'Official receipt': { RW: 'Inyemezabuguzi yemewe', FR: 'Reçu officiel' },
  'Save Booking': { RW: 'Bika Gahunda', FR: 'Enregistrer la réservation' },
  'Your Trips Today': { RW: 'Ingendo Zawe Uyu Munsi', FR: 'Vos trajets du jour' },
  "Today's Overview": { RW: 'Incamake y’Uyu Munsi', FR: 'Aperçu du jour' },
  'See your pickup times, guest names, and airport flight updates.': {
    RW: 'Reba amasaha yo gufata abashyitsi, amazina yabo n’amakuru y’indege.',
    FR: 'Voyez vos heures de prise en charge, noms des clients et infos vols.',
  },
  'See which cars are free, who is driving, and how much money you made.': {
    RW: 'Reba imodoka zidegembye, uwatwaye n’amafaranga winjije.',
    FR: 'Voyez quelles voitures sont libres, qui conduit et vos revenus.',
  },
  'Cars on Trips': { RW: 'Imodoka Ziri mu Ngendo', FR: 'Voitures en trajet' },
  'free': { RW: 'zidegembye', FR: 'libres' },
  'Every car can only have one trip at a time': {
    RW: 'Buri modoka igira urugendo rumwe gusa mu gihe kimwe',
    FR: 'Une voiture ne peut faire qu’un seul trajet à la fois',
  },
  'Airport': { RW: 'Ikibuga cy’Indege', FR: 'Aéroport' },
  'Safaris': { RW: 'Safari', FR: 'Safaris' },
  'Payments & Money': { RW: 'Kwishyura & Amafaranga', FR: 'Paiements & Trésorerie' },
  'See all money paid by guests, send MTN MoMo payment requests, and print receipts.': {
    RW: 'Reba amafaranga yose yishyuwe n’abashyitsi, wohereze MTN MoMo, unasohore inyemezabuguzi.',
    FR: 'Suivez tous les paiements clients, envoyez des demandes MTN MoMo et imprimez les reçus.',
  },
  'Money Received': { RW: 'Amafaranga Yakiriwe', FR: 'Argent reçu' },
  'Mobile Money': { RW: 'Mobile Money', FR: 'Mobile Money' },
  'Money Paid (RWF)': { RW: 'Amafaranga Yishyuwe (RWF)', FR: 'Montant payé (RWF)' },
  'Car Rental Agreement Paper': { RW: 'Amasezerano yo Gukodesha Imodoka', FR: 'Contrat de location automobile' },
  'Copied': { RW: 'Byakoporowe', FR: 'Copié' },
  'Copy': { RW: 'Koporora', FR: 'Copier' },
  'Price & Payment': { RW: 'Igiciro & Kwishyura', FR: 'Tarif & Paiement' },
  'US Dollars (USD)': { RW: 'Amadolari (USD)', FR: 'Dollars US (USD)' },
  'Rwandan Francs (RWF)': { RW: 'Amafaranga y’u Rwanda (RWF)', FR: 'Francs rwandais (RWF)' },
  'Price / Day': { RW: 'Igiciro / Umunsi', FR: 'Prix / Jour' },
  'Total Price': { RW: 'Igiciro Cyose', FR: 'Prix total' },
  'Refundable Deposit': { RW: 'Ingwate Isubizwa', FR: 'Caution remboursable' },
  'Payment Method': { RW: 'Uburyo bwo Kwishyura', FR: 'Mode de paiement' },
  'Important Rules': { RW: 'Amategeko y’Ingenzi', FR: 'Règles importantes' },
  'Who Drives & Where': { RW: 'Utwaye & Aho Imodoka Ijya', FR: 'Conducteur & Zone' },
  'Only the named guest or approved driver may drive this car. Do not leave Rwanda without written approval and cross-border insurance.': {
    RW: 'Umukiriya wanditse cyangwa umushoferi wemewe gusa ni bo batwara iyi modoka. Ntugasohoke mu Rwanda utabiherewe uburenganzira n’ubwishingizi bwambuka umupaka.',
    FR: 'Seul le client désigné ou le chauffeur agréé peut conduire. Ne quittez pas le Rwanda sans accord écrit et assurance transfrontalière.',
  },
  'Fuel & Km Limit': { RW: 'Lisansi & Ibirometero Ntarenzwa', FR: 'Carburant & Limite Km' },
  'Return the car with the same fuel level. Up to 350 km per day is included. Extra fuel is billed at pump price plus': {
    RW: 'Garura imodoka ifite lisansi ingana nk’iyo wayifatanye. Ibirometero 350 ku munsi biremewe. Ibindi bibarwa ku giciro cya sitasiyo hongeweho',
    FR: 'Rendez la voiture avec le même niveau de carburant. 350 km/jour inclus. Carburant manquant facturé au prix pompe plus',
  },

  // Reports, SMS modal, Settings, Tiers, Storefront modal, Tasks
  'Reports & Money': { RW: 'Raporo & Amafaranga', FR: 'Rapports & Finances' },
  'See which cars earn the most, how drivers are doing, and how much tax is due.': {
    RW: 'Reba imodoka zinjiza cyane, uko abashoferi bakora n’umusoro ugomba kwishyurwa.',
    FR: 'Voyez quelles voitures rapportent le plus, la performance chauffeurs et la TVA due.',
  },
  'This Month (May 2026)': { RW: 'Uku Kwezi (Gicurasi 2026)', FR: 'Ce mois (Mai 2026)' },
  'Last Month (April 2026)': { RW: 'Ukwezi Gushize (Mata 2026)', FR: 'Mois dernier (Avril 2026)' },
  'Last 30 Days': { RW: 'Iminsi 30 Ishize', FR: '30 derniers jours' },
  'This Year 2026': { RW: 'Uyu Mwaka 2026', FR: 'Année 2026' },
  'All Time': { RW: 'Igihe Cyose', FR: 'Depuis toujours' },
  'Download File': { RW: 'Kuramo Dosiye', FR: 'Télécharger' },
  '+18.4% more than before': { RW: '+18.4% ugereranyije na mbere', FR: '+18,4 % par rapport à avant' },
  'Cars Used': { RW: 'Ikoreshwa ry’Imodoka', FR: 'Utilisation flotte' },
  'days': { RW: 'iminsi', FR: 'jours' },
  'Goal: 70%+': { RW: 'Intego: 70%+', FR: 'Objectif : 70%+' },
  'On track': { RW: 'Biri ku murongo', FR: 'En bonne voie' },
  'Money Left (Profit)': { RW: 'Inyungu Isigara', FR: 'Bénéfice net' },
  'profit after costs': { RW: 'inyungu nyuma y’ibyasohotse', FR: 'profit après frais' },
  'Driver Rating': { RW: 'Amanota y’Abashoferi', FR: 'Note chauffeurs' },
  '98.2% on time at airport': { RW: '98.2% bagera ku kibuga ku gihe', FR: '98,2 % à l’heure à l’aéroport' },
  'How Much Each Car Is Used': { RW: 'Uko Buri Modoka Ikoreshwa', FR: 'Utilisation par voiture' },
  'Days each car worked vs days parked, and money it brought in': {
    RW: 'Iminsi buri modoka yakoze ugereranyije n’iyo yahagaze, n’amafaranga yinjije',
    FR: 'Jours travaillés vs jours garés, et revenus générés par voiture',
  },
  'Car & Plate': { RW: 'Imodoka & Pulaki', FR: 'Voiture & Plaque' },
  'Type': { RW: 'Ubwoko', FR: 'Type' },
  'How Busy': { RW: 'Uko Ikoze', FR: 'Occupation' },
  'Safety': { RW: 'Umutekano', FR: 'Sécurité' },
  'Average Earned / Car / Day': { RW: 'Impuzandengo / Imodoka / Umunsi', FR: 'Moyenne / Voiture / Jour' },
  'Daily average across all cars': { RW: 'Impuzandengo y’umunsi ku modoka zose', FR: 'Moyenne journalière de la flotte' },
  'Estimated Repair Costs': { RW: 'Ibiciro by’Igaraje Bikenewe', FR: 'Coûts garage estimés' },
  'Tires, brakes, oil & safety checks': { RW: 'Amapine, feri, amavuta & contrôle', FR: 'Pneus, freins, vidange & contrôles' },
  'Profit Kept': { RW: 'Inyungu Isigara', FR: 'Marge nette' },
  'Kept': { RW: 'Isigara', FR: 'Conservé' },
  'Share left after car costs': { RW: 'Igice gisigara nyuma y’ibiciro by’imodoka', FR: 'Part restante après frais auto' },
  'Repair Cost': { RW: 'Ikiguzi cy’Igaraje', FR: 'Coût réparation' },
  'Profit %': { RW: '% y’Inyungu', FR: '% Profit' },
  'Distance Driven': { RW: 'Ibirometero Byagenzwe', FR: 'Distance parcourue' },
  'payments': { RW: 'ubwishyu', FR: 'paiements' },
  'share': { RW: 'igice', FR: 'part' },
  'Rwanda Tax Summary (18% VAT)': { RW: 'Incamake y’Umusoro mu Rwanda (18% TVA)', FR: 'Résumé fiscal Rwanda (TVA 18%)' },
  'Simple breakdown of money before tax, 18% VAT, and total billed to customers': {
    RW: 'Ibisobanuro byoroshye by’amafaranga mbere y’umusoro, 18% TVA n’igiteranyo cyishyuwe',
    FR: 'Détail simple hors taxes, TVA 18 % et total facturé aux clients',
  },
  'Tax Ready': { RW: 'Yiteguye Umusoro', FR: 'Prêt pour RRA' },
  'Before Tax': { RW: 'Mbere y’Umusoro', FR: 'Hors taxe' },
  'Net earnings': { RW: 'Inyungu bwite', FR: 'Revenus nets' },
  'Paid to RRA': { RW: 'Yishyurwa RRA', FR: 'Payé à la RRA' },
  'Total With Tax': { RW: 'Igiteranyo Kirimo Umusoro', FR: 'Total TTC' },
  'Full customer total': { RW: 'Igiteranyo cyose cy’umukiriya', FR: 'Total complet client' },
  'Money By Customer Type': { RW: 'Amafaranga ku Bwoko bw’Abakiriya', FR: 'Revenus par type de client' },
  'accounts': { RW: 'konti', FR: 'comptes' },
  'of total': { RW: 'by’igiteranyo', FR: 'du total' },
  'Kinyarwanda (Best)': { RW: 'Ikinyarwanda (Byiza cyane)', FR: 'Kinyarwanda (Recommandé)' },
  'Text Message': { RW: 'Ubutumwa bwa SMS', FR: 'Message SMS' },
  'From': { RW: 'Uwatanze', FR: 'De' },
  'Driver dials free *134# to confirm — no internet bundle needed.': {
    RW: 'Umushoferi akanda *134# ku buntu kwemeza — nta interineti ikenewe.',
    FR: 'Le chauffeur compose *134# gratuitement — sans forfait data.',
  },
  'Text Sent!': { RW: 'SMS Yoherejwe!', FR: 'SMS envoyé !' },
  'Shown on guest receipts, contracts, and your booking website.': {
    RW: 'Bigaragara ku nyemezabuguzi, amasezerano no ku rubuga rw’abakiriya.',
    FR: 'Affiché sur les reçus, contrats et votre site de réservation.',
  },
  'Pick which cars guests can see and book online.': {
    RW: 'Hitamo imodoka abakiriya bashobora kubona no gufata kuri interineti.',
    FR: 'Choisissez quelles voitures les clients peuvent voir et réserver en ligne.',
  },
  'Show Online': { RW: 'Erekana ku Rubuga', FR: 'Afficher en ligne' },
  'Shown': { RW: 'Igaragara', FR: 'Visible' },
  'Hidden': { RW: 'Ihishwe', FR: 'Masquée' },
  'Your Current Plan': { RW: 'Gahunda Yawe Ubu', FR: 'Votre forfait actuel' },
  'Unlimited cars': { RW: 'Imodoka zitagira umubare', FR: 'Voitures illimitées' },
  'Up to': { RW: 'Kugeza kuri', FR: 'Jusqu’à' },
  'month': { RW: 'ukwezi', FR: 'mois' },
  'Active Now': { RW: 'Irakora Ubu', FR: 'Actif' },
  'Pick': { RW: 'Hitamo', FR: 'Choisir' },
  'Muraho! Book your 4x4 SUV, Land Cruiser, or airport ride in Kigali right here:': {
    RW: 'Muraho! Kodesha 4x4 SUV, Land Cruiser, cyangwa imodoka ikuvana ku kibuga cy’indege i Kigali hano:',
    FR: 'Muraho ! Réservez votre 4x4 SUV, Land Cruiser ou transfert aéroport à Kigali ici :',
  },
  'Your Booking Website Link': { RW: 'Ihuza ry’Urubuga Rwawe rwo Gukodesha', FR: 'Lien de votre site de réservation' },
  'Share this link so guests can book cars online': {
    RW: 'Sangiza iri huza abakiriya bafate imodoka kuri interineti',
    FR: 'Partagez ce lien pour que vos clients réservent en ligne',
  },
  'Ready to Share': { RW: 'Ryiteguye Gusangizwa', FR: 'Prêt à partager' },
  'Send this link to any customer. They pick dates, choose an open car, and book without double bookings.': {
    RW: 'Ohereza iri huza ku mukiriya uwo ari we wese. Bahitamo amatariki, imodoka iboneka, bagafata nta kugongana.',
    FR: 'Envoyez ce lien à vos clients. Ils choisissent dates et voiture libre sans double réservation.',
  },
  'Your Live Booking Link': { RW: 'Ihuza Rwawe Riri Gukora', FR: 'Votre lien de réservation en direct' },
  'Copied!': { RW: 'Byakoporowe!', FR: 'Copié !' },
  'Copy Link': { RW: 'Koporora Ihuza', FR: 'Copier le lien' },
  'Open Booking Page': { RW: 'Fungura Urubuga rwo Gukodesha', FR: 'Ouvrir le site client' },
  'Open in New Tab': { RW: 'Fungura mu Idirishya Rishya', FR: 'Ouvrir dans un nouvel onglet' },
  'Share on WhatsApp': { RW: 'Sangiza kuri WhatsApp', FR: 'Partager sur WhatsApp' },
  'Short Website Address': { RW: 'Aderesi Ngufi y’Urubuga', FR: 'Adresse web courte' },
  'Summary': { RW: 'Incamake', FR: 'Résumé' },
  'Settings': { RW: 'Igenamiterere', FR: 'Paramètres' },
  'Company': { RW: 'Ikigo', FR: 'Agence' },
  'Section': { RW: 'Igice', FR: 'Section' },
  'Site Pause Is On:': { RW: 'Urubuga Rurahagaze Gato:', FR: 'Mode maintenance actif :' },
  'Change': { RW: 'Hindura', FR: 'Modifier' },
  'Team To-Do List': { RW: 'Imirimo y’Ikipe y’Umunsi', FR: 'Liste des tâches de l’équipe' },
  'Give daily jobs to drivers, mechanics, and office staff so nothing gets forgotten.': {
    RW: 'Ha abashoferi, abakanishi n’abakozi bo mu biro imirimo ya buri munsi kugira ngo hatagira ikibagirana.',
    FR: 'Attribuez des tâches aux chauffeurs, mécaniciens et agents pour ne rien oublier.',
  },
  'Add Job': { RW: 'Ongeraho Umurimo', FR: 'Ajouter une tâche' },
  'Waiting': { RW: 'Bitegereje', FR: 'En attente' },
  'Not started yet': { RW: 'Nturatangira', FR: 'Pas encore démarré' },
  'Doing Now': { RW: 'Birakorwa Ubu', FR: 'En cours' },
  'Team working on it': { RW: 'Ikipe iri kubikora', FR: 'L’équipe y travaille' },
  'Urgent': { RW: 'Byihutirwa', FR: 'Urgent' },
  'Needs quick action': { RW: 'Bikeneye gukorwa vuba', FR: 'Action rapide requise' },
  'Finished jobs': { RW: 'Imirimo yarangiye', FR: 'Tâches terminées' },
  'All Jobs': { RW: 'Imirimo Yose', FR: 'Toutes les tâches' },
  'All Speeds': { RW: 'Ubwihutirwe Bwose', FR: 'Toutes priorités' },
  'Important': { RW: 'By’Ingenzi', FR: 'Important' },
  'Normal': { RW: 'Bisanzwe', FR: 'Normal' },
  'Low': { RW: 'Bidakomeye', FR: 'Faible' },
  'Search job or person...': { RW: 'Shaka umurimo cyangwa umuntu...', FR: 'Chercher tâche ou personne...' },
  'For': { RW: 'Kuri', FR: 'Pour' },
  'By': { RW: 'Bitangwa na', FR: 'Par' },
  'Start': { RW: 'Tangira', FR: 'Démarrer' },
  'Mark Done': { RW: 'Emeza ko Byarangiye', FR: 'Terminer' },
  'Remove': { RW: 'Kuraaho', FR: 'Supprimer' },
  'All Jobs Done': { RW: 'Imirimo Yose Yarangiye', FR: 'Toutes les tâches terminées' },
  'No open jobs match your filter right now.': {
    RW: 'Nta mirimo ihuye n’ibyo washakishije iriho ubu.',
    FR: 'Aucune tâche ouverte ne correspond à votre filtre.',
  },
  'Add Team Job': { RW: 'Ongeraho Umurimo w’Ikipe', FR: 'Nouvelle tâche d’équipe' },
  'Pick a person and set a due date': { RW: 'Hitamo umukozi ushyireho itariki ntarengwa', FR: 'Choisissez un membre et une échéance' },
  'Job Title': { RW: 'Izina ry’Umurimo', FR: 'Titre de la tâche' },
  'e.g. Check headlights on RAC 812 K before inspection': {
    RW: 'urugero: Reba amatara ya RAC 812 K mbere ya contrôle',
    FR: 'ex. Vérifier les phares de RAC 812 K avant le contrôle',
  },
  'Details': { RW: 'Ibisobanuro', FR: 'Détails' },
  'Write what needs to be done or where to go...': {
    RW: 'Andika ibigomba gukorwa cyangwa aho kujya...',
    FR: 'Décrivez ce qui doit être fait ou où aller...',
  },
  'Who Does It': { RW: 'Uzabikora', FR: 'Responsable' },
  'Due Date': { RW: 'Itariki Ntarengwa', FR: 'Date limite' },
  'How Urgent': { RW: 'Uko Byihutirwa', FR: 'Priorité' },
  'Car (Optional)': { RW: 'Imodoka (Bitabaye ngombwa)', FR: 'Voiture (Optionnel)' },
  'No specific car': { RW: 'Nta modoka yihariye', FR: 'Aucune voiture précise' },
  'Save Job': { RW: 'Bika Umurimo', FR: 'Enregistrer la tâche' },
  'Simple Monthly Plans': { RW: 'Gahunda Zoroshye z’Ukwezi', FR: 'Forfaits mensuels simples' },
  'Pick the Plan That Fits Your Cars': { RW: 'Hitamo Gahunda Ijyanye n’Imodoka Zawe', FR: 'Choisissez le forfait adapté à votre flotte' },
  'Stop losing money from double bookings or missed payments. Pick a monthly plan based on how many cars you rent out.': {
    RW: 'Reka guhomba kubera kugongana kw’ingendo cyangwa ubwishyu butabonetse. Hitamo gahunda ukurikije umubare w’imodoka zawe.',
    FR: 'Évitez les doubles réservations et paiements manqués. Choisissez un forfait selon le nombre de vos voitures.',
  },
  'Your Cars': { RW: 'Imodoka Zawe', FR: 'Vos voitures' },
  'Your Plan Now': { RW: 'Gahunda Yawe Ubu', FR: 'Votre forfait actuel' },
  'Car Limit': { RW: 'Umubare Ntarengwa w’Imodoka', FR: 'Limite de voitures' },
  'Unlimited Cars': { RW: 'Imodoka Zitagira Umubare', FR: 'Voitures illimitées' },
  'Needs 5 or Fewer Cars': { RW: 'Bisaba Imodoka 5 cyangwa Nkeya', FR: 'Maximum 5 voitures requis' },
  'Share Link': { RW: 'Sangiza Ihuza', FR: 'Partager' },
  'Share your booking website': { RW: 'Sangiza urubuga rwawe rwo gukodesha', FR: 'Partagez votre site de réservation' },
  'Ready': { RW: 'Yiteguye', FR: 'Prête' },
  'In Repair': { RW: 'Mu Igaraje', FR: 'En réparation' },
  'Daily Total': { RW: 'Igiteranyo cy’Umunsi', FR: 'Total journalier' },
  'per day': { RW: 'ku munsi', FR: 'par jour' },
  'Papers Due': { RW: 'Impapuro Zirangira', FR: 'Papiers à renouveler' },
  'Check soon': { RW: 'Reba vuba', FR: 'Vérifier bientôt' },
  'All good': { RW: 'Byose ni byiza', FR: 'Tout est bon' },
  'Daily Rate': { RW: 'Igiciro cy’Umunsi', FR: 'Tarif / jour' },
  'Edit Rate': { RW: 'Hindura Igiciro', FR: 'Modifier le tarif' },

  // SuperAdmin Submodules
  'Company Plans': { RW: 'Gahunda z’Ibigo', FR: 'Forfaits des agences' },
  'Change renewal dates, give free trial days, or upgrade a company plan. Every change saves a reason.': {
    RW: 'Hindura amatariki yo kuvugurura, tanga iminsi y’ubuntu cyangwa uzamure gahunda y’ikigo. Buri mpinduka ibika impamvu.',
    FR: 'Modifiez dates de renouvellement, jours gratuits ou forfaits. Chaque action enregistre une raison.',
  },
  'All Plans': { RW: 'Gahunda Zose', FR: 'Tous les forfaits' },
  'Plan': { RW: 'Gahunda', FR: 'Forfait' },
  'Monthly Price': { RW: 'Igiciro cy’Ukwezi', FR: 'Prix mensuel' },
  'Next Date / Trial': { RW: 'Itariki Ikurikira / Igerageza', FR: 'Prochaine date / Essai' },
  'Renews': { RW: 'Ivugururwa', FR: 'Renouvellement' },
  'Free ends': { RW: 'Ubuntu burangira', FR: 'Fin essai gratuit' },
  'More Time': { RW: 'Ongeraho Igihe', FR: 'Prolonger' },
  'Free Days': { RW: 'Iminsi y’Ubuntu', FR: 'Jours gratuits' },
  'Change Plan...': { RW: 'Hindura Gahunda...', FR: 'Changer de forfait...' },
  'Prices & Plans': { RW: 'Ibiciro & Gahunda', FR: 'Tarifs & Forfaits' },
  'Changes to Starter, Growth, and Enterprise update on the pricing page right away.': {
    RW: 'Impinduka kuri Starter, Growth na Enterprise zihita zigaragara ku rubuga rw’ibiciro ako kanya.',
    FR: 'Toute modification sur Starter, Growth et Enterprise met aussitôt à jour la page des tarifs.',
  },
  'Add Plan': { RW: 'Ongeraho Gahunda', FR: 'Ajouter un forfait' },
  'Yearly': { RW: 'Ku Mwaka', FR: 'Annuel' },
  'free days': { RW: 'iminsi y’ubuntu', FR: 'jours gratuits' },
  'sent back': { RW: 'yasubijwe', FR: 'remboursé' },
  'Money Summary': { RW: 'Incamake y’Amafaranga', FR: 'Résumé financier' },
  'Shows money already paid, money still waiting, failed payments, and money sent back.': {
    RW: 'Yerekana amafaranga yamaze kwishyurwa, ategerejwe, ayanze gucamo n’ayasubijwe.',
    FR: 'Affiche l’argent reçu, en attente, les paiements échoués et les remboursements.',
  },
  'Download CSV': { RW: 'Kuramo CSV', FR: 'Télécharger CSV' },
  'Money Paid (Net)': { RW: 'Amafaranga Yinjiye (Nyuma yo Gusubiza)', FR: 'Encaissements nets' },
  'Paid minus refunds': { RW: 'Ayishyuwe ukuyemo ayasubijwe', FR: 'Payé moins remboursements' },
  'Still Waiting': { RW: 'Aracyategerejwe', FR: 'En attente' },
  'Not paid yet': { RW: 'Ntarishyurwa', FR: 'Pas encore payé' },
  'Failed Payments': { RW: 'Ubwishyu Bwanze', FR: 'Paiements échoués' },
  'Needs retry': { RW: 'Bukeneye kongera kugeragezwa', FR: 'À réessayer' },
  'Sent Back': { RW: 'Ayasubijwe', FR: 'Remboursé' },
  'Refunded to companies': { RW: 'Yasubijwe ibigo', FR: 'Remboursé aux agences' },
  'Monthly Total': { RW: 'Igiteranyo cy’Ukwezi', FR: 'Total mensuel' },
  'Average': { RW: 'Impuzandengo', FR: 'Moyenne' },
  'Money Paid by Plan': { RW: 'Amafaranga Yinjiye ku Bwoko bwa Gahunda', FR: 'Revenus par forfait' },
  'Money Paid by Method': { RW: 'Amafaranga Yinjiye ku Buryo bwo Kwishyura', FR: 'Revenus par mode de paiement' },
  'View any trip to help clients or check late flights. Opening a booking saves a record in the change log.': {
    RW: 'Reba urugendo urwo ari rwo rwose ufashe abakiriya cyangwa urebe indege zakererewe.',
    FR: 'Consultez n’importe quel trajet pour aider les clients ou vérifier un vol retardé.',
  },
  'Search ID, client, place...': { RW: 'Shaka kode, umukiriya, ahantu...', FR: 'Chercher ID, client, lieu...' },
  'All Statuses': { RW: 'Imiterere Yose', FR: 'Tous statuts' },
  'Waiting Driver': { RW: 'Itegereje Umushoferi', FR: 'Attente chauffeur' },
  'Finished': { RW: 'Byarangiye', FR: 'Terminé' },
  'Booking & Dates': { RW: 'Gahunda & Amatariki', FR: 'Réservation & Dates' },
  'Client & Place': { RW: 'Umukiriya & Ahantu', FR: 'Client & Lieu' },
  'Car & Flight': { RW: 'Imodoka & Indege', FR: 'Voiture & Vol' },
  'View': { RW: 'Reba', FR: 'Voir' },
  'Open': { RW: 'Fungura', FR: 'Ouvrir' },
  'Total across': { RW: 'Igiteranyo mu', FR: 'Total sur' },
  'companies': { RW: 'ibigo', FR: 'agences' },
  'Ready Now': { RW: 'Ziteguye Ubu', FR: 'Prêtes' },
  'Free for trips': { RW: 'Zidegembye ku ngendo', FR: 'Libres pour trajets' },
  'On a trip or reserved': { RW: 'Ziri mu rugendo cyangwa zafashwe', FR: 'En trajet ou réservées' },
  'In Garage / Repairs': { RW: 'Mu Igaraje / Zirakorwa', FR: 'Au garage / Réparations' },
  'active garage jobs': { RW: 'imirimo iri mu igaraje', FR: 'réparations actives' },
  'Trials Turned Paid': { RW: 'Abagerageje Bakishyura', FR: 'Essais convertis' },
  'paid': { RW: 'bishyuye', FR: 'payants' },
  'free trial': { RW: 'igerageza ry’ubuntu', FR: 'essai gratuit' },
  'Companies That Left': { RW: 'Ibigo Byahagaritse', FR: 'Agences parties' },
  'paused or stopped': { RW: 'byahagaze cyangwa byavuyemo', FR: 'suspendues ou arrêtées' },
  'Active Users': { RW: 'Abakoresha Bakora', FR: 'Utilisateurs actifs' },
  'Across': { RW: 'Mu', FR: 'Sur' },
  'Finished Trips': { RW: 'Ingendo Zarangiye', FR: 'Trajets terminés' },
  'total trips recorded': { RW: 'ingendo zose zanditswe', FR: 'trajets enregistrés' },
  'How Companies Start': { RW: 'Uko Ibigo Bitangira', FR: 'Statut des agences' },
  'active': { RW: 'zikora', FR: 'actives' },
  'waiting': { RW: 'zitegereje', FR: 'en attente' },
  'All People': { RW: 'Abantu Bose', FR: 'Tous les utilisateurs' },
  'Owners, staff & drivers': { RW: 'Ba nyir’ibigo, abakozi & abashoferi', FR: 'Propriétaires, équipe & chauffeurs' },
  'In': { RW: 'Mu', FR: 'Dans' },
  'All trips across site': { RW: 'Ingendo zose ku rubuga', FR: 'Tous trajets sur la plateforme' },
  'Monthly': { RW: 'Ku Kwezi', FR: 'Mensuel' },
  'Help Requests': { RW: 'Ubusabe bw’Ubufasha', FR: 'Demandes d’aide' },
  'urgent': { RW: 'byihutirwa', FR: 'urgents' },
  'alerts': { RW: 'amakuru', FR: 'alertes' },
  'Money Collected vs. Failed Payments': { RW: 'Amafaranga Yinjiye ugereranyije n’Ayanze', FR: 'Paiements encaissés vs échoués' },
  'Counted only from confirmed payment records': { RW: 'Bibaze ku bwishyu bwemejwe gusa', FR: 'Calculé uniquement sur les paiements confirmés' },
  'See All Payments': { RW: 'Reba Ubwishyu Bwose', FR: 'Voir tous les paiements' },
  'Failed': { RW: 'Byanze', FR: 'Échoués' },
  'Connected Tools': { RW: 'Ibikoresho Bihujwe', FR: 'Outils connectés' },
  'Secret keys stay hidden. Test any tool below or turn it on or off with a saved reason.': {
    RW: 'Amakode y’ibanga aguma ahishwe. Gerageza igikoresho cyose cyangwa ugikureho ubitse impamvu.',
    FR: 'Les clés secrètes restent masquées. Testez ou activez/désactivez chaque outil avec une raison.',
  },
  'Checking...': { RW: 'Irimo kugenzura...', FR: 'Vérification...' },
  'Test Now': { RW: 'Gerageza Ubu', FR: 'Tester' },
  'Turn Off': { RW: 'Zimya', FR: 'Désactiver' },
  'Turn On': { RW: 'Fungura', FR: 'Activer' },
  'Service': { RW: 'Serivisi', FR: 'Service' },
  'Live Data Save': { RW: 'Kubika Amakuru Ako Kanya', FR: 'Sauvegarde en direct' },
  'Online': { RW: 'Iri kuri Interineti', FR: 'En ligne' },
  'Using Local Save': { RW: 'Iri Kubika Hafi', FR: 'Sauvegarde locale' },
  'Stopped Tasks': { RW: 'Imirimo Yahagaze', FR: 'Tâches arrêtées' },
  'Open Errors': { RW: 'Amakosa Akiriho', FR: 'Erreurs ouvertes' },
  'Automatic Tasks': { RW: 'Imirimo Yikora', FR: 'Tâches automatiques' },
  'Run Again': { RW: 'Ongera Ukore', FR: 'Relancer' },
  'System Errors': { RW: 'Amakosa ya Sisitemu', FR: 'Erreurs système' },
  'Fixed': { RW: 'Byakosowe', FR: 'Corrigé' },
  'Mark Fixed': { RW: 'Emeza ko Byakosowe', FR: 'Marquer corrigé' },
  'Safety Alerts': { RW: 'Imburira z’Umutekano', FR: 'Alertes de sécurité' },
  'Shows wrong sign-in tries, blocked page tries, and password reset requests.': {
    RW: 'Yerekana abagerageje kwinjira nabi, abahagaritswe n’abasabye guhindura ijambobanga.',
    FR: 'Affiche tentatives de connexion échouées, accès bloqués et demandes de mot de passe.',
  },
  'Change History (Cannot Edit)': { RW: 'Amateka y’Impinduka (Ntahinduka)', FR: 'Historique (Non modifiable)' },
  'Safe record of every important change. Nothing can be edited or deleted here.': {
    RW: 'Inyandiko yizewe ya buri mpinduka ikomeye. Nta kintu gishobora gusibwa cyangwa guhindurwa hano.',
    FR: 'Journal sécurisé de chaque modification importante. Rien ne peut être modifié ou supprimé ici.',
  },
  'Search person, code, or item...': { RW: 'Shaka umuntu, kode cyangwa ikintu...', FR: 'Chercher personne, code ou élément...' },
  'All Records': { RW: 'Inyandiko Zose', FR: 'Tous les enregistrements' },
  'Time & Code': { RW: 'Igihe & Kode', FR: 'Heure & Code' },
  'Changed By': { RW: 'Uwahinduye', FR: 'Modifié par' },
  'What Changed': { RW: 'Icyahindutse', FR: 'Modification' },
  'Old → New': { RW: 'Kera → Gishya', FR: 'Ancien → Nouveau' },
  'Reason': { RW: 'Impamvu', FR: 'Raison' },
  'Notices & Rules': { RW: 'Amabwiriza & Amakuru', FR: 'Avis & Règles' },
  'Write terms, privacy pages, help questions, and banners for everyone.': {
    RW: 'Andika amategeko, ibibazo bikunze kubazwa n’itangazo kuri bose.',
    FR: 'Rédigez conditions, confidentialité, FAQ et bannières pour tous.',
  },
  'Add Notice': { RW: 'Ongeraho Itangazo', FR: 'Ajouter un avis' },
  'Signup & Company Rules': { RW: 'Amategeko yo Kwiyandikisha & Ibigo', FR: 'Règles d’inscription & agences' },
  'MoMo Code & Site Pause Mode': { RW: 'Kode ya MoMo & Guhagarika Urubuga', FR: 'Code MoMo & Mode pause' },
  'MTN MoMo Pay Code': { RW: 'Kode yo Kwishyura ya MTN MoMo', FR: 'Code marchand MTN MoMo' },
  'Tax (%)': { RW: 'Umusoro (%)', FR: 'Taxe (%)' },
  'Company Tax Number (TIN)': { RW: 'Nimero y’Umusoro y’Ikigo (TIN)', FR: 'Numéro fiscal (TIN)' },
  'Pause Website for Repairs': { RW: 'Hagarika Urubuga Gato ngo Rukorwe', FR: 'Mettre le site en pause' },
  'Write why you changed these rules (at least 5 letters)...': {
    RW: 'Andika impamvu uhinduye aya mategeko (nibura inyuguti 5)...',
    FR: 'Indiquez la raison de ce changement (5 caractères min.)...',
  },
  'Save Rules': { RW: 'Bika Amategeko', FR: 'Enregistrer les règles' },
  'Main Owners control everything. Team helpers cannot give themselves extra power.': {
    RW: 'Ba Nyir’Urubuga bakuru bagenzura byose. Abafasha ntibashobora kwiha ubundi bubasha.',
    FR: 'Les propriétaires principaux contrôlent tout. Les assistants ne peuvent pas s’ajouter de droits.',
  },
  'Add Helper': { RW: 'Ongeraho Umufasha', FR: 'Ajouter un assistant' },
  'Name & Email': { RW: 'Izina & Imeri', FR: 'Nom & E-mail' },
  'Role': { RW: 'Inshingano', FR: 'Rôle' },
  'Pages Allowed': { RW: 'Paji Yemerewe', FR: 'Pages autorisées' },
  'Main Owner': { RW: 'Nyir’Urubuga Mukuru', FR: 'Propriétaire principal' },
  'All 20 Pages': { RW: 'Paji Zose 20', FR: 'Toutes les 20 pages' },
  'pages': { RW: 'paji', FR: 'pages' },
  'General Admin': { RW: 'Umuyobozi Rusange', FR: 'Admin général' },
  'Money Admin': { RW: 'Ushinzwe Amafaranga', FR: 'Admin finances' },
  'Help Admin': { RW: 'Ushinzwe Ubufasha', FR: 'Admin support' },
  'Tools Admin': { RW: 'Ushinzwe Ibikoresho', FR: 'Admin outils' },
  'Safety Admin': { RW: 'Ushinzwe Umutekano', FR: 'Admin sécurité' },
  'Pause': { RW: 'Hagarika', FR: 'Suspendre' },
  'Pause Admin': { RW: 'Hagarika Umuyobozi', FR: 'Suspendre l’admin' },
  'Turn On Admin': { RW: 'Subizaho Umuyobozi', FR: 'Réactiver l’admin' },
  'Could not change status.': { RW: 'Ntibishobotse guhindura imiterere.', FR: 'Impossible de changer le statut.' },
  'Protected Owner': { RW: 'Nyir’Urubuga Urinzwe', FR: 'Propriétaire protégé' },
  'Could not add helper.': { RW: 'Ntibishobotse kongeramo umufasha.', FR: 'Impossible d’ajouter l’assistant.' },
  'Add Admin Helper': { RW: 'Ongeraho Umufasha wa Admin', FR: 'Ajouter un assistant admin' },
  'Full Name': { RW: 'Amazina Yose', FR: 'Nom complet' },
  'e.g. Helping check payments and support.': {
    RW: 'urugero: Afasha kugenzura ubwishyu n’ubufasha.',
    FR: 'ex. Aide au suivi des paiements et du support.',
  },
  'Person': { RW: 'Umuntu', FR: 'Utilisateur' },
  'Last Sign In': { RW: 'Yahinjiye Bwa Nyuma', FR: 'Dernière connexion' },
  'Add Company': { RW: 'Ongeraho Ikigo', FR: 'Ajouter une agence' },
  'Company & Tax ID': { RW: 'Ikigo & Nimero y’Umusoro', FR: 'Agence & NIF' },
  'Owner & City': { RW: 'Nyir’Ikigo & Umujyi', FR: 'Propriétaire & Ville' },
  'Plan & Cars': { RW: 'Gahunda & Imodoka', FR: 'Forfait & Voitures' },
  'Price/mo': { RW: 'Igiciro/ukwezi', FR: 'Prix/mois' },
  'Trial': { RW: 'Igerageza', FR: 'Essai' },

  // Multi-Photo Gallery, Vehicle Details & Features
  'Previous photo': { RW: 'Ifoto ibanziriza', FR: 'Photo précédente' },
  'Next photo': { RW: 'Ifoto ikurikira', FR: 'Photo suivante' },
  'Photo': { RW: 'Ifoto', FR: 'Photo' },
  'photos': { RW: 'amafoto', FR: 'photos' },
  'Cover': { RW: 'Ifoto Nkuru', FR: 'Principale' },
  'Set Cover': { RW: 'Gira Nkuru', FR: 'Définir principale' },
  'Remove photo': { RW: 'Kuraaho ifoto', FR: 'Supprimer la photo' },
  'Saving...': { RW: 'Iri kubika...', FR: 'Enregistrement...' },
  'Upload Photos': { RW: 'Ohereza Amafoto', FR: 'Ajouter des photos' },
  'Add 1 or more': { RW: 'Shyiramo 1 cyangwa menshi', FR: 'Ajouter 1 ou plusieurs' },
  'Or paste photo link (https://...)': { RW: 'Cyangwa shyiramo ihuza ry’ifoto (https://...)', FR: 'Ou coller un lien photo (https://...)' },
  'Add Photo': { RW: 'Ongeraho Ifoto', FR: 'Ajouter' },
  'Please paste a valid photo link starting with https://': {
    RW: 'Shyiramo ihuza ry’ifoto ryemewe ritangirwa na https://',
    FR: 'Veuillez coller un lien photo valide commençant par https://',
  },
  'Quick sample photos (tap to add):': { RW: 'Amafoto y’urugero (kanda wongereho):', FR: 'Exemples rapides (touchez pour ajouter) :' },
  'Car Photos (Shown to Customers)': { RW: 'Amafoto y’Imodoka (Abakiriya Bayabona)', FR: 'Photos de la voiture (visibles clients)' },
  'Photo storage limit reached for this car. Remove a photo or add fewer photos.': {
    RW: 'Umubare w’amafoto yemewe wuzuye. Kuraaho ifoto imwe cyangwa ushyiremo make.',
    FR: 'Limite de stockage atteinte pour cette voiture. Supprimez une photo ou ajoutez-en moins.',
  },
  'Could not load these photos. Please try JPG or PNG files.': {
    RW: 'Ntibyashobotse gukurura aya mafoto. Gerageza JPG cyangwa PNG.',
    FR: 'Impossible de charger ces photos. Essayez des fichiers JPG ou PNG.',
  },
  'Edit car details & photos': { RW: 'Hindura amakuru n’amafoto y’imodoka', FR: 'Modifier infos et photos' },
  'See car details': { RW: 'Reba amakuru y’imodoka', FR: 'Voir les détails' },
  'Edit Car & Photos': { RW: 'Hindura Imodoka & Amafoto', FR: 'Modifier voiture & photos' },
  'What Customers See on Booking Site': { RW: 'Ibyo Abakiriya Babona ku Rubuga', FR: 'Ce que voient les clients en ligne' },
  'Update Info': { RW: 'Vugurura Amakuru', FR: 'Mettre à jour' },
  'Day Price': { RW: 'Igiciro ku Munsi', FR: 'Tarif / jour' },
  'Next Checkup': { RW: 'Isuzuma Rikurikira', FR: 'Prochain contrôle' },
  'Year': { RW: 'Umwaka', FR: 'Année' },
  'Edit Car Details & Photos': { RW: 'Hindura Amakuru & Amafoto y’Imodoka', FR: 'Modifier détails & photos' },
  'Updates show immediately on your customer booking website.': {
    RW: 'Impinduka zihita zigaragara ku rubuga rw’abakiriya ako kanya.',
    FR: 'Les modifications s’affichent aussitôt sur votre site de réservation.',
  },
  'Car Model & Name': { RW: 'Ubwoko & Izina ry’Imodoka', FR: 'Modèle & Nom de voiture' },
  'Number Plate': { RW: 'Pulaki y’Imodoka', FR: 'Numéro de plaque' },
  'Price per Day (RWF)': { RW: 'Igiciro ku Munsi (RWF)', FR: 'Prix par jour (RWF)' },
  'Car Status': { RW: 'Imiterere y’Imodoka', FR: 'Statut de la voiture' },
  'Gearbox': { RW: 'Vitesse', FR: 'Boîte' },
  'Distance Driven (km)': { RW: 'Ibirometero Byagenzwe (km)', FR: 'Kilométrage (km)' },
  'Main Driver': { RW: 'Umushoferi Mukuru', FR: 'Chauffeur principal' },
  'Any Driver': { RW: 'Umushoferi Uwo ari We Wese', FR: 'Tout chauffeur' },
  'Where Parked': { RW: 'Aho Iparitse', FR: 'Lieu de stationnement' },
  'Where Parked in Kigali': { RW: 'Aho Iparitse i Kigali', FR: 'Emplacement à Kigali' },
  'Police Car Check End Date': { RW: 'Itariki Contrôle Technique Irangiriraho', FR: 'Expiration contrôle technique' },
  'Insurance End Date': { RW: 'Itariki Ubwishingizi Burangiriraho', FR: 'Expiration assurance' },
  'About This Car (Shown to Customers)': { RW: 'Ibyerekeye Iyi Modoka (Ku Bakiriya)', FR: 'À propos de cette voiture (clients)' },
  'Tell customers about luggage room, comfort, AC, safari suitability, or airport pickup...': {
    RW: 'Bwira abakiriya umwanya w’imizigo, uburyohe, AC, safari cyangwa ku kibuga cy’indege...',
    FR: 'Décrivez coffre, confort, clim, aptitude safari ou prise en charge aéroport...',
  },
  'Car Features (Tap to Select)': { RW: 'Ibiranga Imodoka (Kanda Uhitamo)', FR: 'Équipements (touchez pour choisir)' },
  'Add car details & photos for your booking website': {
    RW: 'Ongeramo amakuru n’amafoto y’urubuga rwawe rwo gukodesha',
    FR: 'Ajoutez détails et photos pour votre site de réservation',
  },
  'Save Car': { RW: 'Bika Imodoka', FR: 'Enregistrer la voiture' },
  '4WD / 4x4': { RW: '4WD / 4x4 (Imisozi)', FR: '4x4 / Traction intégrale' },
  'Air Conditioning': { RW: 'Ikonjesha (AC)', FR: 'Climatisation' },
  'Pop-Up Safari Roof': { RW: 'Igisenge cya Safari Gifunguka', FR: 'Toit ouvrant safari' },
  'Bluetooth & USB': { RW: 'Bluetooth & USB', FR: 'Bluetooth & USB' },
  'Free Wi-Fi Ready': { RW: 'Wi-Fi y’Ubuntu Irateguye', FR: 'Wi-Fi gratuit prêt' },
  'Child Seat Ready': { RW: 'Intebe y’Umwana Iraboneka', FR: 'Prêt siège enfant' },
  'Unlimited Rwanda km': { RW: 'Ibirometero Bitagira Umupaka mu Rwanda', FR: 'Kilométrage illimité Rwanda' },
  'First-Aid & Spare Tire': { RW: 'Ubutabazi & Ipine ry’Inyongera', FR: 'Trousse secours & roue de secours' },
  '220V Camera Charger': { RW: 'Sharijeri ya Kamera 220V', FR: 'Prise chargeur caméra 220V' },
  'Leather VIP Seats': { RW: 'Intebe z’Uruhu za VIP', FR: 'Sièges cuir VIP' },
  'Start full tank, return full': { RW: 'Tangira yuzuye, uyigarure yuzuye', FR: 'Plein au départ, plein au retour' },
  'Safety Checked & Insured': { RW: 'Yagenzuwe & Ifite Ubwishingizi', FR: 'Contrôlée & Assurée' },
  'Comprehensive Rwanda Insurance': { RW: 'Ubwishingizi Bwuzuye mu Rwanda', FR: 'Assurance tous risques Rwanda' },
  'Free cancel 3+ days before': { RW: 'Guhagarika ku buntu iminsi 3+ mbere', FR: 'Annulation gratuite 3+ jours avant' },
  'Safety checked car': { RW: 'Imodoka yagenzuwe umutekano', FR: 'Voiture contrôlée sécurité' },
  'Photos & Info': { RW: 'Amafoto & Amakuru', FR: 'Photos & Infos' },
  'Pick & Book': { RW: 'Hitamo & Fata', FR: 'Choisir & Réserver' },
  'Pick Car': { RW: 'Hitamo Imodoka', FR: 'Choisir' },
  'Photos & Full Info': { RW: 'Amafoto & Amakuru Yose', FR: 'Photos & Fiche complète' },
  'About This Car': { RW: 'Ibyerekeye Iyi Modoka', FR: 'À propos de cette voiture' },
  'Pickup Hub': { RW: 'Aho Ibonerwa', FR: 'Point de départ' },
  'Included Features & Comfort': { RW: 'Ibirimo & Ibyiza by’Imodoka', FR: 'Équipements & confort inclus' },
  'Open Full Car Page': { RW: 'Fungura Paji Yuzuye y’Imodoka', FR: 'Ouvrir la fiche complète' },
  'Book This Car': { RW: 'Fata Iyi Modoka', FR: 'Réserver cette voiture' },
  'Back to all cars': { RW: 'Subira ku modoka zose', FR: 'Retour aux voitures' },
  'Car Info & Specs': { RW: 'Amakuru & Imiterere y’Imodoka', FR: 'Infos & caractéristiques' },
  'Seats': { RW: 'Imyanya', FR: 'Places' },
  'Bags': { RW: 'Imizigo', FR: 'Bagages' },
  'Suitcases': { RW: 'Amavalizi', FR: 'Valises' },
  'Gears': { RW: 'Vitesse', FR: 'Boîte' },
  'Safety Papers': { RW: 'Impapuro z’Umutekano', FR: 'Papiers sécurité' },
  'Valid to': { RW: 'Bizarangira', FR: 'Valide jusqu’au' },
  'Verified Ready': { RW: 'Yemejwe ko Yiteguye', FR: 'Vérifiée prête' },
  'What This Car Has': { RW: 'Ibyo Iyi Modoka Ifite', FR: 'Ce que comprend cette voiture' },
  'Days:': { RW: 'Iminsi:', FR: 'Jours :' },
  'Days': { RW: 'Iminsi', FR: 'Jours' },
  'Car rent:': { RW: 'Ikode ry’imodoka:', FR: 'Location :' },
  'VAT tax:': { RW: 'Umusoro wa TVA:', FR: 'TVA :' },
  'Total:': { RW: 'Igiteranyo:', FR: 'Total :' },
  'Trip length:': { RW: 'Uburebure bw’urugendo:', FR: 'Durée du trajet :' },
  'Estimated Total:': { RW: 'Igiteranyo Giteganijwe:', FR: 'Total estimé :' },
  'Price per day': { RW: 'Igiciro ku munsi', FR: 'Prix par jour' },
  'Price per day:': { RW: 'Igiciro ku munsi:', FR: 'Prix par jour :' },
  'Per day:': { RW: 'Ku munsi:', FR: 'Par jour :' },
  'Open for Dates': { RW: 'Iraboneka ku Matariki', FR: 'Disponible aux dates' },
  'No cars match your filters': { RW: 'Nta modoka ihuje n’ibyo wahisemo', FR: 'Aucune voiture ne correspond' },
  'Try clearing your filters or ask our Kigali help desk.': {
    RW: 'Gerageza gukuraho ibyo wahisemo cyangwa ubaze abafasha bacu i Kigali.',
    FR: 'Effacez vos filtres ou contactez notre équipe à Kigali.',
  },
  'Show All Cars': { RW: 'Erekana Imodoka Zose', FR: 'Afficher toutes les voitures' },
  'Demo Sandbox': { RW: 'Igerageza Ry’Ubuntu', FR: 'Mode Démo' },
  'Free Demo Sandbox': { RW: 'Igerageza Ry’Ubuntu', FR: 'Bac à sable Démo Gratuit' },
  'Free Demo Storefront Preview': {
    RW: 'Urubuga rw’Igerageza rw’Ubuntu',
    FR: 'Aperçu Vitrine Démo Gratuite',
  },
  'Sample Kigali cars shown so visitors can test online booking.': {
    RW: 'Imodoka z’icyitegererezo i Kigali zerekanwa kugira ngo abakiriya bagerageze gufata imodoka.',
    FR: 'Voitures d’exemple à Kigali pour tester la réservation en ligne.',
  },
  'You are testing sample Kigali cars & bookings locally. Create a real company when ready to go live.': {
    RW: 'Uri kugerageza imodoka n’ingendo z’icyitegererezo. Fungura ikigo cyawe igihe witeguye gutangira gukora.',
    FR: 'Vous testez localement des voitures et réservations d’exemple. Créez votre entreprise pour passer en ligne.',
  },
  'Create Real Company': { RW: 'Fungura Ikigo Cyawe', FR: 'Créer une entreprise' },
  'Your Live Garage is Ready': { RW: 'Igaraje Ryawe Riteguye Gukora', FR: 'Votre garage en ligne est prêt' },
  'Add your real rental cars with photos, or load 4 editable sample Kigali cars to start fast.': {
    RW: 'Shyiramo imodoka zawe nyazo n’amafoto, cyangwa utangirane imodoka 4 z’icyitegererezo wahindura.',
    FR: 'Ajoutez vos véhicules avec photos, ou chargez 4 voitures d’exemple modifiables pour démarrer vite.',
  },
  'Load Starter Sample Cars': { RW: 'Shyiramo Imodoka 4 z’Itangiriro', FR: 'Charger 4 voitures d’exemple' },
  'Add Real Cars': { RW: 'Ongeramo Imodoka Zawe', FR: 'Ajouter vos voitures' },
  'Explore Free Demo Sandbox': { RW: 'Gerageza Igerageza Ry’Ubuntu', FR: 'Explorer la Démo Gratuite' },
  'No Account Needed': { RW: 'Ntibisaba Konti', FR: 'Sans compte' },
  'Try KigaliFleet with sample Kigali cars, drivers, and bookings before creating your real company.': {
    RW: 'Gerageza KigaliFleet n’imodoka z’i Kigali mbere yo gufungura konti y’ikigo cyawe.',
    FR: 'Essayez KigaliFleet avec des voitures, chauffeurs et réservations d’exemple avant de créer votre entreprise.',
  },
  'Sign in to Live Account': { RW: 'Injira muri Konti Nyayo', FR: 'Connexion compte réel' },
  'Create Live Account': { RW: 'Fungura Konti Nyayo', FR: 'Créer un compte réel' },
  'Sign in with Google or email to manage your real company garage.': {
    RW: 'Injira na Google cyangwa imeri kugira ngo ucunge imodoka z’ikigo cyawe.',
    FR: 'Connectez-vous avec Google ou e-mail pour gérer votre flotte réelle.',
  },
  'Create your own isolated company workspace in seconds.': {
    RW: 'Fungura urubuga rwihariye rw’ikigo cyawe mu masegonda make.',
    FR: 'Créez votre espace entreprise isolé en quelques secondes.',
  },
  'Continue with Google instead': { RW: 'Komeza ukoresheje Google', FR: 'Continuer avec Google' },
  'Send Reset Link': { RW: 'Ohereza Ihuza Rihindura', FR: 'Envoyer le lien' },
  'Reset Link Sent!': { RW: 'Ihuza Ryoherejwe!', FR: 'Lien envoyé !' },
  Live: { RW: 'Kuri Interineti', FR: 'En ligne' },
};

/**
 * Translates an English UI label/phrase into RW or FR when matched in DICTIONARY
 * or via structured dynamic rules; falls back safely to English.
 */
export function translateText(enText: string, languageOverride?: AppLanguage): string {
  const lang = languageOverride || globalLanguage;
  if (!enText || lang === 'EN') return enText;

  const trimmed = enText.trim();
  const hit = DICTIONARY[trimmed];
  if (hit) {
    return hit[lang];
  }

  // Dynamic patterns for common UI micro-strings
  // 1. "+ Book <Car>"
  const bookMatch = trimmed.match(/^\+\s*Book\s+(.+)$/i);
  if (bookMatch) {
    return lang === 'RW' ? `+ Fata ${bookMatch[1]}` : `+ Réserver ${bookMatch[1]}`;
  }

  // 2. "Free all <MonthYear>"
  const freeAllMatch = trimmed.match(/^Free all\s+(.+)$/i);
  if (freeAllMatch) {
    return lang === 'RW'
      ? `Idegenbye ukwezi kose (${freeAllMatch[1]})`
      : `Libre tout ${freeAllMatch[1]}`;
  }

  // 3. "Switch View (<Role>)"
  const switchViewMatch = trimmed.match(/^Switch View\s*\((.+)\)$/i);
  if (switchViewMatch) {
    const inner = translateText(switchViewMatch[1], lang);
    return lang === 'RW' ? `Hindura Uko Urebera (${inner})` : `Changer de vue (${inner})`;
  }

  // 4. "<N> unread updates"
  const unreadMatch = trimmed.match(/^(\d+)\s+unread updates$/i);
  if (unreadMatch) {
    return lang === 'RW'
      ? `Amakuru ${unreadMatch[1]} atarasomwa`
      : `${unreadMatch[1]} notifications non lues`;
  }

  // 5. "Alerts (<N>)"
  const alertsMatch = trimmed.match(/^Alerts\s*\((\d+)\)$/i);
  if (alertsMatch) {
    return lang === 'RW' ? `Ubutumwa (${alertsMatch[1]})` : `Alertes (${alertsMatch[1]})`;
  }

  // 6. "Left: <Amount>"
  const leftMatch = trimmed.match(/^Left:\s*(.+)$/i);
  if (leftMatch) {
    return lang === 'RW' ? `Asigaye: ${leftMatch[1]}` : `Reste : ${leftMatch[1]}`;
  }

  // 7. "<N> days"
  const daysMatch = trimmed.match(/^(\d+)\s+days?$/i);
  if (daysMatch) {
    const n = Number(daysMatch[1]);
    return lang === 'RW' ? `iminsi ${n}` : `${n} jour${n > 1 ? 's' : ''}`;
  }

  // 8. "Done (N)", "Booked (N)", "On Trip (N)", "Cancelled (N)", "All (N)", "All Types (N)", etc.
  const parenCountMatch = trimmed.match(/^(Done|Booked|On Trip|Cancelled|All|All Types|Available|In Garage|All Jobs|All Records|All People|All Customers)\s*\((\d+)\)$/i);
  if (parenCountMatch) {
    const translatedWord = translateText(parenCountMatch[1], lang);
    return `${translatedWord} (${parenCountMatch[2]})`;
  }

  // 9. "Up to <N> cars"
  const upToCarsMatch = trimmed.match(/^Up to\s+(\d+)\s+cars$/i);
  if (upToCarsMatch) {
    return lang === 'RW' ? `Kugeza ku modoka ${upToCarsMatch[1]}` : `Jusqu'à ${upToCarsMatch[1]} voitures`;
  }

  // 10. "Maximum <N> photos per car reached."
  const maxPhotosMatch = trimmed.match(/^Maximum\s+(\d+)\s+photos per car reached\.$/i);
  if (maxPhotosMatch) {
    return lang === 'RW'
      ? `Umubare ntarengwa w’amafoto ${maxPhotosMatch[1]} ku modoka wuzuye.`
      : `Maximum de ${maxPhotosMatch[1]} photos par voiture atteint.`;
  }

  return enText;
}

export interface I18nContextValue {
  currency: AppCurrency;
  setCurrency: (currency: AppCurrency) => void;
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  formatMoney: (amountRwf: number) => string;
  tr: (enText: string) => string;
  t: <T>(variants: { EN: T; RW: T; FR: T }) => T;
}

const I18nContext = createContext<I18nContextValue>({
  currency: 'RWF',
  setCurrency: () => {},
  language: 'EN',
  setLanguage: () => {},
  formatMoney: (amount) => formatCurrency(amount, 'RWF'),
  tr: (text) => text,
  t: (variants) => variants.EN,
});

interface I18nProviderProps {
  currency: AppCurrency;
  setCurrency: (currency: AppCurrency) => void;
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  children: React.ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  currency,
  setCurrency,
  language,
  setLanguage,
  children,
}) => {
  // Ensure synchronous active state before children render
  setGlobalCurrency(currency);
  setGlobalLanguage(language);

  const value = useMemo<I18nContextValue>(
    () => ({
      currency,
      setCurrency,
      language,
      setLanguage,
      formatMoney: (amountRwf: number) => formatCurrency(amountRwf, currency),
      tr: (enText: string) => translateText(enText, language),
      t: <T,>(variants: { EN: T; RW: T; FR: T }) => variants[language] ?? variants.EN,
    }),
    [currency, setCurrency, language, setLanguage]
  );

  return React.createElement(I18nContext.Provider, { value }, children);
};

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}
