var util = require("./util");

var properties = [
  {name: "alignment", type: "string"},
  {name: "image", type: "Image"},
  {name: "selection", type: "bool"},
  {name: "text", type: "string"}
];

var events = [
  {name: "change:selection"},
  {name: "select"},
];

module.exports = util.runCommonTests("ToggleButton", {properties: properties, events: events});

if (module === require.main) require("test").run(exports);