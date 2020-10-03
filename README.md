# Passo a Passo

Fonte: [https://youtu.be/68LaXOWwxZI](https://youtu.be/68LaXOWwxZI)
Autor: Matheus Castiglioni

## Ambiente Inicial (orquestrador)

Vamos criar o orquestrador, para isso, basta executar o compando npx abaixo:

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

## Exemplo 01

Instalar uma aplicação do tipo `single-spa` com `React`, para isso ireos usar o comando (`npx create-single-spa`) e passar os parametros conforme abaixo:

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

## Exemplo-02

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

## Exemplo-03

Video no momento do start: [https://youtu.be/68LaXOWwxZI?t=1627](https://youtu.be/68LaXOWwxZI?t=1627)

Vamos criar outra aplicação do tipo `single-spa`, só que agora com rotas, então devemos voltar na raiz do projeto e rodar o comando:

```
npx create-single-spa
    react-multiples
    single-spa application / parcel
    react
    npm
    No
    mc
    react-multiples
```

Devemos anotar a url do playground para teste:

```
1. Run 'npm start -- --port 8500'
2. Go to http://single-spa-playground.org/playground/instant-test?name=@mc/react-multiples&url=8500 to see it working!
```

Então para testarmos, devemos entrar na pasta `react-multiples` do projeto criado e executar:
```
npm start -- --port 8500
e abrir no navegador a url: http://single-spa-playground.org/playground/instant-test?name=@mc/react-multiples&url=8500
```

E tereos algo como:

```
@mc/react-multiples is mounted!
```

Agora devemos no nosso `index.ejs` do nosso orquestrador adicionar a aplicação criada conforme abaixo:

```js
  <% if (isLocal) { %>
  <script type="systemjs-importmap">
    {
      "imports": {
        "@FS/root-config": "//localhost:9000/FS-root-config.js",
        "@mc/react-single": "//localhost:8500/mc-react-single.js",
        "@mc/react-multiples": "//localhost:8500/mc-react-multiples.js"
      }
    }
  </script>
```

E no nosso `FS-root-config.js` devemos registrar o nosso novo microfrontend:

```js
registerApplication(
  '@mc/react-multiples',
  () => System.import('@mc/react-multiples'),
  location => location.pathname.startsWith('/react-multiples'),
);

```

Agora para validar se deu tudo certo, devemos acessar o endereço:

```
http://localhost:9000/react-multiples
```

Devemos ter o seguinte resultado:

```
@mc/react-multiples is mounted!
```


Vamos parar a aplicação do nosso microfrontend que está rodando na porta `8500` e instalar a `react-router-dom`

```
raiz do projeto
cd react-multiples
npm i react-router-dom
```

Vamos apagar os arquivos desnecessários da aplicação:

```
.eslintrc
.prettierignore
jest.config.js
src/root.component.js
src/root.component.test.js
set-public-path.js
```

Devemos criar a seguinte estrutura:

```
src
│   mc-react-multiples.js
│
├───components
│   Root.js
│   Routes.js
│
├───layouts
│   App.js
│
└───pages
    About.js
    Contact.js
    Home.js
```

Então, vamos criar as pastas: `components, layouts e pages`

`components\Root.js`

```js
import React from 'react'

import Routes from './Routes'

const Root = () => <Routes />

export default Root
```

`components\Routes.js`

```js
import React from 'react'
import {
  BrowserRouter,
  Switch,
  Route,
} from 'react-router-dom'

import About from '../pages/About'
import Contact from '../pages/Contact'
import Home from '../pages/Home'

const Routes = () => (
  <BrowserRouter basename="react-multiples">
    <Switch>
      <Route exact path="/" component={Home}/>
      <Route exact path="/about" component={About}/>
      <Route exact path="/contact" component={Contact}/>
    </Switch>
  </BrowserRouter>
)

export default Routes
```

`layouts\App.js`

```js
import React from 'react'
import {Link  } from 'react-router-dom'

const App = ({ children }) => (
  <main>
    <h1>@mc/react-multiples</h1>
    <nav>
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/about">About</Link>
        </li>
        <li>
          <Link to="/contact">Contact</Link>
        </li>
      </ul>
    </nav>
    {children}
  </main>
)

export default App
```

`pages\About.js`

```js
import React from 'react'

import App from '../layouts/App'

const About = () => (
  <App>
    <p>About</p>
  </App>
)

export default About
```

`pages\Contact.js`

```js
import React from 'react'

import App from '../layouts/App'

const Contact = () => (
  <App>
    <p>Contact</p>
  </App>
)

export default Contact
```

`pages\Home.js`

```js
import React from 'react'

import App from '../layouts/App'

const Home = () => (
  <App>
    <p>Home</p>
  </App>
)

export default Home
```

Devemos editar o arquivo `mc-react-multiples.js` no `import do Root` e remover a referência do arquivo que deletamos do `set-public-path.js`, deve ficar assim o código final:

```js
import React from "react";
import ReactDOM from "react-dom";
import singleSpaReact from "single-spa-react";
import Root from "./components/Root";

const lifecycles = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: Root,
  errorBoundary(err, info, props) {
    // Customize the root error boundary for your microfrontend here.
    return null;
  },
});

export const { bootstrap, mount, unmount } = lifecycles;
```

Vamos iniciar novamente a nossa aplicação:

```
npm start -- --port 8500
```

Recarregar no navegador:

```
http://localhost:9000/react-multiples
``` 

Um ponto muito IMPORTANTE é não esquecermos do basename no arquivo de rotas, porque sabemos que temos `react-multiples/about` e não apenas `/about` por exemplo e assim por diante.

```
<BrowserRouter basename="react-multiples">
```

Um outro ponto importante é sempre usar no nosso `root-config.js` a propriedade startsWith ou no modelo antigo trocar para array da propriedade `activeWhen`, pois não teremos apenas a rota `react-multiples`, mas sim `react-multiples/algumacoisa`:

```
location => location.pathname.startsWith('/react-multiples') ou no modelo antigo, devemos usar um array, assim:

activeWhen: ['/react-multiples'],
```

Outro ponto importante é alimentar as Rotas com `exact`, para que não carregue sempre o / = home.
Explicação em [https://youtu.be/68LaXOWwxZI?t=1871](https://youtu.be/68LaXOWwxZI?t=1871)


## Exemplo-04-parcel (a hora e agora)

[https://youtu.be/68LaXOWwxZI?t=2014](https://youtu.be/68LaXOWwxZI?t=2014)

Vamos criar mais um projeto:

```
npx create-single-spa
    	react-parcel
        single-spa application / parcel
        react
        npm
        No
        mc
        react-parcel
```

Uma vez instalado, anotar os dados da url

```
cd react-parcel
1. Run 'npm start -- --port 8500'
2. Go to http://single-spa-playground.org/playground/instant-test?name=@mc/react-parcel&url=8500 to see it working!

O resultado deverá ser: 
@mc/react-parcel is mounted!
```

- `index.ejs` do nosso orquestrador:

```js{8}
  <% if (isLocal) { %>
  <script type="systemjs-importmap">
    {
      "imports": {
        "@FS/root-config": "//localhost:9000/FS-root-config.js",
        "@mc/react-single": "//localhost:8500/mc-react-single.js",
        "@mc/react-multiples": "//localhost:8500/mc-react-multiples.js",
        "@mc/react-parcel": "//localhost:8500/mc-react-parcel.js"
      }
    }
  </script>
  <% } %>
```
- Registrar a aplicação no nosso `FS-root-config`

```js
registerApplication(
  '@mc/react-parcel',
  () => System.import('@mc/react-parcel'),
  location => location.pathname.startsWith('/react-parcel'),
);
```

Rodando no navegador: `http://localhost:9000/react-parcel` deveremos ter o result abaixo:

```
@mc/react-parcel is mounted!
```

Vamos apagar os arquivos de costume do nosso microfrontend:

```
.eslintrc
.prettierignore
jest.config.js
src/root.component.js
src/root.component.test.js
set-public-path.js
```

Criar o arquivo `App.js`

```js
import React, { useState, useEffect } from 'react'
import { listenEvent } from '@mc/utils'

const App = () => {
  const [tasks, updateTasks] = useState([])

  useEffect(() => {
    listenEvent('@mc/react-route/todo/add-task', event => {
      updateTasks(oldTasks => [
        ...oldTasks,
        event.detail,
      ])
    })
  }, [])

  return (
    <>
      <h1>@mc/react-parcel</h1>
      <table>
        <thead>
          <tr>
            <th>Id</th>
            <th>Task</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task.id}>
              <td>{task.id}</td>
              <td>{task.describe}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

export default App
```

Abrir o `mc-react-parcel.js` e remover a linha 1 e editar a linha 5 e 10, deixando o código como abaixo:

```js{4,9}
import React from "react";
import ReactDOM from "react-dom";
import singleSpaReact from "single-spa-react";
import App from "./App";

const lifecycles = singleSpaReact({
  React,
  ReactDOM,
  rootComponent: App,
  errorBoundary(err, info, props) {
    // Customize the root error boundary for your microfrontend here.
    return null;
  },
});

export const { bootstrap, mount, unmount } = lifecycles;
```




