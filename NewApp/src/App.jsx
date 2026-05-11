import { useEffect, useState } from "react";

import ProductList from "./list/productList";
import EmployeeList from "./list/employeeList";
import ImportProduct from "./affichageImport/importProduct";
import ImportCombinations from "./affichageImport/importCombinations";
import ImportOrders from "./affichageImport/importOrders";
import { useAuth } from "./auth/AuthContext";
import Login from "./auth/Login";

import {
  fetchProducts,
} from "./api/productsApi";

import {
  fetchEmployees,
} from "./api/employeesApi";

import {
  createProduct,
} from "./import/importApiProduct";

import { createCombinationFromCsvRow } from "./import/importApiCombinations";
import { createOrderFromCsvRow } from "./import/importApiOrders";

function App() {
  const { user, logout } = useAuth();

  const [products, setProducts] =
    useState([]);

  const [employees, setEmployees] =
    useState([]);

  useEffect(() => {

    const load = async () => {

      const p = await fetchProducts();

      const e = await fetchEmployees();

      setProducts(
        Array.isArray(p) ? p : [p]
      );

      setEmployees(
        Array.isArray(e) ? e : [e]
      );
    };

    load();

  }, []);

  if (!user) {
    return <Login />;
  }

  return (
    <div>

      <h1>Prestashop</h1>

      <button onClick={logout} style={{ marginBottom: "10px" }}>
        Se deconnecter
      </button>

      <ProductList
        products={products}
        getTextValue={(value) => value}
      />
      <EmployeeList
        employees={employees}
        getTextValue={(value) => value}
      />

      <ImportProduct onCreate={createProduct} />
      <ImportCombinations onCreate={createCombinationFromCsvRow} />
      <ImportOrders onCreate={createOrderFromCsvRow} />

    

    </div>
  );
}

export default App;