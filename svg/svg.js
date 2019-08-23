var Shape = function(svgHelper, r, c) {
  this.svgHelper = svgHelper;
  this.r = r;
  this.c = c;
  this.cellWidth = 1;
  this.cellHeight = 1;

  this.getHeight = function() {
    return this.cellHeight * this.svgHelper.HEIGHT + (this.cellHeight - 1) * this.svgHelper.VGAP;
  }

  this.getWidth = function() {
    return this.cellWidth * this.svgHelper.WIDTH + (this.cellWidth - 1) * this.svgHelper.HGAP;
  }

  this.getTop = function() {
    return (this.r - 1) * (this.svgHelper.HEIGHT + this.svgHelper.VGAP);
  }

  this.getBottom = function() {
    return this.getTop() + this.getHeight();
  }

  this.getMidVertical = function() {
    return this.getTop() + (.5 * this.getHeight());
  }

  this.getLeft = function() {
    return (this.c - 1) * (this.svgHelper.WIDTH + this.svgHelper.HGAP) + 2;
  }

  this.getMidHorizontal = function() {
    return this.getLeft() + (.5 * this.getWidth());
  }

  this.getRight = function() {
    return this.getLeft() + this.getWidth();
  }

  this.setCellHeight = function(x) {
    this.cellHeight = x;
  }

  this.setCellWidth = function(x) {
    this.cellWidth = x;
  }

  this.getTextX = function() {
    return this.getLeft() + this.svgHelper.TOFF;
  }

  this.getTextY = function() {
    return this.getBottom() - this.svgHelper.TOFF;
  }

  this.draw = function() {
  }

  this.drawText = function() {
  }

  this.drawText = function(label, tclass, line) {
    var shape = this.svgHelper.makeSvgEl("text")
      .attr("height", (this.getHeight() - 2 * this.svgHelper.LINEOFF) / this.svgHelper.LINES)
      .attr("width", this.getWidth())
      .attr("x", this.getTextX())
      .attr("y", this.getTextY() - this.getHeight() + line * ((this.getHeight() - 2 * this.svgHelper.LINEOFF) / this.svgHelper.LINES) + this.svgHelper.LINEOFF)
      .text(label)
      .addClass(tclass ? tclass : "text");
    if (this.svgHelper.addTabIndex) {
      shape
        .attr("tabindex", this.svgHelper.tabindex++);
    }
    return shape;
  }
}

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
    return this.getLeft() + this.svgHelper.TOFF;
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

var SvgHelper = function() {
  this.VIEW_WIDTH=1200;
  this.VIEW_HEIGHT=1200;
  this.VIZ_COLS=5;
  this.LINES = 3;
  this.LINEOFF = 2;
  this.SVG = $("#svg");
  this.HGAP=40;
  this.VGAP=32;
  this.WIDTH=(this.VIEW_WIDTH - this.VIZ_COLS * this.HGAP)/this.VIZ_COLS;
  this.HEIGHT=50;
  this.TOFF = 5;
  this.tabindex = 0;
  this.addTabIndex = false;
  this.makeSvgEl = function(tag) {
    return $(document.createElementNS('http://www.w3.org/2000/svg', tag));
  }
  this.classBox = "draw";
  this.classWrapBox = "wrap";

  this.drawBox = function(r, c, person, classbox) {
    var g = this.makeSvgEl("g").appendTo(this.SVG);
    var box = new Box(this, r, c);
    var sbox = box.draw(classbox ? classbox: this.classBox)
      .appendTo(g);
    var tclass = classbox == "drawfocus" ? "focustext" : "text";
    box.drawText(person.getName(1), tclass, 1)
      .appendTo(g);
    box.drawText(person.getName(2), tclass, 2)
      .appendTo(g);
    g.children().on("click", function(){
      location.hash = person.id;
      location.reload();
    });
    var link = person.link;
    link = link == null ? "" : link;
    if (link != "" && link != "nolink") {
      var linktext = box.drawText("Details page ", "link", 3).appendTo(g);
      linktext.on("click",function(){
        location = "http://dev-gu-lit-smr.pantheonsite.io" + link;
      });
    }
    return box;
  }

  this.drawCircle = function(r, c, person, copar, label) {
    var g = this.makeSvgEl("g").appendTo(this.SVG);
    var circle = new Circle(this, r, c);
    var scircle = circle.draw()
      .appendTo(g);
    circle.drawText(label, 0)
      .appendTo(g);
    circle.drawText(copar ? copar.getName(1) : "Undefined", 1)
      .appendTo(g);
    g.children().on("click", function(){
      location.hash = person.id + (copar ? "-" + copar.id : "");
      location.reload();
    });
    return circle;
  }

  this.drawEllipse = function(r, c, person, copar, label, isCopar) {
    var g = this.makeSvgEl("g").appendTo(this.SVG);
    var ellipse = new Ellipse(this, r, c);
    var sellipse = ellipse.draw()
      .appendTo(g);
    ellipse.drawText(label, "text", 1)
      .appendTo(g);
    ellipse.drawText(copar ? copar.getName(1) : "Undefined", "text", 2)
      .appendTo(g);
    g.children().on("click", function(){
      if (isCopar) {
        location.hash = person.id + (copar ? "-" + copar.id : "");
      } else {
        location.hash = copar.id;
      }
      location.reload();
    });
    return ellipse;
  }

  this.drawWrapBox = function(r, c, rh, cw) {
    var box = new Box(this, r, c);
    box.setCellHeight(rh);
    box.setCellWidth(cw);
    box.drawBoxOffset(this.classWrapBox, -.25 * this.VGAP, -.25 * this.HGAP, .5 * this.VGAP, .5 * this.HGAP)
      .appendTo(this.SVG);
    return box;
  }

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

var FamilyViz = function() {
  this.rgp    = 1;
  this.rp     = 2;
  this.rchild = 3;

  this.cmgm = 1.5;
  this.cmgf = 2.5;
  this.cpgm = 3.5;
  this.cpgf = 4.5;
  this.cm = 2;
  this.cf = 4;
  this.cchild = 3;

  this.p_mgm;
  this.p_mgf;
  this.p_pgm;
  this.p_pgf;
  this.p_m;
  this.p_f;
  this.p_sib = [];
  this.p_msib = [];
  this.p_psib = [];
  this.p_m_alt = [];
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

  this.draw = function() {
    var svgHelp = new SvgHelper();

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
