import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const apiKey = import.meta.env.VITE_PS_API_KEY;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export const fetchEmployees = async () => {
  const res = await axios.get(
    "/api/api/employees?display=full",
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

  return data?.prestashop?.employees?.employee || [];
};