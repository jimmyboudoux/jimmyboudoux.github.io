export const SUBMISSION_TIMEOUT_MS = 20_000;

function submissionError(message, { fields = {}, retryable = true } = {}) {
  const error = new Error(message);
  error.fields = fields;
  error.retryable = retryable;
  return error;
}

export async function submitDiagnostic({
  endpoint,
  payload,
  fetchImpl = globalThis.fetch,
  AbortControllerRef = globalThis.AbortController,
  setTimeoutFn = globalThis.setTimeout,
  clearTimeoutFn = globalThis.clearTimeout,
  timeoutMs = SUBMISSION_TIMEOUT_MS
}) {
  const controller = AbortControllerRef ? new AbortControllerRef() : null;
  let timeout;
  let timedOut = false;

  if (controller) {
    timeout = setTimeoutFn(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs);
  }

  let response;
  try {
    response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      ...(controller ? { signal: controller.signal } : {})
    });
  } catch {
    throw submissionError(
      timedOut
        ? 'L’envoi prend trop de temps. Vérifiez votre connexion puis réessayez.'
        : 'Impossible de joindre le service. Vérifiez votre connexion puis réessayez.'
    );
  } finally {
    if (timeout) clearTimeoutFn(timeout);
  }
  const result = await response.json().catch(() => ({}));

  if (response.ok) return result;

  throw submissionError(result.message || 'Une erreur est survenue lors de l’envoi.', {
    fields: result.fields || {},
    retryable: response.status >= 500 || response.status === 429
  });
}
