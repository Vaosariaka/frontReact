import { useEffect, useState } from "react";
import { fetchPanier } from "../api/panierApi";


export default function PanierPage() {
  const [panier, setPanier] = useState([]);

    useEffect(() => {
    const load = async () => {
        try {
            const data = await fetchPanier();
            setPanier(Array.isArray(data) ? data : [data]);
        } catch (error) {
            console.error("Erreur lors du chargement du panier:", error);
            setPanier([]);
        }
    };
    load();
}, []);

  return (
    <div>
      <h2>Panier ({panier.length})</h2>
      <div className="table-wrap">
        <table className="client-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Photo</th>
              <th>Nom</th>
              <th>Prix</th>
              <th>Quantité</th>
            </tr>
          </thead>
          <tbody>
            {panier.map((panierItem) => (
              <tr key={panierItem.id}>
                <td>{panierItem.id || "-"}</td>
                <td>
                  {panierItem.image ? (
                    <img className="product-image" src={panierItem.image} alt={panierItem.name || "Produit"} />
                  ) : (
                    "Pas d'image"
                  )}
                </td>
                <td>{panierItem.name || "-"}</td>
                <td>{panierItem.price ?? "-"}</td>
                <td>{panierItem.quantity ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}