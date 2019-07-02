var Box = function(svgHelper, r, c) {
  this.svgHelper = svgHelper;
  this.r = r;
  this.c = c;
  this.cellWidth = 1;
  this.cellHeight = 1;

  this.getTop = function() {
    return (this.r - 1) * (this.svgHelper.HEIGHT + this.svgHelper.VGAP);
  }

  this.getBottom = function() {
    return this.getTop() + this.svgHelper.HEIGHT;
  }

  this.getMidVertical = function() {
    return this.getTop() + (.5 * this.svgHelper.HEIGHT);
  }

  this.getLeft = function() {
    return (this.c - 1) * (this.svgHelper.WIDTH + this.svgHelper.HGAP);
  }

  this.getMidHorizontal = function() {
    return this.getLeft() + (.5 * this.svgHelper.WIDTH);
  }

  this.getRight = function() {
    return this.getLeft() + this.svgHelper.WIDTH;
  }

  this.setCellHeight = function(x) {
    this.cellHeight = x;
  }

  this.setCellWidth = function(x) {
    this.cellWidth = x;
  }

  this.getHeight = function() {
    return this.cellHeight * this.svgHelper.HEIGHT + (this.cellHeight - 1) * this.svgHelper.VGAP;
  }

  this.getWidth = function() {
    return this.cellWidth * this.svgHelper.WIDTH + (this.cellWidth - 1) * this.svgHelper.HGAP;
  }

  this.drawBox = function(bclass){
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

  this.getTextX = function() {
    return this.getLeft() + this.svgHelper.TOFF;
  }

  this.getTextY = function() {
    return this.getBottom() - this.svgHelper.TOFF;
  }

  this.drawText = function(label, tclass, line) {
    return this.svgHelper.makeSvgEl("text")
      .attr("height", (this.getHeight() - 2 * this.svgHelper.LINEOFF) / this.svgHelper.LINES)
      .attr("width", this.getWidth())
      .attr("x", this.getTextX())
      .attr("y", this.getTextY() - this.getHeight() + line * ((this.getHeight() - 2 * this.svgHelper.LINEOFF) / this.svgHelper.LINES) + this.svgHelper.LINEOFF)
      .text(label)
      .addClass(tclass ? tclass : "text");
  }
}

var SvgHelper = function() {
  this.LINES = 3;
  this.LINEOFF = 2;
  this.SVG = $("#svg");
  this.WIDTH=168;
  this.HEIGHT=50;
  this.HGAP=40;
  this.VGAP=32;
  this.TOFF = 5;
  this.makeSvgEl = function(tag) {
    return $(document.createElementNS('http://www.w3.org/2000/svg', tag));
  }
  this.classBox = "draw";
  this.classWrapBox = "wrap";

  this.drawBox = function(r, c, person, classbox) {
    var g = this.makeSvgEl("g").appendTo(this.SVG);
    var box = new Box(this, r, c);
    var sbox = box.drawBox(classbox ? classbox: this.classBox)
      .appendTo(g);
    var tclass = classbox == "drawfocus" ? "focustext" : "text";
    box.drawText(person.getName(1), tclass, 1)
      .appendTo(g);
    box.drawText(person.getName(2), tclass, 2)
      .appendTo(g);
    if (person.children.length > 0) {
      g.children().on("click", function(){
        if (sbox.hasClass("drawfocus")) {
          $(".draw, .text, .focus, .ftext, .wrap, .link").toggle();
        } else {
          location.hash = person.id;
          location.reload();
        }
      });
    } else {
      g.children().on("click", function(){
        location.hash = person.id;
        location.reload();
      });
    }
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

  this.drawFocusBox = function(r, c, person, arr) {
    var box = new Box(this, r, c);
    var g = this.makeSvgEl("g").appendTo(this.SVG);
    var sbox = box.drawBox("focus").appendTo(g);
    box.drawText(arr[0], "ftext", 1).appendTo(g);
    box.drawText(arr[1], "ftext", 2).appendTo(g);
    sbox.on("click", function(){
      location.hash = person.id;
      location.reload();
    });
    return box;
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
}

var FamilyViz = function() {
  this.rgp    = 1;
  this.rp     = 2;
  this.rfocus = 3;

  this.cmgm = 1;
  this.cmgf = 2;
  this.cpgm = 3;
  this.cpgf = 4;
  this.cm = 1.5;
  this.cf = 3.5;
  this.cfocus = 2.5;

  this.p_mgp = [];
  this.p_pgp = [];
  this.p_m;
  this.p_f;
  this.p_focus;
  this.p_sib = [];
  this.p_msib = [];
  this.p_psib = [];

  this.setFocus = function(p) {
    this.p_focus = p;
    return this;
  }
  this.setMother = function(p) {
    this.p_m = p;
    return this;
  }
  this.setFather = function(p) {
    this.p_f = p;
    return this;
  }
  this.addSibling = function(p) {
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
  this.addMaternalGP = function(p) {
    this.p_mgp.push(p);
    return this;
  }
  this.addPaternalGP = function(p) {
    this.p_pgp.push(p);
    return this;
  }

  this.draw = function() {
    var svgHelp = new SvgHelper();
    if (!this.p_focus) return;

    svgHelp.drawWrapBox(this.rfocus, this.cfocus, 1 + this.p_sib.length, 1);
    var focus = svgHelp.drawBox(this.rfocus, this.cfocus, this.p_focus, "drawfocus");

    for(var i=0; i < this.p_sib.length; i++) {
      svgHelp.drawBox(this.rfocus + i + 1, this.cfocus, this.p_sib[i]);
    }

    if (this.p_m) {
      svgHelp.drawWrapBox(this.rp, this.cm, 1 + this.p_msib.length, 1);
      var m = svgHelp.drawBox(this.rp, this.cm, this.p_m);
      for(var i=0; i < this.p_msib.length; i++) {
        svgHelp.drawBox(this.rp + i + 1, this.cm, this.p_msib[i]);
      }
      svgHelp.rconnect(m, focus);
      if (this.p_mgp.length > 0) {
        var mgp = svgHelp.drawBox(this.rgp, this.cmgm, this.p_mgp[0]);
        svgHelp.connect(mgp, m);
      }
      if (this.p_mgp.length > 1) {
        var mgp = svgHelp.drawBox(this.rgp, this.cmgf, this.p_mgp[1]);
        svgHelp.connect(mgp, m);
      }
    }

    if (this.p_f) {
      svgHelp.drawWrapBox(this.rp, this.cf, 1 + this.p_psib.length, 1);
      var f = svgHelp.drawBox(this.rp, this.cf, this.p_f);
      for(var i=0; i < this.p_psib.length; i++) {
        svgHelp.drawBox(this.rp + i + 1, this.cf, this.p_psib[i]);
      }
      svgHelp.lconnect(f, focus);
      if (this.p_pgp.length > 0) {
        var pgp = svgHelp.drawBox(this.rgp, this.cpgm, this.p_pgp[0]);
        svgHelp.connect(pgp, f);
      }
      if (this.p_pgp.length > 1) {
        var pgp = svgHelp.drawBox(this.rgp, this.cpgf, this.p_pgp[1]);
        svgHelp.connect(pgp, f);
      }
    }

    var childsets = this.p_focus.getChildSets();
    var coparents = this.p_focus.getCoparents();
    for (var i=0; i < coparents.length; i++) {
      var cop = coparents[i];
      var cs = childsets[i];
      var pre = cs.length == 1 ? "1 child with " : cs.length + " children with ";
      var name = cop ? cop.name : "Undefined";
      var pgp = svgHelp.drawFocusBox(this.rfocus + i + 1, this.cfocus, cs[0], [pre, name]);
    }
  }
}
