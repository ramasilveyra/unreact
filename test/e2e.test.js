import React from 'react';
import ejs from 'ejs';
import pug from 'pug';
import htmlMinifier from 'html-minifier';
import jsBeautify from 'js-beautify';
import ReactDOMServer from 'react-dom/server';
import Main from './fixtures/e2e/Main';
import { getFixture, getFixturePath } from './utils';
import { compile } from '../src/index';

describe('e2e', () => {
  it('should match the result of `ReactDOMServer.renderToString()` and `ejs.render()`', async () => {
    const fixture = 'e2e';
    const htmlExpexted = ReactDOMServer.renderToStaticMarkup(<Main />);
    const inputFile = getFixturePath(`${fixture}/Main.js`);
    const code = await getFixture(`${fixture}/Main.js`);
    const templateEJS = await compile(code, { inputFile, templateEngine: 'ejs' });
    const templatePug = await compile(code, { inputFile, templateEngine: 'pug' });
    // const templateLiquid = await compile(code, { inputFile, templateEngine: 'liquid' });
    const htmlEJS = ejs.render(templateEJS);
    const htmlPug = pug.render(templatePug);
    // const htmlLiquid = pug.render(templateLiquid);
    const minifyOpts = {
      removeComments: true,
      collapseWhitespace: true,
      collapseInlineTagWhitespace: true
    };
    const htmlEJSMin = jsBeautify.html(htmlMinifier.minify(htmlEJS, minifyOpts));
    const htmlPugMin = jsBeautify.html(htmlMinifier.minify(htmlPug, minifyOpts));
    // const htmlLiquidMin = jsBeautify.html(htmlMinifier.minify(htmlLiquid, minifyOpts));
    const htmlExpextedMin = jsBeautify.html(htmlMinifier.minify(htmlExpexted, minifyOpts));
    expect(htmlEJSMin).toBe(htmlExpextedMin);
    expect(htmlPugMin).toBe(htmlExpextedMin);
    // expect(htmlLiquidMin).toBe(htmlExpextedMin);
  });
});
