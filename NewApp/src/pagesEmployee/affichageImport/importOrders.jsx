import { useEffect, useState } from "react";
import Papa from "papaparse";

function ImportOrders({ onCreate }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [fileName, setFileName] = useState("");
  const csvPath = "/csv/import-data-mai-26 - fichier3.csv";
  

  const handleLoadCsv = () => {
    setFileName(csvPath);
    setMessage(null);

    Papa.parse(csvPath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      delimiter: ",",
      complete: (results) => {
        setRows(results.data || []);
      },
      error: (err) => {
        console.error(err);
        setMessage("Impossible de charger le CSV.");
      },
    });
  };

  useEffect(() => {
    handleLoadCsv();
  }, []);

  const handleImport = async () => {
    if (!rows.length) {
      setMessage("Aucune ligne a importer.");
      return;
    }

    setLoading(true);
    setMessage(null);

    let imported = 0;
    let skipped = 0;

    try {
      for (const row of rows) {
        const nom = row["nom"] || "";
        const email = row["email"] || "";
        const pwd = row["pwd"] || "";

        if (!nom || !email || !pwd) {
          skipped += 1;
          continue;
        }

        await onCreate(row);
        imported += 1;
      }

      setMessage(`Import termine: ${imported} ok, ${skipped} ignores.`);
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de l'import CSV ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded">
      <h2>Importer clients + commandes (fichier3.csv)</h2>

      <div style={{ marginBottom: "10px" }}>
        <button
          type="button"
          onClick={handleLoadCsv}
        >
          Recharger le CSV
        </button>
      </div>

      {fileName && (
        <p style={{ marginBottom: "10px" }}>
          Fichier: {fileName} ({rows.length} lignes)
        </p>
      )}

      <button onClick={handleImport} disabled={loading}>
        {loading ? "Importation..." : "Importer CSV"}
      </button>

      {message && <p style={{ marginTop: "10px" }}>{message}</p>}

      <p>Liste des commandes importees</p>
      {rows.length ? (
        <ul>
          {rows.map((row, index) => {
            const nom = row["nom"] || "";
            const email = row["email"] || "";
            const etat = row["etat"] || "";
            return (
              <li key={`${nom}-${email}-${index}`}>
                {nom || "(sans nom)"}
                {email ? ` - ${email}` : ""}
                {etat ? ` - ${etat}` : ""}
              </li>
            );
          })}
        </ul>
      ) : (
        <p>Aucune ligne chargee.</p>
      )}
    </div>
  );
}

export default ImportOrders;
