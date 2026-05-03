# IBlog

IBlog est une plateforme web de blogging communautaire construite en PHP avec une interface front riche en JavaScript et CSS. Le projet regroupe une landing page, un espace utilisateur, la publication d'articles, des communautes, des fonctionnalites premium et un panneau d'administration.

## Fonctionnalites principales

- inscription, connexion et gestion de session
- publication et lecture d'articles
- sauvegarde d'articles
- profil utilisateur avec avatar et image de couverture
- communautes, chat et fils de discussion
- fonctionnalites premium
- tableau de bord administrateur
- envoi d'emails SMTP pour certains flux d'authentification

## Stack technique

- PHP natif
- MySQL / MariaDB
- JavaScript cote client
- CSS modulaire par composant
- Leaflet pour la carte des tendances

Le projet n'utilise pas `composer.json` ni `package.json` dans l'etat actuel du depot.

## Structure du projet

```text
iblogLV/
|- index.php                     # point d'entree principal
|- reset-password.php            # reinitialisation du mot de passe
|- app.js                        # logique front principale
|- css/                          # styles globaux
|- js/                           # modules front complementaires
|- public/uploads/               # images uploadees
'- backend/
   |- config/                   # connexion BD + variables d'environnement
   |- controller/               # logique metier / endpoints
   |- model/                    # modeles simples
   |- lib/                      # utilitaires comme le mailer SMTP
   '- view/components/          # composants UI, auth, admin, chat, feed...
```

## Prerequis

- PHP 8.1 ou plus
- MySQL ou MariaDB
- serveur local type XAMPP, WAMP, Laragon ou `php -S`

## Configuration

Le backend lit automatiquement un fichier `.env` a la racine du projet s'il existe.

Exemple minimal :

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=blogdyn
DB_USER=root
DB_PASS=

MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=example@example.com
MAIL_PASSWORD=secret
MAIL_FROM_ADDRESS=no-reply@iblog.local
MAIL_FROM_NAME=IBlog
MAIL_ENCRYPTION=tls
```

## Base de donnees

Par defaut, l'application tente de se connecter a la base `blogdyn`.

Tables principales attendues par le code :

- `users`
- `article`
- `savedarticle`
- `community`
- `communitymember`
- `community_message`
- `subscription`

Certaines tables/colonnes peuvent etre creees ou completees automatiquement par le code si elles n'existent pas encore :

- `user_profile`
- `community_thread`
- `community_thread_message`
- colonnes `bio`, `avatar`, `cover` sur `users`

## Lancer le projet en local

### Option 1 : avec XAMPP / WAMP

1. Placez le projet dans le dossier web de votre environnement local.
2. Creez la base MySQL `blogdyn`.
3. Ajoutez votre fichier `.env` a la racine.
4. Demarrez Apache et MySQL.
5. Ouvrez `index.php` dans le navigateur.

### Option 2 : avec le serveur PHP integre

Depuis la racine du projet :

```bash
php -S localhost:8000
```

Puis ouvrez :

```text
http://localhost:8000/index.php
```

Note : pour les fonctionnalites completes, MySQL doit etre actif et correctement configure.

## Points d'entree utiles

- interface principale : `index.php`
- reinitialisation du mot de passe : `reset-password.php`
- API d'authentification : `backend/view/components/auth/api-auth.php`
- tableau de bord admin : `backend/view/components/admin/admin.php`
- login admin : `backend/view/components/admin/admin-login.php`

## Remarques

- les fichiers uploades sont stockes dans `public/uploads/avatars` et `public/uploads/covers`
- la session utilisateur est geree a la fois cote PHP et cote navigateur
- une partie importante de l'interface est assemblee a partir de composants sous `backend/view/components`

## Etat actuel

Le depot contient la structure applicative et les assets, mais pas de script d'installation automatise de la base ni de suite de tests visible a la racine.
