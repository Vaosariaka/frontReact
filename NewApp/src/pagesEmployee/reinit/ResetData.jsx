import { useState } from "react";
import axios from "axios";
import Papa from "papaparse";
import { XMLParser } from "fast-xml-parser";

const apiKey = import.meta.env.VITE_PS_API_KEY;
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

const authHeaders = {
  Authorization: `Basic ${btoa(apiKey + ":")}`,
  Accept: "application/xml",
};

const readCsv = async (path) => {
  const res = await fetch(path);
  const text = await res.text();
  return new Promise((resolve) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
      delimiter: ",",
      transformHeader: (h) => String(h || "").replace(/^\uFEFF/, "").trim(),
      complete: (results) => resolve(results.data || []),
    });
  });
};

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);

const parseCollection = (xml, collectionKey, itemKey) => {
  const payload = parser.parse(xml);
  const items = payload?.prestashop?.[collectionKey]?.[itemKey];
  return toArray(items);
};

const deleteById = (resource, id) =>
  axios.delete(`/api/api/${resource}/${id}`, {
    headers: authHeaders,
  });

const safeDeleteById = async (resource, id) => {
  try {
    await deleteById(resource, id);
    return true;
  } catch (error) {
    const status = error?.response?.status;
    // Certains endpoints PrestaShop (ex: stock_availables) refusent DELETE.
    if (status === 404 || status === 405) {
      return false;
    }
    throw error;
  }
};

const fetchByFilter = async (resource, collectionKey, itemKey, filterQuery) => {
  const res = await axios.get(`/api/api/${resource}?display=full&${filterQuery}`, {
    headers: authHeaders,
    responseType: "text",
  });
  return parseCollection(res.data, collectionKey, itemKey);
};

export default function ResetData() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const onReset = async () => {
    if (!confirm("Confirmer la reinitialisation des donnees importees ?")) return;
    setLoading(true);
    setMessage(null);
    try {
      const csv1 = await readCsv("/csv/import-data-mai-26 - fichier1.csv");
      const csv3 = await readCsv("/csv/import-data-mai-26 - fichier3.csv");

      const references = [...new Set(csv1.map((r) => String(r.reference || "").trim()).filter(Boolean))];
      const emails = [...new Set(csv3.map((r) => String(r.email || "").trim()).filter(Boolean))];

      let deletedProducts = 0;
      let deletedOrders = 0;
      let deletedCustomers = 0;
      let deletedCarts = 0;
      let deletedAddresses = 0;
      let deletedCombinations = 0;
      let deletedStocks = 0;

      // 1) Reset Produits importes (+ combinaisons + stocks lies)
      for (const reference of references) {
        const products = await fetchByFilter(
          "products",
          "products",
          "product",
          `filter[reference]=${encodeURIComponent(reference)}`
        );

        for (const product of products) {
          const productId = product?.id;
          if (!productId) continue;

          const combinations = await fetchByFilter(
            "combinations",
            "combinations",
            "combination",
            `filter[id_product]=${encodeURIComponent(productId)}`
          );
          for (const c of combinations) {
            if (c?.id) {
              const deleted = await safeDeleteById("combinations", c.id);
              if (deleted) deletedCombinations += 1;
            }
          }

          // IMPORTANT: stock_availables peut retourner 405 en DELETE selon la config PS.
          // On laisse la suppression du produit/nettoyage global gérer ces lignes.

          const deletedProduct = await safeDeleteById("products", productId);
          if (deletedProduct) deletedProducts += 1;
        }
      }

      // 2) Reset Clients importes + donnees liees
      for (const email of emails) {
        const customers = await fetchByFilter(
          "customers",
          "customers",
          "customer",
          `filter[email]=${encodeURIComponent(email)}`
        );

        for (const customer of customers) {
          const customerId = customer?.id;
          if (!customerId) continue;

          const orders = await fetchByFilter(
            "orders",
            "orders",
            "order",
            `filter[id_customer]=${encodeURIComponent(customerId)}`
          );
          for (const o of orders) {
            if (o?.id) {
              const deleted = await safeDeleteById("orders", o.id);
              if (deleted) deletedOrders += 1;
            }
          }

          const carts = await fetchByFilter(
            "carts",
            "carts",
            "cart",
            `filter[id_customer]=${encodeURIComponent(customerId)}`
          );
          for (const c of carts) {
            if (c?.id) {
              const deleted = await safeDeleteById("carts", c.id);
              if (deleted) deletedCarts += 1;
            }
          }

          const addresses = await fetchByFilter(
            "addresses",
            "addresses",
            "address",
            `filter[id_customer]=${encodeURIComponent(customerId)}`
          );
          for (const a of addresses) {
            if (a?.id) {
              const deleted = await safeDeleteById("addresses", a.id);
              if (deleted) deletedAddresses += 1;
            }
          }

          const deletedCustomer = await safeDeleteById("customers", customerId);
          if (deletedCustomer) deletedCustomers += 1;
        }
      }

      setMessage(
        `Reinit terminee: ${deletedProducts} produits, ${deletedCombinations} combinaisons, ${deletedStocks} stocks, ${deletedOrders} commandes, ${deletedCarts} paniers, ${deletedAddresses} adresses, ${deletedCustomers} clients supprimes.`
      );
    } catch (error) {
      console.error("Erreur reinitialisation:", error);
      setMessage("Erreur reinitialisation. Voir console pour le detail.");
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
