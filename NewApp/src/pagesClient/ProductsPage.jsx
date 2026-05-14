import { useEffect, useState } from "react";
import { fetchProducts } from "../api/productsApi";
import { useAuth } from "../auth/AuthContext";
import { addCartItem } from "../api/frontOfficeStore";

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProducts();
        setProducts(Array.isArray(data) ? data : [data]);
      } catch {
        setProducts([]);
      }
    };
    load();
  }, []);

  return (
    <div>
      <h2>Accueil - Produits ({products.length})</h2>
      <div className="table-wrap">
        <table className="client-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Photo</th>
              <th>Nom</th>
              <th>Prix</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.id || "-"}</td>
                <td>
                  {p.image ? (
                    <a href={`/product/${p.id}`}>
                      <img className="product-image" src={p.image} alt={p.name || "Produit"} />
                    </a>
                  ) : (
                    "Pas d'image"
                  )}
                </td>
                <td>
                  <a href={`/product/${p.id}`}>{p.name || "-"}</a>
                </td>
                <td>{p.price ?? "-"}</td>
                <td>{p.stock_available ?? "-"}</td>
                <td>
                  <button className="logout-btn" onClick={() => addCartItem(user.id, p, 1)}>
                    Ajouter au panier
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
