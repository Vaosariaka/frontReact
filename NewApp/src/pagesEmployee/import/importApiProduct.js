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

const formatPrice = (value) => {
  if (!Number.isFinite(value)) return undefined;
  return value.toFixed(6);
};



const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const toIsoDate = (value) => {
  if (!value) return undefined;
  const str = String(value).trim();
  const parts = str.split(/[\/.-]/).map((p) => p.trim());
  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (a.length === 4) return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`;
    return `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
  }
  return str;
};

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

const fetchCategoryIdByName = async (name) => {
  if (!name) return null;
  const res = await axios.get(
    `/api/api/categories?display=full&filter[name]=${encodeURIComponent(name)}`,
    {
      headers: {
        Authorization: `Basic ${btoa(apiKey + ":")}`,
        Accept: "application/xml",
      },
      responseType: "text",
    }
  );

  return parseFirstId(res.data, "categories", "category");
};

const createCategory = async ({ name, parentId, langId }) => {
  const obj = {
    prestashop: {
      category: {
        active: "1",
        id_parent: String(parentId),
        name: {
          language: {
            "@_id": String(langId),
            "#text": name,
          },
        },
        link_rewrite: {
          language: {
            "@_id": String(langId),
            "#text": slugify(name) || "categorie",
          },
        },
      },
    },
  };

  const xml = builder.build(obj);
  const res = await axios.post("/api/api/categories", xml, {
    headers: buildAuthHeaders(),
  });
  const payload = parser.parse(res.data);
  return payload?.prestashop?.category?.id || null;
};

const ensureCategoryId = async ({ name, parentId, langId }) => {
  if (!name) return null;
  const existing = await fetchCategoryIdByName(name);
  if (existing) return existing;
  return createCategory({ name, parentId, langId });
};

const parseTaxRate = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const str = String(value).trim();
  const numeric = toNumber(str);
  if (numeric === null) return null;

  if (str.includes("%")) return numeric / 100;
  if (numeric > 0 && numeric <= 1) return numeric;
  if (numeric > 1 && numeric <= 100) return numeric / 100;
  return null;
};

const parseTaxRulesGroupId = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const str = String(value).trim();
  if (str.includes("%")) return null;
  const numeric = toNumber(str);
  if (numeric === null) return null;
  if (Number.isInteger(numeric) && numeric > 0 && numeric > 1) {
    return numeric;
  }
  return null;
};

export const createProduct = async (row, defaults = {}) => {
  const {
    date_availability_produit,
    nom,
    reference,
    prix_ttc,
    Taxe,
    categorie,
    prix_achat,
  } = row;

  const langId = defaults.langId || 1;
  const parentCategoryId = defaults.parentCategoryId || 2;
  const defaultTaxRulesGroupId = defaults.taxRulesGroupId || 1;
  const countryId = defaults.countryId || 8; // France par defaut

  const categoryId = await ensureCategoryId({
    name: categorie,
    parentId: parentCategoryId,
    langId,
  });

  const taxRate = parseTaxRate(Taxe);
  const taxRulesGroupId =
    parseTaxRulesGroupId(Taxe) || defaultTaxRulesGroupId;
  const priceTtc = toNumber(prix_ttc);
  const priceExcl =
    priceTtc && taxRate !== null ? priceTtc / (1 + taxRate) : priceTtc;

  const wholesalePrice = toNumber(prix_achat);




  const productPayload = {
    available_date: toIsoDate(date_availability_produit),
    name: {
      language: {
        "@_id": String(langId),
        "#text": nom || "",
      },
    },
    link_rewrite: {
      language: {
        "@_id": String(langId),
        "#text": slugify(nom) || "produit",
      },
    },
    reference: reference ? String(reference) : undefined,
    price: priceExcl !== null ? formatPrice(priceExcl) : undefined,
    wholesale_price: wholesalePrice !== null ? formatPrice(wholesalePrice) : undefined,
    id_tax_rules_group: String(taxRulesGroupId) ,
    id_category_default: categoryId ? String(categoryId) : undefined,
    id_country_default: String(countryId),
    visibility: "both",
    available_for_order: "1",
    show_price: "1",
    active: "1",
  };

  if (categoryId) {
    productPayload.associations = {
      categories: {
        category: {
          id: String(categoryId),
        },
      },
    };
  }

  const obj = {
    prestashop: {
      product: productPayload,
    },
  };

  const xml = builder.build(obj);

  return axios.post("/api/api/products", xml, {
    headers: buildAuthHeaders(),
  });
};
