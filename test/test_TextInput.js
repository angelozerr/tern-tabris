var util = require("./util");

var properties = [
  {name: "alignment", type: "string"},
  {name: "autoCapitalize", type: "bool"},
  {name: "autoCorrect", type: "bool"},
  {name: "editable", type: "bool"},
  {name: "keyboard", type: "string"},
  {name: "message", type: "string"},
  {name: "text", type: "string"},
  {name: "type", type: "string"},
];

var events = [
  {name: "accept"},
  {name: "blur"},
  {name: "change:text"},
  {name: "focus"},
  {name: "input"}
];

module.exports = util.runCommonTests("TextInput", {properties: properties, events: events});

if (module === require.main) require("test").run(exports);