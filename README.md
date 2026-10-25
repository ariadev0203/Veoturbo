# CLARA 4.3 + Veo Pro
Racine du dépôt GitHub : netlify.toml, netlify/functions/veo.js, public/ (CLARA).
Netlify : Import from Git, aucun réglage. Recherche, contacts, réactivation : app.visionscanal.com (inchangé).
- Cartes abonnés / favoris : nom, jours restants, date de fin, jauge, boutons Relancer / Rappel / Fiche.
- Fiche client : toutes les informations, modification (nom, téléphone, e-mail, localisation, notes), suppression.
- Onglet Veo (même organisation que Veo Pro) : Accueil (chiffre d'affaires, réabonnement), Souscriptions, Commissions.
- Paiement : numéro prérempli avec le contact du client, opérateur MTN / Orange détecté automatiquement.
- Client réabonné absent de la base : enregistré automatiquement pour la relance et le suivi.
- 4.1 : l'onglet Recherche est supprimé (remplacé par Veo). La recherche se fait sur l'Accueil : le client choisi est enregistré automatiquement (contact obligatoire) puis ouvert dans Enregistrement, où se trouvent la réactivation du décodeur, le réabonnement Veo et la relance.
- 4.2 : le numéro de paiement ne reste plus figé (prérempli seulement avec le contact du client enregistré ; contact obligatoire pour un nouveau client, distinct du numéro payeur) ; contrôle des contacts en double dans l'onglet Veo ; message de remerciement des factures protégé ; nom affiché sur l'accueil sauvegardé.
- 4.3 : après un réabonnement Veo, la fiche est mise à jour automatiquement (nouvelle échéance relue chez Veo, plusieurs essais) ; les réabonnements faits dans Veo hors CLARA sont détectés et appliqués ; bouton « Actualiser les dates » dans Suivi ; actualisation depuis le serveur CLARA si Veo n'est pas connecté.
