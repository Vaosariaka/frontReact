import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../auth/AuthContext";
import { fetchOrdersByCustomer, fetchOrderStates } from "../api/ordersApi";

const formatDate = (isoDate) => {
  try {
    return new Date(isoDate).toLocaleString();
  } catch {
    return isoDate;
  }
};

export default function MesCommandesPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [statesMap, setStatesMap] = useState({});

  const loadData = useCallback(async () => {
    if (user.method === "anonymous") {
      setOrders([]);
      return;
    }
    
    try {
      const [orderStates, customerOrders] = await Promise.all([
        fetchOrderStates(),
        fetchOrdersByCustomer(user.id)
      ]);
      
      const map = {};
      orderStates.forEach(st => {
        let name = "Inconnu";
        if (st.name) {
          const lang = Array.isArray(st.name.language) ? st.name.language[0] : st.name.language;
          name = lang?.["#text"] || st.name?.["#text"] || st.name;
        }
        map[st.id] = name;
      });
      setStatesMap(map);
      
      const formatted = customerOrders.filter(Boolean).map(o => ({
        id: o.id,
        date: o.date_add,
        state: map[o.current_state] || `Etat ${o.current_state}`,
        paymentMethod: o.payment,
        shippingCost: o.total_shipping,
        total: o.total_paid
      }));
      setOrders(formatted.reverse()); // Sort by newest first
    } catch(err) {
      console.error(err);
    }
  }, [user.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div>
      <h2>Mes commandes</h2>
      {user.method === "anonymous" ? (
        <p style={{ padding: "20px", backgroundColor: "#f9f9f9", border: "1px solid #ccc", borderRadius: "4px" }}>
          Veuillez vous connecter avec un compte client pour voir vos commandes.
        </p>
      ) : (
        <>
          <div className="table-wrap">
            <table className="client-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Date</th>
                  <th>Etat</th>
                  <th>Paiement</th>
                  <th>Livraison</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{formatDate(order.date)}</td>
                    <td>{order.state}</td>
                    <td>{order.paymentMethod}</td>
                    <td>{Number(order.shippingCost || 0).toFixed(2)}</td>
                    <td>{Number(order.total || 0).toFixed(2)}</td>
                  </tr>
                ))}
                {!orders.length ? (
                  <tr>
                    <td colSpan="6">Aucune commande pour le moment.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
