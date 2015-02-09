var util = require("./util");

exports['test Label completion'] = function() {

  // get
  util.assertCompletion("var label = tabris.create('Label', {});label.", {
    "name":"get",
    "type":"fn(name: string)",
    "origin":"tabris"
  }, null, null, "get");

  // set
  util.assertCompletion("var label = tabris.create('Label', {});label.", {
    "name":"set",
    "type":"fn(name: string, value: ?)",
    "origin":"tabris"
  }, null, null, "set");

  // append
  util.assertCompletion("var label = tabris.create('Label', {});label.", {
    "name":"append",
    "type":"fn(child: types.Widget)",
    "origin":"tabris"
  }, null, null, "append");

  // animate
  util.assertCompletion("var label = tabris.create('Label', {});label.", {
    "name":"animate",
    "type":"fn(animationProperties: ?, options: ?)",
    "origin":"tabris"
  }, null, null, "animate");
 
}

if (module == require.main) require("test").run(exports);