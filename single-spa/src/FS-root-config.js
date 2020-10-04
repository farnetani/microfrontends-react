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

// outra forma mais reduzida de declarar o exemplo acima
registerApplication(
  '@mc/react-single',
  () => System.import('@mc/react-single'),
  location => location.pathname.startsWith('/react-single'),
);

registerApplication(
  '@mc/react-multiples',
  () => System.import('@mc/react-multiples'),
  location => location.pathname.startsWith('/react-multiples'),
);

// registerApplication(
//   '@mc/react-parcel',
//   () => System.import('@mc/react-parcel'),
//   location => location.pathname.startsWith('/react-parcel'),
// );

registerApplication(
  '@mc/react-route',
  () => System.import('@mc/react-route'),
  location => location.pathname.startsWith('/react-route'),
);

start({
  urlRerouteOnly: true,
});

