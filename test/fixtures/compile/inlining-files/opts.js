const path = require('path');

module.exports = [
  {
    templateEngine: 'ejs',
    inputFile: path.join(__dirname, 'input.js')
  },
  {
    templateEngine: 'pug',
    inputFile: path.join(__dirname, 'input.js')
  }
];
