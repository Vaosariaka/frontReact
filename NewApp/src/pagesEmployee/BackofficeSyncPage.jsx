import { useEffect, useState } from "react";
import { fetchProducts } from "../api/productsApi";
import { fetchCategories } from "../api/categoriesApi";
import { fetchEmployees } from "../api/employeesApi";
import { fetchCustomers } from "../api/customersApi";
import { fetchOrders } from "../api/ordersApi";

const toArray = (value) => (Array.isArray(value) ? value : value ? [value] : []);
const toText = (value) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (typeof value === "object") {
    if (value["#text"] !== undefined && value["#text"] !== null) return String(value["#text"]);
    if (value.language) {
      const lang = Array.isArray(value.language) ? value.language[0] : value.language;
      if (lang && lang["#text"] !== undefined && lang["#text"] !== null) return String(lang["#text"]);
    }
  }
  return "-";
};

export default function BackofficeSyncPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    products: [],
    categories: [],
    employees: [],
    customers: [],
    orders: [],
  });

  const loadAll = async () => {
    setLoading(true);
    try {
      const [products, categories, employees, customers, orders] = await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchEmployees(),
        fetchCustomers(),
        fetchOrders(),
      ]);

      setData({
        products: toArray(products),
        categories: toArray(categories),
        employees: toArray(employees),
        customers: toArray(customers),
        orders: toArray(orders),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>Controle Sync BackOffice</h2>
      <p>Ces donnees sont relues depuis l API PrestaShop. Si elles changent ici, elles existent en BackOffice.</p>
      <button onClick={loadAll} disabled={loading}>
        {loading ? "Rafraichissement..." : "Rafraichir"}
      </button>

      <ul>
        <li>Produits: {data.products.length}</li>
        <li>Categories: {data.categories.length}</li>
        <li>Employes: {data.employees.length}</li>
        <li>Clients: {data.customers.length}</li>
        <li>Commandes: {data.orders.length}</li>
      </ul>

      <h3>Derniers produits</h3>
      <ul>
        {data.products.slice(0, 10).map((p) => (
          <li key={toText(p.id)}>{toText(p.id)} - {toText(p.name)}</li>
        ))}
      </ul>

      <h3>Dernieres commandes</h3>
      <ul>
        {data.orders.slice(0, 10).map((o) => (
          <li key={toText(o.id)}>
            {toText(o.id)} - {toText(o.reference)} - etat {toText(o.current_state)}
          </li>
        ))}
      </ul>
    </div>
  );
}
