Les “attributs” que tu vois dans le XML sont les champs du produit PrestaShop.
Quand tu fais :

http://localhost/prestashop/api/products/{id}

PrestaShop retourne un objet <product> avec beaucoup de propriétés.

 Les champs principaux utiles en frontend

Dans ton React, les plus utilisés sont :

Champ XML	Utilité
id	identifiant produit
name	nom produit
price	prix
quantity	stock
description	description longue
description_short	description courte
reference	référence produit
active	produit actif ou non
id_category_default	catégorie
weight	poids
date_add	date création
date_upd	date modification
link_rewrite	URL SEO
visibility	visibilité
condition	état produit
manufacturer_name	marque