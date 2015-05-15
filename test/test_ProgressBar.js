var util = require("./util");

var properties = [
  {name: "maximum", type: "number"},
  {name: "minimum", type: "number"},
  {name: "selection", type: "number"},
  {name: "state", type: "string"}
];

module.exports = util.runCommonTests("ProgressBar", {properties: properties});

if (module === require.main) require("test").run(exports);