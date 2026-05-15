import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import { fetchOrders } from "../api/ordersApi";

export default function EmployeeDashboard() {
    const { user, logout } = useAuth();
    const [orders, setOrders] = useState([]);

    useEffect(() => {
        fetchOrders().then(setOrders);
    }, []);

    const stats = useMemo(() => {
        const list = Array.isArray(orders) ? orders : [];
        let totalGeneral = 0;
        const byDay = {};

        list.forEach((o) => {
            const dateStr = o.date_add ? String(o.date_add).split(" ")[0] : "Inconnu";
            const amount = Number(o.total_paid || 0);

            totalGeneral += amount;

            if (!byDay[dateStr]) {
                byDay[dateStr] = { count: 0, amount: 0 };
            }
            byDay[dateStr].count += 1;
            byDay[dateStr].amount += amount;
        });

        return {
            totalGeneral,
            byDay: Object.entries(byDay).sort((a, b) => b[0].localeCompare(a[0])),
        };
    }, [orders]);

    if (!user) {
        return <p>Chargement...</p>;
    }

    return (
        <div style={{ padding: "20px" }}>
            <h1>Bienvenue employee, {user.firstname} {user.lastname} </h1>
            <button onClick={logout} style={{ padding: "8px 15px", marginBottom: "20px" }}>
                Se déconnecter
            </button>
            <div style={{ display: "flex", gap: "14px", marginBottom: "20px", flexWrap: "wrap" }}>
                <a href="/employee/imports">Importer les 4 fichiers</a>
                <a href="/employee/reset">Reinitialiser les donnees</a>
                <a href="/employee/statut-commande">Commandes: changer etat</a>
                <a href="/employee/sync-backoffice">Controle Sync BackOffice</a>
            </div>

            <div style={{ marginTop: "30px" }}>
                <h2>Tableau de bord</h2>
                <div style={{ marginBottom: "20px", padding: "10px", background: "#f0f0f0", borderRadius: "5px" }}>
                    <h3>Total Général: {stats.totalGeneral.toFixed(2)} €</h3>
                </div>
                
                <h3>Statistiques par jour</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                    <thead>
                        <tr style={{ borderBottom: "2px solid #ccc" }}>
                            <th style={{ padding: "8px" }}>Date</th>
                            <th style={{ padding: "8px" }}>Nb. Commandes</th>
                            <th style={{ padding: "8px" }}>Montant (€)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.byDay.map(([date, data]) => (
                            <tr key={date} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: "8px" }}>{date}</td>
                                <td style={{ padding: "8px" }}>{data.count}</td>
                                <td style={{ padding: "8px" }}>{data.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
