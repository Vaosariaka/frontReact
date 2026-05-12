import { useState } from "react";
import { useAuth } from "../auth/AuthContext";


export default function Login() {
  const { loginCustomer } = useAuth();
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const ok = await loginCustomer(form.email, form.password);
    setLoading(false);
    if (!ok) {
      setError("Email ou mot de passe invalide");
    }
  };

  return (
    <div className="p-4 border rounded">
      <h2>Accès Client</h2>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: "10px" }}>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="Email"
            required
          />
        </div>
        <div style={{ marginBottom: "10px" }}>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            placeholder="Mot de passe"
            required
          />
        </div>
        <button type="submit" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </button>
        {error && <p style={{ marginTop: "10px", color: "red" }}>{error}</p>}
      </form>
    </div>
  );
}