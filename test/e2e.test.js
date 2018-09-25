import path from 'path';
import fs from 'fs';
import util from 'util';
import React from 'react';
import ejs from 'ejs';
import pug from 'pug';
import htmlMinifier from 'html-minifier';
import jsBeautify from 'js-beautify';
import ReactDOMServer from 'react-dom/server';
import Main from './fixtures/e2e/basic/Main';
import { compile } from '../src/index';

const readFile = util.promisify(fs.readFile);

describe('e2e', () => {
  it('should match the result of `ReactDOMServer.renderToString()` and `ejs.render()`', async () => {
    const htmlExpexted = ReactDOMServer.renderToStaticMarkup(<Main />);
    const inputFile = path.join(__dirname, 'fixtures/e2e/basic/Main.js');
    const code = await readFile(inputFile, 'utf-8');
    const templateEJS = await compile(code, { inputFile, templateEngine: 'ejs' });
    const templatePug = await compile(code, { inputFile, templateEngine: 'pug' });
    const htmlEJS = ejs.render(templateEJS);
    const htmlPug = pug.render(templatePug);
    const minifyOpts = {
      removeComments: true,
      collapseWhitespace: true,
      collapseInlineTagWhitespace: true
    };
    const htmlEJSMin = jsBeautify.html(htmlMinifier.minify(htmlEJS, minifyOpts));
    const htmlPugMin = jsBeautify.html(htmlMinifier.minify(htmlPug, minifyOpts));
    const htmlExpextedMin = jsBeautify.html(htmlMinifier.minify(htmlExpexted, minifyOpts));
    expect(htmlEJSMin).toBe(htmlExpextedMin);
    expect(htmlPugMin).toBe(htmlExpextedMin);
  });
});
