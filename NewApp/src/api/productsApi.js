import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const apiKey = import.meta.env.VITE_PS_API_KEY;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

// Extraire la valeur d'un champ qui peut être:
// - string: "value"
// - avec #text: { "#text": "value" }
// - multi-language: { language: { "#text": "value", ... } } ou { language: [{ "#text": "value" }] }
const extractValue = (field) => {
  if (!field) return "";
  
  // Si c'est déjà une string
  if (typeof field === "string") return field.trim();
  if (typeof field === "number") return field.toString();
  if (field instanceof Date) return field.toISOString().split("T")[0];
  
  // Si c'est un objet
  if (typeof field === "object") {
    // Cas 1: objet avec #text direct (ex: { "#text": "value" })
    if (field["#text"] !== undefined && field["#text"] !== null) {
      const textValue = field["#text"];
      return typeof textValue === "string" ? textValue.trim() : String(textValue);
    }
    
    // Cas 2: objet avec language (multi-langue)
    if (field.language) {
      // language peut être un objet ou un tableau
      const lang = Array.isArray(field.language) ? field.language[0] : field.language;
      if (lang && typeof lang === "object" && lang["#text"] !== undefined && lang["#text"] !== null) {
        const langText = lang["#text"];
        return typeof langText === "string" ? langText.trim() : String(langText);
      }
    }
  }

  return "";
};

// Extraire l'image avec l'URL correcte (2 IDs: productId et imageId)
const extractImage = (productId, associations) => {
  if (!associations || !associations.images || !associations.images.image) {
    return "";
  }
  
  const images = associations.images.image;
  const firstImage = Array.isArray(images) ? images[0] : images;
  
  if (!firstImage || !firstImage.id) {
    return "";
  }
  
  const imageId = extractValue(firstImage.id);
  // Donc /api/api/images/... devient http://localhost/prestashop/api/images/...
  return imageId ? `/api/api/images/products/${productId}/${imageId}?ws_key=${apiKey}` : "";
};

const fetchStockByProduct = async () => {
  let res;
  try {
    // Tentative 1: auth Basic (comme les autres endpoints)
    res = await axios.get("/api/api/stock_availables?display=full", {
      headers: {
        Authorization: `Basic ${btoa(apiKey + ":")}`,
        Accept: "application/xml",
      },
      responseType: "text",
    });
  } catch {
    // Tentative 2: ws_key dans l'URL (souvent mieux supporté par PrestaShop)
    res = await axios.get(`/api/api/stock_availables?display=full&ws_key=${apiKey}`, {
      headers: {
        Accept: "application/xml",
      },
      responseType: "text",
    });
  }

  const data = parser.parse(res.data);
  const fromCollection = data?.prestashop?.stock_availables?.stock_available;
  const fromSingle = data?.prestashop?.stock_available;
  const stockItems = fromCollection ?? fromSingle ?? [];
  const normalized = Array.isArray(stockItems)
    ? stockItems
    : stockItems
      ? [stockItems]
      : [];

  const stockMap = new Map();

  normalized.forEach((item) => {
    const productId = extractValue(item.id_product);
    const productAttributeId = extractValue(item.id_product_attribute);
    const quantity = Number(extractValue(item.quantity));

    if (!productId || Number.isNaN(quantity)) return;

    // Priorise la ligne "produit simple" (id_product_attribute = 0)
    if (productAttributeId === "0" || !stockMap.has(productId)) {
      stockMap.set(productId, quantity);
    }
  });

  return stockMap;
};
export const fetchProducts = async () => {
  const productsRes = await axios.get("/api/api/products?display=full", {
    headers: {
      Authorization: `Basic ${btoa(apiKey + ":")}`,
      Accept: "application/xml",
    },
    responseType: "text",
  });

  let stockMap = new Map();
  try {
    stockMap = await fetchStockByProduct();
  } catch (error) {
    console.error("Erreur récupération stock_availables:", error);
    stockMap = new Map();
  }

  const data = parser.parse(productsRes.data);
  const products = data?.prestashop?.products?.product || [];
  
  // Normaliser pour avoir une structure cohérente
  const normalized = Array.isArray(products) ? products : [products];
  
  return normalized.map(p => ({
    id: p.id,
    name: extractValue(p.name) || "produitss",
    price: typeof p.price === "string" ? parseFloat(p.price) : (p.price || 0),
    image: extractImage(p.id, p.associations) || "",
  stock_available:
    stockMap.get(String(p.id)) > 0
      ? stockMap.get(String(p.id))
      : "rupture de stock",    
    description: extractValue(p.description) || "",
  }));
};

export const fetchProductsById = async (productId) => {
  const res = await axios.get(`/api/api/products/${productId}?display=full`, {
    headers: {  
      Authorization: `Basic ${btoa(apiKey + ":")}`,
      Accept: "application/xml",
    },
    responseType: "text",
  });

  const data = parser.parse(res.data);
  const product = data?.prestashop?.product;
  
  if (!product) {
    throw new Error("Produit non trouvé");
  }

  return {
    id: product.id,
    name: extractValue(product.name) || "produitss",
    price: typeof product.price === "string" ? parseFloat(product.price) : (product.price || 0),
    image: extractImage(product.id, product.associations) || "",
    stock_available: "stock non disponible", // Optionnel, à récupérer séparément si besoin
    description: extractValue(product.description) || "",
  };
};

// const fetchProductOptionValueIdByName = async ({ name, groupId }) => {
//   const res = await axios.get(
//     `/api/api/product_option_values?display=full&filter[name]=${encodeURIComponent(name)}&filter[id_product_option_group]=${encodeURIComponent(groupId)}`,
//     {
//       headers: {
//         Authorization: `Basic ${btoa(apiKey + ":")}`,
//         Accept: "application/xml",
//       },
//       responseType: "text",
//     }
//   );

//   const data = parser.parse(res.data);
//   const values = data?.prestashop?.product_option_values?.product_option_value || [];
//   const normalized = Array.isArray(values) ? values : [values];
  
//   return normalized.length > 0 ? normalized[0].id : null;
// };

