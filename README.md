# Passo a Passo

1. Criar o orquestrador. 

```
npx create-single-spa
  - single-spa
  - root config (= orquestrador, projeto base que irá importar as aplicações e os parcels)
  - npm
  - No (typescript)
  - No (single-spa Layout Engine)
  - Organization name: FS - FarsoftSystems 

```

- Rodando: 
```
cd single-spa
npm start
Abrir navegador: http://localhost:9000
```

Instalar uma aplicação React

```
npx create-single-spa
    - react-single
    - single-spa application / parcel
    - react
    - npm
    - No
    - mc
    - react-single
```

O instalador vai nos liberar uma url de playground pra testarmos:

```
http://single-spa-playground.org/playground/instant-test?name=@mc/react-single&url=8500
```

Para startar o projeto é só rodar:

```
npm start -- --port 8500

Agora é só abrir no navegador a url salva anteriormente na instalação do `create-single-spa`: http://single-spa-playground.org/playground/instant-test?name=@mc/react-single&url=8500
```

Agora é só irmos para o nosso Orquestrador (single-spa) e editar o arquivo `index.ejs` e registrar no imports local e não
no global, conforme abaixo:

```ejs
 <% if (isLocal) { %>
  <script type="systemjs-importmap">
    {
      "imports": {
        "@FS/root-config": "//localhost:9000/FS-root-config.js",
        "@mc/react-single": "//localhost:8500/mc-react-single.js"
      }
    }
  </script>
```

Uma vez feito isso no `index.ejs`, precisamos registrar a nossa aplicação no arquivo `FS-root-config.js`:

```js
registerApplication(
  '@mc/react-single',
  () => System.import('@mc/react-single'),
  location => location.pathname.startsWith('/')
);
```

ou

```js
registerApplication({
  name: "@fs/react-single",
  app: () =>
    System.import(
      "@mc/react-single"
    ),
  activeWhen: ["/react-single"],
});
```

Após isso, podemos tentar rodar a nossa aplicação no navegador na seguinte url/porta:

```
http://localhost:9000/react-single
```

Reparar que no nosso console, teremos um erro:

```
app-errors.js:11 Uncaught Error: application '@fs/react-single' died in status LOADING_SOURCE_CODE: Unable to resolve bare specifier 'react' from http://localhost:8500/mc-react-single.js 
```

Isso significa que a `single-spa` não conseguiu resolver as dependencias do `react`. Nas configurações padrões, ela exclui o `react` e o `react DOM`.

Então precisamos localizar o link CDN em [https://reactjs.org/docs/cdn-links.html](https://reactjs.org/docs/cdn-links.html) e pegar os links de produção abaixo do `react` e do `react-dom`:

```
https://unpkg.com/react@16/umd/react.production.min.js
https://unpkg.com/react-dom@16/umd/react-dom.production.min.js
```

e aí precisaremos jogar os links acima no `index.ejs` do nosso orquestrador na parte global, ficando assim

```js
  <script type="systemjs-importmap">
    {
      "imports": {
        "single-spa": "https://cdn.jsdelivr.net/npm/single-spa@5.5.5/lib/system/single-spa.min.js",
        "react": "https://unpkg.com/react@16/umd/react.production.min.js",
        "react-dom": "https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"
      }
    }
  </script>
```

Agora se testarmos a nossa app `react-single` no endereço: `http://localhost:9000/react-single` não encontraremos erro mais.

Se repararmos, teremos agora a aplicação `single-spa` e na última linha, teremos o retorno da nossa app `react-single` : `@fs/react-single is mounted!`

Isso significa que agora estamos tendo 2 aplicações rodando devido no nosso `root-config.js` termos na função `activeWhen` um array contendo `/` e `/react-single`, isso sempre será executado, para resolver isso precisamos mudar o código que estará assim:

```js
import { registerApplication, start } from "single-spa";

registerApplication({
  name: "@single-spa/welcome",
  app: () =>
    System.import(
      "https://unpkg.com/single-spa-welcome/dist/single-spa-welcome.js"
    ),
  activeWhen: ["/"],
});

registerApplication({
  name: "@fs/react-single",
  app: () =>
    System.import(
      "@mc/react-single"
    ),
  activeWhen: ["/react-single"],
});

start({
  urlRerouteOnly: true,
});
```

para conforme abaixo, convertendo o array numa função:

```js
import { registerApplication, start } from "single-spa";

registerApplication({
  name: "@single-spa/welcome",
  app: () =>
    System.import(
      "https://unpkg.com/single-spa-welcome/dist/single-spa-welcome.js"
    ),
  activeWhen: (location) => location.pathname === '/',
});

registerApplication({
  name: "@fs/react-single",
  app: () =>
    System.import(
      "@mc/react-single"
    ),
  activeWhen: (location) => location.pathname === '/react-single',
});

start({
  urlRerouteOnly: true,
});
```

Agora se recarregarmos no navegador a nossa app `react-single` veremos que temos apenas a específica aplicação sendo carregada:

```
@fs/react-single is mounted!
```

Podemos também testar a forma reduzida abaixo:

```js
registerApplication(
  '@mc/react-single',
  () => System.import('@mc/react-single'),
  location => location.pathname.startsWith('/react-single'),
);
```

Apenas salvando o conteúdo do arquivo: `set-public-path.js` do nosso `react-single`

```js
import { setPublicPath } from "systemjs-webpack-interop";
/* This dynamically sets the webpack public path so that code splits work properly. See related:
 * https://github.com/joeldenning/systemjs-webpack-interop#what-is-this
 * https://webpack.js.org/guides/public-path/#on-the-fly
 * https://single-spa.js.org/docs/faq/#code-splits
 */

setPublicPath("@mc/react-single");
```

`root.component.js`

```js
import React from "react";

export default function Root(props) {
  return <section>{props.name} is mounted! Tudo ok!</section>;
}
```

`root.component.test.js`

```js
import React from "react";
import { render } from "@testing-library/react";
import Root from "./root.component";

describe("Root component", () => {
  it("should be in the document", () => {
    const { getByText } = render(<Root name="Testapp" />);
    expect(getByText(/Testapp is mounted!/i)).toBeInTheDocument();
  });
});
```

Agora, poderemos deletar os arquivos abaixo do nosso `react-single`:

```
root.component.js
root.component.test.js
set-public-path.js
```

Criar o arquivo `App.js`

Editar o arquivo `mc-react-single.js` e deixar conforme abaixo:

```js{4,9}
import React from "react";
import ReactDOM from "react-dom";
import singleSpaReact from "single-spa-react";
import Root from "./App";

const lifecycles = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: App,
});

export const { bootstrap, mount, unmount } = lifecycles;

```

O mais importante do arquivo acima é a seguinte linha:

```js
export const { bootstrap, mount, unmount } = lifecycles;
```

Ou seja, obrigatoriamente precisa conter essas 3 funções: `bootstrap, mount, unmount`.

- bootstrap: vai começar a preparar para o nosso app microfrontend ser montado na página.
- mount: vai adicionar o que a bootstrap fez e renderizar no DOM.
- unmount: irá remover do DOM o nosso microfrontend.

Para o `react` a `single-spa` tem a `single-spa-react` pronta para usarmos. Aí para essa função, passamos o objeto  abaixo:

```js
const lifecycles = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: App, //qual seria o nosso primeiro componente que será renderizado na nossa aplicação
});
```

No arquivo `App.js` devemos deixar pronto assim:

```js
import React, { useState } from 'react'

// A propriedade name abaixo será o nome do nosso microfrontend: `@mc/react-single`
const App = ({ name }) => {
  const [counter, updateCounter] = useState(0)

  const handleChange = type => {
    updateCounter(oldCounter => oldCounter + type)
  }

  return (
    <>
      <h1>{name}</h1>
      <h3>Counter: {counter}</h3>
      <button onClick={() => handleChange(-1)}>Decrement</button>
      <button onClick={() => handleChange(1)}>Increment</button>
    </>
  )
}

export default App
```

Se testarmos a nossa aplicação através da URL: ``, veremos um Counter com a função Decrement e Increment.

