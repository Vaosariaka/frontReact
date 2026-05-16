# Logique Dashboard

Le tableau de bord permet de visualiser les indicateurs clés de performance (KPI) de la boutique.

## Logique de calcul
- **Périmètre** : Seuls les commandes considérées comme "valides" sont comptabilisées.
- **Condition de validation** : `ps_orders.valid = 1` ET `ps_order_state.logable = 1`.
- **Visibilité WebService** : Nécessite explicitement `id_shop = 1`.
- **Automatisation** : La validation finale d'une commande passe par `order_histories` et par la mise à jour de la commande via `PUT /api/orders/{id}`.
- **Exclusion** : Les paniers (ps_cart), les commandes annulées (#6) et les erreurs de paiement (#8) sont exclus des statistiques.
- **Montants** : Les valeurs de `total_paid` sont traitées comme TTC.

## Données et Tables
- **Table principale** : `ps_orders`
- **Colonnes clés** :
    - `total_paid` : Montant total de la commande (TTC).
    - `current_state` : État actuel de la commande (lié à `ps_order_state`).
    - `date_add` : Date de création de la commande.
    - `valid` : Indicateur de commande validée.

## API Webservice
- **Endpoint** : `GET /api/orders?display=full&limit=1000`
- **Paramètres** : `output_format=XML`
- **Transformation** : Regroupement par jour (`YYYY-MM-DD`) pour les graphiques et tableaux journaliers.

## Fonctionnalités
- **Statistiques journalières** : Nombre de commandes et montant total par jour.
- **Total Général** : Somme cumulée sur toute la période.
- **Panier Moyen** : `Total Montant / Nombre de Commandes`.
- **Détail des commandes** : Les articles affichés dans `OrderDetailPage.jsx` et `MyOrdersPage.jsx` proviennent des `order_rows` XML renvoyés par le webservice.
