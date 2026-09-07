# Mettre le site en ligne chez Infomaniak

Le site est un ensemble de fichiers HTML, CSS et JavaScript : il n'y a
rien à compiler, rien à installer. On copie le dossier sur le serveur,
et c'est en ligne.

Tout le contenu (films, séances, tarifs, textes) vient de Sanity et se
modifie depuis le Studio, sans jamais toucher au site.

---

## 1. Autoriser le domaine dans Sanity — **à faire en premier**

C'est **l'**étape qui fait échouer une mise en ligne. Le site va
chercher son contenu chez Sanity depuis le navigateur du visiteur, et
Sanity refuse toute adresse qu'on ne lui a pas présentée. Tant que ce
n'est pas fait, le site s'affiche mais **toutes les pages sont vides**,
avec le message « Le contenu du site n'a pas pu être chargé ».

1. Aller sur <https://www.sanity.io/manage> → projet **`vle63mzm`**
2. **API → CORS origins → Add CORS origin**
3. Ajouter, une par une (laisser « Allow credentials » **décoché**) :

   - `https://www.zinema.ch`
   - `https://zinema.ch`
   - l'adresse de test d'Infomaniak, s'il y en a une pendant la
     bascule (du type `https://xxxxx.preview.infomaniak.website`)

L'adresse GitHub Pages (`https://mouknardine.github.io`) doit rester
autorisée tant que cette version-là est en ligne.

> Même chose en ligne de commande, si on préfère :
> `npx sanity cors add https://www.zinema.ch`

## 2. Charger le contenu du cinéma

Une commande verse les films du programme avec leurs affiches, les
tarifs, les coordonnées et les textes des pages dans le Studio, et
retire de l'affiche les films qui n'y sont plus :

```sh
npx sanity exec sanity/import/mettre-a-jour.mjs --with-user-token
```

Voir [sanity/import/LISEZ-MOI.md](sanity/import/LISEZ-MOI.md). À faire
une fois ; ensuite tout se saisit normalement dans le Studio.

## 3. Publier le site

### La méthode recommandée : GitHub envoie tout seul chez Infomaniak

À régler une seule fois, ensuite chaque modification part toute seule.

1. Dans le Manager Infomaniak : **Hébergement → FTP/SSH**. Créer (ou
   reprendre) un compte FTP et noter le serveur, l'identifiant et le
   mot de passe.
2. Dans GitHub : **Settings → Secrets and variables → Actions → New
   repository secret**, et créer les trois secrets :

   | Nom du secret               | Valeur                    |
   | --------------------------- | ------------------------- |
   | `INFOMANIAK_FTP_SERVEUR`    | ex. `ftp.zinema.ch`       |
   | `INFOMANIAK_FTP_UTILISATEUR`| l'identifiant FTP         |
   | `INFOMANIAK_FTP_MOTDEPASSE` | le mot de passe FTP       |

3. Vérifier une seule chose : le compte FTP ouvre-t-il à la racine du
   site (on y voit un dossier `web/`) ou directement dans `web/` ?
   - à la racine → ne rien changer ;
   - directement dans `web/` → dans
     [.github/workflows/deploy-infomaniak.yml](.github/workflows/deploy-infomaniak.yml),
     remplacer `server-dir: web/` par `server-dir: ./`.
4. Lancer une première fois à la main : onglet **Actions → Déploiement
   Infomaniak → Run workflow**. Ensuite, chaque envoi sur la branche
   principale publie tout seul.

Le dossier `api/` (la billetterie) part avec le reste : contrairement à
GitHub Pages, Infomaniak sait exécuter PHP.

### L'alternative : à la main, par FTP

Ouvrir le dépôt dans un logiciel FTP (FileZilla, Cyberduck) et déposer
dans `web/` **uniquement** :

```
index.html  404.html  robots.txt  sitemap.xml  .htaccess
films/  film/  agenda/  evenements/  histoire/  membership/  contact/  billet/
assets/  api/
```

Ne **jamais** y déposer : `sanity/`, `serveur/`, `node_modules/`,
`.github/`, `package.json`, `package-lock.json`, `tsconfig.json`,
`sanity.config.ts`, `sanity.cli.ts`, ni les fichiers `.md`. Ils ne
servent qu'au travail, et le `.htaccess` les bloque déjà par sécurité.

> Si le Manager Infomaniak propose un déploiement Git sur cette
> formule, il fait le même travail : brancher le dépôt et la branche
> principale. La marche à suivre ci-dessus fonctionne dans tous les
> cas, quelle que soit la formule.

## 4. Régler PHP — seulement si la billetterie doit fonctionner

Le dossier `api/` demande **PHP 8.1 au minimum** (Manager Infomaniak →
Hébergement → PHP). Les pages du site, elles, n'ont besoin de rien.

Tant que la billetterie n'est pas branchée, elle reste éteinte
(`BILLETTERIE_EN_LIGNE = false` dans `assets/js/data.js`) et les boutons
d'achat renvoient au lien de paiement collé dans le Studio. Voir
[BILLETTERIE.md](BILLETTERIE.md). Sans le fichier `config.php`, le site
public fonctionne normalement — seule la caisse en ligne répond qu'elle
n'est pas configurée.

## 5. Vérifier, une fois en ligne

- [ ] La page d'accueil affiche le mur d'affiches (donc Sanity répond).
- [ ] `https://zinema.ch` renvoie bien vers `https://www.zinema.ch`.
- [ ] `http://` renvoie vers `https://`.
- [ ] Une adresse inventée (`/nimporte-quoi`) tombe sur la page 404 du site.
- [ ] Sur téléphone, les affiches ont toutes la même taille.
- [ ] `https://www.zinema.ch/robots.txt` et `/sitemap.xml` s'affichent.
- [ ] Coller l'adresse dans WhatsApp : le nom et la description apparaissent.
- [ ] Une modification publiée dans le Studio apparaît sur le site après
      un rafraîchissement — sans redéployer.

## Si le cinéma change de domaine

Trois endroits, et rien d'autre : les balises `og:` et `canonical` en
tête des fichiers HTML, `robots.txt`, `sitemap.xml`. Plus l'adresse à
autoriser dans Sanity (étape 1) et, si la billetterie tourne, la clé
`site.url` de `config.php`.
