const CART_KEY = "fo_cart_items";
const ORDER_KEY = "fo_orders";

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getCartItems = (customerId) => {
  const all = readJson(CART_KEY, {});
  return all[String(customerId)] || [];
};

export const addCartItem = (customerId, product, quantity = 1) => {
  const id = String(customerId);
  const all = readJson(CART_KEY, {});
  const items = all[id] || [];
  const existing = items.find((item) => String(item.id) === String(product.id));

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({
      id: product.id,
      name: product.name,
      image: product.image,
      price: Number(product.price || 0),
      quantity,
    });
  }

  all[id] = items;
  writeJson(CART_KEY, all);
  return items;
};

export const updateCartItemQty = (customerId, productId, quantity) => {
  const id = String(customerId);
  const all = readJson(CART_KEY, {});
  const items = (all[id] || []).map((item) =>
    String(item.id) === String(productId) ? { ...item, quantity: Math.max(1, Number(quantity) || 1) } : item
  );
  all[id] = items;
  writeJson(CART_KEY, all);
  return items;
};

export const removeCartItem = (customerId, productId) => {
  const id = String(customerId);
  const all = readJson(CART_KEY, {});
  all[id] = (all[id] || []).filter((item) => String(item.id) !== String(productId));
  writeJson(CART_KEY, all);
  return all[id];
};

export const clearCart = (customerId) => {
  const id = String(customerId);
  const all = readJson(CART_KEY, {});
  all[id] = [];
  writeJson(CART_KEY, all);
};

export const getOrders = (customerId) => {
  const all = readJson(ORDER_KEY, {});
  return all[String(customerId)] || [];
};

export const createOrderCOD = (customer, items) => {
  const customerId = String(customer.id);
  const all = readJson(ORDER_KEY, {});
  const orders = all[customerId] || [];

  const totalProducts = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const shippingCost = 0;
  const total = totalProducts + shippingCost;

  const order = {
    id: `CMD-${Date.now()}`,
    date: new Date().toISOString(),
    state: "En attente",
    paymentMethod: "Paiement a la livraison",
    shippingCost,
    totalProducts,
    total,
    items,
  };

  all[customerId] = [order, ...orders];
  writeJson(ORDER_KEY, all);
  clearCart(customerId);
  return order;
};
