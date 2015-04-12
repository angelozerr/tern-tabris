var util = require("./util");

var functions = [
  {name: "close", type: "fn()"},
  {name: "open", type: "fn()"}
];

module.exports = util.runCommonTests("Drawer", {functions: functions});

if (module === require.main) require("test").run(module.exports);