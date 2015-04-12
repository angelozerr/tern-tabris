var util = require("./util");

var properties = [
  {name: "html", type: "string"},
  {name: "url", type: "string"}
];

module.exports = util.runCommonTests("WebView", {properties: properties});

if (module === require.main) require("test").run(exports);