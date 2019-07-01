var Person = function(id, name, link) {
  this.id = id;
  this.name = name;
  this.link = link;
  this.children = [];
  this.parents = [];
  this.spouses = [];
  this.refcount = 0;
  this.relSpouseOrCoparent = [];
  this.relParent = null;
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

  this.findRelationship = function(idx) {
    for(var i=0; i<this.relSpouseOrCoparent.length; i++) {
      var rel = this.relSpouseOrCoparent[i];
      if (rel.id1 == this.id && rel.id2 == idx) {
        return rel;
      }
      if (rel.id2 == this.id && rel.id1 == idx) {
        return rel;
      }
    }
    return null;
  }

  this.asFocusVisNode = function() {
    var p = this.asBaseVisNode();
    this.decorateNode(p, "#d6d2c4", "Focus", "right");
    p.data.focus = true;

    this.directVisNode(this, p, "parentrel", true, true);
    this.directVisNode(this, p, "childrel", true, true);

    return p;
  }

  this.asVisNode = function() {
    return this.asDirectedVisNode(this, "childrel", true, true, 0);
  }

  this.asTopVisNode = function() {
    //process all top level items first before walking the descendant tree
    var p = this.asDirectedVisNode(this, "childrel", false, true, 0);
    //for(var i=0; i < this.children.length; i++) {
    //  this.children[i].directVisNode(this, this.children[i].node, "children", true, true);
    //}
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
    if (direction == "parentrel") {
      this.decorateNode(p, "#00b5e2", "Ancestor", "top");
    } else if (base.id == 0){
      this.decorateNode(p, "#d6d2c4", "Top Ancestor", i % 2 == 0 ? "left" : "right");
    } else {
      this.decorateNode(p, "#f8e08e", "Descendant", "bottom");
    }

    if (showNext) {
      p = this.directVisNode(base, p, direction, isRecursive, showNext);
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
    if (direction == "parentrel") {
      var rel = base.relParent;
      if (rel != null) {
        rel.directVisNode(rel, p, direction, isRecursive, showNext);
        /*
        var pp = rel.asVisNode(rel.p1, rel.p2);
        pp.data.myorn = "bottom";
        p.children.push(pp);
        rel.directVisNode(rel, pp, direction, isRecursive, showNext);
        */
      }
    } else if (direction == "childrel") {
      for(var i=0; i<this.relSpouseOrCoparent.length; i++) {
        var coparrel = this.relSpouseOrCoparent[i];
        if (!coparrel) {
          continue;
        }
        if (coparrel.children.length == 0){
          continue;
        }
        var altpar = coparrel.getAltParent(base);
        var pp = coparrel.asVisNode(this, altpar);
        p.children.push(pp);
        if (altpar) {
          var ppp = altpar.asBaseVisNode();
          altpar.decorateNode(ppp, "pink", "Parent", "left")
          pp.children.push(ppp);
        }
        coparrel.directVisNode(coparrel, pp, direction, isRecursive, showNext);
      }
    }
    return p;
  }

  this.getLabel = function() {
    var x = this.children.length;
    if (x == 0) {
      return "";
    } else if (x == 1) {
      return "1 Child";
    } else {
      return x + " Children";
    }
  }

}

var Relationship = function(ft, p1, p2) {
  this.p1 = p1;
  this.p2 = p2;
  this.id1 = p1 == null ? null : p1.id;
  this.id2 = p2 == null ? null : p2.id;
  this.children = [];
  this.matches = function(p1, p2) {
    var id1 = p1 == null ? null : p1.id;
    var id2 = p2 == null ? null : p2.id;
    if (this.id1 == id1 && this.id2 == id2) {
      return true;
    }
    if (this.id1 == id2 && this.id2 == id1) {
      return true;
    }
    return false;
  }
  this.node;
  this.createNode = function(id, label, dir) {
    this.node = {
      id: this.getRelId(),
      name: label,
      data: {
        link: "x",
        mycolor: "tan",
        myorn: dir
      },
      children: []
    }
    return this.node;
  }

  this.getRelId = function() {
    if (this.p1 && this.p2) {
      return "rel-" + this.id1 + "-" + this.id2;
    } else if (this.p1) {
      return "rel-" + this.id1;
    } else {
      return "rel-" + this.id2;
    }
  }

  this.getArr = function() {
    var arr = [];
    if (this.p1) {
      arr.push(this.p1);
    }
    if (this.p2) {
      arr.push(this.p2);
    }
    return arr;
  }

  this.getAltParent = function(ref) {
    if (!ref) {
      return null;
    }
    var arr = this.getArr();
    for(var i=0; i<arr.length; i++) {
      if (ref.id != arr[i].id) {
        return arr[i];
      }
    }
    return null;
  }

  this.asVisNode = function(par, copar) {
    var name = "Children of " + par.name + " and ";
    name += copar ? copar.name : "unspecified";
    var p = this.createNode("node" + this.getRelId(), name, "top");
    return p;
  }

  this.asFocusVisNode = function(par, copar) {
    var p = this.asVisNode(this.p1, this.p2);
    this.directVisNode(this, p, "parentrel", true, true);
    this.directVisNode(this, p, "childrel", true, true);
    return p;
  }

  this.directVisNode = function(baserel, p, direction, isRecursive, showNext) {
    if (direction == "parentrel") {
      var arr = baserel.getArr();
      for(var i=0; i<arr.length; i++) {
        var per = arr[i];
        var pp = per.asBaseVisNode();
        label = per.children.length == 0 ? "" : per.children.length + " Children";
        per.decorateNode(pp, "#d6d2c4", per.getLabel(), "bottom");
        p.children.push(pp);
        per.directVisNode(per, pp, direction, isRecursive, showNext);
      }
    } else if (direction == "childrel") {
      for(var i=0; i<this.children.length; i++) {
        var child = this.children[i];
        if (child) {
          var pp = child.asBaseVisNode();
          child.decorateNode(pp, "#d6d2c4", child.getLabel(), "top");
          p.children.push(pp);
          child.directVisNode(child, pp, direction, isRecursive, showNext);
        }
      }
    }
    return p;
  }
}

var FamilyTree = function() {
  this.BASEURL = ""; //Set this to the base url for links
  this.People = [];
  this.Relationships = [];

  this.findOrCreateRel = function(p1, p2) {
    for(var i=0; i<this.Relationships.length; i++) {
      var pr = this.Relationships[i];
      if (pr.matches(p1, p2)) {
        return pr;
      }
    }
    pr = new Relationship(this, p1, p2);
    this.Relationships.push(pr);
    if (p1 != null) {
      p1.relSpouseOrCoparent.push(pr);
    }
    if (p2 != null) {
      p2.relSpouseOrCoparent.push(pr);
    }
    return pr;
  }

  this.findOrCreateRelParent = function(p) {
    var ip = p.parents;
    if (ip.length == 0) {
      return null;
    }
    var p1 = ip[0];
    var p2 = ip.length > 1 ? ip[1] : null;
    var pr = this.findOrCreateRel(p1, p2);
    pr.children.push(p);
    p.relParent = pr;
    return pr;
  }

  this.makeRelationships = function() {
    for(var i=0; i<this.People.length; i++) {
      var p = this.People[i];
      if (p == null) continue;
      for(var j=0; j<p.spouses.length; j++) {
        var ps = p.spouses[j];
        this.findOrCreateRel(p, ps);
      }
    }
    for(var i=0; i<this.People.length; i++) {
      var p = this.People[i];
      if (p == null) continue;
      this.findOrCreateRelParent(p);
    }
  }

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

  this.processDrupalInputData = function(data) {
    for(var i=0; i<data.length; i++) {
      var rel = data[i];
      var id1 = Number(rel.field_person_or_group_a);
      var name1 = rel.title_1;
      var link1 = rel.view_node;
      if (!this.People[id1]) {
        this.People[id1] = new Person(id1, name1, this.BASEURL+link1);
      }
      var id2 = Number(rel.field_person_or_group_b);
      var name2 = rel.title_2;
      var link2 = rel.view_node_1;
      if (!this.People[id2]) {
        this.People[id2] = new Person(id2, name2, this.BASEURL+link2);
      }
      if (rel.title == "Biological Parent of") {
        this.People[id1].children.push(this.People[id2]);
        this.People[id2].parents.push(this.People[id1]);
      } else if (rel.title == "Spouse of") {
        this.People[id1].spouses.push(this.People[id2]);
        this.People[id2].spouses.push(this.People[id1]);
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
    this.makeRelationships();
    return top.asTopVisNode();
  }

  this.getPersonJson = function(id) {
    this.makeRelationships();
    if (this.People[id]) {
      return this.People[id].asFocusVisNode();
    }
    return new Person(0, "Person not found", this.BASEURL).asVisNode();
  }

  this.getRelationshipJson = function(id1, id2) {
    this.makeRelationships();
    var rel = null;
    if (this.People[id1]) {
      rel = this.People[id1].findRelationship(id2);
    }
    if (rel == null) {
      return new Person(0, "Person not found", this.BASEURL).asVisNode();
    }
    return rel.asFocusVisNode(rel.p1, rel.p2);
  }

  this.getJson = function() {
    //return this.getAllJson();
    var cid = location.hash.replace("#","");
    if (cid == "") {
      return this.getPersonJson(152);
      //return this.getAllJson();
    }
    var match = /rel-(\d+)-?(\d+)?/.exec(cid);
    if (match) {
      return this.getRelationshipJson(match[1], match[2]);
    }
    cid = $.isNumeric(cid) ? Number(cid) : 152;
    return this.getPersonJson(cid);
    //return this.getPersonJson(155);
    //return this.getPersonJson(168);
  }
}
