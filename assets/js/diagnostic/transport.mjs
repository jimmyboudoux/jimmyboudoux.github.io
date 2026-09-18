export async function submitDiagnostic({ endpoint, payload, fetchImpl = globalThis.fetch }) {
  const response = await fetchImpl(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json().catch(() => ({}));

  if (response.ok) return result;

  const error = new Error(result.message || 'Une erreur est survenue lors de l’envoi.');
  error.fields = result.fields || {};
  throw error;
}
