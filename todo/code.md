# Codes utiles React pour appeler les API (XML)

Ce fichier rassemble des blocs de code reutilisables pour appeler les API XML et gerer l etat front.

## 1) Client Axios + headers XML

```jsx
import axios from "axios";

export const api = axios.create({
  baseURL: "/api",
  headers: {
    Accept: "application/xml",
  },
  responseType: "text",
});
```

## 2) Parser / Builder XML

```jsx
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

## 3) Fonction GET generique

```jsx
import { api } from "./api";
import { xmlParser } from "./xml";

export async function getXml(path) {
  const res = await api.get(path);
  return xmlParser.parse(res.data);
}
```

## 4) Fonction POST generique (JSON -> XML)

```jsx
import { api } from "./api";
import { xmlBuilder, xmlParser } from "./xml";

export async function postXml(path, payload) {
  const xmlBody = xmlBuilder.build(payload);

  const res = await api.post(path, xmlBody, {
    headers: { "Content-Type": "application/xml" },
  });

  return xmlParser.parse(res.data);
}
```

## 5) Hook React pour import (reset + fetch)

```jsx
import { useCallback, useRef, useState } from "react";
import { api } from "./api";
import { xmlParser } from "./xml";

export function useImportData() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const resetFront = useCallback(() => {
    setItems([]);
    setError(null);
    setLoading(false);
    localStorage.removeItem("import_cache");
    if (abortRef.current) abortRef.current.abort();
  }, []);

  const runImport = useCallback(async () => {
    resetFront();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const res = await api.get("/prestashop/api/currencies", {
        signal: controller.signal,
      });

      const data = xmlParser.parse(res.data);
      setItems(data);
      localStorage.setItem("import_cache", JSON.stringify(data));
    } catch (err) {
      if (err.name !== "CanceledError" && err.name !== "AbortError") {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [resetFront]);

  return { items, loading, error, runImport, resetFront };
}
```

## 6) Utilisation dans un composant

```jsx
import { useImportData } from "./useImportData";

export default function ImportPage() {
  const { items, loading, error, runImport } = useImportData();

  return (
    <div>
      <button onClick={runImport}>Importer</button>
      {loading && <p>Chargement...</p>}
      {error && <p>Erreur: {String(error.message || error)}</p>}
      <pre>{JSON.stringify(items, null, 2)}</pre>
    </div>
  );
}
```

## 7) Mapping simple XML -> tableau

```jsx
export function mapCurrencies(xmlJson) {
  const list = xmlJson?.currencies?.currency;
  if (!list) return [];
  return Array.isArray(list) ? list : [list];
}
```

## 8) Helper d auth Basic (cle API)

```jsx
export function buildBasicAuthHeader(apiKey) {
  return `Basic ${btoa(apiKey + ":")}`;
}
```

Note: si tu veux ajouter l auth au client Axios, utilise:

```jsx
api.defaults.headers.Authorization = buildBasicAuthHeader(import.meta.env.VITE_PS_API_KEY);
```
