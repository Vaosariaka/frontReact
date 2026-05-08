# React debutante: construire le front pour PrestaShop API (XML)

Ce guide explique comment commencer un front React simple qui consomme les API PrestaShop en XML.

## 1) Idees de base

- React affiche une UI a partir de state (donnees).
- On appelle l API, on transforme le XML en JSON, puis on rend l affichage.
- On separe le code en petits fichiers: client API, fonctions CRUD, composants.

## 2) Installation

```bash
npm i axios fast-xml-parser
```

## 3) Variables .env (exemple)

```
VITE_PS_BASE_URL=http://localhost/prestashop/api
VITE_PS_API_KEY=VOTRE_CLE_API
```

## 4) Client API (XML)

```jsx
// src/api/client.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_PS_BASE_URL,
  headers: {
    Accept: "application/xml",
    Authorization: `Basic ${btoa(import.meta.env.VITE_PS_API_KEY + ":")}`,
  },
  responseType: "text",
});

export default api;
```

## 5) XML parser / builder

```jsx
// src/api/xml.js
import { XMLParser, XMLBuilder } from "fast-xml-parser";

export const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});
```

## 6) Ressources API

Tu ne peux pas appeler "admin". L API accepte des ressources comme:

- products, categories, customers, orders, currencies, languages, zones, etc.

Si tu appelles une ressource invalide, tu obtiens l erreur:

```
Resource of type "admin" does not exists. Did you mean: "zones"?
```

## 7) Login client (sans modifier le back)

Le Webservice PrestaShop (API XML) utilise une cle API (admin) et ne fournit pas de login client.

Comme tu veux utiliser uniquement les API existantes (sans back), la solution est:

- Rediriger l utilisateur vers la page de login PrestaShop (front office).

Si React et PrestaShop sont sur le meme domaine, la session front office peut etre partagee avec les pages PrestaShop.

## 8) Exemple simple: lister des produits

## 7) Exemple simple: lister des produits

```jsx
// src/api/products.js
import api from "./client";
import { xmlParser } from "./xml";

export async function fetchProducts() {
  const res = await api.get("/products");
  return xmlParser.parse(res.data);
}
```

## 8) Exemple composant

```jsx
// src/pages/ProductsPage.jsx
import { useEffect, useState } from "react";
import { fetchProducts } from "../api/products";

export default function ProductsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts()
      .then((data) => {
        const list = data?.prestashop?.products?.product || [];
        setItems(Array.isArray(list) ? list : [list]);
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Chargement...</p>;
  if (error) return <p>Erreur: {String(error.message || error)}</p>;

  return (
    <div>
      <h1>Produits</h1>
      <ul>
        {items.map((p) => (
          <li key={p.id}>{p.name || p.id}</li>
        ))}
      </ul>
    </div>
  );
}
```

## 9) Reinitialiser avant un nouvel import

- Vider le state local.
- Nettoyer le cache local si tu en utilises.
- Annuler les requetes en cours.

Exemples complets dans [frontReact/todo/import.md](frontReact/todo/import.md).
