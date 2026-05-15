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

const formatAmount = (value) => {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num.toFixed(6) : "0.000000";
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


const extractValue = (field) => {
  if (!field) return "";
  if (typeof field === "string") return field.trim();
  if (typeof field === "number") return field.toString();
  if (typeof field === "object") {
    if (field["#text"] !== undefined) return String(field["#text"]).trim();
    if (field.language) {
      const lang = Array.isArray(field.language) ? field.language[0] : field.language;
      if (lang && lang["#text"] !== undefined) return String(lang["#text"]).trim();
    }
  }
  return "";
};

const splitName = (nom) => {
  const value = String(nom || "").trim();
  if (!value) return { firstname: "", lastname: "" };
  const parts = value.split(/\s+/);
  if (parts.length === 1) return { firstname: parts[0], lastname: parts[0] };
  return {
    firstname: parts[0],
    lastname: parts.slice(1).join(" "),
  };
};

const parsePurchases = (achat) => {
  if (!achat) return [];
  const source = String(achat).trim();
  const tupleRegex = /\("([^"]+)"\s*;\s*(\d+)\s*;\s*"([^"]*)"\)/g;
  const items = [];
  let match;

  while ((match = tupleRegex.exec(source)) !== null) {
    items.push({
      reference: match[1].trim(),
      quantity: Number(match[2]) || 1,
      variant: match[3]?.trim() || "",
    });
  }

  if (items.length) return items;

  const rawItems = source
    .split(/[|,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return rawItems.map((item) => {
    const m = item.match(/^([^:*x]+)[:*x](\d+)$/i);
    if (m) {
      return { reference: m[1].trim(), quantity: Number(m[2]) };
    }
    return { reference: item, quantity: 1 };
  });
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

const fetchOrderStateIdByName = async (name) => {
  if (!name) return null;
  const res = await axios.get(
    `/api/api/order_states?display=full&filter[name]=${encodeURIComponent(name)}`,
    {
      headers: {
        Authorization: `Basic ${btoa(apiKey + ":")}`,
        Accept: "application/xml",
      },
      responseType: "text",
    }
  );

  return parseFirstId(res.data, "order_states", "order_state");
};

const createCustomer = async ({ firstname, lastname, email, passwd, langId }) => {
  // on enregistre le passwd (qui est crypté en base64) dans le champ note de l'API prestashop pour pouvoir le décrypter au login côté React

  const obj = {
    prestashop: {
      customer: {
        firstname,
        lastname,
        email,
        passwd, // prestashop hashe ce mot de passe lui même
        note: passwd, // On le met dans la note pour la logique côté REACT
        id_lang: String(langId),
        active: "1",
      },
    },
  };

  const xml = builder.build(obj);
  const res = await axios.post("/api/api/customers", xml, {
    headers: buildAuthHeaders(),
  });

  const payload = parser.parse(res.data);
  return payload?.prestashop?.customer?.id || null;
};

const fetchCustomerByEmail = async (email) => {
  const res = await axios.get(
    `/api/api/customers?display=full&filter[email]=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Basic ${btoa(apiKey + ":")}`,
        Accept: "application/xml",
      },
      responseType: "text",
    }
  );

  const payload = parser.parse(res.data);
  const customer = payload?.prestashop?.customers?.customer;
  if (!customer) return null;
  return Array.isArray(customer) ? customer[0] : customer;
};

const fetchCustomerById = async (id) => {
  const res = await axios.get(`/api/api/customers/${id}`, {
    headers: {
      Authorization: `Basic ${btoa(apiKey + ":")}`,
      Accept: "application/xml",
    },
    responseType: "text",
  });

  const payload = parser.parse(res.data);
  return payload?.prestashop?.customer || null;
};

const createAddress = async ({
  customerId,
  firstname,
  lastname,
  address1,
  city,
  postcode,
  countryId,
  alias,
}) => {
  const obj = {
    prestashop: {
      address: {
        id_customer: String(customerId),
        id_country: String(countryId),
        alias: alias || "Adresse",
        firstname,
        lastname,
        address1,
        city,
        postcode,
        active: "1",
      },
    },
  };

  const xml = builder.build(obj);
  const res = await axios.post("/api/api/addresses", xml, {
    headers: buildAuthHeaders(),
  });

  const payload = parser.parse(res.data);
  return payload?.prestashop?.address?.id || null;
};

const createCart = async ({
  customerId,
  addressDeliveryId,
  addressInvoiceId,
  currencyId,
  langId,
  shopId,
  shopGroupId,
  items,
}) => {
  const cartRows = items.map((item) => ({
    id_product: String(item.productId),
    id_product_attribute: String(item.productAttributeId || 0),
    quantity: String(item.quantity),
  }));

  const obj = {
    prestashop: {
      cart: {
        id_customer: String(customerId),
        id_address_delivery: String(addressDeliveryId),
        id_address_invoice: String(addressInvoiceId),
        id_currency: String(currencyId),
        id_lang: String(langId),
        id_shop: String(shopId),
        id_shop_group: String(shopGroupId),
        associations: {
          cart_rows: {
            cart_row: cartRows,
          },
        },
      },
    },
  };

  const xml = builder.build(obj);
  const res = await axios.post("/api/api/carts", xml, {
    headers: buildAuthHeaders(),
  });

  const payload = parser.parse(res.data);
  return payload?.prestashop?.cart?.id || null;
};

const createOrder = async ({
  cartId,
  customerId,
  addressDeliveryId,
  addressInvoiceId,
  carrierId,
  currencyId,
  langId,
  shopId,
  shopGroupId,
  currentStateId,
  payment,
  module,
  secureKey,
  totals,
  items,
  dateAdd,
}) => {
  const orderRows = items.map((item) => ({
    product_id: String(item.productId),
    product_attribute_id: String(item.productAttributeId || 0),
    product_quantity: String(item.quantity),
    product_name: item.productName || "",
    product_reference: item.productReference || "",
    product_price: String(item.productPrice || 0),
  }));

  const obj = {
    prestashop: {
      order: {
        id_address_delivery: String(addressDeliveryId),
        id_address_invoice: String(addressInvoiceId),
        id_cart: String(cartId),
        id_currency: String(currencyId),
        id_lang: String(langId),
        id_customer: String(customerId),
        id_carrier: String(carrierId),
        current_state: String(currentStateId),
        module,
        payment,
        secure_key: secureKey || "",
        conversion_rate: "1",
        id_shop: String(shopId),
        id_shop_group: String(shopGroupId),
        total_paid: formatAmount(totals.totalPaid),
        total_paid_tax_incl: formatAmount(totals.totalPaidTaxIncl),
        total_paid_tax_excl: formatAmount(totals.totalPaidTaxExcl),
        total_paid_real: formatAmount(totals.totalPaid),
        total_products: formatAmount(totals.totalProducts),
        total_products_wt: formatAmount(totals.totalProductsWt),
        total_shipping: formatAmount(totals.totalShipping),
        total_shipping_tax_incl: formatAmount(totals.totalShipping),
        total_shipping_tax_excl: formatAmount(totals.totalShipping),
        total_discounts: "0.000000",
        total_discounts_tax_incl: "0.000000",
        total_discounts_tax_excl: "0.000000",
        total_wrapping: "0.000000",
        total_wrapping_tax_incl: "0.000000",
        total_wrapping_tax_excl: "0.000000",
        valid: "1",
        date_add: dateAdd || undefined,
        associations: {
          order_rows: {
            order_row: orderRows,
          },
        },
      },
    },
  };

  const xml = builder.build(obj);
  return axios.post("/api/api/orders", xml, {
    headers: buildAuthHeaders(),
  });
};

export const createOrderFromCsvRow = async (row, defaults = {}) => {
  const { date, nom, email, pwd, adresse, achat, etat } = row;
  const { firstname, lastname } = splitName(nom);

  let formattedDate = date || undefined;
  if (formattedDate && formattedDate.includes("/")) {
    const parts = formattedDate.split("/");
    if (parts.length === 3) {
      formattedDate = `${parts[2]}-${parts[1]}-${parts[0]} 00:00:00`;
    }
  }

  const langId = defaults.langId || 1;
  const currencyId = defaults.currencyId || 1;
  const carrierId = defaults.carrierId || 1;
  const shopId = defaults.shopId || 1;
  const shopGroupId = defaults.shopGroupId || 1;
  const countryId = defaults.countryId || 1;
  const addressCity = defaults.city || "Paris";
  const addressPostcode = defaults.postcode || "75001";
  const addressAlias = defaults.addressAlias || "Adresse";
  const payment = defaults.payment || "Import CSV";
  const module = defaults.module || "bankwire";
  const defaultStateId = defaults.defaultStateId || 1;

  if (!firstname || !lastname || !email || !pwd) {
    throw new Error("Donnees client incompletes.");
  }

  const existingCustomer = await fetchCustomerByEmail(email);
  const customerId = existingCustomer?.id
    ? existingCustomer.id
    : await createCustomer({
        firstname,
        lastname,
        email,
        passwd: pwd,
        langId,
      });

  const customer = await fetchCustomerById(customerId);
  const secureKey = customer?.secure_key || "";

  const addressId = await createAddress({
    customerId,
    firstname,
    lastname,
    address1: adresse || "Adresse inconnue",
    city: addressCity,
    postcode: addressPostcode,
    countryId,
    alias: addressAlias,
  });

  const purchases = parsePurchases(achat);
  const items = [];

  for (const purchase of purchases) {
    const product = await fetchProductByReference(purchase.reference);
    if (!product?.id) {
      // On ignore les references inexistantes au lieu de faire echouer toute la commande.
      continue;
    }

    const price = toNumber(product.price) ?? 0;
    items.push({
      productId: product.id,
      productAttributeId: 0,
      quantity: purchase.quantity || 1,
      productName: extractValue(product.name) || "Produit",
      productReference: product.reference || purchase.reference,
      productPrice: price,
    });
  }

  const totals = items.reduce(
    (acc, item) => {
      const line = item.productPrice * item.quantity;
      acc.totalProducts += line;
      acc.totalProductsWt += line;
      return acc;
    },
    {
      totalProducts: 0,
      totalProductsWt: 0,
    }
  );

  const totalShipping = 0;
  const totalPaid = totals.totalProductsWt + totalShipping;
  if (!items.length) {
    throw new Error("Aucun produit valide pour cette commande.");
  }

  const cartId = await createCart({
    customerId,
    addressDeliveryId: addressId,
    addressInvoiceId: addressId,
    currencyId,
    langId,
    shopId,
    shopGroupId,
    items,
  });

  const stateId = (await fetchOrderStateIdByName(etat)) || defaultStateId;

  return createOrder({
    cartId,
    customerId,
    addressDeliveryId: addressId,
    addressInvoiceId: addressId,
    carrierId,
    currencyId,
    langId,
    shopId,
    shopGroupId,
    currentStateId: stateId,
    payment,
    module,
    secureKey,
    totals: {
      totalPaid,
      totalPaidTaxIncl: totalPaid,
      totalPaidTaxExcl: totals.totalProducts,
      totalProducts: totals.totalProducts,
      totalProductsWt: totals.totalProductsWt,
      totalShipping,
    },
    items,
    dateAdd: formattedDate,
  });
};
