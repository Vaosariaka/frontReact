# Guide J1 - Evaluation 11 mai 2026 (P17)

## Objectif
Realiser les taches J1 pour NewAPP, FrontOffice et ExistingApp.

---

## 1) NewAPP

### 1.0 Etat actuel du projet

Fichiers existants:
- [frontReact/NewApp/src/App.jsx](frontReact/NewApp/src/App.jsx)
- [frontReact/NewApp/src/api/productsApi.js](frontReact/NewApp/src/api/productsApi.js)
- [frontReact/NewApp/src/api/employeesApi.js](frontReact/NewApp/src/api/employeesApi.js)
- [frontReact/NewApp/src/import/importApiProduct.js](frontReact/NewApp/src/import/importApiProduct.js)
- [frontReact/NewApp/src/import/importApiEmployee.js](frontReact/NewApp/src/import/importApiEmployee.js)
- [frontReact/NewApp/src/affichageImport/importProduct.jsx](frontReact/NewApp/src/affichageImport/importProduct.jsx)
- [frontReact/NewApp/src/affichageImport/importEmployee.jsx](frontReact/NewApp/src/affichageImport/importEmployee.jsx)

Le proxy Vite pointe vers:
- http://localhost/prestashop
- base: /api (voir vite.config.js)

Donc les endpoints utilises dans le code actuel sont:
- /api/api/products
- /api/api/employees

### 1.1 Backoffice (login + pages protegees)

#### Etapes
1) Creer une page Login (email + mot de passe).
2) Mettre les valeurs par defaut dans le formulaire.
3) Creer un guard pour proteger les pages backoffice.
4) Rediriger vers /login si non connecte.

#### Code (exemple minimal)

```jsx
// src/auth/AuthContext.jsx
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async ({ email, password }) => {
    // TODO: remplacer par ton appel API
    if (email && password) {
      setUser({ email });
      return true;
    }
    return false;
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

```jsx
// src/auth/PrivateRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function PrivateRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
```

```jsx
// src/pages/Login.jsx
import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: "admin@demo.com",
    password: "admin123",
  });
  const [error, setError] = useState(null);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(form);
    if (!ok) setError("Login invalide");
  };

  return (
    <form onSubmit={onSubmit}>
      <input name="email" value={form.email} onChange={onChange} />
      <input name="password" type="password" value={form.password} onChange={onChange} />
      <button type="submit">Se connecter</button>
      {error && <p>{error}</p>}
    </form>
  );
}
```

#### A faire
- Ajouter les routes protegees avec `PrivateRoute`.
- Verifier que toutes les pages backoffice sont sous protection.

---

### 1.2 Bouton de reinitialisation des donnees

#### Etapes
1) Creer une page `ResetData`.
2) Ajouter un bouton de confirmation.
3) Appeler l endpoint de reinitialisation.

```jsx
// src/reinit/ResetData.jsx
import { useState } from "react";
import axios from "axios";

const apiKey = import.meta.env.VITE_PS_API_KEY;

export default function ResetData() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const onReset = async () => {
    if (!confirm("Confirmer la reinitialisation ?")) return;
    setLoading(true);
    setMessage(null);
    try {
      await axios.post(
        "/api/api/reset",
        {},
        {
          headers: {
            Authorization: `Basic ${btoa(apiKey + ":")}`,
          },
        }
      );
      setMessage("Reinitialisation OK");
    } catch {
      setMessage("Erreur reinitialisation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={onReset} disabled={loading}>
        {loading ? "En cours..." : "Reinitialiser"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
```

---

### 1.3 Import des 4 fichiers

- 3 fichiers CSV (import-data-mai-26)
- 1 fichier ZIP (images.zip)

#### Etapes
1) Creer une page `ImportData`.
2) Input pour chaque CSV.
3) Input pour le ZIP.
4) Pour chaque CSV, parser et envoyer vers l API PrestaShop.
5) Pour les images, envoyer le ZIP vers l API (ou un endpoint custom).

### Import produits (CSV) - deja present

Composant:
- [frontReact/NewApp/src/affichageImport/importProduct.jsx](frontReact/NewApp/src/affichageImport/importProduct.jsx)

Colonnes attendues dans le CSV (exemple):
- Name *
- Price tax excluded

Exemple CSV dispo:
- [frontReact/exemple_import_csv/products_import.csv](frontReact/exemple_import_csv/products_import.csv)

### Import employees (CSV)

Composant:
- [frontReact/NewApp/src/affichageImport/importEmployee.jsx](frontReact/NewApp/src/affichageImport/importEmployee.jsx)

Colonnes attendues (basé sur exemple CSV clients):
- Email *
- First Name *
- Last Name *

Exemple CSV dispo:
- [frontReact/exemple_import_csv/customers_import.csv](frontReact/exemple_import_csv/customers_import.csv)

### API createProduct / createEmployee (a corriger)

Les fichiers [frontReact/NewApp/src/import/importApiProduct.js](frontReact/NewApp/src/import/importApiProduct.js)
et [frontReact/NewApp/src/import/importApiEmployee.js](frontReact/NewApp/src/import/importApiEmployee.js)
ont besoin d un objet XML (`obj`). Exemple:

```jsx
// import/importApiProduct.js
import axios from "axios";
import { XMLBuilder } from "fast-xml-parser";

const apiKey = import.meta.env.VITE_PS_API_KEY;

export const createProduct = async ({ name, price }) => {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  const obj = {
    prestashop: {
      product: {
        price: String(price),
        name: {
          language: {
            "@_id": "1",
            "#text": name,
          },
        },
      },
    },
  };

  const xml = builder.build(obj);

  return axios.post("/api/api/products", xml, {
    headers: {
      Authorization: `Basic ${btoa(apiKey + ":")}`,
      "Content-Type": "application/xml",
    },
  });
};
```

```jsx
// import/importApiEmployee.js
import axios from "axios";
import { XMLBuilder } from "fast-xml-parser";

const apiKey = import.meta.env.VITE_PS_API_KEY;

export const createEmployee = ({ firstname, lastname, email }) => {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  const obj = {
    prestashop: {
      employee: {
        firstname,
        lastname,
        email,
      },
    },
  };

  const xml = builder.build(obj);

  return axios.post("/api/api/employees", xml, {
    headers: {
      Authorization: `Basic ${btoa(apiKey + ":")}`,
      "Content-Type": "application/xml",
    },
  });
};
```

---

### 1.4 Page commandes + modification etat

Etats a gerer:
- echec paiement
- paiement effectue
- annule

#### Etapes
1) Charger la liste des commandes.
2) Afficher l etat courant.
3) Bouton pour changer d etat.

```jsx
// src/pages/Orders.jsx (a creer)
import { useEffect, useState } from "react";
import { fetchOrders, updateOrderState } from "../api/ordersApi";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders().then(setOrders);
  }, []);

  const onChangeState = async (orderId, stateId) => {
    await updateOrderState(orderId, stateId);
  };

  return (
    <ul>
      {orders.map((o) => (
        <li key={o.id}>
          {o.reference}
          <button onClick={() => onChangeState(o.id, "PAID")}>Paiement effectue</button>
          <button onClick={() => onChangeState(o.id, "FAILED")}>Echec paiement</button>
          <button onClick={() => onChangeState(o.id, "CANCELED")}>Annule</button>
        </li>
      ))}
    </ul>
  );
}
```

```jsx
// src/api/ordersApi.js (a creer)
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const apiKey = import.meta.env.VITE_PS_API_KEY;
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export async function fetchOrders() {
  const res = await axios.get("/api/api/orders?display=full", {
    headers: {
      Authorization: `Basic ${btoa(apiKey + ":")}`,
      Accept: "application/xml",
    },
    responseType: "text",
  });

  const data = parser.parse(res.data);
  return data?.prestashop?.orders?.order || [];
}

export async function updateOrderState(orderId, stateId) {
  // TODO: adapter selon la methode Prestashop (souvent via order_histories)
  return axios.post(
    "/api/api/order_histories",
    stateId,
    {
      headers: {
        Authorization: `Basic ${btoa(apiKey + ":")}`,
        "Content-Type": "application/xml",
      },
    }
  );
}
```

---

## 2) FrontOffice

### 2.1 Page accueil + fiche produit

Etapes:
1) Page accueil qui liste les produits.
2) Page fiche produit (detail).

---

### 2.2 Workflow d achat

Etapes:
1) Gestion panier.
2) Validation commande.
3) Paiement a la livraison uniquement.
4) Pas de frais de livraison.
5) Page "mes commandes".

---

## 3) ExistingApp

Verification:
- Toutes les donnees importees visibles dans le backoffice Prestashop.
- Les modifications faites via NewAPP impactent Prestashop.

---

## Checklist rapide
- [ ] Login backoffice + guard
- [ ] Page reset data
- [ ] Import CSV + ZIP
- [ ] Page commandes + changement etat
- [ ] Accueil + fiche produit
- [ ] Panier + validation commande
- [ ] Paiement a la livraison
- [ ] Mes commandes
- [ ] Verification backoffice
