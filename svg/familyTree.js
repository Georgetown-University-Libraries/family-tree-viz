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
        p = new Person(this, id, name, this.BASEURL+link);
      }
      this.People[id] = p;
    }
    return p;
  }

  /*
  # This is a very simplistic CSV file currently
  # No embedded commas supported in fields
  # Indicates a comment
  Id,Name,Link,Gender,Birth,Death
  1,Homer Simpson,nolink,M,1960,
  3,Bart Simpson,nolink,M,1980,

  # A new header starts after a blank line
  # Supported Relationships:
  # - Parent Of
  # - Birth Parent Of
  # - Spouse Of
  # - Step Parent Of
  # - Adoptive Parent Of
  Id,Relation,Id2
  1,Parent Of,3
  */
  this.processCsvInputData = function(data) {
    this.BASEURL = "";
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
          this.People[id] = new Person(this, id, cols[1], this.BASEURL+cols[2]);
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

  /*
  Georgetown is developing an application that will assemble this visualization
  from a collection of Drupal data views.  Each of the data components will be assembeld
  into a JSON feed that matches the following structure.
  {
    "BASE": "http://mywebsite.edu/",
    "people": [
      {
        "nid": "1",
        "title": "Homer Simpson"
      },
      {
        "nid": "3",
        "title": "Bart Simpson"
      }
    ],
    "births": [
      {
        "field_person_or_group_a_1": "1",
        "field_event_year": "1960"
      },
      {
        "field_person_or_group_a_1": "3",
        "field_event_year": "1980"
      }
    ],
    "gender": [
      {
        "field_person_or_group_a_1": "1",
        "field_gender": "Male"
      },
      {
        "field_person_or_group_a_1": "3",
        "field_gender": "Male"
      }
    ],
    "relation": [
      {
        "field_person_or_group_a": "1",
        "title": "Biological Parent of",
        "field_person_or_group_b": "3"
      }
    ]
  }
  */
  this.processDrupalInputData = function(data) {
    this.BASEURL = data.BASE;
    for(var i=0; i<data.people.length; i++) {
      var per = data.people[i];
      var id = Number(per.nid);
      var name = per.title;

      var link = "node/" + id;
      if (!this.People[id]) {
        this.People[id] = new Person(this, id, name, link);
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

  /*
  Process relationships between Person objects.
  Parent/Biological Parent will be used interchangably.

  The code uses the phrase "coparent" and "spouse".  Both are displayed in a similar manner.
  The code uses the phras "coparent" to incororate married and unmarried parents of the same child.

  The Family Tree visualization is built on the assumption that 1-2 parents
  will be visualized at a time.
  Adoptive Parents and Step Parents will be displayed as an "other" relationship.
  */
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

  /*
  Retrieve a Person based on an Id
  */
  this.getPerson = function(id) {
    if (this.People[id]) {
      return this.People[id];
    }
    return null;
  }

  /*
  Retrieve a person using the id value found in the URL hash
    #parentId
    #parentId-coparentId
  */
  this.getPersonFromHash = function() {
    var hash = location.hash.replace("#","");
    var m = /^(\d+)(-\d+)?$/.exec(hash);
    if (m) {
      return this.getPerson(m[1]);
    }
    return null;
  }

  /*
  Retrieve a coparent using the id value found in the URL hash
    parentId-coparentId
  */
  this.getCoparentFromHash = function() {
    var hash = location.hash.replace("#","");
    var m = /^\d+-(\d+)?$/.exec(hash);
    if (m) {
      return this.getPerson(m[1]);
    }
    return null;
  }

  /*
  Make a GEDCOM download link
  */
  this.asGedcom = function() {
    var csvdata = "data:text;download:gedcom.csv;charset=utf-8," + this.getGedcom();
    var encodedUri = encodeURI(csvdata);
    jQuery("#gedcom").attr("href", encodedUri).attr("download","gedcom.txt");
  }

  /*
  Generate a GEDCOM representation of the family tree
  */
  this.getGedcom = function() {
    var recs = [];

    //Find all parent child relationships
    for(var i=0; i<this.People.length; i++) {
      var person = this.People[i];
      if (!person) continue;
      person.makeChildSets();
    }

    //Output all known "families" (parent combinations)
    for(var i=0; i<this.Families.length; i++) {
      var f = this.Families[i];
      recs.push("0 " + f.getGedcomId() + " FAM");
    }

    //Output each individual
    for(var i=0; i<this.People.length; i++) {
      var person = this.People[i];
      if (!person) continue;
      recs.push("0 " + person.getGedcomId() + " INDI");
      recs.push("1 NAME " + person.name);
      if (person.isMale()) {
        recs.push("1 SEX M");
      } else if (person.isFemale()) {
        recs.push("1 SEX F");
      }
      if (person.birth != 0) {
        recs.push("1 BIRT");
        recs.push("2 DATE " + person.birth);
      }
      if (person.death != 0) {
        recs.push("1 DEAT");
        recs.push("2 DATE " + person.death);
      }

      //Document spousal family relationships
      for(var j=0; j<person.families.length; j++) {
        var f = person.families[j];
        recs.push("1 FAMS " + f.getGedcomId());
      }
      if (person.isMale() ) {
        for(var j=0; j<person.spouses.length; j++) {
          recs.push("1 WIFE " + person.spouses[j].getGedcomId());
        }
      } else if (person.isFemale() ) {
        for(var j=0; j<person.spouses.length; j++) {
          recs.push("1 HUSB " + person.spouses[j].getGedcomId());
        }
      }
      //Identify the "family" associated with the person's parents
      var f = person.getGedcomFamily();
      if (f) {
        recs.push("1 FAMC " + f.getGedcomId());
      }

      //List children of the individual
      for(var j=0; j<person.children.length; j++) {
        recs.push("1 CHIL " + person.children[j].getGedcomId());
      }
    }
    return recs.join("\n");
  }
}
