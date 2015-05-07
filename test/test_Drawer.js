var util = require("./util");

var prototype = [
  {name: "close", type: "fn()"},
  {name: "open", type: "fn()"}
];

module.exports = util.runCommonTests("Drawer", {prototype: prototype});

if (module === require.main) require("test").run(module.exports);