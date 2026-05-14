import { useAuth } from "../auth/AuthContext";

export default function EmployeeDashboard() {
    const { user, logout } = useAuth();

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
            <p>Choisir une action Backoffice depuis les liens ci-dessus.</p>
        </div>
    );
}
