import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { fetchProducts } from "../api/productsApi";
import "./CustomerDashboard.css";

export default function CustomerDashboard() {
    const { user, logout } = useAuth();
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await fetchProducts();
                setProducts(Array.isArray(data) ? data : [data]);
            } catch {
                setProducts([]);
            }
        };
        loadProducts();
    }, []);

    if (!user) {
        return <p>Chargement...</p>;
    }

    return (
        <div className="client-dashboard">
                <h1 className="client-title">Bienvenue Client, {user.firstname} {user.lastname}</h1>
                <button className="logout-btn" onClick={logout}>
                    Se déconnecter
                </button>

                <h2 className="client-subtitle">Liste des produits ({products.length})</h2>
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
                            {products.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.icategory || "-"}</td>
                                    <td>{p.id || "-"}</td>
                                    <td>
                                        {p.image ? (
                                            <img
                                                src={p.image}
                                                alt={p.name || "Produit"}
                                                className="product-image"
                                            />
                                        ) : (
                                            "Pas d'image"
                                        )}
                                    </td>
                                    <td>{p.name || "Produit"}</td>
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
