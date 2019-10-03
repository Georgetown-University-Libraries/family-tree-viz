var familyTree;

/*
Initialize the family tree visualization
*/
window.onload = function () {
  init();
};

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
  var doc = "/sites/default/files/family-tree/data.json";
  doc = "../localdata/json.json";
  var node = jQuery("#svg");
  jQuery.get(doc, function(data){
    familyTree = new FamilyTree();
    familyTree.processDrupalInputData(data);

    var arr = jQuery("body").attr("class").split(" ");
    var rx = /^page-node-(\d+)$/;
    for(var i=0; i<arr.length; i++) {
      var m = arr[i].match(rx);
      if (m) {
        initDiagram(familyTree.BASEURL, familyTree.getPerson(m[1]), null);
        break;
      }
    }
  }, "json");
}

/*
Sort a list of siblings by birth year, otherwise by id
*/
var peopleSort = function(a, b){
  if (a == null || b == null) {
    return 0;
  }
  var x = a.birth - b.birth;
  x = (x == 0) ? a.id - b.id : x;
  return x;
}

/*
Render the visualization from the perspective of one parent.
If that parent had children with more than one other parent, then a specific coparent can be provided.
*/
function initDiagram(base, fperson, fcopar){
  var family = new FamilyViz(base, jQuery("#family-tree"));
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
  jQuery("#svg").hide();
  for(var i=0; i<familyTree.People.length; i++) {
    var per = familyTree.People[i];
    if (!per) continue;
    var n = jQuery("<tr/>");
    var n1 = jQuery("<td class='name'/>").appendTo(n);
    jQuery("<a/>").attr("href","#"+per.id).text(per.name).appendTo(n1).on("click",function(){
      location.hash=jQuery(this).attr("href");
      location.reload();
    });
    jQuery("<td class='id'/>").text(per.id).appendTo(n);
    jQuery("<td class='gender'/>").text(per.gender == "?" ? "" : per.gender).appendTo(n);
    jQuery("<td class='birth'/>").text(per.birth == 0 ? "" : per.birth).appendTo(n);
    jQuery("<td class='death'/>").text(per.death == 0 ? "" : per.death).appendTo(n);
    jQuery("<td class='numchild'/>").text(per.children.length).appendTo(n);
    jQuery("<td class='numparent'/>").text(per.parents.length).appendTo(n);
    jQuery("<td class='numspouse'/>").text(per.spouses.length).appendTo(n);
    jQuery("<td class='numother'/>").text(per.otherrel.length).appendTo(n);

    jQuery("#people").show();
    jQuery("#people tbody").append(n);
    sorttable.makeSortable(jQuery("#people")[0]);
  }
}
