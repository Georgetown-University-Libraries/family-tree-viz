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
      var dir = "top";
      if (base.spouses) {
        if (base.spouses.length > 1) {
          dir = "right";
        }
      }
      this.decorateNode(p, "#bbbcbc", "Spouse", dir);
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

  /*
  # This is a very simplistic CSV file currently
  # No embedded commas supported in fields
  # Indicates a comment
  Id,Name,Link
  1,Homer Simpson,nolink
  3,Bart Simpson,nolink

  # A new header starts after a blank line
  Id,Relation,Id2
  1,Parent Of,3
  */
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
  

  this.processPeopleObject = function(cp, processObj) {
    if ((processObj) && (cp instanceof Object)) {
      var id = Number(cp.Id);
      var p = new Person(id, cp.Name, this.BASEURL+cp.Link);
      this.People[id] = p;
      
      this.processChildArray(cp, p, processObj);
      this.processSpouseArray(cp, p, processObj);
      return p;
    } else if (cp instanceof Object) {
      var p = this.People[cp.Id];
      if (p) {
        this.processChildArray(cp, p, processObj);
        this.processSpouseArray(cp, p, processObj);
      }
      //return null, the oject has already been processed
      return null;
    } else if (!processObj) {
      var p = this.People[cp];
      if (p) {
        this.processChildArray(cp, p, processObj);
        this.processSpouseArray(cp, p, processObj);
      }
      return p;
    }
  }
  
  this.processPeopleArray = function(arrIn, processObj) {
    for(var i=0; i<arrIn.length; i++) {
      this.processPeopleObject(arrIn[i], processObj);
    }
  }

  this.processChildArray = function(cp, objViz, processObj) {
    if (!cp.Children) return;
    for(var i=0; i<cp.Children.length; i++) {
      var p = this.processPeopleObject(cp.Children[i], processObj);
      if (p) {
        objViz.children.push(p);
        p.parents.push(objViz);
      }
    }
  }

  this.processSpouseArray = function(cp, objViz, processObj) {
    if (!cp.Spouse) return;
    for(var i=0; i<cp.Spouse.length; i++) {
      var p = this.processPeopleObject(cp.Spouse[i], processObj);
      if (p) {
        objViz.spouses.push(p);
        p.spouses.push(objViz);
      }
    }
  }


  /*
  Json input data generated from Yaml input.
  
  People:
  - Id: 1
    Name: Homer Simpson
    Children: [3,4,5]
    Spouse: [2]
  - Id: 2
    Name: Marge Simpson
    Children: [3,4,5]
  - Id: 3
    Name: Bart Simpson
  */
  this.processJsonInputData = function(data) {
    this.processPeopleArray(data.People, true);
    this.processPeopleArray(data.People, false);
  }
  
  this.getAllJson = function() {
    var tops = [];
    for(var i=0; i<this.People.length; i++) {
      if (this.People[i]) {
        var person = this.People[i];
        if (person.parents.length == 0) {
          tops.push(person);
        }
      }
    }
    var top = new Person(0, "All Ancestors", this.BASEURL);
    if (tops.length > 10) {
      var ttop = top;
      for(var i=0; i<tops.length; i++) {
        if (i % 10 == 0 ){
          var bucket = (i/10)+1;
          ttop = new Person(this.People.length+bucket, "Top Bucket " + bucket , this.BASEURL);
          top.children.push(ttop);
        }
        ttop.children.push(tops[i]);
      }
    } else {
      for(var i=0; i<tops.length; i++) {
        top.children.push(tops[i]);
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
