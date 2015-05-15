var util = require("./util");

var properties = [
  {name: "selection", type: "bool"},
  {name: "text", type: "string"}
];

var events = [
  {name: "change:selection"},
  {name: "select"}
];

module.exports = util.runCommonTests("RadioButton", {properties: properties, events: events});

if (module === require.main) require("test").run(exports);