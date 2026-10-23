# CLARA en PWA : hébergement gratuit et mises à jour

## Contenu du dossier
- `index.html` : l'application
- `convertisseur.html` : rubrique « Factures » (convertisseur de facture CANAL+ / StarTimes), chargée dans CLARA
- `manifest.webmanifest`, `icons/` : installation sur l'écran d'accueil
- `sw.js` : mode hors connexion et détection des mises à jour
- `_headers` : empêche le cache des fichiers clés (Cloudflare Pages et Netlify)

## Hébergement gratuit : Cloudflare Pages (recommandé)
1. Créez un compte gratuit sur dash.cloudflare.com.
2. Workers & Pages → Create → Pages → **Upload assets** (envoi direct, sans GitHub).
3. Nommez le projet (ex. `clara`), glissez le **dossier décompressé** `clara-pwa`, puis Deploy.
4. Votre adresse : `https://clara.pages.dev`. Ouvrez-la sur le téléphone, puis « Installer l'application » (Paramètres) ou menu du navigateur → Ajouter à l'écran d'accueil.

Alternatives gratuites : Netlify (app.netlify.com/drop, glisser-déposer du dossier) ou GitHub Pages (dépôt public : le code serait visible par tous).
Les offres gratuites changent : vérifiez les conditions au moment de l'inscription.

## Publier une mise à jour
1. Modifiez `index.html`.
2. Dans `sw.js`, changez `VERSION` (ex. `1.2.1`) et, dans `index.html`, `APP_VERSION` avec la même valeur.
3. Cloudflare : projet → Create deployment → renvoyez le dossier. Netlify : onglet Deploys → glissez le dossier.
4. Chez les utilisateurs, un bandeau « Nouvelle version disponible » apparaît (vérification à chaque ouverture, puis toutes les heures) : un clic sur « Mettre à jour » suffit. Paramètres → « Vérifier les mises à jour » force la recherche.

## À savoir avant de passer en ligne
- **Les données locales sont liées à l'adresse du site** (la synchronisation Google Drive évite ce problème une fois activée). Les clients enregistrés dans l'ancien fichier ne suivent pas : faites Paramètres → Sauvegarde → **Exporter** avant, puis **Importer** dans la version hébergée.
- **Connexion au serveur Canal+** : depuis une adresse https hébergée, le serveur doit accepter les appels de votre domaine (CORS). Testez la connexion juste après la mise en ligne ; si elle est refusée, il faudra passer par un petit relais (je peux le préparer).
- Le mode hors connexion ouvre l'application et les clients enregistrés ; la recherche serveur et la réactivation exigent internet.

## Synchronisation Google Drive (plusieurs appareils)
Les clients, relances, activités, réglages et l'image sont copiés dans un dossier **« CLARA » créé automatiquement** sur le Google Drive du compte connecté. CLARA n'a accès qu'aux fichiers qu'elle crée elle-même, pas au reste de votre Drive. Chaque appareil garde aussi ses données en local et fonctionne hors connexion.

### Configuration (une seule fois, par vous)
1. Allez sur console.cloud.google.com → créez un projet « CLARA ».
2. APIs et services → Bibliothèque → activez **Google Drive API**.
3. Écran de consentement OAuth (Google Auth Platform) : nom CLARA, e-mail d'assistance, public **Externe**. Ajoutez la portée `.../auth/drive.file`, puis **publiez l'application** (état « En production »). En mode « Test », seuls les comptes test sont acceptés et l'accès expire plus vite.
4. Identifiants → Créer des identifiants → **ID client OAuth** → type « Application Web » → *Origines JavaScript autorisées* : l'adresse de votre site (ex. `https://clara.pages.dev`, sans « / » final).
5. Copiez l'ID client, ouvrez `index.html`, remplacez `const GOOGLE_CLIENT_ID="";` par `const GOOGLE_CLIENT_ID="votre-id.apps.googleusercontent.com";`, changez `VERSION` dans `sw.js` (ex. `1.3.1`) et `APP_VERSION` dans `index.html`, puis renvoyez le dossier sur l'hébergeur.
(Sans cette étape, un champ « Identifiant client Google » apparaît dans Paramètres pour tester.)

### Utilisation
- Paramètres → saisissez votre adresse Gmail (facultatif, pour gagner un écran) → **Connecter Google Drive**. Le mot de passe se saisit uniquement sur la page officielle de Google, jamais dans CLARA ; avec le même compte Google sur chaque appareil. La synchronisation se fait à l'ouverture, au retour dans l'application et quelques secondes après chaque enregistrement ou relance.
- Fusion automatique : la fiche modifiée en dernier l'emporte, les relances et activités s'additionnent, une suppression se propage aux autres appareils.
- L'accès Google expire environ toutes les heures : si besoin, un bandeau « Synchronisation Google Drive en pause » apparaît ; un clic sur « Synchroniser maintenant » reconnecte. Rien ne se synchronise quand l'application est fermée.
- Les données du serveur Canal+ et la connexion à l'application restent inchangées : la connexion Google est un compte distinct.
- L'export/import manuel et le rappel de sauvegarde restent disponibles comme secours.

## Bouton « WhatsApp + image » (1 clic)
- Par défaut (mode « Aperçu image ») : un clic ouvre la conversation du client avec le message de relance suivi de l'adresse de `banniere.jpg`. WhatsApp affiche alors l'image dans une carte d'aperçu. Aucun numéro à saisir.
- **Remplacez `banniere.jpg`** (fichier fourni à titre d'exemple) par votre propre bannière, au même nom, de préférence 1200×630 px et moins de 300 Ko, puis renvoyez le dossier. Si vous changez d'image, WhatsApp peut garder l'ancien aperçu un moment : changez alors le nom du fichier.
- **Testez d'abord sur votre propre numéro.** Si l'aperçu ne s'affiche pas chez vous, passez Paramètres → « Envoi WhatsApp + image » sur « Image jointe » (partage de l'image : le contact se choisit alors dans WhatsApp).

## Listing, relance et suivi (version 1.7.0)
- **Paramètres › « Listing : importation et exportation »** : cette rubrique sert uniquement à importer le fichier Excel (colonnes ABONNE, NOM_CLIENT, PRENOM_CLIENT, **TEL_MOBILE**, NUMDEC, DATE_FIN_ABO…) et à exporter les statuts (CSV). L'import charge une bibliothèque externe : internet nécessaire à ce moment-là.
- **Listing** : simple liste des abonnés importés avec leur statut (Réabonné / Réussie / En attente / Non relancé). Toucher un nom ouvre la rubrique **Relance** (il n'y a plus de fiche de relance propre au listing, ni de recherche dans le listing).
- Les abonnés importés rejoignent **automatiquement** les enregistrements (plus de bouton « Transférer ») : une fiche existante est complétée, jamais écrasée.

### Relance
- Liste de **tous les abonnés** (listing + enregistrements), avec compteurs par statut et filtre.
- **Relance groupée par SMS** : tri par opérateur d'après le préfixe de TEL_MOBILE (MTN : 650-654 et 670-679 ; Orange : 655-659 et 690-699 ; le reste dans « Autres »). Audiences : Tous (à relancer + promo), À relancer, Promo 21 jours. Choisissez la SIM de l'opérateur dans l'application SMS. Après l'envoi, « Oui, consigner » passe automatiquement les abonnés du lot en **En attente**.
- **Statut obligatoire** : après WhatsApp, SMS ou Appel, il faut choisir **Réussie / En attente / Non relancé** et valider avant de quitter la page ou de changer d'abonné. Le statut est valable pour l'échéance en cours.

### Suivi › Auto-check
- Interroge le serveur pour **tous les abonnés enregistrés** (3 requêtes à la fois, pause automatique si le serveur est occupé). Garder l'application ouverte ; « Arrêter » puis « Reprendre » permet de continuer.
- Réabonné = nouvelle date de fin postérieure d'au moins 3 jours. **Appliquer** met à jour la fiche (nouvelle échéance) et passe le statut à « Réabonné ».
- **Rapport journalier** (CSV) : statuts modifiés à la date choisie, avec ancien/nouveau statut, canal et fins d'abonnement avant/après.

## Enregistrement général (version 1.8.0)
- **Bouton « Enregistrer »** (en haut de chaque page, à gauche du bouton de langue) : sauvegarde en un clic les clients, le listing et ses statuts, les relances, les réglages en cours de modification (Paramètres), les zones de saisie (message de relance modifié, filtres, recherches) et la relance en attente de statut. Une confirmation avec l'heure s'affiche. Si Google Drive est connecté, la synchronisation est lancée.
- Les zones de saisie sont aussi **enregistrées automatiquement** pendant la frappe et à la fermeture de l'application : après un rechargement, elles sont restaurées (et une relance en attente de statut revient à l'écran).
- **Paramètres › Sauvegarde générale** : « Enregistrer tout », « Exporter tout » (un seul fichier JSON : clients, activités, relances, listing et statuts, réglages, image, préférences, zones de saisie) et « Importer tout » (fusion : la fiche la plus récente l'emporte).
- Les mots de passe ne sont jamais enregistrés dans les brouillons.

## Relance WhatsApp : image + texte ensemble (version 1.8.1)
- Nouveau mode par défaut « Image + texte ensemble » (Paramètres › Envoi WhatsApp + image) : le bouton WhatsApp ouvre le partage du système avec la bannière et le message en un seul envoi ; on choisit WhatsApp puis le contact.
- **Android** : le message est la légende de l'image. **iPhone** : WhatsApp ignore souvent la légende, donc le message est inscrit sous la bannière dans une seule image (rendu proche d'une capture WhatsApp).
- Sans bannière enregistrée, la bannière hébergée (banniere.jpg) est utilisée. Si le partage est impossible (ordinateur), la conversation s'ouvre avec le texte seul.
- Les autres modes restent disponibles ; si vous aviez choisi un mode à la main, vérifiez la liste dans Paramètres.

## Favoris : rappel et relance automatique (version 2.0.0)
- **Ajouter un favori** : sur l'accueil, section « Favoris » → « + Ajouter » (choix parmi les abonnés enregistrés), ou bouton « ☆ Ajouter aux favoris » sur la fiche (Enregistrement) et sur la page Relance. Les favoris portent une ★ dans la liste de Relance.
- **Programmer un rappel** (bouton « Rappel » d'un favori) : date et heure (raccourcis J-3, J-1 ou jour d'échéance à 9 h), canal **WhatsApp** ou **SMS**, et mode :
  - *Rappel seulement* : à l'heure prévue, un écran « Relance programmée » propose « Relancer maintenant » (ou « Reporter 1 h » / « Passer »).
  - *Relance automatique* : même écran, avec un compte à rebours de 15 s ; à zéro, WhatsApp ou l'application SMS s'ouvre toute seule avec le message de relance prêt. « Reporter » ou « Passer » annule.
- Après le lancement, le statut de relance (Réussie / En attente / Non relancé) reste obligatoire, comme pour toute relance.
- **Limite technique** : une application web ne peut pas envoyer seule un message WhatsApp ou SMS. CLARA ouvre la conversation avec le texte prêt, mais il faut toucher « Envoyer » dans WhatsApp ou SMS. De plus, le rappel se déclenche **application ouverte** (vérification toutes les 20 s et au retour dans l'application) ; application fermée, une notification est envoyée si elle est activée, et l'écran s'affiche à la prochaine ouverture. Un rappel resté sans réponse plus de 2 h demande un appui manuel (pas d'ouverture automatique).
- Favoris et rappels suivent la synchronisation Google Drive et la sauvegarde « Exporter tout ».

## Listing / Manuels, marquer, masquer, nouvelles cartes (version 2.1.0)
- **Deux origines séparées** : chaque abonné est « Listing » (créé par l'importation Excel) ou « Manuel » (enregistré depuis Recherche / Enregistrement). Sur la page **Relance**, les onglets *Tous / Listing / Manuels* les séparent, avec leurs compteurs. Les fiches déjà présentes sont classées automatiquement : « Listing » si l'abonné figure dans le fichier importé, sinon « Manuel ». Un abonné enregistré à la main puis retrouvé dans un listing reste « Manuel ».
- **Marquer** (★) : même étoile que les favoris de l'accueil ; le filtre « ★ Marqués » les isole.
- **Masquer** : l'abonné disparaît des listes, des compteurs, des rappels « à relancer », de la relance groupée SMS et de la vérification automatique. Il n'est pas supprimé : le filtre « Masqués » (Relance) ou le bouton « Masqués » (Listing) permet de le **réafficher**. Masquer un favori retire aussi son rappel programmé ; marquer un masqué le réaffiche.
- **Cartes** (Relance et Listing) : nom, décodeur · formule, localisation, date d'expiration, pastille (« Échu depuis N j » / « N jour(s) restant(s) »), barre d'échéance, origine et statut de relance.
- **Fiche client** (toucher une carte, ou le nom d'un favori) : résumé, puis *Appeler*, *WhatsApp* (prépare le message) et *Message (SMS)* (prépare le SMS), plus *Marquer* et *Masquer*.

## Page Relance simplifiée (version 2.2.0)
La page Relance sert uniquement à relancer l'abonné sélectionné. Elle a deux écrans :
- **Choisir un abonné** (quand aucun abonné n'est sélectionné, ou via « ‹ Abonnés ») : onglets Tous / Listing / Manuels, filtres ★ Marqués / Masqués, compteurs de statut, recherche, liste en cartes, et le bouton « Relance groupée par SMS ». Toucher une carte sélectionne l'abonné.
- **Relance de l'abonné** : carte client (échéance, barre, origine, statut) et numéro de contact ; raccourcis « Fiche client » (marquer / masquer) et « Suivant › » ; le message ; **WhatsApp** en bouton principal, puis SMS, Appeler, Copier ; civilité, offre promo et envoi de l'image seule sont rangés dans « Options du message ».
- **Historique de relance** de l'abonné, en bas de page : chaque relance avec son canal, sa date, l'échéance concernée et son résultat (Réussie / En attente), ainsi que les « non abouties », les réabonnements détectés et les relances programmées. Le résultat n'est enregistré que pour les relances faites à partir de la 2.2 ; les plus anciennes s'affichent sans résultat.

## Plusieurs listings (version 2.3.0)
- **Paramètres › Listings** : « Ajouter un listing » importe un fichier Excel **sans écraser les précédents**. Chaque listing est repéré par son **nom** (nom du fichier, modifiable avec « Renommer ») et son **ID** (colonne « ID Technicien » du fichier ; un identifiant interne est créé s'il manque). Chaque carte indique aussi le technicien, le nombre d'abonnés et la date d'import.
- **Réimporter le même fichier** (même nom, ou même ID et même nom) propose de **remplacer** ce listing : ses données sont mises à jour, aucun abonné n'est supprimé.
- **Exporter** : une carte exporte les statuts de son listing ; « Exporter tous les statuts » exporte l'ensemble. Le CSV garde ses colonnes habituelles et ajoute LISTING et ID_LISTING à la fin.
- **Supprimer** un listing demande un choix : *supprimer le listing et ses abonnés* (seuls ceux importés uniquement par ce listing sont retirés) ou *supprimer le listing et garder les abonnés* (ils restent dans l'application, classés « Manuel »). Les abonnés présents dans un autre listing ou saisis à la main sont toujours conservés.
- **Page Listing** : quand il y a plusieurs listings, des puces (« Tous », puis « nom · ID (nombre) ») filtrent par listing ; en vue « Tous », chaque carte porte le nom de son listing.
- Votre listing actuel est repris automatiquement comme premier listing (nom du fichier + ID Technicien). L'abonné présent dans deux listings n'apparaît qu'une fois.

## Cartes partout et facture ajustée (version 2.4.0)
- **Même modèle de carte** (nom, décodeur · formule, localisation, date d'expiration, pastille d'échéance, barre, origine et statut) dans : **Favoris** (accueil, avec le rappel programmé et les boutons Relancer / Rappel / Retirer dans la carte), **Historique** (à relancer et clients enregistrés), **Suivi abonnés** (avec la date d'enregistrement et la dernière relance), **Listing**, **Relance** et **Recherche**. Dans Recherche, un abonné trouvé sur le serveur mais pas encore enregistré porte la mention « Serveur · non enregistré ».
- **Rubrique Factures** : plus aucune information coupée ni à moitié affichée. Modèle original : la police du nom et prénom, de l'adresse, du forfait et de l'option se réduit automatiquement, puis le texte passe sur deux lignes si besoin. Modèle personnalisé : nom et prénom, adresse, forfait et option occupent toute la largeur de la carte (libellé au-dessus, valeur en dessous), les cartes sont plus hautes et le reste de la facture est décalé en conséquence.

## Version 2.5.0 — Thèmes d'apparence

- Nouveau : Paramètres › Apparence. 8 thèmes : CLARA (défaut), iOS, macOS, Windows 11, Ubuntu, Linux GNOME, Linux KDE, Android.
- Mode : Automatique (suit l'appareil), Clair ou Sombre.
- Le choix est mémorisé sur l'appareil (localStorage : clara_os, clara_mode).
- Les polices Ubuntu / Cantarell / Noto Sans sont chargées depuis Google Fonts (facultatif, sans blocage si hors ligne).
- Le générateur de factures (convertisseur) garde son style d'origine dans tous les thèmes.

## Version 2.6.0 — StarTimes masqué et protégé par un code
- Dans **Factures**, l'onglet **StarTimes** n'apparaît que si **Google Drive est connecté** (Paramètres › Synchronisation). Sans Drive, il est invisible.
- Une fois Drive connecté, l'onglet porte un cadenas : au premier usage, vous **créez un code de 4 à 8 chiffres** ; ensuite il est demandé pour ouvrir StarTimes.
- Le code (stocké sous forme de signature, jamais en clair) est **synchronisé via Google Drive** : le même code sur tous vos appareils.
- Reverrouillage automatique après 10 min d'inactivité, à la fermeture de l'application, à la déconnexion de Drive, ou avec **Factures › Paramètres › « Verrouiller StarTimes maintenant »**. Le code se change au même endroit.
- 5 codes faux de suite = blocage de 60 s.
- Limite : protection côté application (masquage + code), pas un chiffrement.

## Version 2.7.0 — Responsive et thèmes « Design extra »
- Les textes passent à la ligne dans les boutons, onglets et cartes (plus de débordement) ; les zones de texte grandissent avec leur contenu.
- Paramètres › Apparence : 4 nouveaux thèmes (✦) à structure différente : **Verre** (dock flottant à droite), **Brutal** (onglets en bas, bordures épaisses), **Éditorial** (navigation texte en haut, serif), **Néon** (angles coupés, lueur, police machine). Ils gèrent le mode clair/sombre sauf Néon (toujours sombre).

## Version 2.7.1
- Anciens thèmes (iOS, macOS, Windows 11, Ubuntu, GNOME, KDE, Android) supprimés. Restent : CLARA (original) et les 4 thèmes ✦. Un appareil qui avait choisi un ancien thème revient automatiquement à CLARA.

## Version 2.8.0 — Mode simple / avancé
- À la connexion, l'utilisateur choisit **Mode avancé** (toutes les rubriques) ou **Mode simple** : Accueil, Recherche, Relance, Suivi client, Paramètres. Le choix est mémorisé sur l'appareil et modifiable dans Paramètres › Mode d'utilisation.
- En mode simple, les rubriques Enregistrement, Listing, Factures et Historique sont masquées et inaccessibles ; Paramètres masque la partie « Listings ».

## Version 2.8.1
- Le mode simple inclut désormais l'onglet **Enregistrement** : Accueil, Recherche, Enregistrement, Relance, Suivi client, Paramètres. Il permet de modifier le numéro d'un contact (bouton « Modifier le contact ») avant de relancer.

## Version 2.9.0 — Import de la facture CANAL+ CGA (PDF)
- Factures › CANAL+ : deux imports possibles — **facture VEO** (capture d'écran, lecture par OCR) et **facture CGA** (fichier PDF, lecture directe du texte, sans OCR).
- Le PDF CGA remplit : date, nom (sans « Monsieur/Madame »), téléphone (9 chiffres), adresse + commune, n° d'abonné, n° de décodeur, forfait + montant, durée, date de fin. La même facture est ensuite générée comme pour VEO.
- Internet requis pour charger la bibliothèque de lecture PDF (comme pour l'OCR).

## Version 2.9.1
- Correction de l'import CGA (PDF) : erreur « contactTel is null » supprimée.
