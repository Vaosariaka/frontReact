import axios from "axios";
import { XMLBuilder, XMLParser } from "fast-xml-parser";

const apiKey = import.meta.env.VITE_PS_API_KEY;

const builder = new XMLBuilder({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

const buildAuthHeaders = () => ({
  Authorization: `Basic ${btoa(apiKey + ":")}`,
  "Content-Type": "application/xml",
});

const formatAmount = (value) => {
  const num = Number(value || 0);
  return Number.isFinite(num) ? num.toFixed(6) : "0.000000";
};

export const submitOrderToPrestashop = async (customer, items) => {
  const customerId = customer.id;
  const firstname = customer.firstname || "Client";
  const lastname = customer.lastname || "Prestashop";

  // 1. Fetch secure_key
  const resCust = await axios.get(`/api/api/customers/${customerId}`, {
    headers: { Authorization: `Basic ${btoa(apiKey + ":")}`, Accept: "application/xml" }
  });
  const custData = parser.parse(resCust.data);
  const secureKey = custData?.prestashop?.customer?.secure_key || "";

  // 2. Create Address
  const objAddr = {
    prestashop: {
      address: {
        id_customer: String(customerId),
        // France = 8
        id_country: "8", 
        alias: "Mon Adresse",
        firstname,
        lastname,
        address1: "Adresse de livraison",
        city: "Paris",
        postcode: "75000",
        active: "1",
      }
    }
  };
  const xmlAddr = builder.build(objAddr);
  const resAddr = await axios.post("/api/api/addresses", xmlAddr, { headers: buildAuthHeaders() });
  const addrData = parser.parse(resAddr.data);
  const addressId = addrData?.prestashop?.address?.id;
  
  if (!addressId) throw new Error("Failed to create address");

  // 3. Create Cart
  const cartRows = items.map(item => ({
    id_product: String(item.id),
    id_product_attribute: "0",
    quantity: String(item.quantity)
  }));

  const objCart = {
    prestashop: {
      cart: {
        id_customer: String(customerId),
        id_address_delivery: String(addressId),
        id_address_invoice: String(addressId),
        // Euro = 1
        id_currency: "1", 
        id_lang: "1",
        id_shop: "1",
        id_shop_group: "1",
        id_carrier: "1",
        associations: { cart_rows: { cart_row: cartRows } }
      }
    }
  };
  const xmlCart = builder.build(objCart);
  const resCart = await axios.post("/api/api/carts", xmlCart, { headers: buildAuthHeaders() });
  const cartData = parser.parse(resCart.data);
  const cartId = cartData?.prestashop?.cart?.id;

  if (!cartId) throw new Error("Failed to create cart");

  // 4. Create Order
  let totalProducts = 0;
  const orderRows = items.map(item => {
    const price = Number(item.price || 0);
    const qty = Number(item.quantity || 1);
    totalProducts += price * qty;
    return {
      product_id: String(item.id),
      product_attribute_id: "0",
      product_quantity: String(qty),
      product_name: item.name || "Produit",
      product_price: String(price),
    };
  });

  const objOrder = {
    prestashop: {
      order: {
        id_address_delivery: String(addressId),
        id_address_invoice: String(addressId),
        id_cart: String(cartId),
        id_currency: "1",
        id_lang: "1",
        id_customer: String(customerId),
        id_carrier: "1",
        // status 3 is processing
        current_state: "3", 
        module: "ps_cashondelivery",
        payment: "Paiement a la livraison",
        secure_key: secureKey,
        conversion_rate: "1",
        id_shop: "1",
        id_shop_group: "1",
        total_paid: formatAmount(totalProducts),
        total_paid_tax_incl: formatAmount(totalProducts),
        total_paid_tax_excl: formatAmount(totalProducts),
        total_paid_real: formatAmount(totalProducts),
        total_products: formatAmount(totalProducts),
        total_products_wt: formatAmount(totalProducts),
        total_shipping: "0.000000",
        total_shipping_tax_incl: "0.000000",
        total_shipping_tax_excl: "0.000000",
        total_discounts: "0.000000",
        total_discounts_tax_incl: "0.000000",
        total_discounts_tax_excl: "0.000000",
        total_wrapping: "0.000000",
        total_wrapping_tax_incl: "0.000000",
        total_wrapping_tax_excl: "0.000000",
        valid: "1",
        associations: { order_rows: { order_row: orderRows } }
      }
    }
  };
  
  const xmlOrder = builder.build(objOrder);
  const resOrder = await axios.post("/api/api/orders", xmlOrder, { headers: buildAuthHeaders() });
  const mappedOrder = parser.parse(resOrder.data);
  return mappedOrder?.prestashop?.order;
};