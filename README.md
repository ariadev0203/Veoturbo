# CLARA 5.0 (indépendante) + Veo Pro

## Contenu du dépôt (à la racine)
netlify.toml, package.json, netlify/functions/ (clara-auth.js, cga.js, veo.js), public/ (CLARA).

## Mise en ligne
Netlify : Import from Git, aucun réglage. Netlify installe tout seul la dépendance @netlify/blobs (package.json).
Variables facultatives (Netlify > Site configuration > Environment variables) :
- CLARA_INVITE : code d'invitation obligatoire pour créer un compte (recommandé : sinon tout le monde peut s'inscrire).
- CLARA_SECRET : phrase secrète pour signer les sessions et chiffrer les clés Google Authenticator (sinon une clé est générée et conservée automatiquement).

## Comptes
Inscription : e-mail + mot de passe + Google Authenticator (clé / lien / QR code), puis 8 codes de secours.
Connexion : e-mail + mot de passe + code à 6 chiffres (ou un code de secours). Verrouillage 15 min après 5 échecs.
Le premier compte créé est administrateur. Aucun mot de passe Veo ni moteur n'est conservé sur le serveur.

## Connexions (première connexion, puis Paramètres > Connexions)
- Veo Pro : réabonnement, factures, commissions, retrait.
- Moteur de recherche et réactivation, interchangeable : VisionsCanal ou CGA Canal (MyPOS).
Les identifiants restent enregistrés sur l'appareil. Si un moteur tombe, CLARA continue de fonctionner (données enregistrées, Veo) et on bascule sur l'autre.

## Ajouter un autre moteur
Dans public/index.html, objet ENGINES : ajouter une entrée { hint, find(field, valeur), react(path, body), test({id, pw}) } puis un bouton dans la page « Connexions ».
