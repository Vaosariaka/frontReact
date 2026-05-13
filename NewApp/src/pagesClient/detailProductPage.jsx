import { useEffect, useState } from "react";
import { fetchProductsById } from "../api/productsApi";

export default function DetailProductPage({ productId }) {
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
     <h1>details de ce produit {product?.id || productId}</h1>
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
                    </tr>
                ) : (
                    <tr>
                      <td colSpan="6">Produit introuvable</td>
                    </tr>
                )}
            </tbody>
        </table>    
    </div>
    </div>
    );
    }
