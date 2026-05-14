import { useEffect, useState } from "react";
import {
  fetchOrders,
  fetchOrderStateIdByKeywords,
  updateOrderState,
} from "../api/ordersApi";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [paidStateId, setPaidStateId] = useState(null);
  const [canceledStateId, setCanceledStateId] = useState(null);

  useEffect(() => {
    fetchOrders().then(setOrders);
    fetchOrderStateIdByKeywords(["paiement accepte", "payment accepted"]).then(setPaidStateId);
    fetchOrderStateIdByKeywords(["annule", "canceled"]).then(setCanceledStateId);
  }, []);

  const onChangeState = async (orderId, stateId) => {
    if (!stateId) return;
    await updateOrderState(orderId, stateId);
  };

  const toText = (value) => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (typeof value === "object" && value["#text"] !== undefined && value["#text"] !== null) {
      return String(value["#text"]);
    }
    return "-";
  };

  return (
    <ul>
      {orders.map((o) => (
        <li key={toText(o.id)}>
          {toText(o.reference) !== "-" ? toText(o.reference) : `Commande #${toText(o.id)}`}
          <button disabled={!paidStateId} onClick={() => onChangeState(toText(o.id), paidStateId)}>
            Paiement effectue
          </button>
          <button disabled={!canceledStateId} onClick={() => onChangeState(toText(o.id), canceledStateId)}>
            Annule
          </button>
        </li>
      ))}
    </ul>
  );
}
