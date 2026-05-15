import axios from "axios";
import { XMLBuilder, XMLParser } from "fast-xml-parser";

const apiKey = import.meta.env.VITE_PS_API_KEY;
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});
const builder = new XMLBuilder({
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
  const xml = builder.build({
    prestashop: {
      order_history: {
        id_order: String(orderId),
        id_order_state: String(stateId),
      },
    },
  });

  return axios.post("/api/api/order_histories", xml, {
    headers: {
      Authorization: `Basic ${btoa(apiKey + ":")}`,
      "Content-Type": "application/xml",
    },
  });
}

export async function fetchOrderStateIdByKeywords(keywords = []) {
  const res = await axios.get("/api/api/order_states?display=full", {
    headers: {
      Authorization: `Basic ${btoa(apiKey + ":")}`,
      Accept: "application/xml",
    },
    responseType: "text",
  });

  const data = parser.parse(res.data);
  const states = data?.prestashop?.order_states?.order_state || [];
  const normalized = Array.isArray(states) ? states : [states];
  const lowered = keywords.map((k) => String(k).toLowerCase());

  const extractName = (state) => {
    const nameField = state?.name;
    if (!nameField) return "";
    if (typeof nameField === "string") return nameField.toLowerCase();
    const lang = Array.isArray(nameField.language) ? nameField.language[0] : nameField.language;
    const txt = lang?.["#text"] || nameField?.["#text"] || "";
    return String(txt).toLowerCase();
  };

  const found = normalized.find((state) => {
    const name = extractName(state);
    return lowered.some((kw) => name.includes(kw));
  });

  return found?.id || null;
}

export async function fetchOrderStates() {
  const res = await axios.get("/api/api/order_states?display=full", {
    headers: {
      Authorization: `Basic ${btoa(apiKey + ":")}`,
      Accept: "application/xml",
    },
    responseType: "text",
  });
  const data = parser.parse(res.data);
  const states = data?.prestashop?.order_states?.order_state || [];
  return Array.isArray(states) ? states : [states];
}

export async function fetchOrdersByCustomer(customerId) {
  const res = await axios.get(`/api/api/orders?display=full&filter[id_customer]=${customerId}`, {
    headers: {
      Authorization: `Basic ${btoa(apiKey + ":")}`,
      Accept: "application/xml",
    },
    responseType: "text",
  });
  const data = parser.parse(res.data);
  const orders = data?.prestashop?.orders?.order || [];
  return Array.isArray(orders) ? orders : [orders];
}
