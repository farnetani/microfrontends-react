import { registerApplication, start } from "single-spa";

registerApplication({
  name: "@single-spa/welcome",
  app: () =>
    System.import(
      "https://unpkg.com/single-spa-welcome/dist/single-spa-welcome.js"
    ),
  activeWhen: (location) => location.pathname === '/',
});

// registerApplication({
//   name: "@fs/react-single",
//   app: () =>
//     System.import(
//       "@mc/react-single"
//     ),
//   activeWhen: (location) => location.pathname === '/react-single',
// });

// outra forma de declarar
registerApplication(
  '@mc/react-single',
  () => System.import('@mc/react-single'),
  location => location.pathname.startsWith('/react-single'),
);

start({
  urlRerouteOnly: true,
});

