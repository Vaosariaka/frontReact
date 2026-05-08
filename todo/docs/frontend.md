# Guide frontend React <-> PrestaShop (complet)

Ce guide explique comment relier un frontend React a PrestaShop (back office + API), appeler les API, structurer le code, et coder des fonctions reutilisables.

## 1) Deux approches possibles

1) API REST officielle (Webservice PrestaShop)
- Simple et stable pour produits, clients, commandes, etc.
- Auth par cle API (Basic Auth).

2) API custom (module / controller front)
- Plus flexible (ex: panier, paiement, logique metier speciale).
- Necessite un module PrestaShop ou un controller custom.

Dans la plupart des cas, on commence avec le Webservice, puis on ajoute du custom si besoin.

## 2) Activer le Webservice PrestaShop

1. Back office -> Parametres avances -> Webservice
2. Activer le Webservice
3. Creer une cle API
4. Donner les droits sur les ressources (GET / POST / PUT / DELETE)

## 3) Base URL et Auth

- Base URL (exemple local):
  - `http://localhost/prestashop/api/`
- Auth Basic:
  - Username: cle API
  - Password: vide

Exemple curl:

```
curl -u YOUR_API_KEY: http://localhost/prestashop/api/products
```

## 4) CORS et proxy (React)

Si le frontend tourne sur un autre port (ex: Vite 5173), il faut gerer CORS.

Option A: proxy Vite

```
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost/prestashop',
        changeOrigin: true,
        secure: false,
      },
    },
  },
}
```

Puis appeler `http://localhost:5173/api/...`

Option B: activer CORS sur Apache (moins recommande)

## 5) Structure frontend recommandee

```
src/
  api/
    client.js
    products.js
    categories.js
    customers.js
    orders.js
  hooks/
    useProducts.js
    useCart.js
  services/
    cartService.js
  pages/
  components/
```

## 6) Client API (axios)

```
// src/api/client.js
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    // Basic Auth: base64(apiKey + ':')
    Authorization: `Basic ${btoa(import.meta.env.VITE_PS_API_KEY + ':')}`,
  },
});

export default api;
```

Note: mettre la cle dans `.env`:

```
VITE_PS_API_KEY=YOUR_API_KEY
```

## 7) Exemples d appels API

### Produits

```
// src/api/products.js
import api from './client';

export async function fetchProducts() {
  const res = await api.get('/products');
  return res.data;
}

export async function fetchProduct(id) {
  const res = await api.get(`/products/${id}`);
  return res.data;
}
```

### Categories

```
// src/api/categories.js
import api from './client';

export async function fetchCategories() {
  const res = await api.get('/categories');
  return res.data;
}
```

### Clients

```
// src/api/customers.js
import api from './client';

export async function createCustomer(payload) {
  const res = await api.post('/customers', payload);
  return res.data;
}
```

## 8) Hooks React (exemple)

```
// src/hooks/useProducts.js
import { useEffect, useState } from 'react';
import { fetchProducts } from '../api/products';

export function useProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    fetchProducts()
      .then((data) => {
        if (active) setItems(data);
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

  return { items, loading, error };
}
```

## 9) Panier (strategie)

Le Webservice ne gere pas tout le workflow panier comme un front moderne. Options:

- Option simple: stocker le panier en localStorage et creer la commande au moment du checkout.
- Option avancee: creer un module PrestaShop pour exposer un endpoint panier (ajout, retrait, sync).

## 10) Endpoint custom (module)

Si tu as besoin de endpoints specifiques:

- Creer un module PrestaShop
- Ajouter un controller front (ex: `modules/monmodule/controllers/front/Api.php`)
- Exposer un JSON

Exemple reponse JSON:

```
header('Content-Type: application/json');
echo json_encode(['ok' => true, 'data' => $data]);
exit;
```

## 11) Securite

- Ne jamais exposer la cle API en prod cote client si elle a des droits d ecriture.
- Pour prod, preferer un backend intermediaire (BFF) qui signe les requetes.
- Limiter les droits de la cle API au strict necessaire.

## 12) Erreurs courantes

- 401 Unauthorized -> cle API invalide ou droits manquants
- 404 -> ressource non activee dans Webservice
- CORS -> proxy non configure ou serveur bloque les headers

## 13) Check-list de mise en place

- [ ] Webservice active et cle creee
- [ ] Droits API verifies
- [ ] Proxy Vite configure
- [ ] Client API centralise (axios)
- [ ] Hooks React pour consommation
- [ ] Panier: strategie choisie

## 14) Etapes suivantes

- Ajouter des pages React (liste produits, detail produit, panier)
- Ajouter authentification client
- Ajouter tunnel de commande
