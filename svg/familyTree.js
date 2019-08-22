var FamilyTree = function() {
  this.BASEURL = "http://dev-gulib-gsa-data.pantheonsite.io"; //Set this to the base url for links
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

  this.processDrupalInputDataV2 = function(data) {
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

      if (this.People[id]) {
        this.People[id].setBirth(birth);
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

    var status = "";
    for(var i=0; i<data.relation.length; i++) {
      var rel = data.relation[i];
      var id1 = Number(rel.field_person_or_group_a);
      var id2 = Number(rel.field_person_or_group_b);
      var p1 = this.People[id1];
      var p2 = this.People[id2];

      if (!p1) {
        status += id1 + ", ";
      } else if (!p2) {
        status += id2 + ", ";
      } else if (rel.title == "Biological Parent of") {
        p1.children.push(p2);
        p2.parents.push(p1);
      } else if (rel.title == "Spouse of") {
        p1.spouses.push(p2);
        p2.spouses.push(p1);
      }
    }
    if (status != "") {
      $("#status").text("Not found: " + status);
    }
  }

  this.processDrupalInputData = function(data) {
    if (data.people && data.relation) {
      return this.processDrupalInputDataV2(data);
    }
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
}
