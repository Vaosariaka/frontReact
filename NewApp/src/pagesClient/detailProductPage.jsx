import { useEffect, useState } from "react";
import { fetchProductsById } from "../api/productsApi";
import { useAuth } from "../auth/AuthContext";
import { addCartItem } from "../api/frontOfficeStore";

export default function DetailProductPage({ productId }) {
  const { user } = useAuth();
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProductsById(productId);
        setProduct(data || null);
      } catch {
        setProduct(null);
      }
    };
    load();
  }, [productId]);

  return (
    <div>
     <h1>Details de ce produit {product?.id || productId}</h1>
     <p><a href="/products">Retour aux produits</a></p>
        <div className="table-wrap">
        <table className="client-table">
            <thead>
            <tr>
                <th>categorie</th>
                <th>identite</th>
                <th>photos</th>
                <th>nom</th>
                <th>prix</th>
                <th>nbre stock</th>
                <th>action</th>
            </tr>
            </thead>
            <tbody>
                {product ? (
                    <tr key={product.id}>
                        <td>{product.icategory || "-"}</td>
                        <td>{product.id || "-"}</td>
                        <td>
                            {product.image ? (
                                <img
                                    src={product.image}
                                    alt={product.name || "Produit"}
                                    className="product-image"
                                />
                            ) : (
                                "Pas d'image"
                            )}
                        </td>
                        <td>{product.name || "-"}</td>
                        <td>{product.price ?? "-"}</td>
                        <td>{product.stock_available ?? "-"}</td>
                        <td>
                          <button className="logout-btn" onClick={() => addCartItem(user.id, product, 1)}>
                            Ajouter au panier
                          </button>
                        </td>
                    </tr>
                ) : (
                    <tr>
                      <td colSpan="7">Produit introuvable</td>
                    </tr>
                )}
            </tbody>
        </table>    
    </div>
    </div>
    );
    }
