var util = require("./util");

var inheriting = ["Canvas", "Drawer", "Page", "ScrollView", "Tab"];

var functions = [
  {name: "append", type: "fn(widget: types.Widget, widget?: types.Widget)"}
];

var events = [{name: "addchild", origin: "Composite"}, {name: "removechild", origin: "Composite"}];

module.exports = util.runCommonTests("Composite", {functions: functions, events: events, inheriting: inheriting});

if (module === require.main) require("test").run(exports);