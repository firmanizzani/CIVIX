import { useEffect, useRef, useState } from 'react';

type GoogleIdentity = {
  initialize(options: { client_id: string; callback: (response: { credential: string }) => void }): void;
  renderButton(element: HTMLElement, options: {
    type: 'standard';
    theme: 'outline';
    size: 'large';
    text: 'signin_with' | 'signup_with' | 'continue_with';
    locale: string;
    width: number;
  }): void;
};

const googleIdentity = () =>
  (window as Window & { google?: { accounts: { id: GoogleIdentity } } }).google?.accounts.id;

let scriptRequest: Promise<GoogleIdentity> | undefined;
function loadGoogleIdentity() {
  const loaded = googleIdentity();
  if (loaded) return Promise.resolve(loaded);
  if (scriptRequest) return scriptRequest;

  scriptRequest = new Promise<GoogleIdentity>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    const fail = () => {
      window.clearTimeout(timeout);
      script.remove();
      scriptRequest = undefined;
      reject(new Error('Google Sign-In gagal dimuat.'));
    };
    const timeout = window.setTimeout(fail, 12000);
    script.onerror = fail;
    script.onload = () => {
      window.clearTimeout(timeout);
      const identity = googleIdentity();
      if (identity) resolve(identity);
      else fail();
    };
    document.head.append(script);
  });
  return scriptRequest;
}

export default function GoogleSignInButton({ clientId, onCredential, linking = false, text }: {
  clientId: string;
  onCredential: (credential: string) => void;
  linking?: boolean;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
}) {
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  callback.current = onCredential;

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    let active = true;
    let observer: ResizeObserver | undefined;
    loadGoogleIdentity().then(identity => {
      if (!active) return;
      identity.initialize({
        client_id: clientId,
        callback: ({ credential }) => {
          if (active) callback.current(credential);
        },
      });
      let previousWidth = 0;
      const render = () => {
        const width = Math.min(400, Math.floor(element.clientWidth));
        if (!width || width === previousWidth) return;
        previousWidth = width;
        element.replaceChildren();
        identity.renderButton(element, {
          type: 'standard', theme: 'outline', size: 'large',
          text: text ?? (linking ? 'continue_with' : 'signin_with'), locale: 'id', width,
        });
      };
      observer = new ResizeObserver(render);
      observer.observe(element);
      render();
    }).catch(() => {
      if (active) setError(true);
    });
    return () => {
      active = false;
      observer?.disconnect();
      element.replaceChildren();
    };
  }, [clientId, linking, text, attempt]);

  return <>
    <div ref={container} className="flex w-full justify-center" />
    {error && <p role="status" className="text-sm text-civix-muted">
      Tombol Google gagal dimuat. <button type="button" className="font-semibold text-civix-primary" onClick={() => {
        setError(false);
        setAttempt(value => value + 1);
      }}>Coba lagi</button>
    </p>}
  </>;
}
