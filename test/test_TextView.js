var util = require("./util");

var properties = [
  {name: "alignment", type: "string"},
  {name: "markupEnabled", type: "bool"},
  {name: "maxLines", type: "number"},
  {name: "text", type: "string"}
];

module.exports = util.runCommonTests("TextView", {properties: properties});

if (module === require.main) require("test").run(exports);