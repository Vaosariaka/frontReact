import { createContext, useContext, useState } from "react";
import bcrypt from "bcryptjs";
import { fetchEmployees } from "../api/employeesApi";
import { fetchCustomers } from "../api/customersApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const loginEmployee = async (email, password) => {
    if (!email || !password) return false;
    
    try {
      const employees = await fetchEmployees();
      const emp = employees.find(e => e.email === email);
      
      if (!emp || !emp.passwd) return false;
      
      // Comparer le password avec le hash bcrypt stocké
      const isValid = await bcrypt.compare(password, emp.passwd);
      
      if (!isValid) return false;
      
      const authUser = {
        method: "employee",
        email: emp.email,
        id: emp.id,
        firstname: emp.firstname,
        lastname: emp.lastname,
      };
      
      setUser(authUser);
      localStorage.setItem("auth_user", JSON.stringify(authUser));
      return true;
    } catch {
      return false;
    }
  };

  const loginCustomer = async (email, password) => {
    if (!email || !password) return false;
    
    try {
      const customers = await fetchCustomers();
      const cust = customers.find(c => c.email === email);
      
      if (!cust || !cust.passwd) return false;
      
      // Comparer le password avec le hash bcrypt stocké
      const isValid = await bcrypt.compare(password, cust.passwd);
      
      if (!isValid) return false;
      
      const authUser = {
        method: "customer",
        email: cust.email,
        id: cust.id,
        firstname: cust.firstname,
        lastname: cust.lastname,
      };
      
      setUser(authUser);
      localStorage.setItem("auth_user", JSON.stringify(authUser));
      return true;
    } catch {
      return false;
    }
  };

  const login = async ({ apiKey }) => {
    const expectedKey = import.meta.env.VITE_PS_API_KEY;
    if (!expectedKey || !apiKey) {
      return false;
    }

    if (apiKey.trim() !== expectedKey.trim()) {
      return false;
    }

    const authUser = { method: "api_key" };
    setUser(authUser);
    localStorage.setItem("auth_user", JSON.stringify(authUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, loginEmployee, loginCustomer, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
