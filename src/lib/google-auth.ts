// Google Identity Services — credential helper
// Uses the GSI library loaded via script tag in Layout.astro

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          prompt: (callback?: (notification: { isNotDisplayed(): boolean; isSkippedMoment(): boolean }) => void) => void;
          renderButton: (element: HTMLElement, options: object) => void;
          cancel: () => void;
        };
      };
    };
  }
}

function loadGsiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

export async function requestGoogleCredential(): Promise<string> {
  const clientId = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID as string;
  if (!clientId) {
    throw new Error("Google Client ID not configured");
  }

  await loadGsiScript();

  return new Promise((resolve, reject) => {
    window.google!.accounts.id.initialize({
      client_id: clientId,
      callback: (response: { credential: string }) => {
        if (response.credential) {
          resolve(response.credential);
        } else {
          reject(new Error("No credential received from Google"));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    window.google!.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        reject(new Error("Google sign-in was cancelled or not displayed"));
      }
    });
  });
}
