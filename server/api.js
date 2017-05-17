/* eslint one-var: ["off"] */
const path = require('path'),
  fs = require('fs');

const getJsonFromFile = file =>
    fs.readFileSync(file, 'utf8', (err, data) => {
      if (err) {
        throw err;
      }
      return JSON.parse(data);
    });

const api = function api(app, opts) {
  app.get('/api/data', (req, res) => {
    const file = path.format({
      dir: opts.data,
      base: 'data.json',
    });

    res
            .status(200)
            .send(getJsonFromFile(file));
  });

  app.post('/api/data', (req, res) => {
    res.sendStatus(200);
  });

  app.delete('/api/data', (req, res) => {
    res.sendStatus(200);
  });

  app.put('/api/data', (req, res) => {
    res.sendStatus(200);
  });
};

module.exports = api;
