var util = require("./util");

var properties = [
  {name: "alignment", type: "string"},
  {name: "image", type: "Image"},
  {name: "text", type: "string"}
];

var events = [{name: "select"}];

module.exports = util.runCommonTests("Button", {properties: properties, events: events});

if (module === require.main) require("test").run(module.exports);