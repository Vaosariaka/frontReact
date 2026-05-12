export default function LoginSelector({ onSelect }) {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <h1>Sélectionner </h1>
        <div style={{ display: "flex", gap: "20px", justifyContent: "center", marginTop: "30px" }}>
          <button
            onClick={() => onSelect("employee")}
            style={{
              padding: "15px 40px",
              fontSize: "16px",
              cursor: "pointer",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Acces pour  employer
          </button>
          <button
            onClick={() => onSelect("customer")}
            style={{
              padding: "15px 40px",
              fontSize: "16px",
              cursor: "pointer",
              color: "white",
              border: "none",
              borderRadius: "4px",
            }}
          >
            Acces pour le client
          </button>
        </div>
      </div>
    </div>
  );
}
