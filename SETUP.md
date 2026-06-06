# Guide d'installation — Déclarations HSE

> Durée estimée : 20 à 30 minutes. Aucune compétence technique requise.

---

## Étape 1 — Créer le Google Sheets

1. Ouvrez [Google Sheets](https://sheets.google.com) et créez un nouveau classeur.
2. Renommez-le (ex. : *Déclarations HSE 2025*).
3. Créez **3 onglets** (clic droit sur l'onglet `Feuille 1` → *Renommer*) :
   - `Observations`
   - `Accidents`
   - `Actions`
4. Copiez l'**ID du classeur** depuis l'URL :
   ```
   https://docs.google.com/spreadsheets/d/ ► VOTRE_SHEET_ID ◄ /edit
   ```
   L'ID est la longue chaîne de lettres et chiffres entre `/d/` et `/edit`.

---

## Étape 2 — Déployer le backend Google Apps Script

1. Depuis votre Google Sheets, cliquez sur **Extensions → Apps Script**.
2. Supprimez le code par défaut dans l'éditeur.
3. Collez le contenu du fichier **`Code.gs`** fourni.
4. En haut du script, renseignez vos valeurs :
   ```js
   const SHEET_ID      = 'VOTRE_SHEET_ID_ICI';      // Récupéré à l'étape 1
   const EMAIL_HSE     = 'hse@votreentreprise.com';   // Votre adresse email
   const ENVOYER_EMAIL = true;                        // false = pas d'email
   ```
5. Cliquez sur **Déployer → Nouveau déploiement**.
6. Paramètres du déploiement :
   - **Type** : Application Web
   - **Exécuter en tant que** : Moi (votre adresse Gmail)
   - **Qui a accès** : Tout le monde
7. Cliquez **Déployer**, autorisez les permissions demandées.
8. **Copiez l'URL** qui se termine par `/exec` — vous en aurez besoin à l'étape 3.

> 💡 Pour tester que le backend fonctionne, ouvrez l'URL dans votre navigateur :  
> vous devez voir `{"ok":true,"msg":"HSE backend actif."}`

---

## Étape 3 — Connecter l'application au backend

1. Ouvrez le fichier **`index.html`** dans un éditeur de texte (Notepad, VS Code…).
2. Repérez la ligne (vers le début du `<script>`) :
   ```js
   const ENDPOINT = '';
   ```
3. Remplacez par votre URL :
   ```js
   const ENDPOINT = 'https://script.google.com/macros/s/VOTRE_ID/exec';
   ```
4. Sauvegardez le fichier.

---

## Étape 4 — Héberger l'application

### Option A — Netlify Drop (recommandé, gratuit, 2 minutes)

1. Ouvrez [drop.netlify.com](https://app.netlify.com/drop).
2. Glissez-déposez votre dossier contenant les 7 fichiers (`index.html`, `manifest.json`, `sw.js`, `icon-192.png`, `icon-512.png`, `Code.gs`, `SETUP.md`).
3. Netlify génère une URL publique (ex. : `https://amazing-hse-123.netlify.app`).

### Option B — GitHub Pages

1. Créez un dépôt public sur GitHub.
2. Importez les fichiers via l'interface.
3. Activez **Settings → Pages → Deploy from branch → main → / (root)**.

> ⚠️ **Icônes PNG** : avant d'héberger, ouvrez `generate-icons.html` dans votre navigateur et téléchargez `icon-192.png` et `icon-512.png` dans votre dossier.

---

## Étape 5 — Installer sur l'écran d'accueil mobile

### Android (Chrome)
1. Ouvrez l'URL de votre application dans Chrome.
2. Menu (⋮) → **Ajouter à l'écran d'accueil** → Ajouter.

### iPhone / iPad (Safari)
1. Ouvrez l'URL dans Safari.
2. Appuyez sur le bouton de partage (⬆) → **Sur l'écran d'accueil** → Ajouter.

L'application s'ouvre désormais en plein écran, comme une app native.

---

## Personnalisation

### Numéros d'urgence
Dans `index.html`, modifiez l'objet `URGENCES` :
```js
const URGENCES = [
  { label: 'SAMU',             tel: '15' },
  { label: 'Responsable HSE',  tel: '+33612345678' },
  // ...
];
```

### Listes déroulantes
Modifiez l'objet `C` dans `index.html` :
```js
const C = {
  zone: ['Atelier A', 'Atelier B', 'Zone logistique', ...],
  site: ['Usine Paris', 'Dépôt Lyon', ...],
  // ...
};
```

### Activer/Désactiver les emails
Dans `Code.gs`, changez :
```js
const ENVOYER_EMAIL = false; // désactive toutes les alertes email
```

### Politique HSE
Dans `index.html`, cherchez le commentaire `<!-- Politique HSE -->` dans la modale et remplacez le texte par votre politique interne.

---

## Sécurité et confidentialité

> ⚠️ **Points d'attention importants**

- **Lien ouvert** : le backend Apps Script est accessible à quiconque possède l'URL. Ne la partagez qu'en interne. Vous pouvez ajouter un mot de passe simple (token secret dans chaque requête) si nécessaire.
- **Données nominatives** : les noms des blessés et les descriptions sont stockés dans Google Sheets, soumis au RGPD. Limitez l'accès au classeur aux personnes habilitées (Partage → Restreindre).
- **Photos** : les photos sont transmises par email et mentionnées dans le Sheet mais non stockées en base64 dans les cellules. Elles transitent par Gmail, soumis à la politique de confidentialité Google.
- **Sauvegardes** : activez l'historique des versions Google Sheets (Fichier → Historique des versions).

---

## Dépannage

| Problème | Solution |
|---|---|
| L'envoi échoue avec "Serveur inaccessible" | Vérifiez l'URL `ENDPOINT` et le déploiement Apps Script. Redéployez si nécessaire. |
| Pas d'email reçu | Vérifiez `ENVOYER_EMAIL = true` et que `EMAIL_HSE` est correct. Vérifiez vos spams. |
| La PWA ne s'installe pas | Assurez-vous que le site est servi en **HTTPS** (requis pour les PWA). |
| Onglets non créés dans Sheets | Le script crée les onglets automatiquement au premier envoi. Vérifiez le `SHEET_ID`. |

---

## Évolution prévue

Un **tableau de bord KPI** sera ajouté ultérieurement (taux de fréquence TF, taux de gravité TG, répartitions par zone/catégorie, suivi de clôture des actions correctives). Il s'appuiera sur le même Google Sheets et pourra être visualisé via **Looker Studio** ou une page intégrée à l'application. Les colonnes ont été conçues pour permettre ce reporting.
