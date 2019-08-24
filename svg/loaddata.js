var familyTree;

/*
Initialize the family tree visualization
*/
$(document).ready(function(){
  init();
});

/*
Change the focus of the visualization to a different person
*/
function dofocus(cid) {
  location.hash = (cid) ? cid : "";
  location.reload();
}

/*
Initialize the display using either a CSV file or a JSON file as input.
The CSV format is designed for easy manipulation and testing of the visualization.
The JSON format is designed to pull data feeds from a collection of Drupal views.
*/
function init(){
  var params = (new URL(document.location)).searchParams;
  var doc = params.get("doc") ? params.get("doc") : "../data.csv";
  if (doc.match(/\.json$/)) {
    $.get(doc, function(data){
      var familyTree = new FamilyTree();
      familyTree.processDrupalInputData(data);
      if (!initDiagram(familyTree.getPersonFromHash(), familyTree.getCoparentFromHash())) {
        showDirectory(familyTree);
      }
    }, "json");
  } else {
    $.get(doc, function(data){
      var familyTree = new FamilyTree();
      familyTree.processCsvInputData(data);
      if (!initDiagram(familyTree.getPersonFromHash(), familyTree.getCoparentFromHash())) {
        showDirectory(familyTree);
      }
    }, "text");
  }

}

/*
Sort a list of siblings by birth year, otherwise by id
*/
var peopleSort = function(a, b){
  var x = a.birth - b.birth;
  x = (x == 0) ? a.id - b.id : x;
  return x;
}

/*
Render the visualization from the perspective of one parent.
If that parent had children with more than one other parent, then a specific coparent can be provided.
*/
function initDiagram(fperson, fcopar){
  var family = new FamilyViz();
  if (family.initDiagram(fperson, fcopar)) {
    family.draw();
    return true;
  }
  return false;
}

/*
Enumerate all known people into a sortable table.

The numchild, numparent, numspouse, and numother columns are used to facilitate visualization
testing and to facilitate quality checks on the completeness of the family tree.
*/
function showDirectory(familyTree) {
  $("#svg").hide();
  for(var i=0; i<familyTree.People.length; i++) {
    var per = familyTree.People[i];
    if (!per) continue;
    var n = $("<tr/>");
    var n1 = $("<td class='name'/>").appendTo(n);
    $("<a/>").attr("href","#"+per.id).text(per.name).appendTo(n1).on("click",function(){
      location.hash=$(this).attr("href");
      location.reload();
    });
    $("<td class='id'/>").text(per.id).appendTo(n);
    $("<td class='gender'/>").text(per.gender == "?" ? "" : per.gender).appendTo(n);
    $("<td class='birth'/>").text(per.birth == 0 ? "" : per.birth).appendTo(n);
    $("<td class='death'/>").text(per.death == 0 ? "" : per.death).appendTo(n);
    $("<td class='numchild'/>").text(per.children.length).appendTo(n);
    $("<td class='numparent'/>").text(per.parents.length).appendTo(n);
    $("<td class='numspouse'/>").text(per.spouses.length).appendTo(n);
    $("<td class='numother'/>").text(per.otherrel.length).appendTo(n);

    $("#people").show();
    $("#people tbody").append(n);
    sorttable.makeSortable($("#people")[0]);
  }
}
