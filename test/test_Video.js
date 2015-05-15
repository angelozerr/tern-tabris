var util = require("./util");

var properties = [
  {name: "url", type: "string"}
];

module.exports = util.runCommonTests("Video", {properties: properties});

if (module === require.main) require("test").run(exports);