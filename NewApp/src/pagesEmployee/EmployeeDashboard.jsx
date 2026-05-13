import { useAuth } from "../auth/AuthContext";
import ImportProduct from "./affichageImport/importProduct";
import ImportCombinations from "./affichageImport/importCombinations";
import ImportOrders from "./affichageImport/importOrders";
import { createProduct } from "./import/importApiProduct";
import { createCombinationFromCsvRow } from "./import/importApiCombinations";
import { createOrderFromCsvRow } from "./import/importApiOrders";

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

            <section style={{ marginBottom: "30px" }}>
                <h2>Importation de produits</h2>
                <ImportProduct onCreate={createProduct} />
            </section>

            <section style={{ marginBottom: "30px" }}>
                <h2>Importation de combinaisons</h2>
                <ImportCombinations onCreate={createCombinationFromCsvRow} />
            </section>

            <section>
                <h2>Importation de commandes</h2>
                <ImportOrders onCreate={createOrderFromCsvRow} />
            </section>

            
        </div>
    );
}
