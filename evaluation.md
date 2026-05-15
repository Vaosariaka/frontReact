
2

Automatic Zoom
Evaluation J1 - 11 mai 26 - P17 
J0 
 Evaluation J0 - 05 mai 2026 - P17
 
Jour 1 
NewAPP 
1.  Backoffice ( avec login/mdp , mettre par defaut sur le formulaire ) 
a.  il faut protéger les pages du back office 
b.  créer une page avec un bouton pour réinitialiser les données 
c.  créer la page pour importer les 4 fichiers  
i.  3 fichiers csv pour le contenu      import-data-mai-26
1.  csv modifié ce 11/05 à 13:15 , voir couleur rouge 
ii.  1 fichier zip pour les images :  images.zip  
d.  page pour afficher les commandes et modifier l’état 
i.  paiement effectué 
ii.  annulé 
2.  FrontOffice 
a.  créer la page d’accueil pour afficher les produits 
i.  avec fiche produit 
b.  faire marcher le workflow d’achat 
i.  gestion de panier 
ii.  validation commande 
1.  avec uniquement le choix “paiement à la livraison” 
2.  pas de frais de livraison 
c.  état de “mes commandes” 
ExistingApp 
1.  s’assurer que  
a.  Toutes les données importées sont visibles quelque part dans le backoffice de 
prestashop. 
b.  Que la modification des données aient un impact sur la NewAPP 
 
Note ce 12/05 : utiliser France comme Pays, et Euro comme devise 
 
Note : Créer uniquement les pages demandées, pas de menu ni affichage non demandé 
 
 
Jour 2 
NewAPP 
1.  Backoffice 
a.  Voici les état des commandes existants que nous allons utiliser (data import 
modifié) 
i.  dans le panier 
ii.  paiement effecuté 
iii.  annulé 
b.  Tableau de bord 
i.  Par jour 
1.  nb de commande 
2.  montant 
ii.  Total général 
2.  Frontoffice 
a.  Changer le page d’accueil par défaut, par une page qui affiche la liste des 
utilisateurs existants. On peut choisir avec quel utilisateur on veut se 
connecter 
i.  rajouter une option “utilisateur anonyme”  
b.  mettre une marque sur les produits ( voir date_availability_produit) 
i.  HOT : pour les produits sorties 1j avant 
ii.  NEW : pour les produits sorties 1 semaines avant 
c.  implémenter une recherche multicritère par produit 
i.  nom 
ii.  catégorie 
iii.  intervalle de prix 