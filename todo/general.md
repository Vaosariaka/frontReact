# Fonctions generalisees (frontend React) pour appeler les APIs

## Objectif
Fournir un ensemble de fonctions generiques cote front pour orchestrer des operations qui appellent plusieurs APIs, avec gestion d'etapes, validations, retries, et reporting.

## Principes
- Une operation = un flux compose de plusieurs appels API.
- Chaque etape peut avoir une validation, une confirmation, et un suivi.
- Centraliser la gestion des erreurs et de l'etat.

## Briques de base a reutiliser
- apiClient: wrapper HTTP (fetch/axios) avec interceptors.
- handleError: normalise les erreurs API.
- withRetry: retry sur erreurs temporaires.
- pollStatus: polling d'un job.
- confirmDialog: confirmation utilisateur.

## Fonctions generalisees (exemples)

### 1) pipelineOperation (multi-etapes)
Permet de definir un flux avec validations, previews, executions.

```
async function pipelineOperation(steps) {
  for (const step of steps) {
    if (step.confirm) {
      const ok = await confirmDialog(step.confirmMessage);
      if (!ok) return { canceled: true };
    }

    const result = await step.run();

    if (step.onSuccess) {
      await step.onSuccess(result);
    }
  }

  return { success: true };
}
```

### 2) executeWithPreview
Flux classique: validate -> preview -> execute -> report.

```
async function executeWithPreview({ validate, preview, execute, report }) {
  const validation = await validate();
  if (!validation.ok) return { error: validation.error };

  const previewData = await preview();
  const ok = await confirmDialog(previewData);
  if (!ok) return { canceled: true };

  const { jobId } = await execute();
  const status = await pollStatus(jobId);

  if (status.state !== 'termine') {
    return { error: status.message || 'Erreur execution' };
  }

  const reportData = await report(jobId);
  return { success: true, report: reportData };
}
```

### 3) bulkOperation
Applique une action sur une liste d'elements en batch.

```
async function bulkOperation(items, action, batchSize = 50) {
  const batches = chunk(items, batchSize);

  for (const batch of batches) {
    await action(batch);
  }

  return { success: true };
}
```

### 4) orchestrateJobs
Lance plusieurs jobs et attend leur completion.

```
async function orchestrateJobs(jobs) {
  const jobIds = [];
  for (const job of jobs) {
    const { jobId } = await job.start();
    jobIds.push(jobId);
  }

  const results = [];
  for (const jobId of jobIds) {
    results.push(await pollStatus(jobId));
  }

  return results;
}
```

## Exemple concret: operation globale multi-API
Scenario: synchroniser produits + utilisateurs + stock.

```
async function syncAll() {
  return pipelineOperation([
    {
      run: () => api.post('/api/sync/users'),
      onSuccess: () => toast('Users ok'),
    },
    {
      run: () => api.post('/api/sync/products'),
      onSuccess: () => toast('Products ok'),
    },
    {
      run: () => api.post('/api/sync/stock'),
      onSuccess: () => toast('Stock ok'),
    },
  ]);
}
```

## Gestion d'erreurs centralisee (idee)

```
function handleError(err) {
  if (err.status === 401 || err.status === 403) {
    return 'Acces refuse';
  }

  if (err.status >= 500) {
    return 'Erreur serveur';
  }

  return err.message || 'Erreur inconnue';
}
```

## Tests a prevoir
- Flux complet multi-API OK.
- Une etape en echec -> arret + message.
- Erreur reseau -> retry.
- Annulation utilisateur -> aucune execution.

## Notes
- Adapter les endpoints et la structure des retours.
- Centraliser les loaders et le reporting pour toutes les operations.
- Eviter le parallelisme non controle si l'ordre est important.
