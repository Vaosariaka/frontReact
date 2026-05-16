# Gestion des Stocks

Documentation sur le suivi et la mise à jour des stocks produits.

## Logique de Stock
- Le stock visible dans l'application est construit à partir de `ps_stock_available`.
- Pour les produits simples, `id_product_attribute = 0`.
- Pour les produits avec déclinaisons, le stock est lié à l'identifiant de la combinaison (`id_product_attribute`).
- L'interface affiche un `stock initial` et un `stock actuel`.
- Le `stock initial` est reconstitué à partir du stock courant plus les quantités vendues validées.
- Les prix affichés côté UI sont calculés en TTC à partir du HT stocké par PrestaShop et du groupe de taxe du produit.

## Données et Tables
- **Table** : `ps_stock_available`
- **Colonnes clés** :
    - `quantity` : Quantité disponible courante.
    - `physical_quantity` : Quantité physique totale quand la synchro de stock est utilisée.
    - `reserved_quantity` : Quantité réservée par les commandes non encore finalisées.
    - `id_product` : Identifiant du produit parent.
    - `id_product_attribute` : Identifiant de la déclinaison (0 si aucune).
    - `depends_on_stock` : Gestion de stock avancée (désactivé par défaut).
    - `out_of_stock` : Autorisation de commande hors stock.
- **Table** : `ps_stock_mvt`
- **Colonnes clés** :
    - `id_stock` : Référence vers `ps_stock_available.id_stock_available`.
    - `sign` : `1` pour une entrée, `-1` pour une sortie.
    - `physical_quantity` : Quantité du mouvement.
    - `date_add` : Date du mouvement.
    - `id_stock_mvt_reason` : Raison du mouvement.
    - `employee_firstname` / `employee_lastname` : Employé associé au mouvement.

## API Webservice
- **Lecture** : `GET /api/stock_availables?filter[id_product]=ID`
- **Mise à jour** : `PUT /api/stock_availables/{id}`
    - Note : PrestaShop exige souvent l'envoi des champs `id_shop` et `id_shop_group`.
- **Mouvements stock** :
    - `GET /prestashop/modules/stockupdate/stockhistory.php?id_product=X`
    - `GET /prestashop/modules/stockupdate/stockupdate.php?id_product=X&delta=Y`

## Fonctionnalités
- **Affichage sur fiche produit** : Consultation directe de la disponibilité en FrontOffice.
- **Catalogue BackOffice** : Affiche `stock initial`, `stock actuel` et le prix TTC.
- **Update Quantity** : Possibilité de modifier le stock via le Backoffice.
- **Évolution journalière** : Page dédiée (`StockHistoryPage.jsx`) qui lit les mouvements de `ps_stock_mvt` via le module `stockupdate`.
- **Après achat** : PrestaShop diminue le stock natif lors de la validation de commande, mais un enregistrement dans `ps_stock_mvt` n'est pas systématique pour chaque achat. Les mouvements affichés ici couvrent surtout les mises à jour manuelles et certains flux natifs de stock.
