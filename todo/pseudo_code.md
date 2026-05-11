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

## Pseudo-code (detaille)
```
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
