# Réinitialisation des Données

Documentation de la fonction de reset globale utilisée avant un nouvel import.

## Logique
- Le reset est orchestré par `src/services/resetService.js`.
- L'API Webservice est interrogée en XML avec `display=full` et `output_format=XML`.
- Les suppressions sont faites dans un ordre qui évite de casser les dépendances entre tables.

## Ordre de suppression
1. `orders`
2. `carts`
3. `combinations`
4. `products`
5. `product_option_values`
6. `categories`
7. `addresses`
8. `customers`
9. `tax_rule_groups`
10. `tax_rules`
11. `taxes`

## Protections
- `ps_category` : les IDs `1` (Root) et `2` (Home) sont protégés.
- `ps_tax_rule_group` : l'ID `1` (Sans taxe) est protégé.

## Tables concernées
- Commandes et paniers : `ps_orders`, `ps_order_history`, `ps_carts`
- Catalogue : `ps_products`, `ps_combinations`, `ps_product_option_value`
- Référentiel : `ps_categories`, `ps_addresses`, `ps_customers`
- Taxes : `ps_tax_rule_group`, `ps_tax_rules`, `ps_tax`

## Vérification
- Le reset retourne un résumé de suppression par type d'objet.
- Le but est de repartir sur une base propre avant réimport, sans supprimer les données système minimales.
