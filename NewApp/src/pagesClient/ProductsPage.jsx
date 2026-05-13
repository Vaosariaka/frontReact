import { useEffect, useState } from "react";
import { fetchProducts } from "../api/productsApi";

export default function ProductsPage() {
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
      <h2>Produits ({products.length})</h2>
      <div className="table-wrap">
        <table className="client-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Photo</th>
              <th>Nom</th>
              <th>Prix</th>
              <th>Stock</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
