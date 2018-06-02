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

<p align="center"><a href="https://youtu.be/hHd7aqj3LF4?t=22s">Why? There is no why.</a> Jokes aside, <strong><a href="https://github.com/ramasilveyra/templating-benchmarks/tree/feat/add-ejs#performance">EJS can be 94% faster</a></strong>.</p>

<h2 align="center">Table of Contents</h2>

- [Install](#install)
- [Usage](#usage)
- [Limitations](#limitations)
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

### Convert Files

```bash

unreact src/button.js --out-file views/button.ejs
```

### Convert Directories

```bash

unreact src --out-dir views
```

<h2 align="center">Limitations</h2>

- Only works with functional components.
- Only works with one React Component per file.

<h2 align="center">Contribute</h2>

Feel free to dive in! [Open an issue](https://github.com/ramasilveyra/unreact/issues/new) or submit PRs.

unreact follows the [Contributor Covenant](https://contributor-covenant.org/version/1/4/) Code of Conduct.

<h2 align="center">License</h2>

[MIT](LICENSE.md)
