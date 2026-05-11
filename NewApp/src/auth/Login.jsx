import { useState } from "react";
import { useAuth } from "./AuthContext";

const DEFAULT_EMAIL =
  import.meta.env.VITE_ADMIN_EMAIL || "admin@demo.com";
const DEFAULT_PASSWORD =
  import.meta.env.VITE_ADMIN_PASSWORD || "admin123";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: DEFAULT_EMAIL,
    password: DEFAULT_PASSWORD,
  });
  const [error, setError] = useState(null);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(form);
    if (!ok) setError("Login invalide");
  };

  return (
    <div className="p-4 border rounded">
      <h2>Backoffice - Login</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <input
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="Email"
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="Password"
          />
        </div>
        <button type="submit">Se connecter</button>
        {error && <p style={{ marginTop: "10px" }}>{error}</p>}
      </form>
    </div>
  );
}