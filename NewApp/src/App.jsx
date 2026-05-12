import { useEffect, useState } from "react";

import ProductList from "./list/productList";
import ImportProduct from "./pagesEmployee/affichageImport/importProduct";
import ImportCombinations from "./pagesEmployee/affichageImport/importCombinations";
import ImportOrders from "./pagesEmployee/affichageImport/importOrders";
import { useAuth } from "./auth/AuthContext";
import LoginEmployee from "./auth/LoginEmployee";
import LoginClient from "./auth/LoginClient";
import LoginSelector from "./auth/LoginSelector";

import {
  fetchProducts,
} from "./api/productsApi";

import {
  fetchEmployees,
} from "./api/employeesApi";


import {
  createProduct,
} from "./pagesEmployee/import/importApiProduct"; 



import { createCombinationFromCsvRow } from "./pagesEmployee/import/importApiCombinations";
import { createOrderFromCsvRow } from "./pagesEmployee/import/importApiOrders";

function App() {
  const { user, logout } = useAuth();

  const [products, setProducts] =
    useState([]);



  const [loginType, setLoginType] = useState(null);


  useEffect(() => {

    const load = async () => {

      const p = await fetchProducts();

      const e = await fetchEmployees();


      setProducts(
        Array.isArray(p) ? p : [p]
      );

   
    };

    load();

  }, []);

  if (!user) {
    if (!loginType) {
      return <LoginSelector onSelect={setLoginType} />;
    }
    if (loginType === "employee") {
      return <LoginEmployee />;
    }
    if (loginType === "customer") {
      return <LoginClient />;
    }
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

      <ImportProduct onCreate={createProduct} />
      <ImportCombinations onCreate={createCombinationFromCsvRow} />
      <ImportOrders onCreate={createOrderFromCsvRow} />

    

    </div>
  );
}

export default App;