var labelType, useGradients, nativeTextSupport, animate;

(function() {
  var ua = navigator.userAgent,
      iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
      typeOfCanvas = typeof HTMLCanvasElement,
      nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
      textSupport = nativeCanvasSupport
        && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
  //I'm setting this based on the fact that ExCanvas provides text support for IE
  //and that as of today iPhone/iPad current text support is lame
  labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
  nativeTextSupport = labelType == 'Native';
  useGradients = nativeCanvasSupport;
  animate = !(iStuff || !nativeCanvasSupport);
})();

var Log = {
  elem: false,
  write: function(text){
    if (!this.elem)
      this.elem = document.getElementById('log');
    this.elem.innerHTML = text;
    this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
  }
};

var Person = function(id, name, link) {
  this.id = id;
  this.name = name;
  this.link = link;
  this.children = [];
  this.parents = [];
  this.spouses = [];
  this.refcount = 0;
  this.node;

  this.createNode = function(id, name, link) {
    this.node = {
      id: id,
      name: name,
      data: {
        link: link,
        mycolor: "#d6d2c4",
        myorn: "right"
      },
      children: []
    }
    return this.node;
  }

  this.asFocusVisNode = function() {
    var p = this.asBaseVisNode();
    this.decorateNode(p, "#d6d2c4", "Focus", "right");
    p.data.focus = true;

    this.directVisNode(this, p, "spouses", false, true);
    this.directVisNode(this, p, "children", true, true);
    this.directVisNode(this, p, "parents", true, true);

    return p;
  }

  this.asVisNode = function() {
    return this.asDirectedVisNode(this, "children", true, true, 0);
  }

  this.asTopVisNode = function() {
    //process all top level items first before walking the descendant tree
    var p = this.asDirectedVisNode(this, "children", false, true, 0);
    for(var i=0; i < this.children.length; i++) {
      this.children[i].directVisNode(this, this.children[i].node, "children", true, true);
    }
    return p;
  }

  this.decorateNode = function(p, color, label, orn) {
    //placement overrides are not yet working
    p.data.myorn = orn;

    if (!p.data.mycolor) {
      p.data.mycolor = color;
    }
    if (p.data.mycolor != "white") {
      p.data.mycolor = color;
    }
    if (!p.name) {
      p.name = label;
    } else if (label != ""){
      p.name += "<br/>(" + label + ")";
    }
  }

  this.asDirectedVisNode = function(base, direction, isRecursive, showNext, i) {
    var p = this.asBaseVisNode();
    if (direction == "parents" && !showNext) {
      this.decorateNode(p, "#d6d2c4", "Other Parent", "left");
    } else if (direction == "parents") {
      this.decorateNode(p, "#00b5e2", "Ancestor", "right");
    } else if (direction == "spouses") {
      this.decorateNode(p, "#bbbcbc", "Spouse", "top");
    } else if (base.id == 0){
      this.decorateNode(p, "#d6d2c4", "Top Ancestor", i % 2 == 0 ? "left" : "right");
    } else {
      this.decorateNode(p, "#f8e08e", "Descendant", "left");
    }

    if (showNext) {
      p = this.directVisNode(base, p, direction, isRecursive, showNext);
      if (direction == "children") {
        p = this.directVisNode(base, p, "parents", false, true);
      }
    }
    return p;
  }

  this.asBaseVisNode = function() {
    var p = this.createNode("node" + this.id, this.name, this.link);
    //var p = this.createNode("node" + this.id, this.name + " ("+this.id+")", this.link);
    if (this.refcount > 0) {
      p.data.cid = p.id;
      p.id += "_" + this.refcount;
      p.name += "*";
      p.data.mycolor = "#d6d2c4";
    }
    this.refcount++;
    return p;
  }

  this.directVisNode = function(base, p, direction, isRecursive, showNext) {
    if (this[direction]) {
      for(var i = 0; i<this[direction].length; i++) {
        var n = this[direction][i];
        if (n.id == base.id) continue;
        p.children.push(n.asDirectedVisNode(this, direction, isRecursive, isRecursive, i));
      }
    }
    return p;
  }

}

var FamilyTree = function() {
  this.BASEURL = ""; //Set this to the base url for links
  this.People = [];

  this.parsePerson = function(cols) {
    var id = (cols[0]) ? Number(cols[0]) : 0;
    var p = null;
    if (id > 0) {
      p = (id in this.People) ? this.People[id] : null;
      if (p == null) {
        var name = (cols[1]) ? cols[1] : "";
        var link = (cols[2]) ? cols[2] : "";
        p = new Person(id, name, this.BASEURL+link);
      }
      this.People[id] = p;
    }
    return p;
  }

  this.processPeopleData = function(data) {
    var rows = data.split(/\r?\n/);

    var firstblock = true;
    var header = true;
    for(var i=0; i < rows.length; i++) {
      var row = rows[i];
      if (rows[i] == "") {
        header = true;
        firstblock = false;
        continue;
      }
      if (rows[i].charAt(0) == '#') continue;
      if (header) {
        header = false;
        continue;
      }
      var cols = row.split(",");
      if (firstblock) {
        if (cols.length > 2) {
          this.parsePerson(cols);
        }
      } else if (cols.length > 2){
        var p = this.People[cols[0]];
        var cp = this.People[cols[2]];
        var rel = cols[1];
        if (p && cp) {
          if (rel == "Parent Of") {
            cp.parents.push(p);
            p.children.push(cp);
          } else if (rel == "Spouse Of") {
            cp.spouses.push(p);
            p.spouses.push(cp);
          }
        }
      }
    }
  }

  this.getAllJson = function() {
    var top = new Person(0, "All Ancestors", this.BASEURL);
    for(var i=0; i<this.People.length; i++) {
      if (this.People[i]) {
        var person = this.People[i];
        if (person.parents.length == 0) {
          top.children.push(person);
        }
      }
    }
    return top.asTopVisNode();
  }

  this.getPersonJson = function(id) {
    if (this.People[id]) {
      return this.People[id].asFocusVisNode();
    }
    return new Person(0, "Person not found", this.BASEURL).asVisNode();
  }
  this.getJson = function() {
    //return this.getAllJson();
    var cid = location.hash.replace("#","");
    if (cid == "") {
      return this.getAllJson();
    }
    var cid = $.isNumeric(cid) ? Number(cid) : 152;
    return this.getPersonJson(cid);
    //return this.getPersonJson(155);
    //return this.getPersonJson(168);
  }
}

function dofocus(cid) {
  location.hash = (cid) ? cid : "";
  location.reload();
}

var familyTree;
function init(){
  $.get("data.csv", function(data){
    var familyTree = new FamilyTree();
    familyTree.processPeopleData(data);
    initDiagram(familyTree.getJson());
  }, "text");
}
function initDiagram(json){
    var $orn = "left";
    //preprocess subtrees orientation
    var arr = json.children, len = arr.length;
    for(var i=0; i < len; i++) {
      //split half left orientation

      arr[i].data.$orn = arr[i].data.myorn;
      $jit.json.each(arr[i], function(n) {
        n.data.$orn = arr[i].data.myorn;
      });

      /*
      if(arr[i].data.myorn == "left") {
        arr[i].data.$orn = 'left';
        $jit.json.each(arr[i], function(n) {
          n.data.$orn = 'left';
        });
      } else {
      //half right
        arr[i].data.$orn = 'right';
        $jit.json.each(arr[i], function(n) {
          n.data.$orn = 'right';
        });
      }
      */
    }
    //end
    //grab radio button
    var normal = $jit.id('s-normal');
    //init Spacetree
    //Create a new ST instance
    var st = new $jit.ST({
        //id of viz container element
        injectInto: 'infovis',
        //multitree
        multitree: true,
        //set duration for the animation
        duration: 800,
        //set animation transition type
        transition: $jit.Trans.Quart.easeInOut,
        //set distance between node and its children
        levelDistance: 40,
        //sibling and subtrees offsets
        siblingOffset: 3,
        subtreeOffset: 3,
        //set node and edge styles
        //set overridable=true for styling individual
        //nodes or edges
        Node: {
            height: 55,
            width: 150,
            type: 'ellipse',
            color: '#aaa',
            overridable: true,
            //set canvas specific styles
            //like shadows
            CanvasStyles: {
              shadowColor: '#ccc',
              shadowBlur: 10
            }
        },
        Edge: {
            type: 'line',
            color: 'black',
            overridable: true
        },

        onBeforeCompute: function(node){
            Log.write("loading " + node.name);
        },

        onAfterCompute: function(){
            Log.write("done");
        },

        //This method is called on DOM label creation.
        //Use this method to add event handlers and styles to
        //your node.
        onCreateLabel: function(label, node){
            label.id = node.id;
            var targetid = node.id
            label.innerHTML = node.name;
            if (node.data.cid) {
              targetid = node.data.cid;
            } else if (node.data.link) {
              if (node.data.focus) {
                label.innerHTML += "<br/><a href='"+node.data.link+"'>Details</a> <a href='javascript:dofocus()'>View ALL</a>";
              } else {
                label.innerHTML += "<br/><a href='"+node.data.link+"'>Details</a> <a href='javascript:dofocus("+node.id.replace("node","")+")'>focus</a>";
              }
            }
            label.onclick = function(){
              if(true) {
                st.onClick(targetid);
              } else {
                st.setRoot(targetid, 'animate');
              }
            };
            //set label styles
            var style = label.style;
            style.width = 150 + 'px';
            style.height = 55 + 'px';
            style.cursor = 'pointer';
            style.color = '#333';
            style.fontSize = '0.8em';
            style.textAlign= 'center';
            style.paddingTop = '10px';
        },

        //This method is called right before plotting
        //a node. It's useful for changing an individual node
        //style properties before plotting it.
        //The data properties prefixed with a dollar
        //sign will override the global node style properties.
        onBeforePlotNode: function(node){
            //add some color to the nodes in the path between the
            //root node and the selected node.
            if (node.selected) {
                node.data.$color = "#64a70b";
            }
            else {
                delete node.data.$color;
                //if the node belongs to the last plotted level
                node.data.$color = node.data.mycolor;
                if(!node.anySubnode("exist")) {
                    //count children number
                    var count = 0;
                    node.eachSubnode(function(n) { count++; });
                    //assign a node color based on
                    //how many children it has
                    //node.data.$color = ['#aaa', '#baa', '#caa', '#daa', '#eaa', '#faa', '#faa', '#faa', '#faa', '#faa'][count];
                }
            }
        },

        //This method is called right before plotting
        //an edge. It's useful for changing an individual edge
        //style properties before plotting it.
        //Edge data proprties prefixed with a dollar sign will
        //override the Edge global style properties.
        onBeforePlotLine: function(adj){
            if (adj.nodeFrom.selected && adj.nodeTo.selected) {
                adj.data.$color = "#eed";
                adj.data.$lineWidth = 3;
            }
            else {
                delete adj.data.$color;
                delete adj.data.$lineWidth;
            }
        }
    });
    //load json data
    st.loadJSON(json);
    //compute node positions and layout
    st.compute('end');
    st.select(st.root);
    //end

}
