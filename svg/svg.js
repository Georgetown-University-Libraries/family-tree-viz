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
  Set text box x coordinate
  */
  this.getTextX = function() {
    return this.getLeft() + this.svgHelper.getTextOffset();
  }

  /*
  Set text box y coordinate
  */
  this.getTextY = function() {
    return this.getBottom() - this.svgHelper.getTextOffset();
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

  /*
  Draw a line of text
  */
  this.drawText = function(label, tclass, line) {
    var shape = this.svgHelper.makeSvgEl("text")
      .attr("height", (this.getHeight() - 2 * this.svgHelper.getLineOffset()) / this.svgHelper.getLines())
      .attr("width", this.getWidth())
      .attr("x", this.getTextX())
      .attr("y", this.getTextY() - this.getHeight() + line * ((this.getHeight() - 2 * this.svgHelper.getLineOffset()) / this.svgHelper.getLines()) + this.svgHelper.getLineOffset())
      .text(label)
      .addClass(tclass ? tclass : this.svgHelper.getTextClass());
    if (this.svgHelper.addTabIndex) {
      shape
        .attr("tabindex", this.svgHelper.tabindex++);
    }
    return shape;
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
Draw an Ellipse containing up to 3 lines of text
*/
var Ellipse = function(svgHelper, r, c) {
  Shape.call(this, svgHelper, r, c);

  this.draw = function(bclass){
    var y = this.getTop() + this.getHeight() / 2;
    var x = this.getLeft() + this.getWidth() / 2;
    return this.svgHelper.makeSvgEl("ellipse")
      .attr("ry", this.getHeight() / 2)
      .attr("rx", this.getWidth() / 2)
      .attr("cx", x)
      .attr("cy", y)
      .addClass("draw");
  }

  this.getTextX = function() {
    return this.getLeft() + .25 * this.getWidth();
  }
  this.getTextY = function() {
    return this.getBottom() + 0 * this.getHeight();
  }

}

/*
var Circle = function(svgHelper, r, c) {
  Shape.call(this, svgHelper, r, c);

  this.getWidth = function() {
    return this.getHeight();
  }

  this.draw = function(bclass){
    var y = this.getTop() + this.getHeight() / 2;
    var x = this.getLeft() + this.getHeight() / 2;
    return this.svgHelper.makeSvgEl("circle")
      .attr("r", this.getHeight() / 2)
      .attr("cx", x)
      .attr("cy", y)
      .addClass("draw");
  }

  this.getTextX = function() {
    return this.getLeft() + this.svgHelper.getTextOffset();
  }

  this.getTextY = function() {
    return this.getMidVertical();
  }

  this.drawText = function(label, pos) {
    var y = this.getTextY() + (this.getHeight() * (.25 * pos));
    var shape = this.svgHelper.makeSvgEl("text")
      .attr("height", this.getHeight() * .25)
      .attr("width", this.getHeight())
      .attr("x", this.getTextX())
      .attr("y", y)
      .text(label)
      .addClass("circletext");
    if (this.svgHelper.addTabIndex) {
      shape
        .attr("tabindex", this.svgHelper.tabindex++);
    }
    return shape;
  }
}
*/

/*
SvgHelper for drawing a grid of family tree shapes with a known size.
*/
var SvgHelper = function(base, viewBox) {
  this.setViewBox = function(viewBox) {
    var attr = viewBox.split("[ ,]");
    if (attr.length == 4) {
      this.minx   = attr[0];
      this.miny   = attr[1];
      this.width  = attr[2];
      this.height = attr[3];
    }
  }
  this.minx = 0;
  this.miny = 0;
  this.height = 1200;
  this.width = 1200;
  this.setViewBox(viewBox);
  this.BASEURL = base;
  this.SVG = jQuery("#svg");
  this.tabindex = 0;
  this.addTabIndex = false;
  this.makeSvgEl = function(tag) {
    return jQuery(document.createElementNS('http://www.w3.org/2000/svg', tag));
  }

  /*
  Control the overall shape of the visualization
  */
  this.getViewWidth = function() {return this.height;}
  this.getViewHeight = function() {return this.width;}
  this.getShapeHeight = function() {return 50;}
  this.getHGAP = function() {return 40;}
  this.getVGAP = function() {return 32;}

  /*
  Pixel refinements to shape placement
  */
  this.getLineOffset =  function() {return 2;}
  this.getTextOffset =  function() {return 5;}

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
    var g = this.makeSvgEl("g").appendTo(this.SVG);
    var box = new Box(this, r, c);
    var sbox = box.draw(classbox ? classbox: this.getClassBox())
      .appendTo(g);
    var tclass = classbox == "drawfocus" ? this.getFoucsTextClass() : this.getTextClass();
    var lines = person.getName();
    for(var i = 0; i<lines.length && i<this.getLines(); i++) {
      box.drawText(lines[i], tclass, i+1)
        .appendTo(g);
    }
    g.children().on("click", function(){
      initDiagram(familyTree.BASEURL, person, null);
    });
    var link = person.link;
    link = link == null ? "" : link;
    if (link != "" && link != "nolink") {
      var linktext = box.drawText("Details page ", this.getLinkTextClass(), this.getLines()).appendTo(g);
      linktext.on("click",function(){
        location = (self.BASEURL == "") ? "" : self.BASEURL + link;
      });
    }
    return box;
  }

  /*
  Draw a family tree box for a relationship between 2 people at a specific table row and column.
  "Coparent" relationships are a visualization of the relationships for person and copar.
  Coparent relationships will contain a unique hash code that references both persons.
  */
  this.drawEllipse = function(r, c, person, copar, label, isCopar) {
    var g = this.makeSvgEl("g").appendTo(this.SVG);
    var ellipse = new Ellipse(this, r, c);
    var sellipse = ellipse.draw()
      .appendTo(g);
    ellipse.drawText(label, this.getTextClass(), 1)
      .appendTo(g);
    var lines = copar ? copar.getName() : ["Undefined", ""];
    ellipse.drawText(lines[0], this.getTextClass(), 2)
      .appendTo(g);
    g.children().on("click", function(){
      if (isCopar) {
        initDiagram(familyTree.BASEURL, person, copar);
      } else {
        initDiagram(familyTree.BASEURL, person, null);
      }
    });
    return ellipse;
  }

  /*
  Draw a shaeded box around a collection of other boxes drawn on the diagram.
  */
  this.drawWrapBox = function(r, c, rh, cw) {
    var box = new Box(this, r, c);
    box.setCellHeight(rh);
    box.setCellWidth(cw);
    box.drawBoxOffset(this.getClassWrapBox(), -.25 * this.getVGAP(), -.25 * this.getHGAP(), .5 * this.getVGAP(), .5 * this.getHGAP())
      .appendTo(this.SVG);
    return box;
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
    this.makeSvgEl("line")
      .attr("x1", x1)
      .attr("y1", y1)
      .attr("x2", x1)
      .attr("y2", yy)
      .addClass("draw")
      .appendTo(this.SVG);

    this.makeSvgEl("line")
      .attr("x1", x1)
      .attr("y1", yy)
      .attr("x2", x2)
      .attr("y2", yy)
      .addClass("draw")
      .appendTo(this.SVG);

    this.makeSvgEl("line")
      .attr("x1", x2)
      .attr("y1", yy)
      .attr("x2", x2)
      .attr("y2", y2)
      .addClass("draw")
      .appendTo(this.SVG);
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
    this.makeSvgEl("line")
      .attr("x1", x1)
      .attr("y1", y1)
      .attr("x2", x2)
      .attr("y2", y1)
      .addClass("draw")
      .appendTo(this.SVG);

    this.makeSvgEl("line")
      .attr("x1", x2)
      .attr("y1", y1)
      .attr("x2", x2)
      .attr("y2", y2)
      .addClass("draw")
      .appendTo(this.SVG);
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
    this.makeSvgEl("line")
      .attr("x1", x1)
      .attr("y1", y1)
      .attr("x2", x2)
      .attr("y2", y1)
      .addClass("draw")
      .appendTo(this.SVG);

    this.makeSvgEl("line")
      .attr("x1", x2)
      .attr("y1", y1)
      .attr("x2", x2)
      .attr("y2", y2)
      .addClass("draw")
      .appendTo(this.SVG);
  }

  /*
  Connect the left side of b1 to the right side of b2.

            +b.1
          /
        /
    b.2+

  */
  this.lsideconnect = function(b1, b2) {
    var y1 = b1.getMidVertical()
    var x1 = b1.getLeft()
    var y2 = b2.getMidVertical();
    var x2 = b2.getRight()
    this.makeSvgEl("line")
      .attr("x1", x1)
      .attr("y1", y1)
      .attr("x2", x2)
      .attr("y2", y2)
      .addClass("draw")
      .appendTo(this.SVG);
  }

  /*
  Connect the right side of b1 to the left side of b2.

    b.1+
        \
         \
          +b.2

  */
  this.rsideconnect = function(b1, b2) {
    var y1 = b1.getMidVertical()
    var x1 = b1.getRight()
    var y2 = b2.getMidVertical();
    var x2 = b2.getLeft()
    this.makeSvgEl("line")
      .attr("x1", x1)
      .attr("y1", y1)
      .attr("x2", x2)
      .attr("y2", y2)
      .addClass("draw")
      .appendTo(this.SVG);
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

  this.setMother = function(p) {
    this.p_m = p;
    return this;
  }
  this.setFather = function(p) {
    this.p_f = p;
    return this;
  }
  this.addChild = function(p) {
    this.p_sib.push(p);
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
    return this;
  }
  this.setMaternalGF = function(p) {
    this.p_mgf = p;
    return this;
  }
  this.setPaternalGM = function(p) {
    this.p_pgm = p;
    return this;
  }
  this.setPaternalGF = function(p) {
    this.p_pgf = p;
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
      }
      for(var i=0; i<mom.otherrel.length; i++) {
        this.addMaternalAlt(mom.otherrel[i]);
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
      }
      for(var i=0; i<dad.otherrel.length; i++) {
        this.addPaternalAlt(dad.otherrel[i]);
      }
    }
    return true;
  }

  /*
  Draw the 3 generations of the family tree
  */
  this.draw = function() {
    this.node.empty("*");
    var viewBox = this.node.attr("viewBox");
    var svgHelp = new SvgHelper(this.BASEURL, viewBox);

    var focus = null;
    if (this.p_sib.length > 0) {
      svgHelp.drawWrapBox(this.rchild, this.cchild, this.p_sib.length, 1);
      focus = svgHelp.drawBox(this.rchild , this.cchild, this.p_sib[0]);
      for(var i=1; i < this.p_sib.length; i++) {
        svgHelp.drawBox(this.rchild + i, this.cchild, this.p_sib[i]);
      }
    }

    var m = null;
    var f = null;
    if (this.p_m) {
      svgHelp.drawWrapBox(this.rp, this.cm, 1 + this.p_msib.length, 1);
      m = svgHelp.drawBox(this.rp, this.cm, this.p_m, "drawfocus");
      for(var i=0; i < this.p_msib.length; i++) {
        svgHelp.drawBox(this.rp + i + 1, this.cm, this.p_msib[i]);
      }
      if (focus) {
        svgHelp.rconnect(m, focus);
      }
      if (this.p_mgm) {
        var mgp = svgHelp.drawBox(this.rgp, this.cmgm, this.p_mgm);
        svgHelp.connect(mgp, m);
      }
      if (this.p_mgf) {
        var mgp = svgHelp.drawBox(this.rgp, this.cmgf, this.p_mgf);
        svgHelp.connect(mgp, m);
      }
      for(var i=0; i< this.p_m_alt.length; i++) {
        var prel = this.p_m_alt[i];
        var altp = svgHelp.drawEllipse(this.rp+i, this.cm-1, this.p_m, prel.p,
          prel.rel, prel.isCopar);
        svgHelp.rsideconnect(altp, m);
      }
    }

    if (this.p_f) {
      svgHelp.drawWrapBox(this.rp, this.cf, 1 + this.p_psib.length, 1);
      f = svgHelp.drawBox(this.rp, this.cf, this.p_f, "drawfocus");
      for(var i=0; i < this.p_psib.length; i++) {
        svgHelp.drawBox(this.rp + i + 1, this.cf, this.p_psib[i]);
      }
      if (focus) {
        svgHelp.lconnect(f, focus);
      } else if (m) {
        svgHelp.lsideconnect(f, m);
      }
      if (this.p_pgm) {
        var pgp = svgHelp.drawBox(this.rgp, this.cpgm, this.p_pgm);
        svgHelp.connect(pgp, f);
      }
      if (this.p_pgf) {
        var pgp = svgHelp.drawBox(this.rgp, this.cpgf, this.p_pgf);
        svgHelp.connect(pgp, f);
      }
      for(var i=0; i< this.p_f_alt.length; i++) {
        var prel = this.p_f_alt[i];
        var altp = svgHelp.drawEllipse(this.rp+i, this.cf+1, this.p_f, prel.p,
            prel.rel, prel.isCopar);
        svgHelp.lsideconnect(altp, f);
      }
    }
  }
}
