# Echange XML avec l'API PrestaShop (front React)

Objectif: echanger des donnees en XML uniquement, sans modifier le back. Cette note propose une solution front avec une bibliotheque de parsing XML.

## Bibliotheques proposees

- `fast-xml-parser` pour parser XML -> JSON et construire JSON -> XML.
- `axios` (optionnel) pour les requetes HTTP. Le `fetch` natif fonctionne aussi.

## Installation

```bash
npm i fast-xml-parser axios
```

## Exemple simple (GET XML -> JSON)

```jsx
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export async function fetchCurrenciesXML() {
  const url = "/api/prestashop/currencies";

  const response = await axios.get(url, {
    headers: {
      Accept: "application/xml",
    },
    responseType: "text",
  });

  const xmlText = response.data;
  const json = parser.parse(xmlText);
  return json;
}
```

## Exemple simple (POST JSON -> XML)

```jsx
import axios from "axios";
import { XMLBuilder } from "fast-xml-parser";

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export async function createCustomerXML(payload) {
  const url = "/api/prestashop/customers";

  const xmlBody = builder.build(payload);

  const response = await axios.post(url, xmlBody, {
    headers: {
      "Content-Type": "application/xml",
      Accept: "application/xml",
    },
  });

  return response.data;
}
```

## Reinitialiser les donnees front avant import

Avant d importer de nouvelles donnees, reinitialiser l etat front pour eviter un melange d anciens et nouveaux resultats.

Points cles:

- Vider le state local (liste, cache, erreurs, chargement).
- Supprimer les donnees persistantes (ex: `localStorage`, `sessionStorage`) si elles existent.
- Annuler les requetes en cours pour eviter des race conditions.

Exemple (hook React simplifie):

```jsx
import { useCallback, useRef, useState } from "react";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export function useImportCurrencies() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const resetFront = useCallback(() => {
    setItems([]);
    setError(null);
    setLoading(false);
    localStorage.removeItem("currencies_cache");
    if (abortRef.current) abortRef.current.abort();
  }, []);

  const importCurrencies = useCallback(async () => {
    resetFront();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const response = await axios.get("/api/prestashop/currencies", {
        headers: { Accept: "application/xml" },
        responseType: "text",
        signal: controller.signal,
      });

      const data = parser.parse(response.data);
      setItems(data);
      localStorage.setItem("currencies_cache", JSON.stringify(data));
    } catch (err) {
      if (err.name !== "CanceledError" && err.name !== "AbortError") {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [resetFront]);

  return { items, loading, error, importCurrencies, resetFront };
}
```

## Note importante (CORS)

Si l'API PrestaShop est sur un autre domaine, il faut passer par un proxy front (Vite dev server) ou par un proxy reverse (Nginx/Apache) pour eviter les erreurs CORS.

Exemple Vite (vite.config.js):

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

## Conseils

- Toujours demander `Accept: application/xml`.
- Toujours envoyer `Content-Type: application/xml`.
- Utiliser `responseType: "text"` pour lire le XML brut.
- Parser le XML cote front, ne pas modifier le back.

## Workflow complet CSV -> PrestaShop (XML)

Architecture:

```
CSV utilisateur
  -> React (lecture + transformation)
  -> JSON interne
  -> XML PrestaShop
  -> API PrestaShop
  -> Base PrestaShop
```

Pourquoi XML:
- Le Webservice PrestaShop est historique et expose un format XML.
- GET /api/products retourne du XML.
- POST /api/products attend du XML.

Exemple CSV:

```
name,price,quantity
Chaise,100,5
Table,300,2
PC,2000,1
```

Etapes:
1) Lire le CSV dans React (Papa Parse)
2) Transformer chaque ligne en objet JS
3) Generer le XML au format PrestaShop
4) POST vers l API PrestaShop

### 1) Lire le CSV (Papa Parse)

Installation:

```bash
npm i papaparse
```

Exemple React:

```jsx
import { useState } from "react";
import Papa from "papaparse";

export function useCsvReader() {
  const [rows, setRows] = useState([]);

  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setRows(results.data || []);
      },
    });
  };

  return { rows, onFileChange };
}
```

Resultat:

```js
[
  { name: "Chaise", price: "100", quantity: "5" },
  { name: "Table", price: "300", quantity: "2" },
]
```

### 2) Transformer CSV -> objet PrestaShop

Exemple objet:

```js
const product = {
  name: "Chaise",
  price: "100",
  quantity: "5",
};
```

### 3) Generer XML PrestaShop

Exemple XML attendu:

```xml
<prestashop>
  <product>
    <price>100</price>
    <name>
      <language id="1">Chaise</language>
    </name>
    <quantity>5</quantity>
  </product>
</prestashop>
```

Generation XML:

```jsx
import { XMLBuilder } from "fast-xml-parser";

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export function buildProductXml(row, langId = 1) {
  const obj = {
    prestashop: {
      product: {
        price: String(row.price),
        quantity: String(row.quantity),
        name: {
          language: {
            "@_id": langId,
            "#text": row.name,
          },
        },
      },
    },
  };

  return builder.build(obj);
}
```

### 4) Envoyer vers PrestaShop (XML)

```jsx
import api from "./api";

export async function sendProductXml(xml) {
  const res = await api.post("/prestashop/api/products", xml, {
    headers: {
      "Content-Type": "application/xml",
      Accept: "application/xml",
    },
  });

  return res.data;
}
```

### Exemple complet (workflow)

```jsx
const onImport = async (rows) => {
  for (const row of rows) {
    const xml = buildProductXml(row);
    await sendProductXml(xml);
  }
};
```

Notes:
- React peut appeler directement l API PrestaShop (sans backend Node/Spring).
- JS sert d intermediaire: CSV -> JS -> XML.
- Si besoin de perf, envoyer en batch (Promise.all avec limite).


