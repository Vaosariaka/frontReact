import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  clearCart,
  getCartItems,
  removeCartItem,
  updateCartItemQty,
} from "../api/frontOfficeStore";
import { submitOrderToPrestashop } from "../api/checkoutApi";

export default function PanierPage() {
  const { user } = useAuth();
  const [items, setItems] = useState(() => getCartItems(user.id));
  const [message, setMessage] = useState("");

  const totalProducts = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    [items]
  );
  const shippingCost = 0;
  const total = totalProducts + shippingCost;

  const onValidateOrder = async () => {
    if (!items.length) return;
    
    if (user.method === "anonymous") {
      setMessage("Veuillez vous connecter avec un compte client pour valider votre commande.");
      return;
    }
    
    setMessage("Validation de la commande en cours...");
    try {
      const order = await submitOrderToPrestashop(user, items);
      clearCart(user.id);
      setItems(getCartItems(user.id));
      setMessage(`Commande #${order.id} validee avec succes !`);
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors de la validation de la commande.");
    }
  };

  return (
    <div>
      <h2>Panier ({items.length})</h2>
      {message ? <p>{message}</p> : null}

      <div className="table-wrap">
        <table className="client-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Photo</th>
              <th>Nom</th>
              <th>Prix</th>
              <th>Quantite</th>
              <th>Total ligne</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>
                  {item.image ? (
                    <img className="product-image" src={item.image} alt={item.name || "Produit"} />
                  ) : (
                    "Pas d'image"
                  )}
                </td>
                <td>{item.name || "-"}</td>
                <td>{item.price ?? "-"}</td>
                <td>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => setItems(updateCartItemQty(user.id, item.id, e.target.value))}
                    style={{ width: 72 }}
                  />
                </td>
                <td>{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</td>
                <td>
                  <button className="logout-btn" onClick={() => setItems(removeCartItem(user.id, item.id))}>
                    Retirer
                  </button>
                </td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan="7">Votre panier est vide.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16 }}>
        <p>Sous-total produits: {totalProducts.toFixed(2)}</p>
        <p>Frais de livraison: {shippingCost.toFixed(2)}</p>
        <p>Total a payer: {total.toFixed(2)}</p>
        <p>Moyen de paiement: Paiement a la livraison</p>
        <button className="logout-btn" disabled={!items.length} onClick={onValidateOrder}>
          Valider la commande
        </button>
        <button
          className="logout-btn"
          style={{ marginLeft: 8 }}
          disabled={!items.length}
          onClick={() => {
            clearCart(user.id);
            setItems([]);
          }}
        >
          Vider le panier
        </button>
      </div>
    </div>
  );
}
