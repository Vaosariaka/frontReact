import { useState } from "react";
import Papa from "papaparse";

function EmployeeImport({ onCreate }) {
   const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
  
      setFileName(file.name);
      setMessage(null);
  
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        delimiter: ";",
        complete: (results) => {
          setRows(results.data || []);
        },
      });
    };
  
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
        const date = row["date"] || row["Date"] || "";
        const nom = row["nom"] || row["Nom"] || "";
        const email = row["email"] || row["Email"] || "";
        const pwd = row["pwd"] || row["Pwd"] || row["password"] || "";
        const adresse = row["adresse"] || row["Adresse"] || "";
        const achat = row["achat"] || row["Achat"] || "";
        const etat = row["etat"] || row["Etat"] || "";

        if (!nom || !email || !pwd) {
          skipped += 1;
          continue;
        }

        await onCreate({ date, nom, email, pwd, adresse, achat, etat });
        imported += 1;
      }

      setMessage(
        `Import termine: ${imported} ok, ${skipped} ignores.`
      );
      
    } catch (err) {
      console.error(err);
      setMessage("Erreur lors de l'import CSV ❌");
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="p-4 border rounded">
      <h2>Importer un Employee</h2>

      <div style={{ marginBottom: "10px" }}>
        <input type="file" accept=".csv" onChange={handleFileChange} />
      </div>

      {fileName && (
        <p style={{ marginBottom: "10px" }}>
          Fichier: {fileName} ({rows.length} lignes)
        </p>
      )}

      <button onClick={handleImport} disabled={loading}>
        {loading ? "Importation..." : "Importer CSV"}
      </button>


      {message && (
        <p style={{ marginTop: "10px" }}>{message}</p>
        

        
      )}

      <p>Liste des employer importer</p>
      {rows.length ? (
        <ul>
          {rows.map((row, index) => {
            const nom = row["nom"] || row["Nom"] || "";
            const email = row["email"] || row["Email"] || "";

            return (
              <li key={`${nom}-${email}-${index}`}>
                {nom || "(sans nom)"} {email ? `- ${email}` : ""}
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

export default EmployeeImport;