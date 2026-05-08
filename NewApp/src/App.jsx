import { useEffect, useState } from "react";
import "./App.css";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

function App() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
  products: [],
  employees: [],
  categories: [],

});
setData((prev) => ({
  ...prev,
  products: newProducts,
  employees: newEmployees,
  
}));
  

  const getTextValue = (value) => {
    if (!value) return "";

    if (typeof value === "string") {
      return value;
    }

    const lang = value.language;

    if (Array.isArray(lang) && lang[0]?.value) {
      return String(lang[0].value);
    }

    if (lang?.value) {
      return String(lang.value);
    }

    return "";
  };

  useEffect(() => {
    let active = true;

    const apiKey = import.meta.env.VITE_PS_API_KEY;

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
    });

    const fetchProducts = async () => {
      const res = await axios.get("/api/api/products?display=full", {
        headers: {
          Authorization: `Basic ${btoa(apiKey + ":")}`,
          Accept: "application/xml",
        },
        responseType: "text",
      });

      const data = parser.parse(res.data);

      const list = data?.prestashop?.products?.product || [];

      if (active) {
        setItems(Array.isArray(list) ? list : [list]);
      }
    };

    const fetchEmployees = async () => {
      const res = await axios.get("/api/api/employees?display=full", {
        headers: {
          Authorization: `Basic ${btoa(apiKey + ":")}`,
          Accept: "application/xml",
        },
        responseType: "text",
      });

      const data = parser.parse(res.data);

      const list = data?.prestashop?.employees?.employee || [];

      if (active) {
        setEmployees(Array.isArray(list) ? list : [list]);
      }
    };

    const loadData = async () => {
      try {                            
        await Promise.all([
          fetch        Products(),
          fetchEmployees(),
        ]);
      } catch (err) {
        if (active) {
          setError(err);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }

    function onSelectFile(file) {
  state.file = file;
  state.errors = [];
  state.preview = null;
}

async function onValidate() {
  assertFileSelected();
  state.loading = true;

  try {
    const result = await api.post('/api/import/validate', { file });

    if (result.blockingErrors.length > 0) {
      showErrors(result.blockingErrors);
      state.canProceed = false;
      return;
    }

    state.canProceed = true;
    state.validationSummary = result.summary;
  } finally {
    state.loading = false;
  }
}

async function onPreview() {
  assertCanProceed();
  state.loading = true;

  try {
    const preview = await api.post('/api/import/preview', { file });
    state.preview = preview;
  } finally {
    state.loading = false;
  }
}

async function onExecuteImport() {
  assertPreviewReady();
  const ok = await confirmDialog(state.preview);
  if (!ok) return;

  state.loading = true;
  try {
    const { jobId } = await api.post('/api/import/execute', { file });
    await pollImportStatus(jobId);
  } finally {
    state.loading = false;
  }
}

//reinitialisation de donnee
const onReset = async () => {
  await ensureAll();
  const preview = await api.post('/api/api/');
  const ok = await confirmDialog(preview);
  if (!ok) return;

  const { jobId } = await api.post('/api/reset/execute');
  const status = await pollStatus(jobId);

  if (status === 'termine') {
    const report = await api.get(`/api/reset/report/${jobId}`);
    showReport(report);
  } else {
    showError('Erreur de reinitialisation');
  }
};
async function pollImportStatus(jobId) {
  while (true) {
    const status = await api.get(`/api/import/status/${jobId}`);

    if (status.state === 'termine') {
      const report = await api.get(`/api/import/report/${jobId}`);
      showReport(report);
      break;
    }

    if (status.state === 'erreur') {
      showError(status.message || 'Erreur import');
      break;
    }

    await wait(1500);
  }
}
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <h1>Appel des API products et employees</h1>

      {loading && <p>Chargement...</p>}

      {error && (
        <p>Erreur: {String(error.message || error)}</p>
      )}

      {!loading &&
        !error &&
        items.length === 0 &&
        employees.length === 0 && (
          <p>Aucun produit ou employee trouve.</p>
        )}

      {!loading && !error && items.length > 0 && (
        <div>
          <h2>Produits</h2>

          <ul>
            {items.map((p) => (
              <li key={p.id}>
                {getTextValue(p.name) || p.price}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!loading && !error && employees.length > 0 && (
        <div>
          <h2>Employees</h2>

          <ul>
            {employees.map((e) => (
              <li key={e.id}>
                {e.firstname} {e.lastname}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App;