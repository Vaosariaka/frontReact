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