// Polyfill para librerías que esperan `global` (p.ej., sockjs-client)
// Debe declararse antes de inicializar la app
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (window as any).global === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).global = window;
}

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
