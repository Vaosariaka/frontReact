import { useState } from "react";
import axios from "axios";

const apiKey = import.meta.env.VITE_PS_API_KEY;

export default function ResetData() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const onReset = async () => {
    if (!confirm("Confirmer la reinitialisation ?")) return;
    setLoading(true);
    setMessage(null);
    try {
      await axios.post(
        "/api/api/reset",
        {},
        {
          headers: {
            Authorization: `Basic ${btoa(apiKey + ":")}`,
          },
        }
      );
      setMessage("Reinitialisation OK");
    } catch {
      setMessage("Erreur reinitialisation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={onReset} disabled={loading}>
        {loading ? "En cours..." : "Reinitialiser"}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
}