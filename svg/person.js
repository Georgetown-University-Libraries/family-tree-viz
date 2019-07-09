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
  this.gender = "?";
  this.birth = 0;
  this.death = 0;

  this.getName = function(line) {
    if (line == 1) {
      var name = this.name;
      if (this.children.length > 0) {
        name += " (" + this.children.length + " ch.)";
      }
      return name;
    }
    var name = this.gender;
    if (this.birth == 0 && this.death == 0) {
      name += " (dates unknown)";
    } else {
      name += "(";
      name += this.birth == 0 ? "?" : this.birth;
      name += " - ";
      name += this.death == 0 ? "?" : this.death;
      name += ")";
    }
    return name;
  }

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

  this.getChildSet = function(coparent) {
    this.makeChildSets();
    var i = this.coparents.indexOf(coparent);
    if (i > -1) {
      return this.childsets[i];
    }
    return [];
  }

  this.childCountLabel = function(coparent) {
    var arr = this.getChildSet(coparent);
    if (arr.length == 1) {
      return "1 Child with ";
    }
    return arr.length + " Children with ";
  }

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
    for(var i=0; i<this.spouses.length; i++) {
      var s = this.spouses[i];
      if (!s) continue;
      if (this.coparents.indexOf(s) == -1) {
        this.coparents.push(s);
        this.childsets.push([]);
      }
    }
  }

  this.setGender = function(gender) {
    if (gender == "M") {
      this.gender = "♂";
    } else if (gender == "F") {
      this.gender = "♀";
    } else {
      this.gender = "?";
    }
  }

  this.isMale = function() {
    return this.gender == "♂";
  }

  this.isFemale = function() {
    return this.gender == "♀";
  }

  this.isGenderUnknown = function() {
    return this.gender == "?";
  }

  this.setBirthYear = function(d) {
    this.birth = $.isNumeric(d) ? Number(d) : 0;
  }

  this.setDeathYear = function(d) {
    this.death = $.isNumeric(d) ? Number(d) : 0;
  }
}
