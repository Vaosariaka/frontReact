import { useEffect, useState } from "react";
import { useAuth } from "./auth/AuthContext";
import LoginEmployee from "./auth/LoginEmployee";
import LoginClient from "./auth/LoginClient";
import LoginSelector from "./auth/LoginSelector";
import EmployeeDashboard from "./pagesEmployee/EmployeeDashboard";
import BackofficeSyncPage from "./pagesEmployee/BackofficeSyncPage";
import BackofficeImportPage from "./pagesEmployee/BackofficeImportPage";
import ResetData from "./pagesEmployee/reinit/ResetData";
import ProductsPage from "./pagesClient/ProductsPage";
import CategoriesPage from "./pagesClient/CategoriesPage";
import PanierPage from "./pagesClient/PanierPage";
import DetailProductPage from "./pagesClient/detailProductPage";
import MesCommandesPage from "./pagesClient/MesCommandesPage";
// import ClientDashboard from "./pagesClient/CustomerDashboard.css";
import StatutCommande from "./statut/StatutCommande";

export default function AppRoutes() {
  const { user, logout } = useAuth();
  const [pathname, setPathname] = useState(() => window.location.pathname || "/");

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname || "/");
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (to) => {
    if (window.location.pathname === to) return;
    window.history.pushState({}, "", to);
    setPathname(to);
  };

  const selectorScreen = (
    <LoginSelector
      onSelect={(type) => navigate(type === "employee" ? "/login/employee" : "/login/client")}
    />
  );

  const guestRoutes = {
    "/": selectorScreen,
    "/login/employee": <LoginEmployee />,
    "/login/client": <LoginClient />,
  };

  const employeeRoutes = {
    "/": <EmployeeDashboard />,
    "/employee": <EmployeeDashboard />,
    "/dashboard": <EmployeeDashboard />,
    "/employee/dashboard": <EmployeeDashboard />,
    "/employee/imports": <BackofficeImportPage />,
    "/employee/reset": <ResetData />,
    "/employee/statut-commande": <StatutCommande />,
    "/employee/sync-backoffice": <BackofficeSyncPage />,
  };
  

  const detailMatch = pathname.match(/^\/product\/([^/]+)$/);
  const detailProductId = detailMatch ? detailMatch[1] : null;

  const customerRoutes = {
    "/": <ProductsPage />,
    "/product": <ProductsPage />,
    "/products": <ProductsPage />,
    "/categorie": <CategoriesPage />,
    "/categories": <CategoriesPage />,
    "/panier": <PanierPage />,
    "/paniers": <PanierPage />,
    "/mes-commandes": <MesCommandesPage />,
  };

  const customerContent = detailProductId
    ? <DetailProductPage productId={detailProductId} />
    : (customerRoutes[pathname] ?? customerRoutes["/"]);

  const customerIsTryingBackoffice = pathname.startsWith("/employee");
  const employeeIsTryingFrontoffice =
    pathname.startsWith("/product") ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/categorie") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/panier") ||
    pathname.startsWith("/mes-commandes");

  const customerView = (
    <div className="client-dashboard">
      <h1 className="client-title">
        FrontOffice - {user?.firstname} {user?.lastname}
      </h1>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <a href="/" className="logout-btn">Accueil</a>
        <a href="/products" className="logout-btn">Produits</a>
        <a href="/categories" className="logout-btn">Categories</a>
        <a href="/panier" className="logout-btn">Panier</a>
        <a href="/mes-commandes" className="logout-btn">Mes commandes</a>
        <button className="logout-btn" onClick={logout}>Deconnexion</button>
      </div>
      {customerContent}
    </div>
  );

  const unauthenticatedView = guestRoutes[pathname] ?? selectorScreen;
  const authenticatedViewByRole = {
    employee: employeeIsTryingFrontoffice
      ? <div style={{ padding: 20 }}>Acces FrontOffice refuse pour un compte employee.</div>
      : (employeeRoutes[pathname] ?? employeeRoutes["/"]),
    customer: customerIsTryingBackoffice
      ? <div style={{ padding: 20 }}>Acces BackOffice refuse pour un compte client.</div>
      : customerView,
  };
  const authenticatedView =
    authenticatedViewByRole[user?.method] ?? <div>Erreur: type d'utilisateur inconnu</div>;

  return user ? authenticatedView : unauthenticatedView;
}
