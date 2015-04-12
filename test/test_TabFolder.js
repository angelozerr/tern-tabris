var util = require("./util");

var properties = [
  {name: "maximum", type: "number"},
  {name: "minimum", type: "number"},
  {name: "selection", type: "number"}
];

var events = [
  {name: "change:selection"},
  {name: "select"}
];

module.exports = util.runCommonTests("TabFolder", {properties: properties, events: events});

if (module === require.main) require("test").run(exports);