var Person = function(id, name, link) {
  this.id = id;
  this.name = name;
  this.link = link;
  this.children = [];
  this.parents = [];
  this.spouses = [];
  this.refcount = 0;
  this.coparents = null;
  this.childsets = null;
  this.node;

  this.getName = function(line) {
    if (line == 1) {
      return this.name;
    }

    if (this.children.length == 0)
      return "";
    else if (this.children.length == 1)
      return "(1 child)";
    else
    return "(" + this.children.length + " children)";
  }

  this.getMom = function() {
    if (this.parents.length > 0) {
      return this.parents[0];
    }
    return null;
  }
  this.getDad = function() {
    if (this.parents.length > 1) {
      return this.parents[1];
    }
    return null;
  }
  this.getSiblings = function() {
    var mch = (this.getMom()) ? this.getMom().children : [];
    var fch = (this.getDad()) ? this.getDad().children : [];
    var sibs = [];
    if (this.getMom() && this.getDad()) {
      for(var i=0; i < mch.length; i++) {
        var ms = mch[i];
        if (!ms) continue;
        if (ms.id == this.id) continue;
        if (fch.indexOf(ms) > -1) {
          sibs.push(ms);
        }
      }
    } else if (this.getMom()) {
      for(var i=0; i < mch.length; i++) {
        var ms = mch[i];
        if (!ms) continue;
        if (ms.id == this.id) continue;
        sibs.push(ms);
      }
    } else if (this.getDad()){
      for(var i=0; i < fch.length; i++) {
        var ms = fch[i];
        if (!ms) continue;
        if (ms.id == this.id) continue;
        sibs.push(ms);
      }
    }
    return sibs;
  }

  this.getAltParent = function(p) {
    if (!p) return null;
    for(var i=0; i < this.parents.length; i++) {
      if (this.parents[i].id != p.id) {
        return this.parents[i];
      }
    }
    return null;
  }

  this.getChildSets = function() {
    this.makeChildSets();
    return this.childsets;
  }

  this.getCoparents = function() {
    this.makeChildSets();
    return this.coparents;
  }

  this.makeChildSets = function() {
    if (this.childsets != null) {
      return;
    }
    this.coparents = [];
    this.childsets = [];
    for(var i=0; i<this.children.length; i++) {
      var c = this.children[i];
      if (!c) continue;
      var p = c.getAltParent(this);
      var found = false;
      if (this.coparents.indexOf(p) == -1) {
        this.coparents.push(p);
        this.childsets.push([]);
      }
      var j = this.coparents.indexOf(p);
      this.childsets[j].push(c);
    }
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

  this.getPerson = function(id) {
    if (this.People[id]) {
      return this.People[id];
    }
    return null;
  }
  this.getPersonFromHash = function() {
    var cid = location.hash.replace("#","");
    if ($.isNumeric(cid)){
      cid = Number(cid);
      return this.getPerson(cid);
    }
    return null;
  }
}
