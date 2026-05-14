import { useEffect, useState } from "react";
import JSZip from "jszip";

function ImagesProductImport({ onCreate }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const zipPath = "/csv/images.zip";

  const handleLoadZip = async () => {
    try {
      setMessage(null);

      const response = await fetch(zipPath);
      const blob = await response.blob();

      const zip = await JSZip.loadAsync(blob);

      const images = [];

      for (const fileName in zip.files) {
        const file = zip.files[fileName];

        if (file.dir) continue;
        const baseName = fileName.split("/").pop() || "";
        if (fileName.startsWith("__MACOSX/")) continue;
        if (baseName.startsWith("._")) continue;

        const imageBlob = await file.async("blob");

        images.push({
          name: fileName,
          file: imageBlob,
        });
      }

      setFiles(images);
      setMessage(`${images.length} images chargees.`);
    } catch (err) {
      console.error(err);
      setMessage("Erreur chargement ZIP.");
    }
  };

  useEffect(() => {
    handleLoadZip();
  }, []);

  const handleImport = async () => {
    if (!files.length) {
      setMessage("Aucune image.");
      return;
    }

    setLoading(true);
    let imported = 0;
    const errors = [];

    for (const image of files) {
      try {
        await onCreate(image);
        imported += 1;
      } catch (err) {
        const apiError = err?.response?.data
          ? String(err.response.data).slice(0, 180)
          : (err?.message || "erreur inconnue");
        errors.push(`${image.name}: ${apiError}`);
      }
    }

    setMessage(
      errors.length
        ? `Import termine: ${imported} ok, ${errors.length} erreurs.`
        : `Import termine: ${imported} ok.`
    );
    if (errors.length) {
      console.error("Erreurs import images:", errors);
    }
    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleImport} disabled={loading}>
        {loading ? "Import..." : "Importer images"}
      </button>

      {message && <p>{message}</p>}
    </div>
  );
}

export default ImagesProductImport;
