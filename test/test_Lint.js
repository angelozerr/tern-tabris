var util = require("./util");

exports['test Button completion'] = function() {

  // Widget#children() is an array of Widget
  util.assertCompletion("var button = tabris.create('Button', {});" +
	"var children = button.children();" +
	"children.", {
    "name" : "filter",
    "type" : "fn(test: fn(elt: types.Widget, i: number) -> bool, context?: ?)",
    "origin" : "tabris"
  }, null, null, "filter");

  util.assertFunction("Button", {name: "get", type: "fn(name: string)"});

};

if (module === require.main) require("test").run(exports);