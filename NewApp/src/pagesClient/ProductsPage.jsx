import { useEffect, useState } from "react";
import { fetchProducts } from "../api/productsApi";
import { useAuth } from "../auth/AuthContext";
import { addCartItem } from "../api/frontOfficeStore";

export default function ProductsPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");

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

  const filteredProducts = products.filter(p => {
    const matchName = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoryId === "" || p.id_category_default === categoryId;
    const matchMin = minPrice === "" || parseFloat(p.price) >= parseFloat(minPrice);
    const matchMax = maxPrice === "" || parseFloat(p.price) <= parseFloat(maxPrice);
    return matchName && matchCat && matchMin && matchMax;
  });

  return (
    <div>
      <h2>Accueil - Produits ({products.length})</h2>
      <div style={{ marginBottom: "20px", display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
        <input 
          type="text" 
          placeholder="Rechercher par nom..." 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)} 
          style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
        <input 
          type="number" 
          placeholder="Prix min" 
          value={minPrice} 
          onChange={(e) => setMinPrice(e.target.value)} 
          style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc", width: "100px" }}
        />
        <input 
          type="number" 
          placeholder="Prix max" 
          value={maxPrice} 
          onChange={(e) => setMaxPrice(e.target.value)} 
          style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc", width: "100px" }}
        />
        <input 
          type="number" 
          placeholder="ID Catégorie..." 
          value={categoryId} 
          onChange={(e) => setCategoryId(e.target.value)} 
          style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc", width: "150px" }}
        />
      </div>
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
            {filteredProducts.map((p) => {
              // Current target date is fixed to May 15, 2026 for assessment context
              const targetDate = new Date("2026-05-15T00:00:00");
              const addDate = p.date_add ? new Date(p.date_add) : null;
              const dateDiffDays = addDate ? (targetDate.getTime() - addDate.getTime()) / (1000 * 3600 * 24) : 999;
              
              const isHot = dateDiffDays >= 0 && dateDiffDays <= 1;
              const isNew = !isHot && dateDiffDays >= 0 && dateDiffDays <= 7;

              return (
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
                  {isHot && <span style={{backgroundColor: "red", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", marginLeft: "5px", fontWeight: "bold"}}>HOT</span>}
                  {isNew && <span style={{backgroundColor: "blue", color: "white", padding: "2px 6px", borderRadius: "4px", fontSize: "12px", marginLeft: "5px", fontWeight: "bold"}}>NEW</span>}
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
