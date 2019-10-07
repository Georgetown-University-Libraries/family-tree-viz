/*
Helper Classes to draw 3 generations of a family tree.
This class assumes that all relationships can be rendered in the following
grid.

     Maternal     Maternal     Paternal     Paternal
     Grandmother  Grandfather  Grandmother  Grandfather
     (1,1.5)      (1,2.5)      (1,3.5)      (1,4.5)

             Birth                    Birth
             Mother                   Father
             (2,2)                    (2,4)

[Stepfathers]            Children              [Stepmothers]
[Adoptive Rel]    (sorted in birth order)     [Adoptive Rel]
(3,1)                     (3,3)               (3,5)
(4,1)                     (4,3)               (4,5)
(n,1)                     (n,3)               (n,5)

             Maternal                 Paternal
             Sibling                  Sibling
             (3,2)                    (3,4)
             (4,2)                    (4,4)
             (n,2)                    (n,4)
*/

/*
Shape Class - helper class to draw shapes that will contain labels.
Shapes can be connected with lines.

Draw a particular shape at table row r and table col c.
These values are indexed to start at 1.

The svgHelper class will determine the appropriate height and width for the shape.
The svgHelper class will compute the canvas coordinates for drawing the shape.

To simplify styling, the code was adapted from SVG rendering to positional placement
of HTML objects.
*/
var Shape = function(svgHelper, r, c) {
  this.svgHelper = svgHelper;
  this.r = r;
  this.c = c;
  this.cellWidth = 1;
  this.cellHeight = 1;

  /*
  Shape height
  */
  this.getHeight = function() {
    return this.cellHeight * this.svgHelper.getShapeHeight() + (this.cellHeight - 1) * this.svgHelper.getVGAP();
  }

  /*
  Shape width
  */
  this.getWidth = function() {
    return this.cellWidth * this.svgHelper.getShapeWidth() + (this.cellWidth - 1) * this.svgHelper.getHGAP();
  }

  /*
  Shape top coordinate
  */
  this.getTop = function() {
    return (this.r - 1) * (this.svgHelper.getShapeHeight() + this.svgHelper.getVGAP());
  }

  /*
  Shape bottom coordinate
  */
  this.getBottom = function() {
    return this.getTop() + this.getHeight();
  }


  /*
  Shape verical midpoint (for line drawing)
  */
  this.getMidVertical = function() {
    return this.getTop() + (.5 * this.getHeight());
  }

  /*
  Shape left coordinate
  */
  this.getLeft = function() {
    return (this.c - 1) * (this.svgHelper.getShapeWidth() + this.svgHelper.getHGAP()) + 2;
  }

  /*
  Shape horizontal midpoint (for line drawing)
  */
  this.getMidHorizontal = function() {
    return this.getLeft() + (.5 * this.getWidth());
  }

  /*
  Shape right coordinate
  */
  this.getRight = function() {
    return this.getLeft() + this.getWidth();
  }

  /*
  Set text box height
  */
  this.setCellHeight = function(x) {
    this.cellHeight = x;
  }

  /*
  Set text box width
  */
  this.setCellWidth = function(x) {
    this.cellWidth = x;
  }

  /*
  Abstract draw method
  */
  this.draw = function() {
  }

  /*
  Abstract text draw method
  */
  this.drawText = function() {
  }
}

/*
Draw a Rectangle containing up to 3 lines of text
*/
var Box = function(svgHelper, r, c) {
  Shape.call(this, svgHelper, r, c);

  this.draw = function(bclass){
    return this.drawBoxOffset(bclass, 0, 0, 0, 0);
  }

  this.drawBoxOffset = function(bclass, yoff, xoff, yadd, xadd){
    var y = this.getTop();
    var x = this.getLeft();
    return this.svgHelper.makeSvgEl("rect")
      .attr("height", this.getHeight() + yadd)
      .attr("width", this.getWidth() + xadd)
      .attr("x", x + xoff)
      .attr("y", y + yoff)
      .addClass(bclass);
  }
}

/*
SvgHelper for drawing a grid of family tree shapes with a known size.
*/
var SvgHelper = function(base, viewBox) {
  this.minx = 0;
  this.miny = 0;
  this.SVG = jQuery("#family-tree");
  this.height = this.SVG.height();
  this.width = this.SVG.width();
  this.BASEURL = base;
  this.tabindex = 0;
  this.addTabIndex = false;
  this.makeSvgEl = function(tag) {
    return jQuery(document.createElementNS('http://www.w3.org/2000/svg', tag));
  }

  /*
  Control the overall shape of the visualization
  */
  this.getViewWidth = function() {return this.width;}
  this.getViewHeight = function() {return this.height;}
  this.getShapeHeight = function() {return 50;}
  this.getHGAP = function() {return 40;}
  this.getVGAP = function() {return 32;}

  /*
  Number of columns in the family tree visualization.
  If this changes, the placement of relatives will need to change.
  */
  this.getVizCols = function() {return 5;}

  /*
  Number of lines of text within a shape object.
  */
  this.getLines = function() {return 3;}

  /*
  Computed shapre size values
  */
  this.getShapeWidth = function() {
    return (this.getViewWidth() - this.getVizCols() * this.getHGAP())/this.getVizCols();
  }

  /*
  Control the CSS assigned to shape objects
  */
  this.getClassBox = function() {return "draw";}
  this.getClassWrapBox = function() {return "wrap";}
  this.getTextClass = function() {return "text";}
  this.getFoucsTextClass = function() {return "focustext";}
  this.getLinkTextClass = function() {return "link";}

  /*
  Draw a family tree box for a person at a specific table row and column.
  */
  this.drawBox = function(r, c, person, classbox) {
    var self = this;
    var box = new Box(this, r, c);
    var hbox = jQuery("<div/>")
      .attr("tabindex", "0")
      .attr("aria-label", "Focus the family tree on " + person.name)
      .attr("aria-role", "button")
      .appendTo(this.SVG)
      .addClass(classbox)
      .addClass("draw")
      .css("width", box.getWidth())
      .css("height", box.getHeight())
      .css("left", box.getLeft())
      .css("top", box.getTop());

    var lines = person.getName();
    var text = "";
    var p = jQuery("<p/>").appendTo(hbox);
    for(var i = 0; i<lines.length && i<this.getLines(); i++) {
      jQuery("<span/>")
        .addClass("line"+(i+1))
        .append(lines[i])
        .appendTo(p);
      p.append(jQuery("<br/>"));
    }
    this.appendDetailLink(person, p, lines.length+1);
    hbox
      .on("click", function(){
        initDiagram(familyTree.BASEURL, person, null);
      })
      .on("keydown", function(e){
        if (e.which == 13 || e.which == 32) {
          $(this).click();
        }
      });

    return box;
  }

  this.appendDetailLink = function(person, p, linec) {
    var self = this;
    var link = person.link;
    link = link == null ? "" : link;
    if (link != "" && link != "nolink") {
      var span = jQuery("<span/>")
        .addClass("line"+linec)
        .appendTo(p);
      jQuery("<a/>")
        .addClass(this.getLinkTextClass())
        .text("Details page ")
        .attr("aria-label", "Details page for " + person.name)
        .attr("href", (self.BASEURL == "") ? "" : self.BASEURL + link)
        .appendTo(span);
    }
  }

  /*
  Draw a family tree box for a relationship between 2 people at a specific table row and column.
  "Coparent" relationships are a visualization of the relationships for person and copar.
  Coparent relationships will contain a unique hash code that references both persons.
  */
  this.drawAnnotatedBox = function(r, c, person, copar, label, isCopar) {
    var self = this;
    var box = new Box(this, r, c);
    var labelname = person.name + (isCopar ? " and " + copar.name : "");
    var hbox = jQuery("<div/>")
      .attr("tabindex", "0")
      .attr("aria-label", "Focus the family tree on " + labelname)
      .attr("aria-role", "button")
      .appendTo(this.SVG)
      .addClass("dotdraw draw")
      .css("width", box.getWidth())
      .css("height", box.getHeight() + 18)
      .css("left", box.getLeft())
      .css("top", box.getTop());
    var nlines = copar ? copar.getName() : ["Undefined", ""];
    var lines = [];
    if (label != "" && label != null) {
      lines.push("<span class='label'>" + label + ": </span>");
    }
    for(var i=0; i<nlines.length; i++) {
      lines.push(nlines[i]);
    }
    var text = "";
    var p = jQuery("<p/>").appendTo(hbox);
    for(var i = 0; i<lines.length && i<this.getLines(); i++) {
      jQuery("<span/>")
        .addClass("line"+(i+1))
        .append(lines[i])
        .appendTo(p);
      p.append(jQuery("<br/>"));
    }
    if (copar) {
      this.appendDetailLink(copar, p, lines.length+1);
    }
    hbox.children()
      .on("click", function(){
        if (isCopar) {
          initDiagram(familyTree.BASEURL, person, copar);
        } else {
          initDiagram(familyTree.BASEURL, person, null);
        }
      })
      .on("keydown", function(e){
        if (e.which == 13 || e.which == 32) {
          $(this).click();
        }
      })
    return box;
  }

  /*
  Draw a shaeded box around a collection of other boxes drawn on the diagram.
  */
  this.drawWrapBox = function(r, c, rh, cw) {
    var box = new Box(this, r, c);
    box.setCellHeight(rh);
    box.setCellWidth(cw);
    var hbox = jQuery("<div/>").appendTo(this.SVG);
    hbox.addClass("wrap")
        .css("width", box.getWidth() + .5 * this.getHGAP() + 4)
        .css("height", box.getHeight() + .5 * this.getVGAP() + 4)
        .css("left", box.getLeft() -.25 * this.getHGAP())
        .css("top", box.getTop() -.25 * this.getVGAP());
    return hbox;
  }

  /*
  Connect the botton of b1 to the top of b2 using lines at 90 degree angles.
    b.1
     |
     +---+
         |
        b.2
  */
  this.connect = function(b1, b2) {
    var y1 = b1.getBottom();
    var x1 = b1.getMidHorizontal()
    var y2 = b2.getTop();
    var x2 = b2.getMidHorizontal()
    var yy = (y1 + y2) / 2;
    var xx = (x1 + x2) / 2;

    jQuery("<div/>")
      .addClass("line vert")
      .appendTo(this.SVG)
      .css("left", x1)
      .css("top", y1)
      .css("height", yy-y1)
      .css("width", 0);

    jQuery("<div/>")
      .addClass("line vert")
      .appendTo(this.SVG)
      .css("left", x2)
      .css("top", yy)
      .css("height", y2-yy)
      .css("width", 0);

    jQuery("<div/>")
      .addClass("line horiz")
      .appendTo(this.SVG)
      .css("left", x1 < x2 ? x1 : x2)
      .css("top", yy)
      .css("width", x1 < x2 ? x2-x1 : x1-x2)
      .css("height", 0);
  }

  /*
  Connect the left side of b1 to the top of b2 using lines at 90 degree angles.

            +---b.1
            |
           b.2
  */
  this.lconnect = function(b1, b2) {
    var y1 = b1.getMidVertical()
    var x1 = b1.getLeft()
    var y2 = b2.getTop();
    var x2 = b2.getMidHorizontal()
    jQuery("<div/>")
      .addClass("line horiz")
      .appendTo(this.SVG)
      .css("left", x2)
      .css("top", y1)
      .css("width", x1-x2)
      .css("height", 0);
    jQuery("<div/>")
      .addClass("line vert")
      .appendTo(this.SVG)
      .css("left", x2)
      .css("top", y1)
      .css("height", y2-y1)
      .css("width", 0);
  }

  /*
  Connect the right side of b1 to the top of b2 using lines at 90 degree angles.

      b.1---+
            |
           b.2
  */
  this.rconnect = function(b1, b2) {
    var y1 = b1.getMidVertical()
    var x1 = b1.getRight()
    var y2 = b2.getTop();
    var x2 = b2.getMidHorizontal()
    jQuery("<div/>")
      .addClass("line horiz")
      .appendTo(this.SVG)
      .css("left", x1)
      .css("top", y1)
      .css("width", x2-x1)
      .css("height", 0);
    jQuery("<div/>")
      .addClass("line vert")
      .appendTo(this.SVG)
      .css("left", x2)
      .css("top", y1)
      .css("height", y2-y1)
      .css("width", 0);
  }

  /*
  Connect the left side of b1 to the right side of b2.

    b.2--+
         |
         +--b.1

  */
  this.lsideconnect = function(b1, b2) {
    var y1 = b1.getMidVertical()
    var x1 = b1.getLeft()
    var y2 = b2.getMidVertical();
    var x2 = b2.getRight()
    var xx = (x1 + x2) / 2;

    jQuery("<div/>")
      .addClass("line dothoriz")
      .appendTo(this.SVG)
      .css("left", xx)
      .css("top", y1)
      .css("width", x1-xx)
      .css("height", 0);

    jQuery("<div/>")
      .addClass("line dotvert")
      .appendTo(this.SVG)
      .css("left", xx)
      .css("top", y2)
      .css("height", y1-y2)
      .css("width", 0);

    jQuery("<div/>")
      .addClass("line dothoriz")
      .appendTo(this.SVG)
      .css("left", x2)
      .css("top", y2)
      .css("width", xx-x2)
      .css("height", 0);
  }

  /*
  Connect the right side of b1 to the left side of b2.

         +--b.2
         |
         |
    b.1--+

  */
  this.rsideconnect = function(b1, b2) {
    var y1 = b1.getMidVertical()
    var x1 = b1.getRight()
    var y2 = b2.getMidVertical();
    var x2 = b2.getLeft()
    var xx = (x1 + x2) / 2;

    jQuery("<div/>")
      .addClass("line dothoriz")
      .appendTo(this.SVG)
      .css("left", x1)
      .css("top", y1)
      .css("width", xx-x1)
      .css("height", 0);

    jQuery("<div/>")
      .addClass("line dotvert")
      .appendTo(this.SVG)
      .css("left", xx)
      .css("top", y2)
      .css("height", y1-y2)
      .css("width", 0);

    jQuery("<div/>")
      .addClass("line dothoriz")
      .appendTo(this.SVG)
      .css("left", xx)
      .css("top", y2)
      .css("width", x2-xx)
      .css("height", 0);
  }

}

/*
Build a 3 generation family visualization to display with a focus on the middle generation.

Assumption: display 0-4 grandparents at one time.
Assumption: display 1-2 parents at one time
  - other spouses / coparents will be displayed to the side
Assumption: display the birth children for the parents listed above
  - adoptive parent/child relationships will be displayed to the side

If the gender is unknown for a parent, the first parent will fall in the maternal column.
*/
var FamilyViz = function(base, node) {
  //jQuery node to use for SVG display
  this.node = node;

  //for use as css class
  this.first_col = 0;
  this.last_row = 0;

  //base location for link url
  this.BASEURL = base;
  //grandparent row
  this.rgp    = 1;
  //parent row - this is the focal point of the display
  this.rp     = 2;
  //top row for displaying children
  this.rchild = 3;

  //maternal grandmother col
  this.cmgm = 1.5;
  //maternal grandfather col
  this.cmgf = 2.5;
  //paternal grandmother col
  this.cpgm = 3.5;
  //paternal grandfather col
  this.cpgf = 4.5;
  //mother col
  this.cm = 2;
  //father col
  this.cf = 4;
  //children col
  this.cchild = 3;

  //maternal grandmother - Person object
  this.p_mgm;
  //maternal grandfather - Person object
  this.p_mgf;
  //paternal grandmother - Person object
  this.p_pgm;
  //paternal grandfather - Person object
  this.p_pgf;
  //mother - Person object
  this.p_m;
  //father - Person object
  this.p_f;
  //children of mother/father - Person object
  this.p_sib = [];
  //maternal siblings - Person object
  this.p_msib = [];
  //paternal siblings - Person object
  this.p_psib = [];
  //maternal relationships - PersonRel object
  this.p_m_alt = [];
  //paternal relationships - PersonRel object
  this.p_f_alt = [];

  this.setFirstCol = function(col) {
    if (this.first_col == 0 || col < this.first_col) {
      this.first_col = col;
    }
  }
  this.getFirstColClass = function() {
    return (this.first_col == 0) ? "" : ("first-col-" + this.first_col);
  }

  this.setLastRow = function(row) {
    if (row > this.last_row) {
      this.last_row = row;
    }
  }
  this.getLastRowClass = function() {
    return (this.last_row == 0) ? "" : ("last-row-" + this.last_row);
  }

  this.setMother = function(p) {
    this.p_m = p;
    this.setFirstCol(this.cm);
    return this;
  }
  this.setFather = function(p) {
    this.p_f = p;
    this.setFirstCol(this.cf);
    return this;
  }
  this.addChild = function(p) {
    this.p_sib.push(p);
    this.setFirstCol(this.cchild);
    return this;
  }
  this.addMaternalSibling = function(p) {
    this.p_msib.push(p);
    return this;
  }
  this.addPaternalSibling = function(p) {
    this.p_psib.push(p);
    return this;
  }
  this.setMaternalGM = function(p) {
    this.p_mgm = p;
    this.setFirstCol(this.cmgm);
    return this;
  }
  this.setMaternalGF = function(p) {
    this.p_mgf = p;
    this.setFirstCol(this.cmgf);
    return this;
  }
  this.setPaternalGM = function(p) {
    this.p_pgm = p;
    this.setFirstCol(this.cpgm);
    return this;
  }
  this.setPaternalGF = function(p) {
    this.p_pgf = p;
    this.setFirstCol(this.cpgf);
    return this;
  }

  this.addMaternalAlt = function(prel) {
    this.p_m_alt.push(prel);
    return this;
  }

  this.addPaternalAlt = function(prel) {
    this.p_f_alt.push(prel);
    return this;
  }

  /*
  Populate the 3 generations for person fperson using one coparent relationship

  If fcopar is specified, a specific coparent relationship will be displayed.
  */
  this.initDiagram = function(fperson, fcopar){
    if (!fperson) return false;

    var childsets = fperson.getChildSets();
    var copars = fperson.coparents;

    var children = fcopar ? fperson.getChildSet(fcopar) : childsets[0];
    if (children == null) {
      children = [];
    }

    chilren = children.sort(peopleSort);

    var mom = null;
    var dad = null;
    if (fcopar == null) {
      if (fperson.isMale()) {
        dad = fperson;
        if (copars.length > 0) {
          mom = copars[0];
        }
      } else {
        mom = fperson;
        if (copars.length > 0) {
          dad = copars[0];
        }
      }
    } else if (fperson.isGenderUnknown() && fcopar.isGenderUnknown()) {
      mom = fperson;
      dad = fcopar;
    } else if (fperson.isFemale()) {
      mom = fperson;
      dad = fcopar;
    } else if (fperson.isMale()) {
      mom = fcopar;
      dad = fperson;
    } else if (fcopar.isFemale()) {
      mom = fcopar;
      dad = fperson;
    } else {
      mom = fperson;
      dad = fcopar;
    }

    if (children.length > 0) {
      for(var i=0; i<children.length; i++) {
        this.addChild(children[i]);
      }
    }
    if (mom != null) {
      this.setMother(mom);
      var msibs = mom.getSiblings().sort(peopleSort);
      for(var i=0; i<msibs.length; i++) {
        this.addMaternalSibling(msibs[i]);
      }
      if (mom.getMom()) {
        this.setMaternalGM(mom.getMom());
      }
      if (mom.getDad()) {
        this.setMaternalGF(mom.getDad());
      }
      var pars = mom.getAltParents(dad).sort(peopleSort);;
      for(var i=0; i<pars.length; i++) {
        this.addMaternalAlt(new PersonRel(pars[i], "Spouse/Coparent", true));
        this.setFirstCol(this.cm - 1);
      }
      for(var i=0; i<mom.otherrel.length; i++) {
        this.addMaternalAlt(mom.otherrel[i]);
        this.setFirstCol(this.cm - 1);
      }
    }
    if (dad) {
      this.setFather(dad);
      var psibs = dad.getSiblings().sort(peopleSort);
      for(var i=0; i<psibs.length; i++) {
        this.addPaternalSibling(psibs[i]);
      }
      if (dad.getMom()) {
        this.setPaternalGM(dad.getMom());
      }
      if (dad.getDad()) {
        this.setPaternalGF(dad.getDad());
      }
      var pars = dad.getAltParents(mom).sort(peopleSort);
      for(var i=0; i<pars.length; i++) {
        this.addPaternalAlt(new PersonRel(pars[i], "Spouse/Coparent", true));
        this.setFirstCol(this.cf + 1);
      }
      for(var i=0; i<dad.otherrel.length; i++) {
        this.addPaternalAlt(dad.otherrel[i]);
        this.setFirstCol(this.cf + 1);
      }
    }
    return true;
  }

  /*
  Draw the 3 generations of the family tree
  */
  this.draw = function(person) {
    this.node.empty("*");
    var viewBox = this.node.attr("viewBox");
    var svgHelp = new SvgHelper(this.BASEURL, viewBox);

    var focus = null;
    if (this.p_sib.length > 0) {
      focus = new Box(svgHelp, this.rchild, this.cchild);
    }
    var m = null;
    var f = null;

    if (this.p_m) {
      m = new Box(svgHelp, this.rp, this.cm);
      if (this.p_mgm) {
        var mgp = svgHelp.drawBox(this.rgp, this.cmgm, this.p_mgm);
        svgHelp.connect(mgp, m);
      }
      if (this.p_mgf) {
        var mgp = svgHelp.drawBox(this.rgp, this.cmgf, this.p_mgf);
        svgHelp.connect(mgp, m);
      }
      svgHelp.drawWrapBox(this.rp, this.cm, 1 + this.p_msib.length, 1);
      var cname = "drawfocus" + (person == this.p_m ? " treefocus" : "primarycoparent");
      svgHelp.drawBox(this.rp, this.cm, this.p_m, cname);
      this.setLastRow(this.rp);
      for(var i=0; i < this.p_msib.length; i++) {
        svgHelp.drawBox(this.rp + i + 1, this.cm, this.p_msib[i]);
        this.setLastRow(this.rp + i + 1);
      }
      if (focus) {
        svgHelp.rconnect(m, focus);
      }
    }

    if (this.p_f) {
      f = new Box(svgHelp, this.rp, this.cf);
      if (this.p_pgm) {
        var pgp = svgHelp.drawBox(this.rgp, this.cpgm, this.p_pgm);
        svgHelp.connect(pgp, f);
      }
      if (this.p_pgf) {
        var pgp = svgHelp.drawBox(this.rgp, this.cpgf, this.p_pgf);
        svgHelp.connect(pgp, f);
      }
      svgHelp.drawWrapBox(this.rp, this.cf, 1 + this.p_psib.length, 1);
      var cname = "drawfocus" + (person == this.p_f ? " treefocus" : "primarycoparent");
      svgHelp.drawBox(this.rp, this.cf, this.p_f, cname);
      this.setLastRow(this.rp);
      for(var i=0; i < this.p_psib.length; i++) {
        svgHelp.drawBox(this.rp + i + 1, this.cf, this.p_psib[i]);
        this.setLastRow(this.rp + i + 1);
      }
      if (focus) {
        svgHelp.lconnect(f, focus);
      } else if (m) {
        svgHelp.lsideconnect(f, m);
      }
    }

    if (this.p_sib.length > 0) {
      svgHelp.drawWrapBox(this.rchild, this.cchild, this.p_sib.length, 1);
      focus = svgHelp.drawBox(this.rchild , this.cchild, this.p_sib[0]);
      this.setLastRow(this.rchild);
      for(var i=1; i < this.p_sib.length; i++) {
        svgHelp.drawBox(this.rchild + i, this.cchild, this.p_sib[i]);
        this.setLastRow(this.rchild + i);
      }
    }

    if (this.p_m) {
      for(var i=0; i< this.p_m_alt.length; i++) {
        var prel = this.p_m_alt[i];
        var altp = svgHelp.drawAnnotatedBox(this.rp+i, this.cm-1, this.p_m, prel.p,
          prel.rel, prel.isCopar);
        this.setLastRow(this.rp + i);
        svgHelp.rsideconnect(altp, m);
      }
    }

    if (this.p_f) {
      for(var i=0; i< this.p_f_alt.length; i++) {
        var prel = this.p_f_alt[i];
        var altp = svgHelp.drawAnnotatedBox(this.rp+i, this.cf+1, this.p_f, prel.p,
            prel.rel, prel.isCopar);
        this.setLastRow(this.rp + i);
        svgHelp.lsideconnect(altp, f);
      }
    }

    svgHelp.SVG
      .removeClass("first-col-1 first-col-1.5 first-col-2 first-col-2.5 first-col-3 first-col-3.5 first-col-4 first-col-4.5 first-col-5")
      .addClass(this.getFirstColClass());
    svgHelp.SVG
      .removeClass("last-row-1 last-row-2 last-row-3 last-row-4 last-row-5 last-row-6 last-row-7 last-row-8 last-row-9 last-row-10")
      .removeClass("last-row-11 last-row-12 last-row-13 last-row-14 last-row-15 last-row-16 last-row-17 last-row-18 last-row-19 last-row-20")
      .addClass(this.getLastRowClass());
  }
}
