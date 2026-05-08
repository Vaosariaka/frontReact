# Add / Delete / Update (CRUD) pour PrestaShop via React

## Objectif
Donner un guide simple pour creer, modifier et supprimer des ressources PrestaShop depuis React, avec XML.

## Contexte du projet
- Frontend React appelle directement l API PrestaShop.
- Format d echange: XML.
- Pas de backend additionnel.

## Ressources cibles (exemples)
- Produits: /prestashop/api/products
- Categories: /prestashop/api/categories
- Clients: /prestashop/api/customers

## Client API (rappel)
```jsx
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: { Accept: "application/xml" },
  responseType: "text",
});

export default api;
```

## Helpers XML (rappel)
```jsx
import { XMLBuilder, XMLParser } from "fast-xml-parser";

export const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});
```

## 1) ADD (POST)

### Exemple: creer un produit
```jsx
import api from "./api";
import { xmlBuilder } from "./xml";

export async function addProduct({ name, price, quantity }, langId = 1) {
  const payload = {
    prestashop: {
      product: {
        price: String(price),
        quantity: String(quantity),
        name: {
          language: {
            "@_id": langId,
            "#text": name,
          },
        },
      },
    },
  };

  const xmlBody = xmlBuilder.build(payload);

  const res = await api.post("/prestashop/api/products", xmlBody, {
    headers: { "Content-Type": "application/xml" },
  });

  return res.data;
}
```

## 2) UPDATE (PUT)

### Exemple: modifier un produit par id
```jsx
import api from "./api";
import { xmlBuilder } from "./xml";

export async function updateProduct(id, { name, price, quantity }, langId = 1) {
  const payload = {
    prestashop: {
      product: {
        id: String(id),
        price: String(price),
        quantity: String(quantity),
        name: {
          language: {
            "@_id": langId,
            "#text": name,
          },
        },
      },
    },
  };

  const xmlBody = xmlBuilder.build(payload);

  const res = await api.put(`/prestashop/api/products/${id}`, xmlBody, {
    headers: { "Content-Type": "application/xml" },
  });

  return res.data;
}
```

## 3) DELETE (DELETE)

### Exemple: supprimer un produit par id
```jsx
import api from "./api";

export async function deleteProduct(id) {
  const res = await api.delete(`/prestashop/api/products/${id}`);
  return res.data;
}
```

## Flux React simple (CRUD)
```jsx
const [data, setData] = useState({ products: [] });
const [error, setError] = useState(null);

const onAdd = async (payload) => {
  try {
    await addProduct(payload);
  } catch (err) {
    setError(err.message || "Erreur ajout");
  }
};

const onUpdate = async (id, payload) => {
  try {
    await updateProduct(id, payload);
  } catch (err) {
    setError(err.message || "Erreur update");
  }
};

const onDelete = async (id) => {
  try {
    await deleteProduct(id);
  } catch (err) {
    setError(err.message || "Erreur suppression");
  }
};
```

## Points importants
- Toujours envoyer `Content-Type: application/xml` pour POST/PUT.
- `id` obligatoire pour update/delete.
- Pour certains champs (name), PrestaShop attend `language`.
- Adapter le payload selon la resource (product, category, customer).
