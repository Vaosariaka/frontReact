# Gestion des Commandes

Documentation sur le flux et la gestion des commandes dans le backoffice.

## Logique de Flux
- Les commandes sont importées ou créées via le workflow d'achat du FrontOffice.
- L'état de la commande est piloté par l'API `order_histories` pour assurer la persistance et le déclenchement des hooks PrestaShop.
- Le front affiche les totaux TTC. PrestaShop stocke les montants de commande dans `total_paid`, `total_paid_tax_incl` et `total_paid_tax_excl`.
- Les articles de commande sont lus depuis `associations.order_rows.order_row` dans les réponses XML du webservice.

## Données et Tables
- **Tables** : `ps_orders`, `ps_order_state`, `ps_order_history`.
- **Table associée** : `ps_order_detail` côté cœur PrestaShop, exposée ici via `order_rows`.
- **Mapping des états (Evalué)** :
    - `2` : Paiement accepté (Paiement accepté)
    - `13` : En attente de paiement à la livraison (En attente paiement à la livraison)
    - `8` : Erreur de paiement (Erreur de paiement)
    - `6` : Annulé (Annulé)

## API Webservice
- **Lecture** : `GET /api/orders?display=full`
- **Mise à jour** : `PUT /api/orders/{id}` (requiert l'envoi de tous les champs obligatoires).
- **Changement d'état** : `POST /api/order_histories`
    - Corps XML : `<order_history><id_order>ID</id_order><id_order_state>STATE_ID</id_order_state></order_history>`

## Fonctionnalités
- **Liste des commandes** : Affichage complet avec ID, Client, Total, Date et État.
- **Changement d'état dynamique** : Menu déroulant permettant de passer d'un état à un autre. Le système gère automatiquement la mise à jour des champs `valid`, `id_shop` et `total_paid_real`.
- **Synchronisation** : Toute modification dans le backoffice PrestaShop est immédiatement répercutée via l'API.
- **Impact stock** : Lorsqu'une commande passe dans un état logable ou expédié, PrestaShop met à jour le stock natif via ses hooks et sa logique core. Selon le flux, cela peut diminuer `ps_stock_available.quantity` et parfois générer un mouvement dans `ps_stock_mvt`.
