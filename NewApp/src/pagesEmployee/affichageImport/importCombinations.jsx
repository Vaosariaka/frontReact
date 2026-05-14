import { useEffect, useState } from "react";
import Papa from "papaparse";

function ImportCombinations({ onCreate }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [fileName, setFileName] = useState("");
  const csvPath = "/csv/import-data-mai-26 - fichier2.csv";
  const defaults = {
    langId: 1,
    shopId: 1,
    shopGroupId: 1,
  };

  const handleLoadCsv = () => {
    setFileName(csvPath);
    setMessage(null);

    Papa.parse(csvPath, {
      download: true,
      header: true,
      skipEmptyLines: true,
      delimiter: ",",
      transformHeader: (h) => String(h || "").replace(/^\uFEFF/, "").trim(),
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
    const errors = [];

    for (const row of rows) {
      const reference = row["reference"] || "";
      const specificite = row["specificite"] || row["specificité"] || "";
      const karazany = row["karazany"] || "";

      if (!reference || !specificite || !karazany) {
        skipped += 1;
        continue;
      }

      try {
        await onCreate(row, defaults);
        imported += 1;
      } catch (err) {
        const apiError = err?.response?.data
          ? String(err.response.data).slice(0, 180)
          : (err?.message || "erreur inconnue");
        errors.push(`${reference}/${specificite}/${karazany}: ${apiError}`);
      }
    }

    setMessage(
      errors.length
        ? `Import termine: ${imported} ok, ${skipped} ignores, ${errors.length} erreurs.`
        : `Import termine: ${imported} ok, ${skipped} ignores.`
    );
    if (errors.length) {
      console.error("Erreurs import declinaisons:", errors);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded">
      <h2>Importer declinaisons + stock (fichier2.csv)</h2>

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

      <p>Liste des declinaisons importees</p>
      {rows.length ? (
        <ul>
          {rows.map((row, index) => {
            const reference = row["reference"] || "";
            const specificite = row["specificite"] || row["specificité"] || "";
            const karazany = row["karazany"] || "";
            return (
              <li key={`${reference}-${specificite}-${karazany}-${index}`}>
                {reference || "(sans reference)"}
                {specificite ? ` - ${specificite}` : ""}
                {karazany ? ` - ${karazany}` : ""}
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

export default ImportCombinations;
