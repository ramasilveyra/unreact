import React from 'react';
import ejs from 'ejs';
import htmlMinifier from 'html-minifier';
import jsBeautify from 'js-beautify';
import ReactDOMServer from 'react-dom/server';
import Main from './fixtures/e2e/Main';
import { getFixture, getFixturePath } from './utils';
import { compile } from '../src/index';

describe('e2e', () => {
  it('should match the result of `ReactDOMServer.renderToString()` and `ejs.render()`', async () => {
    // HACK:
    //   1. Manually removed ` data-reactroot=""` from `ReactDOMServer.renderToString()` output.
    //   2. EJS doesn't handle attributes generation like React. If the value of an attribute is
    //      `null` it will still print the attribute. Manually removed ` data-clipboard-target=""`.
    const fixture = 'e2e';
    const expected = ReactDOMServer.renderToString(<Main />).replace('data-reactroot=""', '');
    const MainPath = getFixturePath(`${fixture}/Main.js`);
    const MainCode = await getFixture(`${fixture}/Main.js`);
    const ejsResult = await compile(MainCode, MainPath);
    const result = ejs
      .render(ejsResult, { type: '', copyTarget: null, appearance: null })
      .replace(' data-clipboard-target=""', '')
      .replace(' data-clipboard-target=""', '');
    const minOpts = {
      removeComments: true,
      collapseWhitespace: true,
      collapseInlineTagWhitespace: true
    };
    const resultMin = jsBeautify.html(htmlMinifier.minify(result, minOpts));
    const expectedMin = jsBeautify.html(htmlMinifier.minify(expected, minOpts));
    expect(resultMin).toBe(expectedMin);
  });
});
