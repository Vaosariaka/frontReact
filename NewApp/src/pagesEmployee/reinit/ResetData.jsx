import { useState } from "react";
import axios from "axios";
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
    if (status === 404 || status === 405) {
      return false;
    }
    console.error(`Error deleting ${resource} ${id}:`, error);
    return false;
  }
};

const fetchAll = async (resource, collectionKey, itemKey) => {
  try {
    const res = await axios.get(`/api/api/${resource}?display=full`, {
      headers: authHeaders,
      responseType: "text",
    });
    return parseCollection(res.data, collectionKey, itemKey);
  } catch(e) {
    console.warn("Error fetching " + resource, e);
    return [];
  }
};

export default function ResetData() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const onReset = async () => {
    if (!confirm("Confirmer la reinitialisation de TOUTES les données ?")) return;
    setLoading(true);
    setMessage("Suppression en cours...");
    try {
      let deletedProducts = 0;
      let deletedOrders = 0;
      let deletedCustomers = 0;
      let deletedCarts = 0;
      let deletedAddresses = 0;
      let deletedCombinations = 0;

      // DELETE ORDERS
      const orders = await fetchAll("orders", "orders", "order");
      for (const o of orders) {
        if (o?.id) {
          if (await safeDeleteById("orders", o.id)) deletedOrders++;
        }
      }

      // DELETE CARTS
      const carts = await fetchAll("carts", "carts", "cart");
      for (const c of carts) {
        if (c?.id) {
          if (await safeDeleteById("carts", c.id)) deletedCarts++;
        }
      }

      // DELETE COMBINATIONS
      const combinations = await fetchAll("combinations", "combinations", "combination");
      for (const c of combinations) {
        if (c?.id) {
          if (await safeDeleteById("combinations", c.id)) deletedCombinations++;
        }
      }

      // DELETE PRODUCTS
      const products = await fetchAll("products", "products", "product");
      for (const p of products) {
        if (p?.id) {
          if (await safeDeleteById("products", p.id)) deletedProducts++;
        }
      }

      // DELETE ADDRESSES
      const addresses = await fetchAll("addresses", "addresses", "address");
      for (const a of addresses) {
        if (a?.id) {
          if (await safeDeleteById("addresses", a.id)) deletedAddresses++;
        }
      }

      // DELETE CUSTOMERS
      const customers = await fetchAll("customers", "customers", "customer");
      for (const c of customers) {
        if (c?.id) {
          if (await safeDeleteById("customers", c.id)) deletedCustomers++;
        }
      }

      setMessage(
        `Reinit terminee: ${deletedProducts} produits, ${deletedCombinations} combinaisons, ${deletedOrders} commandes, ${deletedCarts} paniers, ${deletedAddresses} adresses, ${deletedCustomers} clients supprimes.`
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
        {loading ? "En cours..." : "Reinitialiser TOUTES les données"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}
