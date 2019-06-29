var WIDTH=100;
var HEIGHT=30;
var HGAP=10;
var VGAP=20;
var TOFF = 5;

var SVG;

function makeSvgEl(tag) {
  return $(document.createElementNS('http://www.w3.org/2000/svg', tag));
}

function drawBox(r, c, label) {
  var y = (r - 1) * (HEIGHT + VGAP);
  var x = (c - 1) * (WIDTH +  HGAP);
  var rect = makeSvgEl("rect")
    .attr("height", HEIGHT)
    .attr("width", WIDTH)
    .attr("x", x)
    .attr("y", y)
    .addClass("draw")
    .appendTo(SVG);

  makeSvgEl("text")
    .attr("height", HEIGHT)
    .attr("width", WIDTH)
    .attr("x", x + TOFF)
    .attr("y", y + HEIGHT - TOFF)
    .text(label)
    .addClass("text")
    .appendTo(SVG);
}

function connect(r1, c1, r2, c2) {
  var y1 = r1 * (HEIGHT + VGAP) - VGAP;
  var x1 = (c1 - .5) * (WIDTH + HGAP);
  makeSvgEl("line")
    .attr("x1", x1)
    .attr("y1", y1)
    .attr("x2", x1)
    .attr("y2", y1 + VGAP/2)
    .addClass("draw")
    .appendTo(SVG);
  var y2 = (r2 - 1) * (HEIGHT + VGAP);
  var x2 = (c2 - .5) * (WIDTH + HGAP);
  makeSvgEl("line")
    .attr("x1", x2)
    .attr("y1", y2 - VGAP/2)
    .attr("x2", x2)
    .attr("y2", y2)
    .addClass("draw")
    .appendTo(SVG);
  makeSvgEl("line")
    .attr("x1", x1)
    .attr("y1", y2 - VGAP/2)
    .attr("x2", x2)
    .attr("y2", y2 - VGAP/2)
    .addClass("draw")
    .appendTo(SVG);
}

$(document).ready(function(){
  SVG = $("#svg");
  drawBox(1, 1, "Maternal GM");
  drawBox(1, 2, "Maternal GF");
  drawBox(1, 4, "Paternal GM");
  drawBox(1, 5, "Paternal GF");
  drawBox(2, 1.5, "Mother");
  connect(1, 1, 2, 1.5);
  connect(1, 2, 2, 1.5);
  drawBox(2, 4.5, "Father");
  connect(1, 4, 2, 4.5);
  connect(1, 5, 2, 4.5);
  drawBox(3, 1.5, "Maternal Sib");
  drawBox(3, 4.5, "Paternal Sib");
  drawBox(3, 3, "Focus");
  connect(2, 1.5, 3, 3);
  connect(2, 4.5, 3, 3);
  drawBox(4, 3, "Sibling");
  drawBox(5, 3, "Sibling");
});
