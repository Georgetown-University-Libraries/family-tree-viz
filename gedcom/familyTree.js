var UNKNOWN = "Unknown";

var MarrOrParentalRel = function(fid, id1, id2) {
  this.id1 = id1;
  this.id2 = id2;
  this.fid = fid;
  this.gedcomid = function() {
    return "@F" + this.fid + "@";
  }
  this.children = [];
}

var Person = function(id, name, link) {
  this.id = id;
  this.name = name;
  this.link = link;
  this.children = [];
  this.parents = [];
  this.spouses = [];
  this.gedcomid = function() {
    return "@I" + this.id + "@";
  }
}

var FamilyTree = function() {
  this.BASEURL = ""; //Set this to the base url for links
  this.People = [];
  this.MarrOrParentalRels = []

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

  this.findOrCreateRel = function(id1, id2) {
    for(var i=0; i<this.MarrOrParentalRels.length; i++) {
      var pr = this.MarrOrParentalRels[i];
      if (pr.id1 == id1 && pr.id2 == id2) {
        return pr;
      }
      if (pr.id1 == id2 && pr.id2 == id1) {
        return pr;
      }
    }
    pr = new MarrOrParentalRel(this.MarrOrParentalRels.length, id1, id2);
    this.MarrOrParentalRels.push(pr);
    return pr;
  }

  this.findOrCreateRelParent = function(p) {
    var ip = p.parents;
    if (ip.length == 0) {
      return null;
    }
    var id1 = ip[0].id;
    var id2 = ip.length > 1 ? ip[1].id : null;
    var pr = this.findOrCreateRel(id1, id2);
    pr.children.push(p);
    return pr;
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
    var recs = [];
    for(var i=0; i<this.People.length; i++) {
      if (this.People[i]) {
        var person = this.People[i];
        recs.push("0 " + person.gedcomid() + " INDI");
        recs.push("1 NAME "+person.name);
        var f = this.findOrCreateRelParent(person);
        if (f != null) {
          recs.push("1 FAMC " + f.gedcomid());
        }
        for(var j=0; j<person.spouses.length; j++) {
          var ps = person.spouses[j];
          var f = this.findOrCreateRel(person.id, ps.id);
          recs.push("1 FAMS " + f.gedcomid());
        }
      }
    }
    for(var i=0; i<this.MarrOrParentalRels.length; i++) {
      var f = this.MarrOrParentalRels[i];
      recs.push("0 " + f.gedcomid() + " FAM");
      if (f.id1 != null) {
        recs.push("1 HUSB " + this.People[f.id1].gedcomid());
      }
      if (f.id2 != null) {
        recs.push("1 WIFE " + this.People[f.id2].gedcomid());
      }
      for(var j=0; j<f.children.length; j++) {
        recs.push("1 CHIL " + f.children[j].gedcomid());
      }
    }
    return recs.join('\n');
  }

  this.getJson = function() {
    return this.getAllJson();
  }

}
