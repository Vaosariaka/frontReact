import { useEffect, useState } from "react";
import Papa from "papaparse";

function ProductImport({ onCreate }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [fileName, setFileName] = useState("");
  const csvPath = "/csv/import-data-mai-26 - fichier1.csv";
  const defaults = {
    langId: 1,
    parentCategoryId: 2,
    taxRulesGroupId: 1,
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
      const nom = row["nom"] || "";
      const reference = row["reference"] || "";
      const prixTtc = row["prix_ttc"] || "";

      if (!nom || !reference || !prixTtc) {
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
        errors.push(`${reference}: ${apiError}`);
      }
    }

    setMessage(
      errors.length
        ? `Import termine: ${imported} ok, ${skipped} ignores, ${errors.length} erreurs.`
        : `Import termine: ${imported} ok, ${skipped} ignores.`
    );
    if (errors.length) {
      console.error("Erreurs import produits:", errors);
    }
    setLoading(false);
  };

  return (
    <div className="p-4 border rounded">
      <h2>Importer des produits + categories (fichier1.csv)</h2>

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


      {message && (
        <p style={{ marginTop: "10px" }}>{message}</p>
        

        
      )}

      <p>Liste des produits importes</p>
      {rows.length ? (
        <ul>
          {rows.map((row, index) => {
            const name = row["nom"] || "";
            const price = row["prix_ttc"] || "";
            const reference = row["reference"] || "";

            return (
              <li key={`${reference}-${index}`}>
                {name || "(sans nom)"}
                {reference ? ` - ${reference}` : ""}
                {price ? ` - ${price}` : ""}
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

export default ProductImport;
