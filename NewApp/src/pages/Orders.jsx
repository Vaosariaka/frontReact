import { useEffect, useState } from "react";
import { fetchOrders, updateOrderState } from "../api/ordersApi";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders().then(setOrders);
  }, []);

  const onChangeState = async (orderId, stateId) => {
    await updateOrderState(orderId, stateId);
  };

  return (
    <ul>
      {orders.map((o) => (
        <li key={o.id}>
          {o.reference}
          <button onClick={() => onChangeState(o.id, "PAID")}>Paiement effectue</button>
          <button onClick={() => onChangeState(o.id, "FAILED")}>Echec paiement</button>
          <button onClick={() => onChangeState(o.id, "CANCELED")}>Annule</button>
        </li>
      ))}
    </ul>
  );
}