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

  this.processCsvInputData = function(data) {
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
          var id = Number(cols[0]);
          this.People[id] = new Person(id, cols[1], this.BASEURL+cols[2]);
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

  //Json input data generated from Yaml input
  this.processJsonInputData = function(data) {
    var arr = data.People;
    for(var i=0; i<arr.length; i++) {
      var cp = arr[i];
      var id = Number(cp.Id);
      this.People[id] = new Person(id, cp.Name, this.BASEURL+cp.Link);
    }
    for(var i=0; i<arr.length; i++) {
      var cp = arr[i];
      var p = this.People[cp.Id];
      if (cp.Children) {
        for(var li=0; li<cp.Children.length; li++) {
          var lid = cp.Children[li];
          var lp = this.People[lid];
          if (lp) {
            lp.parents.push(p);
            p.children.push(lp);
          }
        }
      }
      if (cp.Spouse) {
        for(var li=0; li<cp.Spouse.length; li++) {
          var lid = cp.Spouse[li];
          var lp = this.People[lid];
          if (lp) {
            lp.spouses.push(p);
            p.spouses.push(lp);
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
