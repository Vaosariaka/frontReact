import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const apiKey = import.meta.env.VITE_PS_API_KEY;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export const fetchProducts = async () => {
  const res = await axios.get(
    "/api/api/products?display=full",
    {
      headers: {
        Authorization:
          `Basic ${btoa(apiKey + ":")}`,

        Accept: "application/xml",
      },

      responseType: "text",
    }
  );

  const data = parser.parse(res.data);

  return data?.prestashop?.products?.product || [];
};