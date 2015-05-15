var util = require("./util");

var properties = [
  {name: "badge", type: "string"},
  {name: "image", type: "Image"},
  {name: "title", type: "string"}
];

module.exports = util.runCommonTests("Tab", {properties: properties});

if (module === require.main) require("test").run(exports);