import { ALTCHA_TIMEOUT_MS, decodeAltchaPayload } from './core.mjs';

export async function solveAltcha({
  widget,
  form,
  customElementsRef = globalThis.customElements,
  setTimeoutFn = globalThis.setTimeout,
  clearTimeoutFn = globalThis.clearTimeout
}) {
  if (!widget) {
    throw new Error('La protection anti-robot n’est pas disponible. Rechargez la page puis réessayez.');
  }

  await customElementsRef.whenDefined('altcha-widget');
  widget.reset();

  await new Promise((resolve, reject) => {
    let finished = false;
    let timeout;
    const cleanup = () => {
      widget.removeEventListener('statechange', onStateChange);
      if (timeout) clearTimeoutFn(timeout);
    };
    const succeed = () => {
      if (finished) return;
      finished = true;
      cleanup();
      resolve();
    };
    const fail = () => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error('La vérification anti-robot a échoué. Réessayez dans quelques instants.'));
    };
    const onStateChange = (event) => {
      if (event.detail?.state === 'verified') succeed();
      if (event.detail?.state === 'error') fail();
    };
    timeout = setTimeoutFn(fail, ALTCHA_TIMEOUT_MS);
    widget.addEventListener('statechange', onStateChange);
    try {
      widget.verify();
    } catch {
      fail();
    }
  });

  return decodeAltchaPayload(new FormData(form).get('altcha'));
}
