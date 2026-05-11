import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({
    email: "admin@demo.com",
    password: "admin123",
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
    <form onSubmit={onSubmit}>
      <input name="email" value={form.email} onChange={onChange} />
      <input name="password" type="password" value={form.password} onChange={onChange} />
      <button type="submit">Se connecter</button>
      {error && <p>{error}</p>}
    </form>
  );
}