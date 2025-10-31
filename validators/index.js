// validators/index.js
module.exports = {
    ...require('./profileValidator'),
    ...require('./settingsValidator'),
    ...require('./personalValidator'),
    ...require('./documentValidator'),
    ...require('./selfieValidator'),
  };
  