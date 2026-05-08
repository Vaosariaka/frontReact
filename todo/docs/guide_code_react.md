# Guide code React: connexion API, CRUD, affichage

Ce guide donne un modele simple pour se connecter a l API PrestaShop et realiser:
- affichage (liste + detail)
- insertion
- modification
- suppression
- reinitialisation des donnees front

## 1) Structure simple

```
src/
  api/
    client.js
    xml.js
    products.js
  pages/
    ProductsPage.jsx
  components/
    ProductForm.jsx
```

## 2) API client (Basic Auth + XML)

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

## 3) XML parser/builder

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

## 4) CRUD generique (exemple products)

```jsx
// src/api/products.js
import api from "./client";
import { xmlParser, xmlBuilder } from "./xml";

export async function listProducts() {
  const res = await api.get("/products");
  return xmlParser.parse(res.data);
}

export async function getProduct(id) {
  const res = await api.get(`/products/${id}`);
  return xmlParser.parse(res.data);
}

export async function createProduct(payload) {
  const xmlBody = xmlBuilder.build({ prestashop: { product: payload } });
  const res = await api.post("/products", xmlBody, {
    headers: { "Content-Type": "application/xml" },
  });
  return xmlParser.parse(res.data);
}

export async function updateProduct(id, payload) {
  const xmlBody = xmlBuilder.build({ prestashop: { product: { id, ...payload } } });
  const res = await api.put(`/products/${id}`, xmlBody, {
    headers: { "Content-Type": "application/xml" },
  });
  return xmlParser.parse(res.data);
}

export async function deleteProduct(id) {
  const res = await api.delete(`/products/${id}`);
  return xmlParser.parse(res.data);
}
```

## 5) Formulaire simple (insert + update)

```jsx
// src/components/ProductForm.jsx
import { useState } from "react";

export default function ProductForm({ initial, onSubmit }) {
  const [name, setName] = useState(initial?.name || "");
  const [price, setPrice] = useState(initial?.price || "0");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ name, price });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <input value={price} onChange={(e) => setPrice(e.target.value)} />
      <button type="submit">Enregistrer</button>
    </form>
  );
}
```

## 6) Page complete (liste + CRUD + reset)

```jsx
// src/pages/ProductsPage.jsx
import { useEffect, useState } from "react";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../api/products";
import ProductForm from "../components/ProductForm";

export default function ProductsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  const resetFront = () => {
    setItems([]);
    setError(null);
    setLoading(false);
    setEditing(null);
    localStorage.removeItem("products_cache");
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await listProducts();
      const list = data?.prestashop?.products?.product || [];
      setItems(Array.isArray(list) ? list : [list]);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (payload) => {
    await createProduct(payload);
    await load();
  };

  const handleUpdate = async (payload) => {
    if (!editing?.id) return;
    await updateProduct(editing.id, payload);
    setEditing(null);
    await load();
  };

  const handleDelete = async (id) => {
    await deleteProduct(id);
    await load();
  };

  return (
    <div>
      <h1>Produits</h1>

      <button onClick={resetFront}>Reinitialiser</button>

      {loading && <p>Chargement...</p>}
      {error && <p>Erreur: {String(error.message || error)}</p>}

      <ProductForm
        initial={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
      />

      <ul>
        {items.map((p) => (
          <li key={p.id}>
            {p.name || p.id}
            <button onClick={() => setEditing(p)}>Modifier</button>
            <button onClick={() => handleDelete(p.id)}>Supprimer</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 7) Remarques importantes

- Certaines ressources exigent des champs obligatoires. Lire la doc PrestaShop pour la structure XML.
- Utiliser les noms de ressources valides (products, categories, customers, etc.).
- Pour debug, afficher le XML brut si besoin.

## 8) Login client (sans modifier le back)

Le Webservice n est pas un login client. Il utilise une cle API admin.

Comme tu veux utiliser uniquement les API existantes (sans back), la seule solution simple est de rediriger l utilisateur vers la page de login PrestaShop (front office) sur le meme domaine.

Exemple de bouton:

```jsx
export function LoginButton() {
  const handleLogin = () => {
    window.location.href = "http://localhost/prestashop/authentication";
  };

  return <button onClick={handleLogin}>Se connecter</button>;
}
```

Un vrai login SPA (API JSON/XML) demanderait un endpoint custom, donc interdit dans ton cas.

Si tu veux, je peux adapter ce guide a tes ressources exactes.
