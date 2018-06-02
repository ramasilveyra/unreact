<div align="center">
  <a href="https://www.npmjs.com/package/unreact">
    <img src="https://img.shields.io/npm/v/unreact.svg?maxAge=86400" alt="Last npm Registry Version">
  </a>
  <a href="https://travis-ci.org/ramasilveyra/unreact?branch=master">
    <img src="https://travis-ci.org/ramasilveyra/unreact.svg?branch=master" alt="Build Status">
  </a>
  <a href="https://codecov.io/github/ramasilveyra/unreact?branch=master">
    <img src="https://img.shields.io/codecov/c/github/ramasilveyra/unreact.svg?branch=master" alt="Code coverage">
  </a>
</div>

<h1 align="center">Convert React Components to EJS or Pug (unreact)</h1>

<blockquote align="center">The future is React without React.</blockquote>

<p align="center"><strong><a href="https://github.com/ramasilveyra/templating-benchmarks/tree/feat/add-ejs#performance">EJS and Pug templates engines can be 94%+ faster than <code>ReactDOMServer.renderToString</code></a></strong>.</p>

<h2 align="center">Table of Contents</h2>

- [Install](#install)
- [Usage](#usage)
- [Limitations](#limitations)
- [Future](#future)
- [Contribute](#contribute)
- [License](#license)

<h2 align="center">Install</h2>

**Node.js v8 or newer** is required.

Via the yarn client:

```bash
$ yarn add --dev unreact
```

Via the npm client:

```bash
$ npm install --save-dev unreact
```

<h2 align="center">Usage</h2>

### Convert Files (`--out-file`/`-o`)

```bash

unreact src/button.js --out-file views/button.ejs
```

### Convert Directories (`--out-dir`/`-O`)

```bash

unreact src --out-dir views
```

<h2 align="center">Limitations</h2>

*ALPHA SOFTWARE*

- Only works with functional components and very simple ones.

<h2 align="center">Future</h2>

Check the work bridging React and Prepack:
- https://github.com/facebook/prepack/pulls?utf8=%E2%9C%93&q=is%3Apr+react
- https://twitter.com/trueadm/status/1002812303824314369
- https://github.com/trueadm/ssr-with-prepack-hackathon 

<h2 align="center">Contribute</h2>

Feel free to dive in! [Open an issue](https://github.com/ramasilveyra/unreact/issues/new) or submit PRs.

unreact follows the [Contributor Covenant](https://contributor-covenant.org/version/1/4/) Code of Conduct.

<h2 align="center">License</h2>

[MIT](LICENSE.md)
