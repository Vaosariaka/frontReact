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

    try {
      for (const image of files) {
        await onCreate(image);
      }

      setMessage("Import termine.");
    } catch (err) {
      console.error(err);
      setMessage("Erreur import.");
    } finally {
      setLoading(false);
    }
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