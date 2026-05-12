# Resume - Import PrestaShop (CSV)

## API login backoffice

- Point d'entree backoffice: `/prestashop/admin749mjbpvcgrvnjps5iq/index.php`.
- Si non connecte, redirection vers: `/prestashop/admin749mjbpvcgrvnjps5iq/index.php?controller=AdminLogin&redirect=...`.
- Login backoffice = formulaire HTML (pas webservice):
  - URL: `/prestashop/admin749mjbpvcgrvnjps5iq/index.php?controller=AdminLogin`
  - Methode: `POST`
  - Champs: `email`, `passwd`, `submitLogin=1` (optionnel: `redirect`).
- Si PS Accounts actif, il existe aussi un ecran OAuth: `/prestashop/modules/ps_accounts/login` (route module).

Sources: admin init et controller login.

## Taxes (colonnes CSV `Taxe`)

Tables impliquees (schemas):
- `ps_tax` (taux)
- `ps_tax_lang` (nom)
- `ps_tax_rules_group` (groupe)
- `ps_tax_rules_group_shop` (liaison boutique)
- `ps_tax_rule` (regle: pays, taxe, groupe)

Etapes (ordre recommande):
1. Creer le taux dans `ps_tax`:
	- `rate` = 11.650 ou 5.600 (pas en %)
	- `active` = 1, `deleted` = 0
2. Creer le libelle dans `ps_tax_lang`:
	- `id_tax`, `id_lang`, `name` (ex: "TVA 11.65%")
3. Creer le groupe dans `ps_tax_rules_group`:
	- `name` (ex: "MG 11.65%"), `active`=1, `deleted`=0, `date_add`, `date_upd`
4. Lier le groupe a la boutique dans `ps_tax_rules_group_shop`:
	- `id_tax_rules_group`, `id_shop`
5. Creer la regle dans `ps_tax_rule`:
	- `id_tax_rules_group`, `id_country`, `id_state` (souvent 0 ou pays seul),
	  `zipcode_from`, `zipcode_to` (valeurs vides si non utilise),
	  `id_tax`, `behavior` (0 par defaut), `description`.
6. Affecter le produit: `ps_product.id_tax_rules_group`.

Note: l'erreur `ps_taxe` vient du nom de table. Le bon nom est `ps_tax`.

## CSV 1 (produits + categories)

Colonnes: `date_availability_produit, nom, reference, prix_ttc, Taxe, categorie, prix_achat`

Etapes:
1. Categorie (si inexistante):
	- `ps_category`: `id_parent`, `active=1`, `date_add`, `date_upd`
	- `ps_category_lang`: `id_category`, `id_lang`, `name`, `link_rewrite`
2. Produit:
	- `ps_product`: `available_date` (YYYY-MM-DD), `reference`, `price` (HT),
	  `wholesale_price`, `id_tax_rules_group`, `id_category_default`, `active=1`
	- `ps_product_lang`: `id_product`, `id_lang`, `name`, `link_rewrite`
3. Liaison categorie-produit:
	- `ps_category_product`: `id_category`, `id_product`, `position`

Conversion prix: `prix_ttc` -> `price` HT = TTC / (1 + taux).

## CSV 2 (declinaisons + stock)

Colonnes: `reference, specificite, karazany, stock_initial, prix_vente_ttc`

Etapes:
1. Retrouver le produit par `reference` (ps_product.reference).
2. Groupe attribut:
	- `ps_attribute_group` (`group_type`, `position`, `is_color_group`)
	- `ps_attribute_group_lang` (`name`, `public_name`)
	- `ps_attribute_group_shop` (`id_attribute_group`, `id_shop`)
3. Valeur attribut:
	- `ps_attribute` (`id_attribute_group`, `position`)
	- `ps_attribute_lang` (`name`)
	- `ps_attribute_shop` (`id_attribute`, `id_shop`)
4. Declinaison:
	- `ps_product_attribute` (`id_product`, `reference`, `price`, `available_date`)
	- `ps_product_attribute_shop` (`id_product`, `id_product_attribute`, `id_shop`, `price`)
	- `ps_product_attribute_combination` (`id_product_attribute`, `id_attribute`)
5. Stock:
	- `ps_stock_available` (`id_product`, `id_product_attribute`, `id_shop`, `id_shop_group`, `quantity`)

Conversion prix declinaison: `prix_vente_ttc` -> impact HT.

## CSV 3 (clients + commandes)

Colonnes: `date, nom, email, pwd, adresse, achat, etat`

Etapes:
1. Client:
	- `ps_customer`: `firstname`, `lastname`, `email`, `passwd` (hash), `date_add`
2. Adresse:
	- `ps_address`: `id_customer`, `address1`, `postcode`, `city`, `id_country`, `alias`, `date_add`
3. Commande:
	- `ps_orders`: `id_customer`, `id_address_delivery`, `id_address_invoice`, `id_currency`,
	  `id_carrier`, `id_lang`, `current_state`, `payment`, `module`, `date_add`
4. Ligne de commande:
	- `ps_order_detail`: `id_order`, `product_id`, `product_attribute_id`, `product_quantity`, `product_price`
5. Statut:
	- `ps_order_state` + `ps_order_state_lang` (si statut inexistant)

## Images

Etapes:
1. Retrouver le produit par `reference`.
2. Creer `ps_image` (`id_product`, `position`, `cover`).
3. Lier `ps_image_shop` (`id_image`, `id_product`, `id_shop`, `cover`).
4. Utiliser l'API Webservice images pour uploader le fichier.

Ordre recommande: categories -> produits -> declinaisons -> stock -> images -> clients/adresses -> commandes.

## Details tables/colonnes (scope import)

### Taxes

**ps_tax**
- `id_tax`: identifiant du taux.
- `rate`: taux en pourcentage (ex: 11.650).
- `active`: 1 = actif.
- `deleted`: 1 = supprime (soft delete).

**ps_tax_lang**
- `id_tax`: lien vers le taux.
- `id_lang`: langue du libelle.
- `name`: nom affiche du taux (ex: "TVA 11.65%").

**ps_tax_rules_group**
- `id_tax_rules_group`: identifiant du groupe.
- `name`: nom du groupe (ex: "MG 11.65%"), visible en backoffice.
- `active`: 1 = actif.
- `deleted`: 1 = supprime (soft delete).
- `date_add`: creation.
- `date_upd`: mise a jour.

**ps_tax_rules_group_shop**
- `id_tax_rules_group`: groupe.
- `id_shop`: boutique.

**ps_tax_rule**
- `id_tax_rule`: identifiant de la regle.
- `id_tax_rules_group`: groupe cible.
- `id_country`: pays de la regle.
- `id_state`: etat/region (0 si non utilise).
- `zipcode_from`, `zipcode_to`: plage code postal (vide si non utilise).
- `id_tax`: taux applique.
- `behavior`: comportement (0 par defaut).
- `description`: description libre.

### Categories

**ps_category**
- `id_category`: identifiant categorie.
- `id_parent`: categorie parente.
- `id_shop_default`: boutique par defaut.
- `level_depth`: niveau dans l'arbre.
- `nleft`, `nright`: champs de l'arbre imbrique (calcul interne).
- `active`: 1 = active.
- `date_add`, `date_upd`: dates.
- `position`: position dans la liste.
- `is_root_category`: 1 si categorie racine.

**ps_category_lang**
- `id_category`: categorie.
- `id_shop`: boutique.
- `id_lang`: langue.
- `name`: nom.
- `description`: description complete.
- `additional_description`: description additionnelle.
- `link_rewrite`: slug URL.
- `meta_title`, `meta_keywords`, `meta_description`: SEO.

**ps_category_product**
- `id_category`: categorie.
- `id_product`: produit.
- `position`: ordre d'affichage dans la categorie.

### Produits

**ps_product**
- `id_product`: identifiant produit.
- `id_supplier`: fournisseur (optionnel).
- `id_manufacturer`: marque (optionnel).
- `id_category_default`: categorie par defaut.
- `id_shop_default`: boutique par defaut.
- `id_tax_rules_group`: groupe de taxe.
- `on_sale`: 1 si promo.
- `online_only`: 1 si vente en ligne uniquement.
- `ean13`, `isbn`, `upc`, `mpn`: codes produit.
- `ecotax`: ecotaxe.
- `quantity`: stock global (peut rester a 0 si stock gere via `ps_stock_available`).
- `minimal_quantity`: quantite minimale.
- `low_stock_threshold`, `low_stock_alert`: alerte stock bas.
- `price`: prix HT.
- `wholesale_price`: prix d'achat HT.
- `unity`, `unit_price`, `unit_price_ratio`: prix a l'unite.
- `additional_shipping_cost`: surcout livraison.
- `reference`: reference produit.
- `supplier_reference`: reference fournisseur.

**ps_product_lang**
- `id_product`: produit.
- `id_shop`: boutique.
- `id_lang`: langue.
- `description`, `description_short`: contenu.
- `link_rewrite`: slug URL.
- `meta_description`, `meta_keywords`, `meta_title`: SEO.
- `name`: nom.
- `available_now`, `available_later`, `delivery_in_stock`, `delivery_out_stock`: textes stock.

### Declinaisons / attributs

**ps_attribute_group**
- `id_attribute_group`: identifiant du groupe.
- `is_color_group`: 1 si groupe de couleur.
- `group_type`: type (select, radio, color).
- `position`: ordre d'affichage.

**ps_attribute_group_lang**
- `id_attribute_group`: groupe.
- `id_lang`: langue.
- `name`: nom interne.
- `public_name`: nom affiche.

**ps_attribute_group_shop**
- `id_attribute_group`: groupe.
- `id_shop`: boutique.

**ps_attribute**
- `id_attribute`: identifiant attribut.
- `id_attribute_group`: groupe.
- `color`: couleur (optionnel).
- `position`: ordre d'affichage.

**ps_attribute_lang**
- `id_attribute`: attribut.
- `id_lang`: langue.
- `name`: valeur (ex: "kely").

**ps_attribute_shop**
- `id_attribute`: attribut.
- `id_shop`: boutique.

**ps_product_attribute**
- `id_product_attribute`: identifiant declinaison.
- `id_product`: produit parent.
- `reference`: reference declinaison.
- `supplier_reference`, `ean13`, `isbn`, `upc`, `mpn`: codes declinaison.
- `wholesale_price`: prix d'achat.
- `price`: impact de prix HT.
- `ecotax`, `weight`, `unit_price_impact`: impacts.
- `default_on`: declinaison par defaut.
- `minimal_quantity`: quantite minimale.
- `low_stock_threshold`, `low_stock_alert`: alerte stock bas.
- `available_date`: date de dispo.

**ps_product_attribute_lang**
- `id_product_attribute`: declinaison.
- `id_lang`: langue.
- `available_now`, `available_later`: textes stock.

**ps_product_attribute_shop**
- `id_product`: produit.
- `id_product_attribute`: declinaison.
- `id_shop`: boutique.
- `wholesale_price`, `price`, `ecotax`, `weight`, `unit_price_impact`: impacts boutique.
- `default_on`: declinaison par defaut.
- `minimal_quantity`, `low_stock_threshold`, `low_stock_alert`: stocks.
- `available_date`: date de dispo.

**ps_product_attribute_combination**
- `id_product_attribute`: declinaison.
- `id_attribute`: attribut associe.

### Stock

**ps_stock_available**
- `id_stock_available`: identifiant stock.
- `id_product`: produit.
- `id_product_attribute`: declinaison (0 si produit simple).
- `id_shop`: boutique.
- `id_shop_group`: groupe boutique.
- `quantity`: stock dispo.
- `physical_quantity`: stock physique.
- `reserved_quantity`: stock reserve.
- `depends_on_stock`: 1 si stock avance.
- `out_of_stock`: comportement rupture.
- `location`: emplacement.

### Clients / commandes

**ps_customer**
- `id_customer`: identifiant client.
- `id_shop_group`, `id_shop`: contexte boutique.
- `id_gender`: civilite.
- `id_default_group`: groupe par defaut.
- `id_lang`: langue.
- `id_risk`: niveau de risque.
- `company`, `siret`, `ape`: infos societe.
- `firstname`, `lastname`: nom/prenom.
- `email`: email.
- `passwd`: mot de passe hashe.
- `last_passwd_gen`: date generation mdp.
- `birthday`: date naissance.
- `newsletter`, `optin`: marketing.
- `website`: site web.
- `outstanding_allow_amount`: encours autorise.
- `show_public_prices`: affichage prix.
- `max_payment_days`: delai paiement.
- `secure_key`: cle client.

**ps_address**
- `id_address`: identifiant adresse.
- `id_country`, `id_state`: pays/etat.
- `id_customer`: client.
- `id_manufacturer`, `id_supplier`, `id_warehouse`: usages specifiques.
- `alias`: libelle adresse.
- `company`: societe.
- `lastname`, `firstname`: nom/prenom.
- `address1`, `address2`: adresse.
- `postcode`, `city`: code postal / ville.
- `other`: complement.
- `phone`, `phone_mobile`: telephones.
- `vat_number`, `dni`: identifiants.
- `date_add`, `date_upd`: dates.
- `active`, `deleted`: statut.

**ps_orders**
- `id_order`: identifiant commande.
- `reference`: reference commande.
- `id_shop_group`, `id_shop`: contexte boutique.
- `id_carrier`: transporteur.
- `id_lang`: langue.
- `id_customer`: client.
- `id_cart`: panier.
- `id_currency`: devise.
- `id_address_delivery`, `id_address_invoice`: adresses.
- `current_state`: statut.
- `secure_key`: cle client.
- `payment`: nom paiement.
- `conversion_rate`: taux devise.
- `module`: module de paiement.
- `recyclable`, `gift`, `gift_message`: options.
- `mobile_theme`: theme mobile.
- `total_discounts`, `total_discounts_tax_incl`, `total_discounts_tax_excl`: remises.
- `total_paid`, `total_paid_tax_incl`, `total_paid_tax_excl`: total paye.
- `total_paid_real`: total paye reel.
- `total_products`, `total_products_wt`: total produits HT/TTC.
- `total_shipping`, `total_shipping_tax_incl`, `total_shipping_tax_excl`: livraison.
- `carrier_tax_rate`: taux livraison.
- `total_wrapping`, `total_wrapping_tax_incl`, `total_wrapping_tax_excl`: emballage.
- `round_mode`, `round_type`: arrondis.
- `invoice_number`, `delivery_number`: numeros facture/BL.
- `invoice_date`, `delivery_date`: dates facture/BL.
- `valid`: 1 si commande validee.
- `date_add`, `date_upd`: dates.

**ps_order_detail**
- `id_order_detail`: identifiant ligne.
- `id_order`: commande.
- `id_order_invoice`: facture.
- `id_warehouse`: entrepot.
- `id_shop`: boutique.
- `product_id`: produit.
- `product_attribute_id`: declinaison.
- `id_customization`: personnalisation.
- `product_name`: nom au moment de la commande.
- `product_quantity`: quantite commandee.
- `product_quantity_in_stock`: stock au moment de la commande.
- `product_quantity_refunded`, `product_quantity_return`, `product_quantity_reinjected`: retours.
- `product_price`: prix unitaire HT.
- `reduction_percent`, `reduction_amount`, `reduction_amount_tax_incl`, `reduction_amount_tax_excl`: remises.
- `group_reduction`: remise groupe.
- `product_quantity_discount`: quantite remise.
- `product_ean13`, `product_isbn`, `product_upc`, `product_mpn`: codes.
- `total_price_tax_incl`, `total_price_tax_excl`: totaux ligne.
- `unit_price_tax_incl`, `unit_price_tax_excl`: prix unitaire.
- `original_product_price`: prix d'origine.
- `tax_name`, `tax_rate`, `tax_computation_method`: infos taxes.

**ps_order_state**
- `id_order_state`: identifiant statut.
- `invoice`, `pdf_invoice`: facture.
- `send_email`: envoi email.
- `module_name`: module associe.
- `color`: couleur backoffice.
- `unremovable`: statut verrouille.
- `hidden`: visible ou non.
- `logable`: loggable.
- `delivery`: statut livraison.
- `shipped`: expedie.
- `paid`: paye.
- `pdf_delivery`: BL.
- `deleted`: supprime.

**ps_order_state_lang**
- `id_order_state`: statut.
- `id_lang`: langue.
- `name`: libelle.
- `template`: template email.

### Images

**ps_image**
- `id_image`: identifiant image.
- `id_product`: produit.
- `position`: ordre.
- `cover`: 1 si image principale.

**ps_image_shop**
- `id_product`: produit.
- `id_image`: image.
- `id_shop`: boutique.
- `cover`: image principale pour la boutique.

## Mapping CSV -> Webservice (endpoints + champs)

Base Webservice: `/prestashop/api/` (auth Basic, cle API).

### CSV 1 - Produits + categories

- **Categorie**
	- Endpoint: `POST /prestashop/api/categories`
	- Champs minimum:
		- `active`, `id_parent`
		- `name` (language id)
		- `link_rewrite` (language id)
- **Produit**
	- Endpoint: `POST /prestashop/api/products`
	- Champs minimum:
		- `name` (language id)
		- `reference`
		- `price` (HT)
		- `wholesale_price`
		- `id_tax_rules_group`
		- `id_category_default`
		- `active`
	- Association categorie:
		- `associations > categories > category > id`

### CSV 2 - Declinaisons + stock

- **Groupe attribut**
	- Endpoint: `POST /prestashop/api/product_option_values` (valeurs)
	- Endpoint: `POST /prestashop/api/product_options` (groupes)
	- Champs minimum groupes:
		- `name`, `public_name`, `group_type`
- **Valeur attribut**
	- Champs minimum valeurs:
		- `id_attribute_group`, `name`
- **Declinaison**
	- Endpoint: `POST /prestashop/api/combinations`
	- Champs minimum:
		- `id_product`
		- `reference`
		- `price` (impact HT)
		- `associations > product_option_values > product_option_value > id`
- **Stock**
	- Endpoint: `POST /prestashop/api/stock_availables`
	- Champs minimum:
		- `id_product`, `id_product_attribute`, `id_shop`, `id_shop_group`, `quantity`

### CSV 3 - Clients + commandes

- **Client**
	- Endpoint: `POST /prestashop/api/customers`
	- Champs minimum:
		- `firstname`, `lastname`, `email`, `passwd`, `id_lang`, `id_shop`, `id_shop_group`
- **Adresse**
	- Endpoint: `POST /prestashop/api/addresses`
	- Champs minimum:
		- `id_customer`, `address1`, `postcode`, `city`, `id_country`, `alias`, `firstname`, `lastname`
- **Commande**
	- Endpoint: `POST /prestashop/api/orders`
	- Champs minimum:
		- `id_customer`, `id_address_delivery`, `id_address_invoice`,
			`id_currency`, `id_lang`, `id_shop`, `id_shop_group`,
			`payment`, `module`, `current_state`
- **Lignes de commande**
	- Endpoint: `POST /prestashop/api/order_details`
	- Champs minimum:
		- `id_order`, `product_id`, `product_attribute_id`, `product_quantity`, `product_price`
- **Etat commande** (si statut n'existe pas)
	- Endpoint: `POST /prestashop/api/order_states`
	- Champs minimum:
		- `name` (language id), `send_email`, `color`, `logable`, `paid`

### Images

- **Image**
	- Endpoint: `POST /prestashop/api/images/products/{id_product}`
	- Payload: fichier image binaire