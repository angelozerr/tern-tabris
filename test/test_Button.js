var util = require("./util");

exports['test Button completion'] = function() {

  // Widget#children() is an array of Widget
  util.assertCompletion("var button = tabris.create('Button', {});" +
	"var children = button.children();" +
	"children.", {
    "name":"concat",
    "type":"fn(other: [?])",
    "origin":"ecma5"
  }, null, null, "concat");
 
  util.assertCompletion("var button = tabris.create('Button', {});" +
	"var children = button.children();" +
	"children.forEach(function(elt) {elt.", {
	"name":"get",
    "type":"fn(name: string)",
    "origin":"tabris"
  }, null, null, "get");
  
}

if (module == require.main) require("test").run(exports);