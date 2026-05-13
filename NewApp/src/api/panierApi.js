import axios from "axios";
import { XMLParser } from "fast-xml-parser";

const apiKey = import.meta.env.VITE_PS_API_KEY;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
});

export const fetchPanier = async (customerId) => {
    const res = await axios.get('/api/api/carts?display=full&filter[id_customer]=' + customerId, {
        headers: {
            Authorization: `Basic ${btoa(apiKey + ":")}`,
            Accept: "application/xml",
        },
        responseType: "text",
    });
    const data = parser.parse(res.data);
    return data?.prestashop?.carts?.cart || [];
};

export const addToPanier = async (customerId, productId, quantity) => {
    const cartData = `
    <prestashop>
      <cart>
        <id_customer>${customerId}</id_customer>
        <associations>
          <cart_rows>
            <cart_row>
              <id_product>${productId}</id_product>
              <quantity>${quantity}</quantity>
            </cart_row>
          </cart_rows>
        </associations>
      </cart>
    </prestashop>`;

    return axios.post('/api/api/carts', cartData, {
        headers: {
            Authorization: `Basic ${btoa(apiKey + ":")}`,
            "Content-Type": "application/xml",
        },
    });
}