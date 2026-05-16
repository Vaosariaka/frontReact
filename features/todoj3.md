# Jour 3 — Backoffice : Documentation technique

## 3a. Vérification des erreurs dans l'import CSV

### Fonctionnalités implémentées

| Validation | Statut | Fichier | Fonction |
|---|---|---|---|
| Nom de colonne non conforme | ✅ | `src/utils/csvParser.js` | `validateColumns(rows, requiredColumns)` |
| Format date ≠ DD/MM/YYYY | ✅ | `src/utils/csvParser.js` | `parseDateFR(str)` |
| Montant positif (prix > 0) | ✅ | `src/services/importService.js` | dans `importProductCSVRows()` |

### Logique

- **Colonnes** : `validateColumns` compare les clés du premier objet CSV avec la liste `REQUIRED_COLUMNS`. Si des colonnes manquent, l'import est refusé.
- **Date** : `parseDateFR` convertit DD/MM/YYYY → YYYY-MM-DD. Si le format ne correspond pas, renvoie `"0000-00-00"`.
- **Montant positif** : Avant chaque création de produit, on vérifie que `price > 0` et `wholesale_price >= 0`. Si invalide, la ligne est rejetée.

### API PrestaShop utilisée
- `POST /api/products` — création de produit via XML

---

## 3b. Page d'ajout en stock des produits

### Page
- **Fichier** : `src/pages/backoffice/StockManagementPage.jsx`
- **Route** : `/back/stock`

### Fonctionnalité
- Affiche un tableau de tous les produits avec leur stock actuel
- Champ `delta` pour saisir une quantité à ajouter (+) ou retirer (-)
- Bouton "Appliquer" → endpoint PHP custom

### Tables PrestaShop utilisées

| Table | Rôle |
|---|---|
| `ps_stock_available` | Stock réel par produit (quantity, id_product, id_product_attribute) |
| `ps_stock_mvt` | Historique de tous les mouvements de stock |
| `ps_stock_mvt_reason` | Raisons des mouvements (id=1 augmentation, id=2 diminution) |

### Colonnes clés — `ps_stock_available`

| Colonne | Type | Description |
|---|---|---|
| `id_stock_available` | INT PK | Identifiant unique |
| `id_product` | INT | ID du produit |
| `id_product_attribute` | INT | 0 = produit principal |
| `quantity` | INT | Quantité en stock |

### Colonnes clés — `ps_stock_mvt`

| Colonne | Type | Description |
|---|---|---|
| `id_stock_mvt` | BIGINT PK | Identifiant unique |
| `id_stock` | INT | Référence vers `ps_stock_available.id_stock_available` |
| `id_stock_mvt_reason` | INT | 1=augmentation, 2=diminution |
| `physical_quantity` | INT | Quantité absolue du mouvement |
| `sign` | SMALLINT | +1 ou -1 |
| `employee_lastname` | VARCHAR | Nom de l'employé |
| `employee_firstname` | VARCHAR | Prénom de l'employé |
| `date_add` | DATETIME | Date du mouvement |

### Endpoint PHP — `stockupdate.php`
- **Chemin** : `/prestashop/modules/stockupdate/stockupdate.php`
- **Paramètres** : `id_product` (INT), `delta` (INT positif ou négatif)
- **Action** :
  1. `StockAvailable::updateQuantity($idProduct, 0, $delta)` → met à jour `ps_stock_available`
  2. INSERT dans `ps_stock_mvt` avec sign=+1/-1 et physical_quantity=|delta|

---

## 3c. Tableau d'évolution du stock journalier

### Page
- **Fichier** : `src/pages/backoffice/StockHistoryPage.jsx`
- **Route** : `/back/stock-history`

### Fonctionnalité
- Sélecteur de produit (dropdown)
- Tableau trié par date décroissante : Date, Delta, Stock après, Raison, Employé
- Couleur verte pour delta positif, rouge pour négatif

### Endpoint PHP — `stockhistory.php`
- **Chemin** : `/prestashop/modules/stockupdate/stockhistory.php`
- **Paramètre** : `id_product` (INT)
- **Logique** :
  1. Récupère `id_stock_available` depuis `ps_stock_available` (WHERE id_product=X AND id_product_attribute=0)
  2. SELECT depuis `ps_stock_mvt` WHERE id_stock = id_stock_available
  3. JOIN `ps_stock_mvt_reason_lang` pour le libellé de la raison
  4. Calcule `stock_after` en partant du stock actuel et remontant dans le temps

---

## Résumé des fichiers créés / modifiés

| Fichier | Action | Description |
|---|---|---|
| `src/services/importService.js` | MODIFIÉ | Ajout validation montant positif |
| `src/pages/backoffice/StockManagementPage.jsx` | NOUVEAU | Page gestion de stock |
| `src/pages/backoffice/StockHistoryPage.jsx` | NOUVEAU | Tableau évolution stock |
| `src/router.jsx` | MODIFIÉ | Routes `/back/stock` et `/back/stock-history` |
| `vite.config.js` | MODIFIÉ | Proxy `/prestashop/modules` |
| `prestashop/modules/stockupdate/stockupdate.php` | NOUVEAU | Endpoint PHP `StockAvailable::updateQuantity` + INSERT `ps_stock_mvt` |
| `prestashop/modules/stockupdate/stockhistory.php` | NOUVEAU | Endpoint PHP lecture `ps_stock_mvt` |
