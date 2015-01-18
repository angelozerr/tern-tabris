var util = require("./util");

exports['test tabris completion'] = function() {
  util.assertCompletion("ta", {
    "start":{"line":0,"ch":0},
	"end":{"line":0,"ch":2},
	"isProperty":false,
	"isObjectKey": false,
	"completions":[{"name":"tabris","type":"tabris","origin":"tabris"}]
  });
}

exports['test tabris.create completion'] = function() {

  // undefined widget
  util.assertCompletion("var button = tabris.create('Undefined', {});button.", {
    "start":{"line":0,"ch":51},
    "end":{"line":0,"ch":51},
    "isProperty":true,
    "isObjectKey": false,
    "completions":[]
  });
 
  // get
  util.assertCompletion("var button = tabris.create('Button', {});button.", {
    "name":"get",
    "type":"fn(name: string)",
    "origin":"tabris"
  }, null, null, "get");

  // set
  util.assertCompletion("var button = tabris.create('Button', {});button.", {
    "name":"set",
    "type":"fn(name: string, value: string)",
    "origin":"tabris"
  }, null, null, "set");

  // append
  util.assertCompletion("var button = tabris.create('Button', {});button.", {
    "name":"append",
    "type":"fn(child: !types.Widget)",
    "origin":"tabris"
  }, null, null, "append");

  // animate
  util.assertCompletion("var button = tabris.create('Button', {});button.", {
    "name":"animate",
    "type":"fn(properties: ?, options: ?)",
    "origin":"tabris"
  }, null, null, "animate");
 
}

exports['test Widget.get completion'] = function() {
	 
  // get('text') returns a string
  util.assertCompletion("var button = tabris.create('Button', {});button.get('text').", {
    "name":"charAt",
    "type":"fn(i: number) -> string",
    "origin":"ecma5"
  }, null, null, "charAt");

  // get('selection') returns a boolean
  /*util.assertCompletion("var button = tabris.create('Button', {});button.get('selection').", {
    "name":"left",
    "type":"number",
    "origin":"tabris"
  }, null, null);*/
  
  // get('bounds') returns a Bounds object
  util.assertCompletion("var button = tabris.create('Button', {});button.get('bounds').", {
    "name":"left",
    "type":"number",
    "origin":"tabris"
  }, null, null, "left");
 
}

exports['test Widget.on listener "this" completion'] = function() {
	 
  // get('text') returns a string
  util.assertCompletion("var button = tabris.create('Button', {});" +
  		"button.on('selection', selectionHandler);" +
  		"var selectionHandler = function() { this.", {
    "name":"animate",
    "type":"fn(properties: ?, options: ?)",
    "origin":"tabris"
  }, null, null, "animate");
 
}
if (module == require.main) require("test").run(exports);