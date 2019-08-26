var FamilyTree = function() {
  this.BASEURL = ""; //Set this to the base url for links
  this.People = [];
  this.Families = [];

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
          if (cols.length > 3) {
            this.People[id].setGender(cols[3]);
          }
          if (cols.length > 4) {
            this.People[id].setBirthYear(cols[4]);
          }
          if (cols.length > 5) {
            this.People[id].setDeathYear(cols[5]);
          }
        }
      } else if (cols.length > 2){
        var p = this.People[cols[0]];
        var cp = this.People[cols[2]];
        var rel = cols[1];
        this.processRelationship(p, rel, cp);
      }
    }
  }

  this.processDrupalInputData = function(data) {
    this.BASEURL = data.BASE;
    for(var i=0; i<data.people.length; i++) {
      var per = data.people[i];
      var id = Number(per.nid);
      var name = per.title;

      var link = "/node/" + id;
      if (!this.People[id]) {
        this.People[id] = new Person(id, name, link);
      }
    }

    for(var i=0; i<data.births.length; i++) {
      var per = data.births[i];
      var id = Number(per.field_person_or_group_a_1);
      var birth = per.field_event_year;

      if (this.People[id] && birth != 0) {
        this.People[id].setBirthYear(birth);
      }
    }

    for(var i=0; i<data.gender.length; i++) {
      var per = data.gender[i];
      var id = Number(per.field_person_or_group_a_1);
      var gender = per.field_gender;

      if (this.People[id]) {
        this.People[id].setGender(gender);
      }
    }

    for(var i=0; i<data.relation.length; i++) {
      var rel = data.relation[i];
      var id1 = Number(rel.field_person_or_group_a);
      var id2 = Number(rel.field_person_or_group_b);
      var p1 = this.People[id1];
      var p2 = this.People[id2];
      this.processRelationship(p1, rel.title, p2);
    }
  }

  this.processRelationship = function(p1, rel, p2) {
    if (!p1 || !p2) {
      return;
    }
    rel = rel.toLowerCase();
    if (rel == "biological parent of" || rel == "parent of") {
      p1.children.push(p2);
      p2.parents.push(p1);
    } else if (rel == "spouse of") {
      p1.spouses.push(p2);
      p2.spouses.push(p1);
    } else if (rel == "adoptive parent of") {
      p1.addRelation(p2, "Adopted Child");
      p2.addRelation(p1, "Adoptive Parent");
    } else if (rel == "step parent of") {
      p1.addRelation(p2, "Step Child");
      p2.addRelation(p1, "Step Parent");
    }
  }

  this.processPeopleObject = function(cp, processObj) {
    if ((processObj) && (cp instanceof Object)) {
      var id = Number(cp.Id);
      var link = cp.Link ? this.BASEURL + cp.Link : "";
      var p = new Person(id, cp.Name, link);
      if (cp.Gender) {
        p.setGender(cp.Gender);
      }
      if (cp.Birth) {
        p.setBirthYear(cp.Birth);
      }
      if (cp.Death) {
        p.setDeathYear(cp.Death);
      }
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

  this.getPerson = function(id) {
    if (this.People[id]) {
      return this.People[id];
    }
    return null;
  }
  this.getPersonFromHash = function() {
    var hash = location.hash.replace("#","");
    var m = /^(\d+)(-\d+)?$/.exec(hash);
    if (m) {
      return this.getPerson(m[1]);
    }
    return null;
  }

  this.getCoparentFromHash = function() {
    var hash = location.hash.replace("#","");
    var m = /^\d+-(\d+)?$/.exec(hash);
    if (m) {
      return this.getPerson(m[1]);
    }
    return null;
  }

  this.asGedcom = function() {
    var csvdata = "data:text;download:gedcom.csv;charset=utf-8," + this.getGedcom();
    var encodedUri = encodeURI(csvdata);
    $("#gedcom").attr("href", encodedUri).attr("download","gedcom.txt");
  }

  this.getGedcom = function() {
    var families = [];
    var recs = [];
    for(var i=0; i<this.People.length; i++) {
      var person = this.People[i];
      if (!person) continue;
      recs.push("0 " + person.getGedcomId() + " INDI");
      recs.push("1 NAME "+person.name);
    }
    return recs.join("\n");
  }
}
