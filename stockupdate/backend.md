# Modifications PrestaShop (Backend)

Ce document répertorie les fichiers ajoutés ou modifiés directement dans le dossier racine de PrestaShop pour supporter les fonctionnalités spécifiques (historique de stock, etc.).

## 1. Endpoint Historique des Stocks
- **Fichier** : `stockhistory.php`
- **Emplacement** : `/opt/lampp/htdocs/prestashop/modules/stockupdate/stockhistory.php`
- **Description** : Script PHP indépendant (mais utilisant l'environnement PrestaShop via `config.inc.php`) qui permet de récupérer l'historique des changements de quantité pour un produit donné.

### Détails Techniques
- **Paramètre** : `id_product` (obligatoire).
- **Table interrogée** : `ps_stock_mvt` (via liaison avec `ps_stock_available`).
- **Calcul** : Le script traite les deltas (quantité physique * signe) pour reconstruire l'état du stock "après mouvement" en remontant le temps à partir de la quantité actuelle.
- **Réponse** : JSON contenant la liste des mouvements (date, delta, raison, employé, stock après).

## Usage
Utilisé par le Backoffice (`StockHistoryPage.jsx`) pour afficher l'évolution journalière du stock par produit.