Champs order (PrestaShop)

Endpoint:
- /api/orders/{id}

Exemple (extrait XML):
- <order>

Champs principaux utiles en frontend

Champ XML	Utilite
id	identifiant commande
id_address_delivery	adresse livraison
id_address_invoice	adresse facturation
id_cart	panier
id_currency	devise
id_lang	langue
id_customer	client
id_carrier	transporteur
current_state	etat commande
module	module paiement
invoice_number	numero facture
invoice_date	date facture
delivery_number	numero livraison
delivery_date	date livraison
valid	commande validee
date_add	date creation
date_upd	date modification
shipping_number	numero expedition
note	note
id_shop_group	groupe boutique
id_shop	boutique
secure_key	cle securite
payment	mode paiement
recyclable	recyclable
gift	cadeau
gift_message	message cadeau
mobile_theme	theme mobile
total_discounts	total remises HT
total_discounts_tax_incl	total remises TTC
total_discounts_tax_excl	total remises HT
total_paid	total paye
total_paid_tax_incl	total paye TTC
total_paid_tax_excl	total paye HT
total_paid_real	total paye reel
total_products	total produits HT
total_products_wt	total produits TTC
total_shipping	frais livraison HT
total_shipping_tax_incl	frais livraison TTC
total_shipping_tax_excl	frais livraison HT
carrier_tax_rate	taux taxe transporteur
total_wrapping	emballage HT
total_wrapping_tax_incl	emballage TTC
total_wrapping_tax_excl	emballage HT
round_mode	mode arrondi
round_type	type arrondi
conversion_rate	taux conversion
reference	reference commande
associations	lignes de commande (order_rows)
