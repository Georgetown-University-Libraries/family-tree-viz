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
    var rect = this.svgHelper.makeSvgEl("rect")
      .attr("height", this.getHeight() + yadd)
      .attr("width", this.getWidth() + xadd)
      .attr("x", x + xoff)
      .attr("y", y + yoff)
      .addClass(bclass)
      .appendTo(this.svgHelper.SVG);
  }

  this.getTextX = function() {
    return this.getLeft() + this.svgHelper.TOFF;
  }

  this.getTextY = function() {
    return this.getBottom() - this.svgHelper.TOFF;
  }

  this.drawText = function(label) {
    this.svgHelper.makeSvgEl("text")
      .attr("height", this.getHeight())
      .attr("width", this.getWidth())
      .attr("x", this.getTextX())
      .attr("y", this.getTextY())
      .text(label)
      .addClass("text")
      .appendTo(this.svgHelper.SVG);
  }
}

var SvgHelper = function() {
  this.SVG = $("#svg");
  this.WIDTH=120;
  this.HEIGHT=40;
  this.HGAP=20;
  this.VGAP=24;
  this.TOFF = 5;
  this.makeSvgEl = function(tag) {
    return $(document.createElementNS('http://www.w3.org/2000/svg', tag));
  }
  this.classBox = "draw";
  this.classWrapBox = "wrap";

  this.drawBox = function(r, c, label) {
    var box = new Box(this, r, c);
    box.drawBox(this.classBox);
    box.drawText(label);
    return box;
  }

  this.drawWrapBox = function(r, c, rh, cw) {
    var box = new Box(this, r, c);
    box.setCellHeight(rh);
    box.setCellWidth(cw);
    box.drawBoxOffset(this.classWrapBox, -.25 * this.VGAP, -.5 * this.HGAP, this.VGAP, this.HGAP);
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

$(document).ready(function(){
  var rgp    = 1;
  var rp     = 2;
  var rfocus = 3;

  var cmgm = 1;
  var cmgf = 2;
  var cpgm = 4;
  var cpgf = 5;
  var cm = 1.5;
  var cf = 4.5;
  var cfocus = 3;

  var svgHelp = new SvgHelper();
  var mgm = svgHelp.drawBox(rgp, cmgm, "Maternal GM");
  var mgf = svgHelp.drawBox(rgp, cmgf, "Maternal GF");
  var pgm = svgHelp.drawBox(rgp, cpgm, "Paternal GM");
  var pgf = svgHelp.drawBox(rgp, cpgf, "Paternal GF");

  svgHelp.drawWrapBox(rp, cm, 2, 1);

  var m = svgHelp.drawBox(rp, cm, "Mother");
  svgHelp.connect(mgm, m);
  svgHelp.connect(mgf, m);

  svgHelp.drawWrapBox(rp, cf, 2, 1);

  var f = svgHelp.drawBox(rp, cf, "Father");
  svgHelp.connect(pgm, f);
  svgHelp.connect(pgf, f);

  svgHelp.drawBox(rfocus, cm, "Maternal Sib");
  svgHelp.drawBox(rfocus, cf, "Paternal Sib");

  svgHelp.drawWrapBox(rfocus, cfocus, 3, 1);
  var focus = svgHelp.drawBox(rfocus, cfocus, "Focus");
  svgHelp.rconnect(m, focus);
  svgHelp.lconnect(f, focus);

  svgHelp.drawBox(rfocus + 1, cfocus, "Sibling");
  svgHelp.drawBox(rfocus + 2, cfocus, "Sibling");
});
