import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { getOrders } from "../api/frontOfficeStore";

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

  useEffect(() => {
    setOrders(getOrders(user.id));
  }, [user.id]);

  return (
    <div>
      <h2>Mes commandes ({orders.length})</h2>
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
    </div>
  );
}
