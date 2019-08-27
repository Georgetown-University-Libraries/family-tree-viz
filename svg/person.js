/*
Person Relationship - this class is used to annotate how one person relates to another person.
This is used to annotate the following relationships:
- Other Spouses/Coparents of the people in focus
- Step parent/child
- Adoptive parent/child
*/
var PersonRel = function(p, rel, isCopar) {
  this.p = p;
  this.rel = rel;

  //boolean - this flag indicates that a visualization should be displayed from
  //the perspective of a specific coparent relationship.
  this.isCopar = isCopar;
}

/*
Person object built from a collection of people records and related people records.
*/
var Person = function(familyTree, id, name, link) {
  //refernce to the family tree
  this.familyTree = familyTree;
  //numeric id for the individual.  this will be used in a zero-based array that assumes
  //there will be a finite number of people.  If more complex ids are needed, an index will
  //need to be calculated.
  this.id = id;
  //name of the person
  this.name = name;
  //link to a website page with details about the person
  this.link = link;
  //array of the children of this person
  this.children = [];
  //array of the biological parents of this person
  this.parents = [];
  //array of the spouses of this person
  this.spouses = [];
  //array of families when generating a gedcom listing
  this.families = [];

  //array of annotated relationships to this person
  //spouses, biological parents, and biological children should not be captured here.
  this.otherrel = [];
  //array of the spouses and biological coparents of this person
  this.coparents = null;
  //array of the lists of childen of this person (one list will be created for each coparent)
  this.childsets = null;
  //birth year for this person as int.  0 indicates no value.
  this.birth = 0;
  //death year for this person as int.  0 indicates no value.
  this.death = 0;
  //gender for this person: ? (unset), ♂, ♀
  this.gender = "?";

  //get the text to display in the visualization box for each person.
  //line refers to the line number to display in the box.
  //For SVG rendering, the value will be returned line by line.
  this.getName = function() {
    var lines = [];
    var name = this.name;
    if (this.children.length > 0) {
      name += " (" + this.children.length + " ch.)";
    }
    lines.push(name);

    name = this.gender;
    if (this.birth == 0 && this.death == 0) {
      name += " (dates unknown)";
    } else {
      name += "(";
      name += this.birth == 0 ? "?" : this.birth;
      name += " - ";
      name += this.death == 0 ? "?" : this.death;
      name += ")";
    }
    lines.push(name);
    return lines;
  }

  /*
  Find the mother or the first ungendered parent for the individual.
  */
  this.getMom = function() {
    var p1 = null;
    for (var i=0; i < this.parents.length; i++) {
      var p = this.parents[i];
      if (p.isFemale()) {
        return p;
      } else if (p.isGenderUnknown() && p1 == null) {
        p1 = p;
      }
    }
    return p1;
  }

  /*
  Find the father or the second ungendered parent for the individual.
  */
  this.getDad = function() {
    var p1 = null;
    var skippedFirst = false;
    for (var i=0; i < this.parents.length; i++) {
      var p = this.parents[i];
      if (p.isMale()) {
        return p;
      } else if (p.isGenderUnknown()) {
        if (skippedFirst) {
          return p1 = p;
        } else {
          skippedFirst = true;
        }
      }
    }
    return p1;
  }

  /*
  Find the other people with the same parents as the individual in focus.
  */
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

  /*
  From the perspective of this person, find the coparent of parent p.
  */
  this.getAltParent = function(p) {
    if (!p) return null;
    for(var i=0; i < this.parents.length; i++) {
      if (this.parents[i].id != p.id) {
        return this.parents[i];
      }
    }
    return null;
  }

  /*
  From the perspective of this person, find Gedcom family.
  A "family" may be identified by either one parent or 2 parents
  */
  this.getGedcomFamily = function() {
    if (this.parents.length > 0) {
      var p = this.parents[0];
      var ap = this.getAltParent(p);
      for(var i=0; i < p.families.length; i++) {
        var f = p.families[i];
        if (f.p1.id == p.id && f.p2 && ap) {
          if (f.p2.id == ap.id) {
            return f;
          }
        } else if (f.p2 && ap) {
          if (f.p2.id == p.id && f.p1.id == ap.id) {
            return f;
          }
        } else if (f.p1.id == p.id) {
          return f;
        }
      }
    }
    return null;
  }

  /*
  Compute the lists of coparents and childsets for this person.
  This will be initialized only once.
  */
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
        this.makeFamilyTwoParent(p);
        this.childsets.push([]);
      }
      var j = this.coparents.indexOf(p);
      this.childsets[j].push(c);
    }
    for(var i=0; i<this.spouses.length; i++) {
      var s = this.spouses[i];
      if (!s) continue;
      if (this.coparents.indexOf(s) == -1) {
        this.coparents.push(s);
        this.makeFamilyTwoParent(s);
        this.childsets.push([]);
      }
    }
  }

  /*
  get the child sets for this person as an array.
  */
  this.getChildSets = function() {
    this.makeChildSets();
    return this.childsets;
  }

  /*
  get the coparents for this person as an array.
  */
  this.getCoparents = function() {
    this.makeChildSets();
    return this.coparents;
  }

  /*
  Get the childset between this person and another parent.
  */
  this.getChildSet = function(coparent) {
    this.makeChildSets();
    var i = this.coparents.indexOf(coparent);
    if (i > -1) {
      return this.childsets[i];
    }
    return [];
  }

  /*
  Get the list of coparents excluding the coparent in focus.
  */
  this.getAltParents = function(coparent) {
    this.makeChildSets();
    var arr = [];
    for(var i=0; i<this.coparents.length; i++) {
      if (this.coparents[i] != coparent) {
        arr.push(this.coparents[i]);
      }
    }
    return arr;
  }

  /*
  Get the gender character for this person
  */
  this.setGender = function(gender) {
    if (this.isGenderUnknown()) {
      if (gender == "M" || gender == "Male") {
        this.gender = "♂";
      } else if (gender == "F" || gender == "Female") {
        this.gender = "♀";
      }
    }
  }

  /*
  this person is male (true/false)
  */
  this.isMale = function() {
    return this.gender == "♂";
  }

  /*
  this person is female (true/false)
  */
  this.isFemale = function() {
    return this.gender == "♀";
  }

  /*
  this person does not have a specified gender (true/false)
  */
  this.isGenderUnknown = function() {
    return this.gender == "?";
  }

  /*
  get birth year as an int or return 0
  */
  this.setBirthYear = function(d) {
    this.birth = $.isNumeric(d) ? Number(d) : 0;
  }

  /*
  get death year as an int or return 0
  */
  this.setDeathYear = function(d) {
    this.death = $.isNumeric(d) ? Number(d) : 0;
  }

  /*
  add an annotated relationship to this person.
  */
  this.addRelation = function(p, rel) {
    this.otherrel.push(new PersonRel(p, rel, false));
  }

  /*
  When printing gedcom, provide a unique id for each item
  */
  this.getGedcomId = function() {
    return "@I" + this.id + "@";
  }

  /*
  Assign a GEDCOM family for a single parent
  */
  this.makeFamilyOneParent = function() {
    var f = new Family(this, null);
    this.familyTree.Families.push(f);
    f.id = this.familyTree.Families.length;
    this.families.push(f);
    return f;
  }

  /*
  Assign a GEDCOM family for a 2 parent combination
  */
  this.makeFamilyTwoParent = function(p2) {
    if (p2 == null) {
      return this.makeFamilyOneParent();
    }
    for(var i=0; i<this.families.length; i++) {
      var f = this.families[i];
      if (f.p2) {
        if (f.p2.id == p2.id || f.p1.id == p2.id) {
          return f;
        }
      }
    }
    var f = new Family(this, p2);
    this.familyTree.Families.push(f);
    f.id = this.familyTree.Families.length;
    this.families.push(f);
    p2.families.push(f);
    return f;
  }
}

/*
Gedcom family id
*/
var Family = function(p1, p2) {
  this.id = -1;
  this.p1 = p1;
  this.p2 = p2;

  /*
  When printing gedcom, provide a unique id for each item
  */
  this.getGedcomId = function() {
    return "@F" + this.id + "@";
  }
}
