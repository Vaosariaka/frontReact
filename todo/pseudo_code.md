# Pseudo-code pour l'import (frontend React)

## Objectif
Definir le pseudo-code complet du flux d'import cote front React, avec validation, preview, execution, suivi, et gestion d'erreurs via API.

## Hypotheses
- L'import se fait depuis un fichier (CSV, XLSX, JSON).
- Le front orchestre les appels API.
- L'API propose un mode "preview" et un mode "execute".

## Endpoints (exemple a adapter)
- POST /api/import/validate
  - Verifie le format et retourne un resume + erreurs bloquantes.
- POST /api/import/preview
  - Retourne un apercu des donnees a importer (compteurs, mappings).
- POST /api/import/execute
  - Lance l'import et retourne un identifiant de job.
- GET /api/import/status/:jobId
  - Etat: en_cours, termine, erreur.
- GET /api/import/report/:jobId
  - Rapport final (lignes succes, erreurs, warnings).

## UX / UI attendu
- Zone de depot fichier + bouton "Importer".
- Etape "Validation" puis "Preview" avant l'execution.
- Resume clair des impacts (nb lignes, creations, mises a jour).
- Progression temps reel (polling ou SSE).
- Rapport final telechargeable.

## Pseudo-code (detaille, React)
```
const [file, setFile] = useState(null);
const [loading, setLoading] = useState(false);
const [errors, setErrors] = useState([]);
const [preview, setPreview] = useState(null);
const [canProceed, setCanProceed] = useState(false);
const [validationSummary, setValidationSummary] = useState(null);
const [report, setReport] = useState(null);

const onSelectFile = (nextFile) => {
  setFile(nextFile);
  setErrors([]);
  setPreview(null);
  setCanProceed(false);
  setValidationSummary(null);
  setReport(null);
};

const onValidate = async () => {
  if (!file) return;
  setLoading(true);
  setErrors([]);

  try {
    const res = await api.post('/api/import/validate', { file });
    const result = res.data;

    if (result.blockingErrors?.length > 0) {
      setErrors(result.blockingErrors);
      setCanProceed(false);
      return;
    }

    setCanProceed(true);
    setValidationSummary(result.summary || null);
  } catch (err) {
    setErrors([err.message || 'Erreur validation']);
  } finally {
    setLoading(false);
  }
};

const onPreview = async () => {
  if (!canProceed || !file) return;
  setLoading(true);

  try {
    const res = await api.post('/api/import/preview', { file });
    setPreview(res.data);
  } catch (err) {
    setErrors([err.message || 'Erreur preview']);
  } finally {
    setLoading(false);
  }
};

const onExecuteImport = async () => {
  if (!preview || !file) return;
  const ok = await confirmDialog(preview);
  if (!ok) return;

  setLoading(true);
  try {
    const { jobId } = (await api.post('/api/import/execute', { file })).data;
    await pollImportStatus(jobId);
  } catch (err) {
    setErrors([err.message || 'Erreur import']);
  } finally {
    setLoading(false);
  }
};

const pollImportStatus = async (jobId) => {
  while (true) {
    const res = await api.get(`/api/import/status/${jobId}`);
    const status = res.data;

    if (status.state === 'termine') {
      const reportRes = await api.get(`/api/import/report/${jobId}`);
      setReport(reportRes.data);
      break;
    }

    if (status.state === 'erreur') {
      setErrors([status.message || 'Erreur import']);
      break;
    }

    await wait(1500);
  }
};
```

## Cas d'erreur a gerer
- Fichier manquant / format invalide.
- Erreurs bloquantes renvoyees par /validate.
- Import deja en cours.
- Timeout / erreur serveur.

## Tests minimum
- Import fichier valide -> preview -> execution -> rapport OK.
- Import fichier invalide -> erreurs bloquees.
- Annulation utilisateur apres preview.
- Erreur API -> message clair + retry.

## Notes
- Adapter les payloads et codes retour a l'API reelle.
- Ne pas faire de parsing lourd cote front, laisser l'API valider.
