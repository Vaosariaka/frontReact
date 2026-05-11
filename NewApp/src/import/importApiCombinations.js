import axios from "axios";
import { XMLBuilder, XMLParser } from "fast-xml-parser";

const apiKey = import.meta.env.VITE_PS_API_KEY;

const builder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  const cleaned = String(value).replace(/[^0-9.,-]/g, "").replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
};

const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const buildAuthHeaders = (contentType = "application/xml") => ({
  Authorization: `Basic ${btoa(apiKey + ":")}`,
  "Content-Type": contentType,
});

const parseFirstId = (data, collectionKey, itemKey) => {
  const payload = parser.parse(data);
  const collection = payload?.prestashop?.[collectionKey]?.[itemKey];
  if (!collection) return null;
  if (Array.isArray(collection)) return collection[0]?.id || null;
  return collection?.id || null;
};

const fetchProductByReference = async (reference) => {
  const res = await axios.get(
    `/api/api/products?display=full&filter[reference]=${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Basic ${btoa(apiKey + ":")}`,
        Accept: "application/xml",
      },
      responseType: "text",
    }
  );

  const payload = parser.parse(res.data);
  const product = payload?.prestashop?.products?.product;
  if (!product) return null;
  return Array.isArray(product) ? product[0] : product;
};

const fetchProductOptionIdByName = async (name) => {
  if (!name) return null;
  const res = await axios.get(
    `/api/api/product_options?display=full&filter[name]=${encodeURIComponent(name)}`,
    {
      headers: {
        Authorization: `Basic ${btoa(apiKey + ":")}`,
        Accept: "application/xml",
      },
      responseType: "text",
    }
  );

  return parseFirstId(res.data, "product_options", "product_option");
};

const createProductOption = async ({ name, langId }) => {
  const obj = {
    prestashop: {
      product_option: {
        is_color_group: "0",
        group_type: "select",
        name: {
          language: {
            "@_id": String(langId),
            "#text": name,
          },
        },
        public_name: {
          language: {
            "@_id": String(langId),
            "#text": name,
          },
        },
      },
    },
  };

  const xml = builder.build(obj);
  const res = await axios.post("/api/api/product_options", xml, {
    headers: buildAuthHeaders(),
  });

  const payload = parser.parse(res.data);
  return payload?.prestashop?.product_option?.id || null;
};

const ensureProductOptionId = async ({ name, langId }) => {
  const existing = await fetchProductOptionIdByName(name);
  if (existing) return existing;
  return createProductOption({ name, langId });
};

const fetchProductOptionValueIdByName = async ({ name, groupId }) => {
  if (!name) return null;
  const res = await axios.get(
    `/api/api/product_option_values?display=full&filter[name]=${encodeURIComponent(
      name
    )}&filter[id_attribute_group]=${encodeURIComponent(groupId)}`,
    {
      headers: {
        Authorization: `Basic ${btoa(apiKey + ":")}`,
        Accept: "application/xml",
      },
      responseType: "text",
    }
  );

  return parseFirstId(res.data, "product_option_values", "product_option_value");
};

const createProductOptionValue = async ({ name, groupId, langId }) => {
  const obj = {
    prestashop: {
      product_option_value: {
        id_attribute_group: String(groupId),
        name: {
          language: {
            "@_id": String(langId),
            "#text": name,
          },
        },
        link_rewrite: {
          language: {
            "@_id": String(langId),
            "#text": slugify(name) || "option",
          },
        },
      },
    },
  };

  const xml = builder.build(obj);
  const res = await axios.post("/api/api/product_option_values", xml, {
    headers: buildAuthHeaders(),
  });

  const payload = parser.parse(res.data);
  return payload?.prestashop?.product_option_value?.id || null;
};

const ensureProductOptionValueId = async ({ name, groupId, langId }) => {
  const existing = await fetchProductOptionValueIdByName({ name, groupId });
  if (existing) return existing;
  return createProductOptionValue({ name, groupId, langId });
};

const createCombination = async ({ productId, optionValueId, priceImpact }) => {
  const obj = {
    prestashop: {
      combination: {
        id_product: String(productId),
        price: priceImpact !== null ? String(priceImpact) : "0",
        associations: {
          product_option_values: {
            product_option_value: {
              id: String(optionValueId),
            },
          },
        },
      },
    },
  };

  const xml = builder.build(obj);
  const res = await axios.post("/api/api/combinations", xml, {
    headers: buildAuthHeaders(),
  });

  const payload = parser.parse(res.data);
  return payload?.prestashop?.combination?.id || null;
};

const fetchStockAvailableId = async ({ productId, combinationId }) => {
  const res = await axios.get(
    `/api/api/stock_availables?display=full&filter[id_product]=${encodeURIComponent(
      productId
    )}&filter[id_product_attribute]=${encodeURIComponent(combinationId)}`,
    {
      headers: {
        Authorization: `Basic ${btoa(apiKey + ":")}`,
        Accept: "application/xml",
      },
      responseType: "text",
    }
  );

  return parseFirstId(res.data, "stock_availables", "stock_available");
};

const upsertStockAvailable = async ({
  productId,
  combinationId,
  quantity,
  shopId,
  shopGroupId,
}) => {
  const existingId = await fetchStockAvailableId({
    productId,
    combinationId,
  });

  const obj = {
    prestashop: {
      stock_available: {
        id: existingId ? String(existingId) : undefined,
        id_product: String(productId),
        id_product_attribute: String(combinationId),
        id_shop: String(shopId),
        id_shop_group: String(shopGroupId),
        quantity: String(quantity),
        depends_on_stock: "0",
        out_of_stock: "2",
      },
    },
  };

  const xml = builder.build(obj);

  if (existingId) {
    return axios.put(`/api/api/stock_availables/${existingId}`, xml, {
      headers: buildAuthHeaders(),
    });
  }

  return axios.post("/api/api/stock_availables", xml, {
    headers: buildAuthHeaders(),
  });
};

export const createCombinationFromCsvRow = async (row, defaults = {}) => {
  const { reference, specificite, karazany, stock_initial, prix_vente_ttc } = row;
  if (!reference || !specificite || !karazany) {
    throw new Error("Donnees manquantes pour la declinaison.");
  }

  const langId = defaults.langId || 1;
  const shopId = defaults.shopId || 1;
  const shopGroupId = defaults.shopGroupId || 1;

  const product = await fetchProductByReference(reference);
  if (!product?.id) {
    throw new Error(`Produit introuvable pour la reference: ${reference}`);
  }

  const groupId = await ensureProductOptionId({ name: specificite, langId });
  const valueId = await ensureProductOptionValueId({
    name: karazany,
    groupId,
    langId,
  });

  const priceImpact = toNumber(prix_vente_ttc) ?? 0;
  const combinationId = await createCombination({
    productId: product.id,
    optionValueId: valueId,
    priceImpact,
  });

  const quantity = toNumber(stock_initial) ?? 0;
  await upsertStockAvailable({
    productId: product.id,
    combinationId: combinationId || 0,
    quantity,
    shopId,
    shopGroupId,
  });

  return combinationId;
};
