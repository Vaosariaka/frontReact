# Reinitialisation des donnees (frontend React)

## Objectif
Definir le flux complet de reinitialisation des donnees cote front React, en appelant les API backend, avec validations, confirmation utilisateur, suivi de progression, et gestion des erreurs.

## Contexte
- Le frontend (React) orchestre la reinitialisation.
- Les actions se font via appels API (pas de logique metier critique cote front).
- L'operation est sensible: confirmation explicite, traçabilite, et securite.

## Prerequis
- L'utilisateur doit avoir un role autorise (ex: admin).
- Token d'authentification valide (ex: JWT) present.
- Endpoints API de reinitialisation disponibles et documentes.

## Endpoints (exemple a adapter)
- POST /api/reset/preview
  - Retourne un resume des donnees affectees (comptes, commandes, etc.).
- POST /api/reset/execute
  - Lance la reinitialisation et retourne un identifiant de job.
- GET /api/reset/status/:jobId
  - Donne l'etat: en_cours, termine, erreur.
- GET /api/reset/report/:jobId
  - Fournit un rapport final (elements traites, erreurs).

## UX / UI attendu
- Bouton "Reinitialiser" visible uniquement pour les roles autorises.
- Fenetre de confirmation avec:
  - Message d'avertissement clair.
  - Champ de confirmation (ex: taper "REINITIALISER").
  - Resume des donnees (obtenu via /preview).
- Indicateur de progression pendant l'execution.
- Affichage du rapport final.

## Flux fonctionnel (detaille)
1) Verification des droits utilisateur.
2) Appel /api/reset/preview pour afficher un resume.
3) Confirmation utilisateur (double validation).
4) Appel /api/reset/execute.
5) Polling sur /api/reset/status/:jobId.
6) Quand termine: appel /api/reset/report/:jobId.
7) Affichage du resultat (success/fail + details).

## Gestion des erreurs
- 401/403: afficher "Acces refuse" et proposer de se reconnecter.
- 409: operation deja en cours -> afficher statut en cours.
- 500/timeout: message d'erreur + bouton "Reessayer".
- Journaliser les erreurs cote front (console + service de log si dispo).

## Securite et garde-fous
- Toujours demander une confirmation explicite.
- Bloquer le bouton tant que les validations ne sont pas passees.
- Desactiver l'operation si une reinitialisation est deja en cours.

## Exemple de sequence (pseudo-code React)
```
const [loading, setLoading] = useState(false);
const [preview, setPreview] = useState(null);
const [report, setReport] = useState(null);
const [error, setError] = useState(null);

const onReset = async () => {
  setError(null);
  setLoading(true);

  try {
    await ensureAdmin();
    const previewRes = await api.post('/api/reset/preview');
    setPreview(previewRes.data);

    const ok = await confirmDialog(previewRes.data);
    if (!ok) return;

    const { jobId } = (await api.post('/api/reset/execute')).data;
    const status = await pollStatus(jobId);

    if (status.state === 'termine') {
      const reportRes = await api.get(`/api/reset/report/${jobId}`);
      setReport(reportRes.data);
    } else {
      setError(status.message || 'Erreur de reinitialisation');
    }
  } catch (err) {
    setError(err.message || 'Erreur de reinitialisation');
  } finally {
    setLoading(false);
  }
};
```

## Tests a prevoir
- Utilisateur non admin -> action impossible.
- Preview OK + annulation utilisateur -> rien ne se passe.
- Execution OK + rapport affiche.
- Erreur API -> message clair + retry.
- Operation deja en cours -> UI bloquee.

## Notes
- Adapter les endpoints et les codes de retour a l'API reelle.
- Eviter toute logique de suppression cote front: le front orchestre uniquement.
