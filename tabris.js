(function(mod) {
  if (typeof exports == "object" && typeof module == "object") { // CommonJS
    return mod(require.main.require("../lib/infer"), require.main.require("../lib/tern"));
  }
  if (typeof define == "function" && define.amd) // AMD
    return define([ "tern/lib/infer", "tern/lib/tern" ], mod);
  mod(tern, tern);
})(function(infer, tern) {
  "use strict";

  infer.registerFunction("tabris_create", function(_self, args, argNodes) {
	if (!argNodes || !argNodes.length || argNodes[0].type != "Literal" || typeof argNodes[0].value != "string")
	  return infer.ANull;
	var cx = infer.cx(), server = cx.parent, name = argNodes[0].value;
	var locals = cx.definitions.tabris;
    if (locals[name] && locals[name].getProp("prototype")) return new infer.Obj(locals[name].getProp("prototype").getType());
    
    return infer.ANull;
  });
    
  infer.registerFunction("tabris_Widget_get", function(_self, args, argNodes) {
	if (!argNodes || !argNodes.length || argNodes[0].type != "Literal" || typeof argNodes[0].value != "string")
	  return infer.ANull;
	var cx = infer.cx(), server = cx.parent, name = argNodes[0].value, locals = cx.definitions.tabris;
	switch(name) {
	  case 'text':
		return cx.protos.String;
	  case 'bounds':
	    return locals['Bounds'];		
	}    
    return infer.ANull;
  });
  
  tern.registerPlugin("tabris", function(server, options) {    
    return {
      defs: defs      
    };
  });
  
  var defs = {
	  "!name": "tabris",
	  "!define": {
		"Bounds": {
		  "left": {
		    "!type": "number",
		    "!doc": "The horizontal offset from the parent's left edge in dip"
		  },
		  "top": {
		    "!type": "number",
		    "!doc": "The horizontal offset from the parent's top edge in dip"
		  },
		  "width": {
		    "!type": "number",
		    "!doc": "The width of the widget in dip"
		  },
		  "height": {
		    "!type": "number",
		    "!doc": "The height of the widget in dip"
		  }		  
		},
		"Widget": {
		  "!type": "fn()",
		  "prototype": {
            "get": {
              "!type": "fn(name: string) -> !custom:tabris_Widget_get",
              "!doc": "Retrieves the current value of the given property from the widget and returns it.",
              "!url": "https://github.com/eclipsesource/tabris-js/blob/master/doc/widgets.md#getname"
            },
            "set": {
              "!type": "fn(name: string, value: string) -> !this",
              "!doc": "Sets a widget property. Returns the widget itself.",
              "!url": "https://github.com/eclipsesource/tabris-js/blob/master/doc/widgets.md#setproperties"
            },
            "animate": {
              "!type": "fn(properties: ?, options: ?)",
              "!doc": "Changes a number of widget properties with an animation. Currently, only the properties transform and opacity are supported. Does not yet return any value.",
              "!url": "https://github.com/eclipsesource/tabris-js/blob/master/doc/widgets.md#animateproperties-options"
            },
            "appendTo": {
              "!type": "fn(parent: +Widget) -> !this",
              "!doc": "Appends the widget to a parent. If the widget already has a parent, it is deregistered from the actual parent and registered with the new one. Returns the widget itself.",
              "!url": "https://github.com/eclipsesource/tabris-js/blob/master/doc/widgets.md#appendtoparent"
            },
            "append": {
              "!type": "fn(child: +Widget) -> !this",
              "!doc": "Appends one or more child widget to this widget. This method is equivalent to calling appendTo on every child, e.g. parent.append(child1, child2) is a short cut for calling child1.appendTo(parent) and child2.appendTo(parent). Returns the widget itself.",
              "!url": "https://github.com/eclipsesource/tabris-js/blob/master/doc/widgets.md#appendchild-child-"
            },
            "parent": {
              "!type": "fn() -> +Widget",
              "!doc": "Returns the widget's parent.",
              "!url": "https://github.com/eclipsesource/tabris-js/blob/master/doc/widgets.md#parent"
            },
            "children": {
              "!type": "fn() -> [+Widget]",
              "!doc": "Returns the list of children of this widget. The returned array is a copy and can safely be manipulated.",
              "!url": "https://github.com/eclipsesource/tabris-js/blob/master/doc/widgets.md#children"
            },            
            "dispose": {
              "!type": "fn()",
              "!doc": "Disposes of the widget, destroys all of its children widgets and triggers a dispose event.",
              "!url": "https://github.com/eclipsesource/tabris-js/blob/master/doc/widgets.md#dispose"
            }
		  }
		},
		"Composite": {
	      "!type": "fn()",
	      "!doc": "TODO",
	      "prototype": {
	        "!proto": "Widget.prototype"
	      }
	    },
	    "Page": {
	      "!type": "fn()",
	      "!doc": "TODO",
	      "prototype": {
	        "!proto": "Widget.prototype"
	      }
	    },
	    "Button": {
	      "!type": "fn()",
	      "!doc": "A push button. Can contain a text or an image.",
	      "prototype": {
	        "!proto": "Widget.prototype"
	      }
	    }
	  },
	  "tabris": {
		"load": {
		  "!type": "fn(fn: fn())"	
		},
        "create": {
          "!type": "fn(type: string, properties?: ?) -> !custom:tabris_create",
          "!doc": "Creates a native widget of a given type and returns its reference.",
          "!url": "https://github.com/eclipsesource/tabris-js/blob/master/doc/widgets.md#tabriscreatetype-properties"
        }	
	  }
  }

});