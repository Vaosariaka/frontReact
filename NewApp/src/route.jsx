import { useEffect, useState } from "react";
import { useAuth } from "./auth/AuthContext";
import LoginEmployee from "./auth/LoginEmployee";
import LoginClient from "./auth/LoginClient";
import LoginSelector from "./auth/LoginSelector";
import EmployeeDashboard from "./pagesEmployee/EmployeeDashboard";
import ProductsPage from "./pagesClient/ProductsPage";
import CategoriesPage from "./pagesClient/CategoriesPage";
import PanierPage from "./pagesClient/PanierPage";
import DetailProductPage from "./pagesClient/detailProductPage";
// import ClientDashboard from "./pagesClient/CustomerDashboard.css";
import StatutCommande from "./statut/StatutCommande";

export default function AppRoutes() {
  const { user } = useAuth();
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
        "/employee/statut-commande": <StatutCommande />,
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
  };

  const customerView = detailProductId
    ? <DetailProductPage productId={detailProductId} />
    : (customerRoutes[pathname] ?? customerRoutes["/"]);

  const unauthenticatedView = guestRoutes[pathname] ?? selectorScreen;
  const authenticatedViewByRole = {
    employee: employeeRoutes[pathname] ?? employeeRoutes["/"],
    customer: customerView,
  };
  const authenticatedView =
    authenticatedViewByRole[user?.method] ?? <div>Erreur: type d'utilisateur inconnu</div>;

  return user ? authenticatedView : unauthenticatedView;
}
