function dofocus(cid) {
  location.hash = (cid) ? cid : "";
  location.reload();
}

var familyTree;
function init(){
  var params = (new URL(document.location)).searchParams;
  var doc = params.get("doc") ? params.get("doc") : "../data.csv";
  if (doc.match(/\.yml$/)) {
    $.get(doc, function(data){
      var json = jsyaml.load(data);
      var familyTree = new FamilyTree();
      familyTree.processJsonInputData(json);
      initDiagram(familyTree.getPersonFromHash());
    }, "text");
  } else if (doc.match(/\.json$/)) {
    $.get(doc, function(data){
      var familyTree = new FamilyTree();
      familyTree.processDrupalInputData(data);
      initDiagram(familyTree.getPersonFromHash());
    }, "json");
  } else {
    $.get(doc, function(data){
      var familyTree = new FamilyTree();
      familyTree.processCsvInputData(data);
      initDiagram(familyTree.getPersonFromHash());
    }, "text");
  }

}

function initDiagram(person){
  var family = new FamilyViz();
  family.setFocus(person);
  var mom = person.parents.length > 0 ? person.parents[0] : null;
  var dad = person.parents.length > 1 ? person.parents[1] : null;
  var sibs = person.getSiblings();
  for(var i=0; i<sibs.length; i++) {
    family.addSibling(sibs[i]);
  }
  if (mom) {
    family.setMother(mom);
    var msibs = mom.getSiblings();
    for(var i=0; i<msibs.length; i++) {
      family.addMaternalSibling(msibs[i]);
    }
    var pars = mom.parents;
    for(var i=0; i<pars.length; i++) {
      family.addMaternalGP(pars[i]);
    }
  }
  if (dad) {
    family.setFather(dad);
    var psibs = dad.getSiblings();
    for(var i=0; i<psibs.length; i++) {
      family.addPaternalSibling(psibs[i]);
    }
    var pars = dad.parents;
    for(var i=0; i<pars.length; i++) {
      family.addPaternalGP(pars[i]);
    }
  }
  family.draw();
  /*
  family
    .setFocus("Focus")
    .addSibling("Sibling 1")
    .addSibling("Sibling 2")
    .addSibling("Sibling 3")
    .addSibling("Sibling 4")
    .addSibling("Sibling 5")
    .setMother("Mother")
    .addMaternalSibling("M Sibling 1")
    .addMaternalSibling("M Sibling 2")
    .addMaternalSibling("M Sibling 3")
    .setFather("Father")
    .addPaternalSibling("P Sibling 1")
    .addPaternalSibling("P Sibling 2")
    .addMaternalGP("Maternal GM")
    .addMaternalGP("Maternal GF")
    .addPaternalGP("Paternal GM")
    .addPaternalGP("Paternal GF")
    .draw();
  */
}

$(document).ready(function(){
  init();
});
