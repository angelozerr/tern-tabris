var util = require("./util");

var properties = [
  {name: "image", type: "Image"},
  {name: "scaleMode", type: "string"}
];

module.exports = util.runCommonTests("ImageView", {properties: properties});

if (module === require.main) require("test").run(module.exports);