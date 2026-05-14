# Etapes d'import PrestaShop

Ce dossier contient 3 fichiers CSV de donnees et 1 zip pour les images.

Fichiers :
- import-data-mai-26 - fichier1.csv
- import-data-mai-26 - fichier2.csv
- import-data-mai-26 - fichier3.csv
- images.zip

## Ordre d'import

1. Categories
2. Produits
3. Declinaisons et stock
4. Images
5. Clients et adresses
6. Commandes et lignes de commande

## 1) fichier1.csv

Colonnes : date_availability_produit, nom, reference, prix_ttc, Taxe, categorie, prix_achat

| Colonne CSV | Table cible | Colonne cible | A faire |
|---|---|---|---|
| date_availability_produit | ps_product | available_date | Date de disponibilite produit |
| nom | ps_product_lang | name | Nom du produit |
| reference | ps_product | reference | Reference produit |
| prix_ttc | ps_product | price | Prix produit, a convertir si besoin |
| Taxe | ps_tax_rules_group / ps_tax | groupe de taxe | Associer le taux de taxe au produit ou creer taxe si nexiste pas  |
| categorie | ps_category_lang puis ps_category_product | name puis liaison | voir si il existe sinon Creer la categorie puis lier le produit |
| prix_achat | ps_product | wholesale_price | Prix d achat |

## 2) fichier2.csv

Colonnes : reference, specificite, karazany, stock_initial, prix_vente_ttc

| Colonne CSV | Table cible | Colonne cible | A faire |
|---|---|---|---|
| reference | ps_product / ps_product_attribute | reference | Retrouver le produit parent |
| specificite | ps_attribute_group puis ps_attribute_group_lang | name | Creer le groupe d attributs |
| karazany | ps_attribute puis ps_attribute_lang | name | Creer la valeur d attribut |
| stock_initial | ps_stock_available | quantity | Stock produit ou declinaison |
| prix_vente_ttc | ps_product_attribute | price | Impact de prix de la declinaison |

## 3) fichier3.csv

Colonnes : date, nom, email, pwd, adresse, achat, etat

| Colonne CSV | Table cible | Colonne cible | A faire |
|---|---|---|---|
| date | ps_customer / ps_orders | date_add | Date de creation |
| nom | ps_customer | firstname / lastname | Separé en prenom et nom si possible |
| email | ps_customer | email | Email client |
| pwd | ps_customer | passwd | Mot de passe a hacher |
| adresse | ps_address | address1 | Adresse client |
| achat | ps_orders / ps_order_detail | product_id, product_attribute_id, product_quantity | Parser la liste des achats |
| etat | ps_order_state / ps_order_state_lang | name | Statut de commande |

## Images a associer

Contenu de images.zip :
- T_01.png
- P_01.png
- C_03.png
- M_02.jpeg

Correspondance :

| Fichier image | Reference produit | Table cible |
|---|---|---|
| T_01.png | T_01 | ps_image |
| P_01.png | P_01 | ps_image |
| C_03.png | C_03 | ps_image |
| M_02.jpeg | M_02 | ps_image |

## Regle simple

- Le nom du fichier image doit correspondre a la reference du produit.
- Il faut creer le produit avant d ajouter l image.
- Les declinaisons doivent etre crees avant le stock.
- Les commandes doivent etre creees apres les clients et les adresses.
