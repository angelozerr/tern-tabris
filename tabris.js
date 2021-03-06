(function(mod) {
  if (typeof exports == "object" && typeof module == "object") { // CommonJS
    return mod(require("tern/lib/infer"), require("tern/lib/tern"));
  }
  if (typeof define == "function" && define.amd) // AMD
    return define([ "tern/lib/infer", "tern/lib/tern" ], mod);
  mod(tern, tern);
})(function(infer, tern) {
  "use strict";

  var preferQuote = "\"";

  var defaultRules = {
    "UnknownTabrisType" : {"severity" : "error"},
    "UnknownTabrisProperty" : {"severity" : "error"},
    "UnknownTabrisEvent" : {"severity" : "error"}
  };

  var notCreatable = ["Widget", "WidgetCollection", "CanvasContext", "UI", "App", "Device", "Proxy"];

  function registerLints() {
    if (!tern.registerLint) return;

    // validate tabris.create(
    tern.registerLint("tabrisCreate_lint", function(node, addMessage, getRule) {
      var argNode = node.arguments[0];
      if (argNode) {
        var cx = infer.cx(), types = cx.definitions.tabris["types"], typeName = argNode.value;
        if (!types.hasProp(typeName)) addMessage(argNode, "Unknown tabris type '" + typeName + "'", defaultRules.UnknownTabrisType.severity);
      }
    });

    // validate widget.get(
    tern.registerLint("tabrisGet_lint", function(node, addMessage, getRule) {
      var argNode = node.arguments[0];
      if (argNode) {
        var cx = infer.cx(), proxyType = argNode._tabris && argNode._tabris.proxyType, propertyName = argNode.value;
        if (!getProxyPropertyType(proxyType, propertyName)) addMessage(argNode, "Unknown tabris property '" + propertyName + "'", defaultRules.UnknownTabrisProperty.severity);
      }
    });

    // validate widget.set(
    tern.registerLint("tabrisSet_lint", function(node, addMessage, getRule) {
      var argNode = node.arguments[0];
      if (argNode) {
        var cx = infer.cx(), proxyType = argNode._tabris && argNode._tabris.proxyType, propertyName = argNode.value, propertyType = getProxyPropertyType(proxyType, propertyName);
        if (!propertyType) {
          // Unknown property
          addMessage(argNode, "Unknown tabris property '" + propertyName + "'", defaultRules.UnknownTabrisProperty.severity);
        } else {
          // TODO: Validate property value.
        }
      }
    });

    // validate on, off, trigger event(
    tern.registerLint("tabrisEvent_lint", function(node, addMessage, getRule) {
      var argNode = node.arguments[0];
      if (argNode) {
        var cx = infer.cx(), proxyType = argNode._tabris && argNode._tabris.proxyType, eventName = argNode.value;
        if (!getEventType(proxyType, eventName)) addMessage(argNode, "Unknown tabris event '" + eventName + "'", defaultRules.UnknownTabrisEvent.severity);
      }
    });

  }

  function fillCompletions(completions, types, preferQuote) {
    var query = {docs: true, types: true, origins: true};
    infer.forAllPropertiesOf(types, function(prop, obj) {
      if (obj.origin == "tabris") {
        var name = preferQuote ? preferQuote + prop + preferQuote : prop;
        var item = tern.addCompletion(query, completions, name, obj.hasProp(prop))
        if (preferQuote) item.displayName = prop;
      }
    });
  }

  function registerGuessTypes() {
    if (!tern.registerGuessType) return;

    // completion guess for tabris.create(
    tern.registerGuessType("tabrisCreate_guessType", function(arg, i, file) {
      switch(i) {
      case 0:
        var cx = infer.cx(), types = cx.definitions.tabris["types"];
        var completions = [];
        fillCompletions(completions, types, preferQuote);
        return {
          type: "string",
          completions: completions
        }
        break;
      }
    });

    // completion guess for widget.get(
    tern.registerGuessType("tabrisGet_guessType", function(arg, i, file, objType) {
      switch(i) {
      case 0:
        var completions = [], widgetType = objType.getType(), proto = widgetType.proto;
        while(proto) {
          var objType = getProxyObjectProperties(proto);
          if (objType) fillCompletions(completions, objType.getType(), preferQuote);
          proto = proto.proto;
        }
        return {
          type: "string",
          completions: completions
        }
        break;
      }
    });

  }

  infer.registerFunction("tabris_create", function(_self, args, argNodes) {
    if (!argNodes || !argNodes.length || argNodes[0].type != "Literal" || typeof argNodes[0].value != "string")
      return infer.ANull;
    var cx = infer.cx(), server = cx.parent, name = argNodes[0].value, locals = cx.definitions.tabris["types"], tabrisType = locals.hasProp(name);
    argNodes[0]._tabris = {"type" : "tabris_create"};
    if (tabrisType) {
      return new infer.Obj(tabrisType.getType().getProp("prototype").getType());
    }
    return infer.ANull;
  });

  infer.registerFunction("tabris_Proxy_get", function(_self, args, argNodes) {
    if (!argNodes || !argNodes.length || argNodes[0].type != "Literal" || typeof argNodes[0].value != "string")
      return infer.ANull;

    var widgetType = _self.getType(), propertyName = argNodes[0].value, propertyType = getProxyPropertyType(widgetType, propertyName);
    argNodes[0]._tabris = {"type" : "tabris_Proxy_get", "proxyType" : widgetType};
    if (propertyType && !propertyType.isEmpty()) return propertyType.getType();
    return infer.ANull;
  });

  infer.registerFunction("tabris_Proxy_set", function(_self, args, argNodes) {
    if (!argNodes || !argNodes.length || argNodes[0].type != "Literal" || typeof argNodes[0].value != "string")
      return infer.ANull;

    var widgetType = _self.getType(), propertyName = argNodes[0].value, propertyType = getProxyPropertyType(widgetType, propertyName);
    argNodes[0]._tabris = {"type" : "tabris_Proxy_set", "proxyType" : widgetType};

    var fnType = _self.hasProp("set").getFunctionType();
    var result = new infer.AVal;
    var deps = [];
    deps.push(args[0]);
    //deps.push(propertyType.getType());
    //fnType.propagate(new infer.IsCallee(infer.cx().topScope, deps, null, result));
    fnType.args = deps;
    return result
  });

  infer.registerFunction("tabris_Proxy_eventtype", function(_self, args, argNodes) {
    if (!argNodes || !argNodes.length || argNodes[0].type != "Literal" || typeof argNodes[0].value != "string")
      return infer.ANull;

    var proxyType = _self.getType();
    argNodes[0]._tabris = {"type" : "tabris_Proxy_eventtype", "proxyType" : proxyType};
  });

  function getProxyEventProperties(proto) {
    var name = proto.name.replace(/^types\./, "").split(".")[0];
    var cx = infer.cx();
    var locals = cx.definitions.tabris;
    return locals["!events"].hasProp(name + "Events");
  }

  function getEventType(widgetType, eventName) {
    if (!(widgetType)) return null;
    var proto = widgetType.proto, eventType = null;
    while(proto) {
      var objectType = getProxyEventProperties(proto);
      if (objectType && objectType.getType) eventType = objectType.getType().hasProp(eventName)
      if (eventType) return eventType;
      proto = proto.proto;
    }
    return null;
  }

  function getProxyPropertyType(widgetType, propertyName) {
    if (!(widgetType)) return null;
    var proto = widgetType.proto, propertyType = null;
    while(proto) {
      var objectType = getProxyObjectProperties(proto);
      if (objectType && objectType.getType) propertyType = objectType.getType().hasProp(propertyName)
      if (propertyType) return propertyType;
      proto = proto.proto;
    }
    return null;
  }

  function getProxyObjectProperties(proto) {
    var cx = infer.cx(), locals = cx.definitions.tabris;
    var objectName = proto.name;
    objectName = objectName
      .replace(/^types./, "")
      .replace(/^tabris./, "")
      .replace(/.prototype$/, "")
      .concat("Properties");
    return locals["!properties"].hasProp(objectName);
  }

  tern.registerPlugin("tabris", function(server, options) {
    registerLints();
    registerGuessTypes();
    server.on("typeAt", findTypeAt);
    server.on("completion", findCompletions);
    server.addDefs(defs);
  });

  function findTypeAt(_file, _pos, expr, type) {
    if (!expr || expr.node.type != "Literal" ||
        typeof expr.node.value != "string" || !expr.node._tabris)
      return type;

    type = Object.create(type);

    var cx = infer.cx(), tabrisType;
    switch(expr.node._tabris.type) {
      case "tabris_create":
        var types = cx.definitions.tabris["types"];
        tabrisType = types.hasProp(expr.node.value);
        break;
    }
    if (tabrisType && tabrisType.doc) type.doc = tabrisType.doc;
    if (tabrisType && tabrisType.url) type.url = tabrisType.url;
    if (tabrisType && tabrisType.origin) type.origin = tabrisType.origin;
    return type;
  }

  function findCompletions(file, query) {
    var wordEnd = tern.resolvePos(file, query.end);
    var word = null, completions = [];
    var wrapAsObjs = query.types || query.depths || query.docs || query.urls || query.origins;
    var cx = infer.cx(), overrideType = null;

    function gather(prop, obj, depth, addInfo) {
      // 'hasOwnProperty' and such are usually just noise, leave them
      // out when no prefix is provided.
      if (obj == cx.protos.Object && !word) return;
      if (query.filter !== false && word &&
          (query.caseInsensitive ? prop.toLowerCase() : prop).indexOf(word) !== 0) return;
      for (var i = 0; i < completions.length; ++i) {
        var c = completions[i];
        if ((wrapAsObjs ? c.name : c) == prop) return;
      }
      var rec = tern.addCompletion(query, completions, prop, obj.hasProp(prop))
      if (overrideType) rec.type = overrideType;
    }

    var callExpr = infer.findExpressionAround(file.ast, null, wordEnd, file.scope, "CallExpression");
    if (callExpr && callExpr.node.arguments && callExpr.node.arguments.length && callExpr.node.arguments.length > 0) {
      var argNode = callExpr.node.arguments[0];
      if (!(argNode.start <= wordEnd && argNode.end >= wordEnd)) return;
      if (argNode._tabris) {
        var word = argNode.raw.slice(1, wordEnd - argNode.start), quote = argNode.raw.charAt(0)
        if (word && word.charAt(word.length - 1) == quote)
          word = word.slice(0, word.length - 1)
        if (query.caseInsensitive) word = word.toLowerCase()

        if (argNode.end == wordEnd + 1 && file.text.charAt(wordEnd) == quote)
          ++wordEnd;

        switch(argNode._tabris.type) {
          case "tabris_Proxy_get":
          case "tabris_Proxy_set":
            var widgetType = argNode._tabris.proxyType, proto = widgetType.proto;
            while(proto) {
              var objType = getProxyObjectProperties(proto);
              if (objType) infer.forAllPropertiesOf(objType, gather);
              proto = proto.proto;
            }
            break;
          case "tabris_Proxy_eventtype":
            var widgetType = argNode._tabris.proxyType, proto = widgetType.proto;
            while(proto) {
              var objType = getProxyEventProperties(proto);
              if (objType) infer.forAllPropertiesOf(objType, gather);
              proto = proto.proto;
            }
            break;
          case "tabris_create":
            var types = cx.definitions.tabris["types"];
            types.props = omit(types.props, notCreatable);
            overrideType = "string";
            infer.forAllPropertiesOf(types, gather);
            break;
        }

        return {start: tern.outputPos(query, file, argNode.start),
          end: tern.outputPos(query, file, wordEnd),
          completions: completions.map(function(rec) {
            var name = typeof rec == "string" ? rec : rec.name
            var string = JSON.stringify(name)
            if (quote == "'") string = quote + string.slice(1, string.length -1).replace(/'/g, "\\'") + quote
            if (typeof rec == "string") return string
            rec.displayName = name
            rec.name = string
            return rec
          })}
      }
    }
  }

  function omit(object, keys) {
    var result = {};
    for (var key in object) {
      if (keys.indexOf(key) === -1) {
        result[key] = object[key];
      }
    }
    return result;
  }

  function maybeSet(obj, prop, val) {
    if (val != null) obj[prop] = val;
  }

  var defs = {
    "!name" : "tabris",
    "!define" : {
      "!propertyTypes": {
        "Bounds" : {
          "!doc": "Widget bounds are represented as an object with the following properties:",
          "!url": "https://tabrisjs.com/documentation/1.9/types#bounds",
          "left" : {
            "!type": "number",
            "!doc": "The horizontal offset from the parent's left edge in dip"
          },
          "top" : {
            "!type": "number",
            "!doc": "The horizontal offset from the parent's top edge in dip"
          },
          "width" : {
            "!type": "number",
            "!doc": "The width of the widget in dip"
          },
          "height" : {
            "!type": "number",
            "!doc": "The height of the widget in dip"
          }
        },
        "Color": {
          "!doc": "Colors are specified as strings using one of the following formats:",
          "!url": "https://tabrisjs.com/documentation/1.9/types#color"
        },
        "Font": {
          "!doc": "Fonts are specified as strings using the shorthand syntax known from CSS. The font family may be omitted, in this case the default system font will be used.",
          "!url": "https://tabrisjs.com/documentation/1.9/types#font"
        },
        "CellType": {},
        "ItemHeight": {},
        "Image": {
          "!doc": "Image object associated with the element.",
          "!url": "https://tabrisjs.com/documentation/1.9/types#image",
          "src": {
            "!type": "string",
            "!doc": "Image path or URL."
          },
          "width": {
            "!type": "number",
            "!doc": "Image width, extracted from the image file when missing."
          },
          "height": {
            "!type": "number",
            "!doc": "Image height, extracted from the image file when missing."
          },
          "scale": {
            "!type": "number",
            "!doc": "Image scale factor - the image will be scaled down by this factor. Ignored when width or height are set."
          }
        },
        "LayoutData": {
          "!doc": "Used to define how a widget should be arranged within its parent.",
          "!url": "https://tabrisjs.com/documentation/1.9/types#layoutdata",
          "left": {
            "!type": "!propertyTypes.margin",
            "!doc": "The position of the widget's left edge relative to the parent or a sibling widget."
          },
          "right": {
            "!type": "!propertyTypes.margin",
            "!doc": "The position of the widget's right edge relative to the parent or a sibling widget."
          },
          "top": {
            "!type": "!propertyTypes.margin",
            "!doc": "The position of the widget's top edge relative to the parent or a sibling widget."
          },
          "bottom": {
            "!type": "!propertyTypes.margin",
            "!doc": "The position of the widget's bottom edge relative to the parent or a sibling widget."
          },
          "width": {
            "!type": "!propertyTypes.dimension",
            "!doc": "The width of the widget."
          },
          "height": {
            "!type": "!propertyTypes.dimension",
            "!doc": "The height of the widget."
          },
          "centerX": {
            "!type": "!propertyTypes.offset",
            "!doc": "The horizontal position of the widget's center relative to the parent's center."
          },
          "centerY": {
            "!type": "!propertyTypes.offset",
            "!doc": "The vertical position of the widget's center relative to the parent's center."
          },
          "baseline": {
            "!type": "+types.Widget",
            "!doc": "The vertical position of the widget's baseline relative to a sibling widget."
          },
        },
        "Transformation": {
          "!doc": "Transformations are specified as an object with the following properties:",
          "!url": "https://tabrisjs.com/documentation/1.9/types#transformation",
          "rotation": {
            "!type": "number",
            "!doc": "Clock-wise rotation in radians."
          },
          "scaleX": {
            "!type": "number",
            "!doc": "Horizontal scale factor."
          },
          "scaleY": {
            "!type": "number",
            "!doc": "Vertical scale factor."
          },
          "translationX": {
            "!type": "number",
            "!doc": "Horizontal translation (shift) in dip."
          },
          "translationY": {
            "!type": "number",
            "!doc": "Vertical translation (shift) in dip."
          }
        },
        "Selector": {
          "!doc": "Selectors are used to filter a given list of widgets. It can be function returning a boolean for a given widget. However, more commonly a selector is a string that may either reference a widgets type (e.g. \"Button\", \"TextView\"), or its id (\"#myButton\", \"#myTextView\").",
          "!url": "https://tabrisjs.com/documentation/1.9/selector"
        },
        "margin": {
          "!doc": "Distance to a parent's or sibling's opposing edge in one of these formats: offset, percentage, Widget, \"selector\", \"prev()\", \"percentage offset\", \"selector offset\", \"prev() offset\", [Widget, offset], [percentage, offset], [selector, offset], [\"prev()\", offset]",
          "!url": "https://tabrisjs.com/documentation/1.9/types#margin"
        },
        "dimension": {
          "!doc": "A positive float, or 0, representing device independent pixels.",
          "!url": "https://tabrisjs.com/documentation/1.9/types#dimension"
        },
        "offset": {
          "!doc": "A positive or negative float, or 0, representing device independent pixels.",
          "!url": "https://tabrisjs.com/documentation/1.9/types#offset"
        }
      },
      "!properties" : {
        "UIProperties" : {
          "background" : {
            "!type" : "!propertyTypes.Color",
            "!doc" : "Background color for the navigation elements"
          },
          "activePage" : {
            "!type" : "+types.Page",
            "!doc" : "The currently visible page."
          },
          "textColor": {
            "!type" : "!propertyTypes.Color",
            "!doc" : "Text color for the navigation elements"
          },
          "toolbarVisible": {
            "!type" : "bool",
            "!doc" : "Whether the toolbars above and below pages are visible. Default: \"true\""
          },
          "displayMode": {
            "!type" : "string",
            "!doc" : "Allows to switch the UI to full screen. Supported values: \"normal\", \"fullscreen\". Default: \"normal\""
          }
        },
        "DeviceProperties" : {
          "language" : {
            "!type" : "string",
            "!doc" : "The user language configured on the device as an RFC 4646 compliant string. For example \"de\", \"es-ES\", etc. This property is also available globally as navigator.language."
          },
          "model" : {
            "!type" : "string",
            "!doc" : "The name of the device model. For example \"iPad4,1\" or \"Nexus 7\". This property is also available globally as device.model."
          },
          "orientation" : {
            "!type" : "string",
            "!doc" : "The device orientation. One of \"portrait-primary\", \"portrait-secondary\", \"landscape-primary\", and \"landscape-secondary\"."
          },
          "platform" : {
            "!type" : "string",
            "!doc" : "The name of the platform. Currently either \"Android\" or \"iOS\". This property is also available globally as device.platform."
          },
          "scaleFactor" : {
            "!type" : "number",
            "!doc" : "The ratio between physical pixels and device independent pixels. This property is also available globally as \"window.devicePixelRatio\""
          },
          "screenHeight" : {
            "!type" : "number",
            "!doc" : "The entire height of the device's screen in device independent pixel. Depends on the current device orientation. This property is also available globally as screen.height."
          },
          "screenWidth" : {
            "!type" : "number",
            "!doc" : "The entire width of the device's screen in device independent pixel. Depends on the current device orientation. This property is also available as globally as screen.width."
          },
          "version" : {
            "!type" : "string",
            "!doc" : "The platform version. On iOS it lools like this: \"8.1.1\". On Android, the version code is returned. This property is also available globally as device.version."
          }
        },
        "ActionProperties" : {
          "enabled": {
            "!type": "bool",
            "!doc": "Whether the action can be invoked."
          },
          "textColor": {
            "!type": "!propertyTypes.Color",
            "!doc": "Text color of the action."
          },
          "image": {
            "!type": "!propertyTypes.Image",
            "!doc": "Icon image for the action."
          },
          "placementPriority": {
            "!type": "string",
            "!doc": "Actions with higher placement priority will be placed at a more significant position in the UI, e.g. low priority actions could go into a menu instead of being included in a toolbar. Supported values: \"low\", \"high\", \"normal\", default: \"normal\"."
          },
          "title": {
            "!type": "string",
            "!doc": "The text to be displayed for the action."
          },
          "visible": {
            "!type": "bool",
            "!doc": "Whether the action is visible."
          }
        },
        "WidgetProperties": {
          "class": {
            "!type" : "string",
            "!doc" : "A class name or a whitespace separated list of class names to identify the widget. Class names are arbitrary strings that describe a state or a category and help to select widgets using a selector expression. A class name may only contain alphanumeric characters, \"_\" and \"-\". Class names can also be added or removed using the field \"classList\"."
          },
          "classList": {
            "!type" : "[string]",
            "!doc" : "Provides convenient access to the list of class names set to this widget. Class names can either be set using the \"class\" property or by modifying the \"classList\" directly."
          },
          "id": {
            "!type" : "string",
            "!doc" : "A string to identify the widget by using selectors. Id's are optional. It is strongly recommended that they are unique within a page."
          },
          "enabled" : {
            "!type" : "bool",
            "!doc" : "Whether the widget can be operated. Default: \"true\""
          },
          "visible" : {
            "!type" : "bool",
            "!doc" : "Whether the widget is visible. Default: \"true\""
          },
          "layoutData" : {
            "!type" : "!propertyTypes.LayoutData",
            "!doc" : "Shorthand for all layout properties."
          },
          "left": {
            "!type": "!propertyTypes.margin",
            "!doc": "The position of the widget's left edge relative to the parent or a sibling widget."
          },
          "right": {
            "!type": "!propertyTypes.margin",
            "!doc": "The position of the widget's right edge relative to the parent or a sibling widget."
          },
          "top": {
            "!type": "!propertyTypes.margin",
            "!doc": "The position of the widget's top edge relative to the parent or a sibling widget."
          },
          "bottom": {
            "!type": "!propertyTypes.margin",
            "!doc": "The position of the widget's bottom edge relative to the parent or a sibling widget."
          },
          "width": {
            "!type": "!propertyTypes.dimension",
            "!doc": "The width of the widget."
          },
          "height": {
            "!type": "!propertyTypes.dimension",
            "!doc": "The height of the widget."
          },
          "centerX": {
            "!type": "!propertyTypes.offset",
            "!doc": "The horizontal position of the widget's center relative to the parent's center."
          },
          "centerY": {
            "!type": "!propertyTypes.offset",
            "!doc": "The vertical position of the widget's center relative to the parent's center."
          },
          "baseline": {
            "!type": "+types.Widget",
            "!doc": "The vertical position of the widget's baseline relative to a sibling widget."
          },
          "font" : {
            "!type" : "!propertyTypes.Font",
            "!doc" : "The font used for the widget."
          },
          "backgroundImage" : {
            "!type" : "!propertyTypes.Image",
            "!doc" : "An image to be displayed on the widget's background. If the image is smaller than the widget, it will be tiled."
          },
          "bounds" : {
            "!type" : "!propertyTypes.Bounds",
            "!doc" : "The actual location and size of the widget, relative to its parent. This property is read-only."
          },
          "background" : {
            "!type" : "!propertyTypes.Color",
            "!doc" : "Background color of the widget."
          },
          "textColor" : {
            "!type" : "!propertyTypes.Color",
            "!doc" : "Text color of the widget."
          },
          "opacity" : {
            "!type" : "number",
            "!doc" : "Opacity of the entire widget. Can be used for fade animations. Default: \"1\"."
          },
          "transform" : {
            "!type" : "!propertyTypes.Transformation",
            "!doc" : "Modifications to the widget's shape, size, or position. Can be used for animations. Note: In Android the \"transform\" property does not affect the \"bounds\" property, while it does so in iOS."
          },
          "highlightOnTouch" : {
            "!type" : "bool",
            "!doc" : "Whether the entire widget should be highlighted while touched. Default: \"false\"."
          },
          "elevation" : {
            "!type" : "number",
            "!doc" : "The position of the widget on the x-axis. Currently only supported on Android 5.0+."
          },
          "cornerRadius" : {
            "!type" : "number",
            "!doc" : "Configure a widget to have rounded corners. Each corner is affected equally. Supported on iOS and Android 5.0+."
          }
        },
        "ButtonProperties" : {
          "alignment" : {
            "!type" : "string",
            "!doc" : "The horizontal alignment of the button text. Supported values: \"left\", \"right\", \"center\", default: \"center\"."
          },
          "image" : {
            "!type" : "!propertyTypes.Image",
            "!doc" : "An image to be displayed on the button."
          },
          "text" : {
            "!type" : "string",
            "!doc" : "The button's label text."
          }
        },
        "PageProperties": {
          "image" : {
            "!type" : "!propertyTypes.Image",
            "!doc" : "An image to be displayed next to the navigation drawer page entry."
          },
          "title" : {
            "!type" : "string",
            "!doc" : "The title of the page."
          },
          "topLevel" : {
            "!type" : "bool",
            "!doc" : "Defines whether this is a top level page. Default: \"false\"."
          }
        },
        "TextViewProperties": {
          "alignment" : {
            "!type" : "string",
            "!doc" : "The horizontal alignment of the text. Supported values: \"left\", \"right\", \"center\", default: \"left\"."
          },
          "lineSpacing": {
            "!type": "number",
            "!doc": "The amount of space between each line of text. The \"lineSpacing\" property is a factor with a default value of \"1.0\"."
          },
          "markupEnabled": {
            "!type": "bool",
            "!doc": "Allows for a subset of HTML tags in the label text. Supported tags are: \"a\", \"del\", \"ins\", \"b\", \"i\", \"strong\", \"em\", \"big\", \"small\", \"br\". All tags must be closed (e.g. use <br/> instead of <br>). Nesting tags is currently not supported. This property must be set in the \"create\" method. It cannot be changed after widget creation."
          },
          "maxLines": {
            "!type": "number",
            "!doc": "Limit the number of lines to be displayed to the given maximum. \"null\" disables this limit. Default: \"null\"."
          },
          "text" : {
            "!type" : "string",
            "!doc" : "The text to display."
          }
        },
        "TextInputProperties": {
          "alignment" : {
            "!type" : "string",
            "!doc" : "The horizontal alignment of the text. Supported values: \"left\", \"right\", \"center\", default: \"left\"."
          },
          "autoCapitalize": {
            "!type": "bool",
            "!doc": "Automatically switch to capital letters after every key pressed. Default: \"false\"."
          },
          "autoCorrect": {
            "!type": "bool",
            "!doc": "Enables the spell checker and auto-correction feature. Default: \"false\"."
          },
          "editable": {
            "!type": "bool",
            "!doc": "Specifies whether the TextInput can be edited."
          },
          "focused" : {
            "!type" : "bool",
            "!doc" : "Reflects whether this widget has the keyboard focus. Setting this property to \"true\" will focus the widget and open the virtual keyboard, setting it to \"false\" will remove the focus and hide the virtual keyboard."
          },
          "keyboard": {
            "!type": "string",
            "!doc": "Selects the keyboard type to use for editing this widget. Has no effect when \"type\" is set to \"multiline\". Supported values: \"ascii\", \"decimal\", \"email\", \"number\", \"numbersAndPunctuation\", \"phone\", \"url\", \"default\"."
          },
          "message": {
            "!type": "string",
            "!doc": "A hint text that is displayed when the input field is empty. Does not apply on iOS when `type` is set to \"multiline\"."
          },
          "text": {
            "!type": "string",
            "!doc": "The text in the input field."
          },
          "type": {
            "!type": "string",
            "!doc": "The type of the text widget. This property can only be set in the \"tabris.create\" method. It cannot be changed after widget creation. Supported values: \"default\", \"password\", \"search\", \"multiline\", default: \"default\"."
          }
        },
        "CheckBoxProperties": {
          "selection" : {
            "!type" : "bool",
            "!doc" : "The checked state of the check box. Default: \"false\"."
          },
          "text" : {
            "!type" : "string",
            "!doc" : "The label text of the check box."
          }
        },
        "SwitchProperties": {
          "selection" : {
            "!type" : "bool",
            "!doc" : "The checked state of the switch. Default: \"false\"."
          },
          "thumbOnColor" : {
            "!type" : "!propertyTypes.Color",
            "!doc" : "The color of the movable thumb, when switched \"on\"."
          },
          "thumbOffColor" : {
            "!type" : "!propertyTypes.Color",
            "!doc" : "The color of the movable thumb, when switched \"off\"."
          },
          "trackOnColor" : {
            "!type" : "!propertyTypes.Color",
            "!doc" : "The color of the track that holds the thumb, when switched \"on\"."
          },
          "trackOffColor" : {
            "!type" : "!propertyTypes.Color",
            "!doc" : "The color of the track that holds the thumb, when switched \"off\"."
          }
        },
        "CollectionViewProperties": {
          "columnCount" : {
            "!type" : "number",
            "!doc" : "The number of columns to display in the collection view. If set to a value \"n > 1\", each row will contain \"n\" items. The available space will be equally distributed between columns."
          },
          "initializeCell" : {
            "!type" : "fn()",
            "!doc" : "A callback used to initialize a collection cell by attaching widget and \"change:item\" listener. Cells are created by the framework and recycled on scrolling. This callback receives the cell as the first and the cell type as second parameter."
          },
          "itemHeight" : {
            "!type" : "!propertyTypes.ItemHeight",
            "!doc" : "The height of a collection cell. If set to a function, this function will be called for every item, providing the item and the cell type as parameters, and must return the item height for the given item."
          },
          "items" : {
            "!type" : "[?]",
            "!doc" : "An array of data items to be displayed by the collection view. For dynamic content, use the methods \"insert\" and \"remove\" instead of setting this property directly."
          },
          "refreshEnabled" : {
            "!type" : "bool",
            "!doc" : "Enables the user to trigger a refresh by using the pull-to-refresh gesture. Default: \"false\"."
          },
          "refreshIndicator" : {
            "!type" : "bool",
            "!doc" : "Whether the refresh indicator is currently visible. Will be set to \"true\" when a \"refresh\" event is triggered. Reset it to \"false\" when the refresh is finished. Default: \"false\"."
          },
          "refreshMessage" : {
            "!type" : "string",
            "!doc" : "The message text displayed together with the refresh indicator. Currently not supported on Android. Default: \"\"."
          },
          "cellType" : {
            "!type" : "!propertyTypes.CellType",
            "!doc" : "The name of the cell type to use for a given item. This name will be passed to the initializeCell and itemHeight functions. Cells will be reused only by items that require the same cell type. If set to a function, this function will be called for every item, providing the item as a parameter, and must return a name for the cell type to use for the given item."
          },
          "firstVisibleIndex" : {
            "!type" : "number",
            "!doc" : "The first item that is currently visible on screen. This property is read-only."
          },
          "lastVisibleIndex" : {
            "!type" : "number",
            "!doc" : "The last item that is currently visible on screen. This property is read-only."
          }
        },
        "PickerProperties": {
          "items" : {
            "!type" : "[?]",
            "!doc" : "An array of data items to be displayed by the picker. If the items aren't strings, the \"itemText\" property must be set to a function to extract item texts."
          },
          "itemText": {
            "!type": "fn()",
            "!doc": "A function that returns the string to display for a given data item. Defaults to mapping items to their default string representation."
          },
          "selectionIndex" : {
            "!type" : "number",
            "!doc" : "The index of the currently selected item."
          },
          "selection" : {
            "!type" : "?",
            "!doc" : "The currently selected data item."
          }
        },
        "ImageViewProperties": {
          "image" : {
            "!type" : "!propertyTypes.Image",
            "!doc" : "The image shown in the ImageView."
          },
          "scaleMode" : {
            "!type" : "string",
            "!doc" : "The scale mode of the image in the ImageView. Supported values: \"auto\", \"fit\", \"fill\", \"stretch\", \"none\", default: \"auto\""
          },
          "tintColor" : {
            "!type" : "!propertyTypes.Color",
            "!doc" : "A color to change the image appearance. All opaque parts of the image will be tinted with the given color. Set to \"null\" to remove the effect. Available on iOS and Android 5.0+."
          }
        },
        "ProgressBarProperties": {
          "maximum" : {
            "!type" : "number",
            "!doc" : "The maximal numeric value of the progress bar, default: \"100\""
          },
          "minimum" : {
            "!type" : "number",
            "!doc" : "The minimal numeric value of the progress bar, default: \"0\""
          },
          "selection" : {
            "!type" : "number",
            "!doc" : "The current progress bar value. Default: \"0\""
          },
          "state" : {
            "!type" : "string",
            "!doc" : "The state of the progress bar. Supported values: \"normal\", \"paused\", \"error\", default: \"normal\""
          }
        },
        "RadioButtonProperties": {
          "selection" : {
            "!type" : "bool",
            "!doc" : "The checked state of the radio button. Default: \"false\"."
          },
          "text" : {
            "!type" : "string",
            "!doc" : "The label text of the radio button."
          }
        },
        "SearchActionProperties": {
          "proposals" : {
            "!type" : "[string]",
            "!doc" : "The list of proposals to display. Default: \"[]\"."
          },
          "text" : {
            "!type" : "string",
            "!doc" : "The text in the search input field."
          },
          "message" : {
            "!type" : "string",
            "!doc" : "A hint text that is displayed when the search input is empty."
          }
        },
        "SliderProperties": {
          "maximum" : {
            "!type" : "number",
            "!doc" : "The maximal numeric value of the slider, default: \"100\""
          },
          "minimum" : {
            "!type" : "number",
            "!doc" : "The minimal numeric value of the slider, default: \"0\""
          },
          "selection" : {
            "!type" : "number",
            "!doc" : "The current slider value. Default: \"0\""
          },
        },
        "TabFolderProperties": {
          "paging" : {
            "!type" : "bool",
            "!doc" : "Enables swiping through tabs."
          },
          "selection" : {
            "!type" : "+types.Tab",
            "!doc" : "The selected tab object."
          },
          "tabBarLocation" : {
            "!type" : "string",
            "!doc" : "The placement of the tab titles. When set to \"hidden\" the tab bar will not be visible. When set to \"auto\", the position is platform dependent. Supported values: \"top\", \"bottom\", \"auto\", default: \"auto\""
          },
        },
        "TabProperties": {
          "badge" : {
            "!type" : "string",
            "!doc" : "Text of the tab badge on iOS."
          },
          "image" : {
            "!type" : "!propertyTypes.Image",
            "!doc" : "Image shown on the tab button."
          },
          "selectedImage" : {
            "!type" : "!propertyTypes.Image",
            "!doc" : "An image to be displayed on the currently active tab."
          },
          "title" : {
            "!type" : "string",
            "!doc" : "Text title of the tab."
          },
        },
        "ToggleButtonProperties": {
          "alignment" : {
            "!type" : "string",
            "!doc" : "The horizontal alignment of the button text. Supported values: \"left\", \"right\", \"center\", default: \"center\""
          },
          "image" : {
            "!type" : "!propertyTypes.Image",
            "!doc" : "An image to be displayed on the button."
          },
          "selection" : {
            "!type" : "bool",
            "!doc" : "The selection state of the toggle button. Default: \"false\"."
          },
          "text" : {
            "!type" : "string",
            "!doc" : "The button's label text."
          },
        },
        "ScrollViewProperties": {
          "direction" : {
            "!type" : "string",
            "!doc" : "Specifies the scrolling direction of the scroll composite. This property can only be set in the \"tabris.create\" method. It cannot be changed after widget creation. Supported values: \"vertical\", \"horizontal\", default: \"vertical\"."
          },
          "scrollX" : {
            "!type" : "number",
            "!doc" : "The horizontal scrolling position."
          },
          "scrollY" : {
            "!type" : "number",
            "!doc" : "The vertical scrolling position."
          }
        },
        "VideoProperties": {
          "url" : {
            "!type" : "string",
            "!doc" : "The URL of the video to play."
          }
        },
        "WebViewProperties": {
          "html" : {
            "!type" : "string",
            "!doc" : "A complete HTML document to display. Always returns the last set value."
          },
          "url" : {
            "!type" : "string",
            "!doc" : "The URL of the web page to display. Returns empty string when content from \"html\" property is displayed."
          }
        }
      },
      "!events": {
        "AppEvents": {
          "pause": {
            "!doc": "Fired when the app is not the interaction target of the user anymore. Usually preceded by \"resume\". Parameter: \"app\"."
          },
          "resume": {
            "!doc": "Fired when the app is visible and ready to interact with the user. The event is preceded by either \"foreground\" (the app becomes visible again) or \"pause\" (the app regains ability to interact with user). Parameter: \"app\"."
          },
          "background": {
            "!doc": "Fired when the app becomes invisible. Either because the user has another app in the foreground or he returned to the home screen. Parameter: \"app\"."
          },
          "foreground": {
            "!doc": "Fired when the app becomes visible. The event is only fired after the app has been brought to the background. Not during app startup. Parameter: \"app\"."
          },
          "terminate": {
            "!doc": "Fired when the app is being destroyed. After this callback no more interaction with the app is possible. Parameter: \"app\"."
          },
          "backnavigation": {
            "!doc": "Fired when the back button is pressed on Android. To suppress the default back navigation behavior, call \"event.preventDefault()\". Parameters: \"app\", \"event\"."
          }
        },
        "UIEvents": {
          "change:activePage": {
            "!doc": "Fired when the \"activePage\" property of tabris.ui changes. Parameters: \"ui\", \"page\", \"options\"."
          }
        },
        "DeviceEvents": {
          "change:orientation": {
            "!doc": "Fired when the \"orientation\" property has changed and the rotation animation has finished. Parameters: \"device\", \"orientation\", \"options\"."
          }
        },
        "ActionEvents": {
          "select": {
            "!doc": "Fired when the action is invoked. Parameter: \"widget\"."
          }
        },
        "WidgetEvents": {
          "animationstart": {
            "!doc": "Fired when widget animation has been started. Parameters: \"widget\", \"options\"."
          },
          "animationend": {
            "!doc": "Fired when widget animation has ended. Parameters: \"widget\", \"options\"."
          },
          "touchstart": {
            "!doc": "Fired when a widget is touched. Parameters: \"widget\", \"gesture\"."
          },
          "touchmove": {
            "!doc": "Fired repeatedly while swiping across the screen. Parameters: \"widget\", \"gesture\"."
          },
          "touchend": {
            "!doc": "Fired when a touch ends on the same widget than it started on. Parameters: \"widget\", \"gesture\"."
          },
          "touchcancel": {
            "!doc": "Fired instead of touchend when the touch ends on another widget than it started on. Parameters: \"widget\", \"gesture\"."
          },
          "longpress": {
            "!doc": "Fired after pressing a widget for a specific amount of time (about a second). Parameters: \"widget\", \"gesture\"."
          },
          "resize": {
            "!doc": "Fired when the widget's size has changed. You can use this event to apply new layoutData. Parameters: \"widget\", \"bounds\", \"options\"."
          },
          "dispose": {
            "!doc": "Fired when the widget is about to be disposed. Parameter: \"widget\"."
          },
          "pan": {
            "!doc": "Fired when a finger starts moving in the widget. Parameters: \"widget\", \"gesture\"."
          },
          "pan:left": {
            "!doc": "Fired when a finger starts moving left in the widget. Parameters: \"widget\", \"gesture\"."
          },
          "pan:up": {
            "!doc": "Fired when a finger starts moving up in the widget. Parameters: \"widget\", \"gesture\"."
          },
          "pan:right": {
            "!doc": "Fired when a finger starts moving right in the widget. Parameters: \"widget\", \"gesture\"."
          },
          "pan:down": {
            "!doc": "Fired when a finger starts moving down in the widget. Parameters: \"widget\", \"gesture\"."
          },
          "swipe:left": {
            "!doc": "Fired when a finger moves left quickly. Parameters: \"widget\", \"gesture\"."
          },
          "swipe:up": {
            "!doc": "Fired when a finger moves up quickly. Parameters: \"widget\", \"gesture\"."
          },
          "swipe:right": {
            "!doc": "Fired when a finger moves right quickly. Parameters: \"widget\", \"gesture\"."
          },
          "swipe:down": {
            "!doc": "Fired when a finger moves down quickly. Parameters: \"widget\", \"gesture\"."
          },
          "tap": {
            "!doc": "Fired when a widget is tapped. Parameters: \"widget\", \"gesture\"."
          },
        },
        "ButtonEvents": {
          "select": {
            "!doc": "Fired when the button is pressed. Parameter: \"widget\"."
          }
        },
        "CheckBoxEvents": {
          "change:selection": {
            "!doc": "Fired when the check box is checked or unchecked. Parameters: \"widget\", \"selection\", \"options\"."
          },
          "select": {
            "!doc": "Fired when the check box is checked or unchecked. Parameters: \"widget\", \"selection\", \"options\"."
          }
        },
        "DrawerEvents": {
          "open": {
            "!doc": "Fired when the drawer is opened and has reached its resting position. Parameter: \"widget\"."
          },
          "close": {
            "!doc": "Fired when the drawer is closed and has reached its resting position. Parameter: \"widget\"."
          }
        },
        "ImageViewEvents": {
          "load": {
            "!doc": "Fired when the image loading has finished. The event parameter contains information about the loading process. Parameters: \"widget\", \"{error: boolean}\"."
          }
        },
        "SwitchEvents": {
          "change:selection": {
            "!doc": "Fired when the selection property changes. Parameters: \"widget\", \"selection\", \"options\"."
          },
          "select": {
            "!doc": "Fired when the switch is toggled by the user. Parameters: \"widget\", \"selection\", \"options\"."
          }
        },
        "CollectionViewEvents": {
          "select": {
            "!doc": "Fired when a collection item is selected. Parameters: \"collectionView\", \"item\", \"{index: number}\""
          },
          "refresh": {
            "!doc": "Fired when the user requested a refresh. An event listener should reset the \"refreshIndicator\" property when refresh is finished. Parameter: \"widget\"."
          },
          "scroll": {
            "!doc": "Fired while the collection view is scrolling. Parameters: \"collectionView\", \"{deltaX: number, deltaY: number}\". The event contains the scroll delta of this scroll event: \"{deltaX: number, deltaY: number}\". The value of \"deltaY\" will be positive when scrolling up and negative when scrolling down."
          }
        },
        "CompositeEvents": {
          "addchild": {
            "!doc": "Fired when a child is added. Parameters: \"widget\", \"child\", \"options\""
          },
          "removechild": {
            "!doc": "Fired when a child is removed. Parameters: \"widget\", \"child\", \"{index: number}\""
          }
        },
        "RadioButtonEvents": {
          "change:selection": {
            "!doc": "Fired when the selection property changes. Parameters: \"widget\", \"selection\", \"options\"."
          },
          "select": {
            "!doc": "Fired when the radio button is selected or deselected. Parameters: \"widget\", \"selection\", \"options\"."
          }
        },
        "SearchActionEvents": {
          "accept": {
            "!doc": "Fired when a text input has been submitted by pressing the keyboard's search key. Parameters: \"widget\", \"text\", \"options\"."
          },
          "input": {
            "!doc": "Fired when the user inputs text. Parameters: \"widget\", \"text\", \"options\"."
          }
        },
        "SliderEvents": {
          "change:selection": {
            "!doc": "Fired when the selection property changes. Parameters: \"widget\", \"selection\", \"options\"."
          },
          "select": {
            "!doc": "Fired when the selection property is changed by the user. Parameters: \"widget\", \"selection\", \"options\"."
          }
        },
        "TabFolderEvents": {
          "change:selection": {
            "!doc": "Fired when the selection of the slider gets changed. Parameters: \"widget\", \"selection\", \"options\"."
          },
          "select": {
            "!doc": "Fired when the selection property changes by user interaction. Parameters: \"widget\", \"selection\", \"options\"."
          }
        },
        "TextInputEvents": {
          "accept": {
            "!doc": "Fired when a text input has been finished by pressing the keyboard's Enter key. The label of this key may vary depending on the platform and locale. Parameters: \"widget\", \"text\", \"options\"."
          },
          "blur": {
            "!doc": "Fired when the widget lost focus. Parameter: \"widget\"."
          },
          "change:text": {
            "!doc": "Fired when the text property changes, either by \"set\" or by the user. Parameters: \"widget\", \"text\", \"options\"."
          },
          "focus": {
            "!doc": "Fired when the widget gains focus. Parameter: \"widget\"."
          },
          "input": {
            "!doc": "Fired when the text changed by the user. Parameters: \"widget\", \"text\", \"options\"."
          }
        },
        "ToggleButtonEvents": {
          "change:selection": {
            "!doc": "Fired when the selection property changes. Parameters: \"widget\", \"selection\", \"options\"."
          },
          "select": {
            "!doc": "Fired when the toggle button is selected or deselected by the user. Parameters: \"widget\", \"selection\", \"options\"."
          }
        },
        "PageEvents": {
          "appear": {
            "!doc": "Fired when the page is about to become visible, i.e. it has become the active page. Parameter: \"widget\"."
          },
          "resize": {
            "!doc": "Fired when the page's size has changed. You can use this event to apply new layoutData. Parameters: \"widget\", \"bounds\", \"options\"."
          },
          "disappear": {
            "!doc": "Fired when the page is no longer visible, i.e. another page has become the active page. Parameter: \"widget\"."
          }
        },
        "PickerEvents": {
          "change:selectionIndex": {
            "!doc": "Fired when the selectionIndex property changes. Parameters: \"widget\", \"selectionIndex\", \"options\"."
          },
          "change:selection": {
            "!doc": "Fired when the selection property changes. The index of the selected item is given in the options object as \"index\". Parameters: \"widget\", \"selection\", \"options\"."
          },
          "select": {
            "!doc": "Fired when an item was selected by the user. Parameters: \"widget\", \"selection\", \"{index: number}\"."
          }
        },
        "ScrollViewEvents": {
          "scroll": {
            "!doc": "Fired on scrolling. Parameters: \"widget\", \"{x: number, y: number}\" (indicates the current scrolling position)"
          }
        },
        "WebViewEvents": {
          "load": {
            "!doc": "Fired when the url has been loaded. Parameter: \"widget\"."
          },
          "navigate": {
            "!doc": "Fired when the WebView is about to navigate to a new URL. Listeners can intercept the navigation by calling \"event.preventDefault()\". Parameters: \"widget\", \"event\"."
          },
          "message": {
            "!doc": "Fired when a web message has been sent via \"window.parent.postMessage(message, targetOrigin)\" from inside the WebView. The events \"data\" property contains the message sent, which currently has to be a string. Parameters: \"widget\", \"event\"."
          }
        }
      },
      "types": {
        "App": {
          "!type": "fn()",
          "!doc": "The object tabris.app provides information about the application.",
          "prototype": {
            "!proto": "types.Proxy.prototype",
            "reload": {
              "!type": "fn() -> !this",
              "!doc": "Forces the running application to reload the main module and start over."
            },
            "installPatch": {
              "!type": "fn(url: string, callback: fn()) -> !this",
              "!doc": "Installs a patch from the given URL. When the patch is successfully installed, it will remain inactive until the application is reloaded."
            },
            "getResourceLocation": {
              "!type": "fn(path: string) -> string",
              "!doc": "Returns the URL for a given resource that is bundled with the app. Can be used to access app resources like images, videos, etc. Note that these resources can only be accessed in read-only mode."
            }
          }
        },
        "UI" : {
          "!type": "fn()",
          "!doc": "The object \"tabris.ui\" is the root element for all widgets. This is the parent for all top-level pages, actions and the drawer.",
          "prototype" : {
            "!proto" : "types.Widget.prototype"
          }
        },
        "Device": {
          "!type": "fn()",
          "!doc": "The object tabris.device provides information about the device that executes the application. All properties are read-only.",
          "prototype" : {
            "!proto" : "types.Proxy.prototype"
          }
        },
        "Action" : {
          "!type" : "fn()",
          "!url" : "https://tabrisjs.com/documentation/1.9/api/Action",
          "!doc" : "An executable item that is integrated in the application's navigation menu. Add a listener on \"select\" to implement the action.",
          "prototype" : {
            "!proto" : "types.Widget.prototype"
          }
        },
        "ActivityIndicator" : {
          "!type" : "fn()",
          "!url" : "https://tabrisjs.com/documentation/1.9/api/ActivityIndicator",
          "!doc" : "A widget representing a spinning indicator for indeterminate loading/processing time.",
          "prototype" : {
            "!proto" : "types.Widget.prototype"
          }
        },
        "Proxy": {
          "!type" : "fn()",
          "prototype": {
            "get" : {
              "!type" : "fn(name: string) -> !custom:tabris_Proxy_get",
              "!doc" : "Gets the current value of the given property.",
              "!url" : "https://tabrisjs.com/documentation/1.9/api/Properties#getproperty",
              "!data": {
                "!lint": "tabrisGet_lint",
                "!guess-type": "tabrisGet_guessType"
              }
            },
            "set" : {
              "!type" : "fn(name: string, value: ?) -> !this",
              "!effects" : ["custom tabris_Proxy_set"],
              "!doc" : "Sets the given property. Supports chaining.",
              "!url" : "https://tabrisjs.com/documentation/1.9/api/Properties#setproperty-value",
              "!data": {
                "!lint": "tabrisSet_lint"
              }
            },
            "on": {
              "!type" : "fn(type: string, listener: fn(), context?: ?) -> !this",
              "!effects" : [ "custom tabris_Proxy_eventtype", "call !1 this=!this" ],
              "!doc" : "Adds a listener to the list of functions to be notified when event is fired. If the context parameter is not present, the listener will be called in the context of this object. Supports chaining.",
              "!url" : "https://tabrisjs.com/documentation/1.9/api/Events#onevent-listener-context",
              "!data": {
                "!lint": "tabrisEvent_lint"
              }
            },
            "once": {
              "!type" : "fn(type: string, listener: fn(), context?: ?) -> !this",
              "!effects" : [ "custom tabris_Proxy_eventtype", "call !1 this=!this" ],
              "!doc" : "Same as on, but removes the listener after it has been invoked by an event. Supports chaining.",
              "!url" : "https://tabrisjs.com/documentation/1.9/api/Events#onceevent-listener-context",
              "!data": {
                "!lint": "tabrisEvent_lint"
              }
            },
            "off": {
              "!type" : "fn(event?: string, listener?: fn(), context?: ?) -> !this",
              "!effects" : [ "custom tabris_Proxy_eventtype", "call !1 this=!this" ],
              "!doc" : "Removes all occurrences of listener that are bound to event and context from this widget. Supports chaining.",
              "!url" : "https://tabrisjs.com/documentation/1.9/api/Events#offevent-listener-context",
              "!data": {
                "!lint": "tabrisEvent_lint"
              }
            }
          }
        },
        "Widget" : {
          "!type" : "fn()",
          "prototype" : {
            "!proto": "types.Proxy.prototype",
            "apply" : {
              "!type" : "fn(properties: ?) -> !this",
              "!doc" : "Applies the given properties to all descendants that match the associated selector(s). \"properties\" is an object in the format \"{Selector: {property: value, property: value, ... }, Selector: ...}\"."
            },
            "id" : {
              "!type": "string",
              "!doc": "Direct access to the value of the property of the same name. May be used instead of \"widget.get(\"id\");\" Do not use this field to change the value, instead use \"widget.set(\"id\", id);\"."
            },
            "cid" : {
              "!type": "string",
              "!doc": "An application-wide unique identifier automatically assigned to all widgets on creation. Do not change it."
            },
            "type" : {
              "!type": "string",
              "!doc": "The exact string that was used to create this widget using the \"tabris.create\" method."
            },
            "animate" : {
              "!type" : "fn(animationProperties: ?, options: ?) -> +Promise",
              "!doc" : "Starts an animation that transforms the given properties from their current values to the given ones. \n\nSupported properties are \"transform\" and \"opacity\". \n\nSupported options are: \n - \"delay\" (time until the animation starts in ms, defaults to \"0\") \n - \"duration\" (in ms) \n - \"easing\" (one of \"linear\", \"ease-in\", \"ease-out\", \"ease-in-out\") \n - \"repeat\" (number of times to repeat the animation, defaults to \"0\") \n - \"reverse\" (\"true\" to alternate the direction of the animation on every repeat) \n - \"name\" (no effect, but will be given in animation events). \n\nReturns a promise that is resolved once the animation is completed and is rejected if the animation is aborted."
            },
            "appendTo" : {
              "!type" : "fn(parent: +types.Widget) -> !this",
              "!doc" : "Appends this widget to the given parent. The parent widget must support children (extending \"Composite\"). If the widget already has a parent, it is removed from the old parent."
            },
            "insertBefore" : {
              "!type" : "fn(widget: +types.Widget) -> !this",
              "!doc" : "Inserts this widget directly before the given widget. If the widget already has a parent, it is removed from the old parent."
            },
            "insertAfter" : {
              "!type" : "fn(widget: +types.Widget) -> !this",
              "!doc" : "Inserts this widget directly after the given widget. If the widget already has a parent, it is removed from the old parent."
            },
            "parent" : {
              "!type" : "fn() -> +types.Widget",
              "!doc" : "Returns the parent of this widget."
            },
            "siblings" : {
              "!type" : "fn(selector?: !propertyTypes.Selector) -> +types.WidgetCollection",
              "!doc" : "Returns a (possibly empty) collection of all siblings of this widget that match the selector."
            },
            "children" : {
              "!type" : "fn(selector?: !propertyTypes.Selector) -> +types.WidgetCollection",
              "!doc" : "Returns a (possibly empty) collection of all children of this widget that match the selector."
            },
            "trigger" : {
              "!type" : "fn(type?: string, param?: ?) -> !this",
              "!effects" : [ "custom tabris_Proxy_eventtype"],
              "!doc" : "Triggers an event of the given type. All registered listeners will be notified. Additional parameters will be passed to the listeners.",
              "!data": {
                "!lint": "tabrisEvent_lint"
              }
            },
            "dispose" : {
              "!type" : "fn()",
              "!doc" : "Removes this widget from its parent and destroys it. Also disposes of all its children. Triggers a \"remove\" event on the parent and a \"dispose\" event on itself. The widget can no longer be used."
            },
            "isDisposed" : {
              "!type" : "fn() -> bool",
              "!doc" : "Returns \"true\" if the widget has been disposed, otherwise \"false\"."
            },
            "find" : {
              "!type" : "fn(selector?: !propertyTypes.Selector) -> +types.WidgetCollection",
              "!doc" : "Returns a (possibly empty) collection of all descendants of this widget that match the selector."
            }
          }
        },
        "WidgetCollection": {
          "!type" : "fn()",
          "!doc" : "A \"WidgetCollection\" is an array-like object representing a set of widgets, as returned by the widget methods \"children\" and \"find\".",
          "!url": "https://tabrisjs.com/documentation/1.9/api/WidgetCollection",
          "prototype" : {
            "children": {
              "!type" : "fn(selector?: !propertyTypes.Selector) -> !this",
              "!doc" : "Returns a collection containing all children of all widgets in this collection. Provided a \"selector\" argument, it is equivalent to \"collection.children().filter(selector)\"."
            },
            "find": {
              "!type" : "fn(selector?: !propertyTypes.Selector) -> !this",
              "!doc" : "Returns a collection containing all descendants of all widgets in this collection that match the given selector."
            },
            "parent": {
              "!type" : "fn() -> !this",
              "!doc" : "Returns a collection containing all direct parents of all widgets in this collection."
            },
            "appendTo": {
              "!type" : "fn(parent: +types.Composite) -> !this",
              "!doc" : "Append all widgets in this collection to the given widget."
            },
            "animate": {
              "!type" : "fn(properties: ?, options: ?)",
              "!doc" : "Animates all widgets in this collection."
            },
            "dispose": {
              "!type" : "fn()",
              "!doc" : "Disposes all widgets in this collection."
            },
            "first" : {
              "!type" : "fn() -> +types.Widget",
              "!doc" : "Returns the first widget in the collection. Same as \"collection[0]\"."
            },
            "last" : {
              "!type" : "fn() -> +types.Widget",
              "!doc" : "Returns the last widget in the collection. Same as \"collection[collection.length - 1]\"."
            },
            "toArray" : {
              "!type" : "fn() -> [+types.Widget]",
              "!doc" : "Return an Array containing all widgets in the collection."
            },
            "length" : {
              "!type" : "number",
              "!doc" : "A read-only field containing the number of widgets in the collection."
            },
            "forEach" : {
              "!type" : "fn(callback: fn(widget: +types.Widget, index: number, widgetCollection: +types.WidgetCollection))",
              "!effects" : [
                "call !0 this=!1 !this.<index> number"
              ],
              "!doc" : "Calls the given callback for each widget in the collection."
            },
            "filter" : {
              "!type" : "fn(selector: !propertyTypes.Selector) -> !this",
              "!doc" : "Returns a new \"WidgetCollection\" containing all widgets in this collection that match the given selector."
            },
            "indexOf" : {
              "!type" : "fn(widget: +types.Widget) -> number",
              "!url" : "https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/indexOf",
              "!doc" : "Returns the index of the given widget within the collection. If there is no match the return value is \"-1\"."
            }
          }
        },
        "Page" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/Page",
          "!doc" : "Pages contain an application's UI.",
          "prototype" : {
            "!proto" : "types.Composite.prototype",
            "open" : {
              "!type" : "fn() -> !this",
              "!doc" : "Opens the page, i.e. makes it the active page."
            },
            "close" : {
              "!type" : "fn()",
              "!doc" : "Closes and disposes of the page."
            }
          }
        },
        "Button" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/Button",
          "!doc" : "A push button. Can contain a text or an image.",
          "prototype" : {
            "!proto" : "types.Widget.prototype"
          }
        },
        "TextView" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/TextView",
          "!doc" : "A widget to display a text. For images, use ImageView.",
          "prototype" : {
            "!proto" : "types.Widget.prototype"
          }
        },
        "TextInput" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/TextInput",
          "!doc" : "A widget that allows to enter text.",
          "prototype" : {
            "!proto" : "types.Widget.prototype"
          }
        },
        "CheckBox" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/CheckBox",
          "!doc" : "A check box widget.",
          "prototype" : {
            "!proto" : "types.Widget.prototype"
          }
        },
        "Switch" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/Switch",
          "!doc" : "A switch widget that can be toggled.",
          "prototype" : {
            "!proto" : "types.Widget.prototype"
          }
        },
        "CollectionView" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/CollectionView",
          "!doc" : "A scrollable list that displays data items in cells, one per row. Cells are created on demand and filled with widgets in the \"initializeCell\" callback. When a data item is mapped to a cell, it is set as the property \"item\" and the cell receives an \"change:item\" event.",
          "prototype" : {
            "!proto" : "types.Widget.prototype",
            "insert" : {
              "!type" : "fn(items: [?], index?: number)",
              "!doc" : "Inserts the given items into this view. Items are added at the end. If \"index\" is present, inserts the given items into this view at the given index. If a negative index is given, it is interpreted as relative to the end. If the given index is greater than the item count, new items will be appended at the end. This operation will modify the items property."
            },
            "remove" : {
              "!type" : "fn(index: number, count?: number)",
              "!doc" : "Removes the item at the given index from this view. If a negative index is given, it is interpreted as relative to the end. If \"count\" is present, removes count items beginning with the given index from this view. This operation will modify the items property."
            },
            "refresh" : {
              "!type" : "fn(index?: number)",
              "!doc" : "Triggers a refresh of all visible items. This will issue itemchange events on the corresponding cells. If \"index\" is present, triggers a refresh of the item with the given index. If the item is scrolled into view, an itemchange event will be issued on the corresponding cell."
            },
            "reveal" : {
              "!type" : "fn(index: number)",
              "!doc" : "Scrolls the item with the given index into view. If a negative index is given, it is interpreted as relative to the end."
            },
          }
        },
        "Picker" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/Picker",
          "!doc" : "A widget with a drop-down list of items to choose from.",
          "prototype" : {
            "!proto" : "types.Widget.prototype"
          }
        },
        "PageSelector" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/PageSelector",
          "!doc" : "A CollectionView that contains all top-level pages and allows to open them. New top-level pages are added dynamically.",
          "prototype" : {
            "!proto" : "types.CollectionView.prototype"
          }
        },
        "SearchAction" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/SearchAction",
          "!doc" : "An action that displays a search text field with dynamic proposals when selected. Add a listener on \"select\" to implement the action. On \"input\", you may set a list of \"proposals\".",
          "prototype" : {
            "!proto" : "types.Action.prototype"
          }
        },
        "Composite" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/Composite",
          "!doc" : "An empty widget that can contain other widgets.",
          "prototype" : {
            "!proto" : "types.Widget.prototype",
            "append" : {
              "!type" : "fn(widget: +types.Widget, widget?: +types.Widget)",
              "!doc" : "Adds the given widgets to the composite."
            },
          }
        },
        "Canvas" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/Canvas",
          "!doc" : "Canvas is a widget that can be used to draw graphics using a canvas context. Canvas context is a subset of the HTML5 \"CanvasRenderingContext2D\".",
          "prototype" : {
            "!proto" : "types.Composite.prototype",
            "getContext": {
              "!type": "fn(contextType: string, width: number, height: number) -> +types.CanvasContext",
              "!doc" : "Returns the drawing context with the given size."
            }
          }
        },
        "CanvasContext": {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/Canvas",
          "prototype": {
            "save": "fn()",
            "restore": "fn()",
            "scale": "fn(x: number, y: number)",
            "rotate": "fn(angle: number)",
            "translate": "fn(x: number, y: number)",
            "transform": "fn(a: number, b: number, c: number, d: number, e: number, f: number)",
            "setTransform": "fn(a: number, b: number, c: number, d: number, e: number, f: number)",
            "strokeStyle": "string",
            "fillStyle": "string",
            "clearRect": "fn(x: number, y: number, w: number, h: number)",
            "fillRect": "fn(x: number, y: number, w: number, h: number)",
            "strokeRect": "fn(x: number, y: number, w: number, h: number)",
            "fill": "fn()",
            "beginPath": "fn()",
            "stroke": "fn()",
            "fillText": "fn(text: string, x: number, y: number, maxWidth: number)",
            "strokeText": "fn(text: string, x: number, y: number, maxWidth: number)",
            "measureText": "fn(text: string) -> ?",
            "lineWidth": "number",
            "lineCap": "string",
            "lineJoin": "string",
            "textAlign": "string",
            "textBaseline": "string",
            "closePath": "fn()",
            "moveTo": "fn(x: number, y: number)",
            "lineTo": "fn(x: number, y: number)",
            "quadraticCurveTo": "fn(cpx: number, cpy: number, x: number, y: number)",
            "bezierCurveTo": "fn(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number)",
            "rect": "fn(x: number, y: number, w: number, h: number)",
            "arc": "fn(x: number, y: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: bool)",
          }
        },
        "Drawer" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/Drawer",
          "!doc" : "A navigation drawer that can be swiped in from the left edge of the screen. Can contain any kind of widgets. It may be useful to include a \"PageSelector\" that displays all top-level pages.",
          "prototype" : {
            "!proto" : "types.Composite.prototype",
             "open" : {
                "!type" : "fn() -> !this",
                "!doc" : "Opens the drawer."
              },
              "close" : {
                "!type" : "fn()",
                "!doc" : "Closes the drawer."
              }
          }
        },
        "ImageView" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/ImageView",
          "!doc" : "A widget to display an image.",
          "prototype" : {
            "!proto" : "types.Widget.prototype"
          }
        },
        "ProgressBar" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/ProgressBar",
          "!doc" : "A widget representing a numeric value as a horizontal bar with a growing indicator.",
          "prototype" : {
            "!proto" : "types.Widget.prototype"
          }
        },
        "RadioButton" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/RadioButton",
          "!doc" : "A radio button. Selecting a radio button deselects all its siblings (i.e. all radio buttons within the same parent).",
          "prototype" : {
            "!proto" : "types.Widget.prototype"
          }
        },
        "Slider" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/Slider",
          "!doc" : "A widget representing a numeric value as an movable indicator on a horizontal line. Known Issues: Selection event is only fired after indicator is released.",
          "prototype" : {
            "!proto" : "types.Widget.prototype"
          }
        },
        "TabFolder" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/TabFolder",
          "!doc" : "A widget that can switch between tabs. Only children of type \"Tab\" are supported. Since the TabFolder does not compute its own size, the width and height must be defined by the respective layout properties (e.g. either \"width\" or \"left\" and \"right\" must be specified).",
          "prototype" : {
            "!proto" : "types.Widget.prototype"
          }
        },
        "Tab" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/Tab",
          "!doc" : "A container representing a single tab of the TabFolder widget.",
          "prototype" : {
            "!proto" : "types.Composite.prototype"
          }
        },
        "ToggleButton" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/ToggleButton",
          "!doc" : "A push button that \"snaps in\", i.e. it is selected when pressed and deselected when pressed again.",
          "prototype" : {
            "!proto" : "types.Widget.prototype"
          }
        },
        "ScrollView" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/ScrollView",
          "!doc" : "A composite that allows its content to overflow either vertically (default) or horizontally. Since the ScrollView does not compute its own size, the width and height must be defined by the respective layout properties (e.g. either \"width\" or \"left\" and \"right\" must be specified).",
          "prototype" : {
            "!proto" : "types.Composite.prototype"
          }
        },
        "Video" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/Video",
          "!doc" : "A widget that plays a video from a URL.",
          "prototype" : {
            "!proto" : "types.Widget.prototype"
          }
        },
        "WebView" : {
          "!type" : "fn()",
          "!url": "https://tabrisjs.com/documentation/1.9/api/WebView",
          "!doc" : "A widget that can display a web page. Known Issues: Having multiple instances of this widget on screen may not work.",
          "prototype" : {
            "!proto" : "types.Widget.prototype",
            "postMessage" : {
              "!type" : "fn(message: string, targetOrigin: string) -> !this",
              "!doc" : "Posts a web message to the underlying \"window\" object of the WebView. The website in the \"WebView\" can register for the message in the following fashion: \"window.addEventListener('message', callbackFunction)\". For more information see \"Window.postMessage()\" (https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage) API."
            },
          }
        }
      }
    },
    "tabris" : {
      "create" : {
        "!type" : "fn(type: string, properties?: ?) -> !custom:tabris_create",
        "!doc" : "Creates a native widget of a given type and returns its reference.",
        "!url" : "https://tabrisjs.com/documentation/1.9/widget-basics#tabriscreatetype-properties",
        "!data": {
          "!lint": "tabrisCreate_lint",
          "!guess-type": "tabrisCreate_guessType"
        }
      },
      "app": {"!type": "+types.App"},
      "device": {"!type": "+types.Device"},
      "ui": {"!type": "+types.UI"},
      "Action": {"!type": "types.Action"},
      "ActivityIndicator": {"!type": "types.ActivityIndicator"},
      "Page": {"!type": "types.Page"},
      "Button": {"!type": "types.Button"},
      "TextView": {"!type": "types.TextView"},
      "TextInput": {"!type": "types.TextInput"},
      "CheckBox": {"!type": "types.CheckBox"},
      "Switch": {"!type": "types.Switch"},
      "CollectionView": {"!type": "types.CollectionView"},
      "Picker": {"!type": "types.Picker"},
      "PageSelector": {"!type": "types.PageSelector"},
      "SearchAction": {"!type": "types.SearchAction"},
      "Composite": {"!type": "types.Composite"},
      "Canvas": {"!type": "types.Canvas"},
      "Drawer": {"!type": "types.Drawer"},
      "ImageView": {"!type": "types.ImageView"},
      "ProgressBar": {"!type": "types.ProgressBar"},
      "RadioButton": {"!type": "types.RadioButton"},
      "TabFolder": {"!type": "types.TabFolder"},
      "Tab": {"!type": "types.Tab"},
      "ToggleButton": {"!type": "types.ToggleButton"},
      "ScrollView": {"!type": "types.ScrollView"},
      "Video": {"!type": "types.Video"},
      "WebView": {"!type": "types.WebView"}
    },
    "setTimeout": {
      "!type": "fn(callback: fn(), delay: number, args?: ?) -> ?",
      "!doc": "Calls the given function with \"args\" (and all following parameters) after the specified delay. The actual delay may be slightly longer than the given one.",
      "!url": "https://tabrisjs.com/documentation/1.9/w3c-api"
    },
    "setInterval": {
      "!type": "fn(callback: fn(), delay: number, args?: ?) -> ?",
      "!doc": "Calls the given function with \"args\" (and all following parameters) repeatedly, each time waiting the given delay. The actual delay may be slightly longer than the given one.",
      "!url": "https://tabrisjs.com/documentation/1.9/w3c-api"
    },
    "clearTimeout": {
      "!type": "fn(id: number)",
      "!doc": "Cancels the running timeout associated with the given id. When given an invalid ID, nothing happens.",
      "!url": "https://tabrisjs.com/documentation/1.9/w3c-api"
    },
    "clearInterval": {
      "!type": "fn(id: number)",
      "!doc": "Cancels the running interval associated with the given id. When given an invalid ID, nothing happens.",
      "!url": "https://tabrisjs.com/documentation/1.9/w3c-api"
    },
    /**
     * Promise definitions ported from: https://github.com/ternjs/tern/blob/master/defs/ecma6.json
     */
    "Promise": {
      "!type": "fn(executor: fn(resolve: fn(value: ?), reject: fn(reason: ?)))",
      "!doc": "The Promise object is used for deferred and asynchronous computations. A Promise is in one of the three states:",
      "!url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise",
      "prototype": {
        "catch": {
          "!doc": "The catch() method returns a Promise and deals with rejected cases only. It behaves the same as calling Promise.prototype.then(undefined, onRejected).",
          "!url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/catch",
          "!type": "fn(onRejected: fn(reason: ?)) -> +Promise"
        },
        "then": {
          "!doc": "The then() method returns a Promise. It takes two arguments, both are callback functions for the success and failure cases of the Promise.",
          "!url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/then",
          "!type": "fn(onFulfilled: fn(value: ?), onRejected: fn(reason: ?)) -> +Promise"
        }
      },
      "all": {
        "!type": "fn(iterable: [+Promise]) -> +Promise",
        "!doc": "The Promise.all(iterable) method returns a promise that resolves when all of the promises in the iterable argument have resolved.",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all"
      },
      "race": {
        "!type": "fn(iterable: [+Promise]) -> +Promise",
        "!doc": "The Promise.race(iterable) method returns a promise that resolves or rejects as soon as one of the promises in the iterable resolves or rejects, with the value or reason from that promise.",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race"
      },
      "reject": {
        "!type": "fn(reason: ?) -> +Promise",
        "!doc": "The Promise.reject(reason) method returns a Promise object that is rejected with the given reason.",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/reject"
      },
      "resolve": {
        "!type": "fn(value: ?) -> +Promise",
        "!doc": "The Promise.resolve(value) method returns a Promise object that is resolved with the given value. If the value is a thenable (i.e. has a then method), the returned promise will 'follow' that thenable, adopting its eventual state; otherwise the returned promise will be fulfilled with the value.",
        "!url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/resolve"
      }
    }
  };
});
