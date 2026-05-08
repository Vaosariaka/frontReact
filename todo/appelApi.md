# Appeler les API PrestaShop depuis React (XML)

Ce guide donne un modele simple pour appeler les API PrestaShop en XML depuis le front React, sans modifier le back.

## 1) Prerequis

- API Webservice active cote PrestaShop.
- Cle API creee dans le Back Office.
- Proxy front (Vite) si domaine different.

## 2) Installation

```bash
npm i axios fast-xml-parser
```

## 3) Client API (Axios + XML)

```jsx
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    Accept: "application/xml",
  },
  responseType: "text",
});

export default api;
```

Explication rapide:

- `baseURL: "/api"` pointe vers le proxy Vite (evite CORS).
- `Accept: "application/xml"` demande du XML.
- `responseType: "text"` permet de lire le XML brut pour le parser.

Si tu dois envoyer la cle API (Basic Auth), ajoute:

```jsx
api.defaults.headers.Authorization = `Basic ${btoa(import.meta.env.VITE_PS_API_KEY + ":")}`;
```

## 4) Parser XML -> JSON

```jsx
import { XMLParser } from "fast-xml-parser";

export const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});
```

## 5) Builder JSON -> XML

```jsx
import { XMLBuilder } from "fast-xml-parser";

export const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});
```

## 6) Exemple GET (produits)

```jsx
import api from "./api";
import { xmlParser } from "./xml";

export async function fetchProducts() {
  const res = await api.get("/prestashop/api/products");
  return xmlParser.parse(res.data);
}
```

Explication de `fetchProducts`:

- `api.get("/prestashop/api/products")` envoie une requete GET vers l API PrestaShop.
- `res.data` contient du XML (texte).
- `xmlParser.parse(res.data)` transforme le XML en JSON utilisable en React.
- La fonction renvoie le JSON parse.

Astuce `display=full`:

- Par defaut, PrestaShop renvoie souvent une liste d IDs seulement.
- En ajoutant `?display=full`, l API renvoie les champs complets (ex: name, price, etc.).

Exemple:

```jsx
const res = await api.get("/prestashop/api/products?display=full");
```

## 7) Exemple POST (clients)

```jsx
import api from "./api";
import { xmlBuilder } from "./xml";

export async function createCustomer(payload) {
  const xmlBody = xmlBuilder.build(payload);

  const res = await api.post("/prestashop/api/customers", xmlBody, {
    headers: {
      "Content-Type": "application/xml",
    },
  });

  return res.data;
}
```

## 8) Proxy Vite (CORS)

```js
export default {
  server: {
    proxy: {
      "/api": {
        target: "https://votre-prestashop.tld",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
};
```

## 9) Reinitialiser avant import

Avant d importer:
- vider state local
- nettoyer localStorage
- annuler requetes en cours

Voir l exemple dans [frontReact/todo/import.md](frontReact/todo/import.md).

## 10) Exemple loadData (Promise.all) + usage React

`loadData` permet de charger plusieurs ressources en meme temps, puis de remplir un seul state objet.

```jsx
import { useEffect, useState } from "react";
import api from "./api";
import { xmlParser } from "./xml";

async function loadData() {
  const [productsRes, employeesRes] = await Promise.all([
    api.get("/prestashop/api/products?display=full"),
    api.get("/prestashop/api/employees?display=full"),
  ]);

  return {
    products: xmlParser.parse(productsRes.data),
    employees: xmlParser.parse(employeesRes.data),
  };
}

export function useLoadData() {
  const [data, setData] = useState({ products: [], employees: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    loadData()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active) setError(err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { data, loading, error };
}
```

Pourquoi `Promise.all`:

- Lance les requetes en parallele (plus rapide).
- Attends que toutes les requetes soient finies.
- Si une requete echoue, l erreur est capturee dans `catch`.

Gestion de plusieurs APIs sans multiplier les `useState`:

Si tu fais:

```jsx
const [products, setProducts] = useState([]);
const [employees, setEmployees] = useState([]);
const [categories, setCategories] = useState([]);
```

ca devient vite lourd.

Option 1: un seul objet de state

```jsx
const [data, setData] = useState({
  products: [],
  employees: [],
  categories: [],
});
```

Puis:

```jsx
setData((prev) => ({
  ...prev,
  products: newProducts,
}));
```

Et:

```jsx
setData((prev) => ({
  ...prev,
  employees: newEmployees,
}));
```

Affichage:

```jsx
data.products.map(...)
data.employees.map(...)
```

Option 2: fonction generique de fetch (XML)

```jsx
const fetchData = async (url, key) => {
  try {
    const res = await api.get(url);
    const parsed = xmlParser.parse(res.data);

    setData((prev) => ({
      ...prev,
      [key]: parsed,
    }));
  } catch (err) {
    console.log(err);
  }
};
```

Puis:

```jsx
fetchData("/api/products", "products");
fetchData("/api/employees", "employees");
fetchData("/api/categories", "categories");
```

Option 3: custom hook

```jsx
function useApi(url) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(url)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading };
}
```

Option 4: TanStack Query

```jsx
const { data, isLoading, error } = useQuery({
  queryKey: ["products"],
  queryFn: () => axios.get("/api/products"),
});
```

Decision finale pour ce projet:
- Utiliser un seul `state` objet + une fonction `fetchData` generique.
- Ca evite de multiplier les `useState` et reste simple sans nouvelle lib.

## 11) Accolades, parentheses, et points-virgules

Rappels importants en React:

- `{}`: en JSX, sert a ecrire du JavaScript dans le HTML.
- `()`: en JSX, enveloppe du rendu multi-lignes.
- `;`: termine une instruction JavaScript.

Exemples corrects:

```jsx
return (
  <div>
    {items.length > 0 ? <List /> : <Empty />}
  </div>
);
```

Erreur classique (oublier un `)` ou `}`):

```jsx
return (
  <div>
    {items.map((p) => (
      <p key={p.id}>{p.name}</p>
    ))}
  </div>
);
```

## 12) Acceder aux attributs de l API (XML -> JSON)

Le XML PrestaShop devient un objet JSON. Exemple simplifie:

```js
data.prestashop.products.product
```

Parfois `name` est un objet multilangue:

```js
const nameValue = item.name?.language?.[0]?.value || "";
```

Astuce pratique:

```jsx
const getTextValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  const lang = value.language;
  if (Array.isArray(lang) && lang[0]?.value) return String(lang[0].value);
  if (lang?.value) return String(lang.value);
  return "";
};
```
