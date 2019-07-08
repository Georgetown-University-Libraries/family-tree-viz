var familyTree;

function dofocus(cid) {
  location.hash = (cid) ? cid : "";
  location.reload();
}

$(document).ready(function(){
  init();
});

function init(){
  var params = (new URL(document.location)).searchParams;
  var doc = params.get("doc") ? params.get("doc") : "../data.csv";
  if (doc.match(/\.yml$/)) {
    $.get(doc, function(data){
      var json = jsyaml.load(data);
      var familyTree = new FamilyTree();
      familyTree.processJsonInputData(json);
      if (!initDiagram(familyTree.getPersonFromHash(), familyTree.getCoparentFromHash())) {
        showDirectory(familyTree);
      }
    }, "text");
  } else if (doc.match(/\.json$/)) {
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

function initDiagram(fperson, fcopar){
  if (!fperson) return false;
  var family = new FamilyViz();

  mom = fperson;
  dad = fcopar;

  var childsets = fperson.getChildSets();
  var copars = fperson.coparents;

  var children = fcopar ? fperson.getChildSet(fcopar) : childsets[0];

  if (children == null) {
    children = [];
  }

  if (children.length > 0) {
    for(var i=0; i<children.length; i++) {
      family.addChild(children[i]);
    }
    mom = children[0].parents.length > 0 ? children[0].parents[0] : null;
    dad = children[0].parents.length > 1 ? children[0].parents[1] : null;
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
      pars = mom.getAltParents(dad);
      for(var i=0; i<pars.length; i++) {
        family.addMaternalAltPar(pars[i]);
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
      pars = dad.getAltParents(mom);
      for(var i=0; i<pars.length; i++) {
        family.addPaternalAltPar(pars[i]);
      }
    }
  } else {
    family.setMother(mom);
    var msibs = mom.getSiblings();
    for(var i=0; i<msibs.length; i++) {
      family.addMaternalSibling(msibs[i]);
    }
    var pars = mom.parents;
    for(var i=0; i<pars.length; i++) {
      family.addMaternalGP(pars[i]);
    }
    pars = mom.getAltParents(dad);
    for(var i=0; i<pars.length; i++) {
      family.addMaternalAltPar(pars[i]);
    }

    if (dad) {
      family.setFather(dad);
      var msibs = dad.getSiblings();
      for(var i=0; i<msibs.length; i++) {
        family.addPaternalSibling(msibs[i]);
      }
      var pars = dad.parents;
      for(var i=0; i<pars.length; i++) {
        family.addPaternalGP(pars[i]);
      }
      pars = dad.getAltParents(mom);
      for(var i=0; i<pars.length; i++) {
        family.addPaternalAltPar(pars[i]);
      }
    }
  }
  family.draw();
  return true;
}

function showDirectory(familyTree) {
  $("#svg").hide();
  for(var i=0; i<familyTree.People.length; i++) {
    var per = familyTree.People[i];
    if (!per) continue;
    var n = $("<li/>");
    $("<a/>").attr("href","#"+per.id).text(per.name).appendTo(n).on("click",function(){
      location.hash=$(this).attr("href");
      location.reload();
    });
    $("#people").append(n);
  }
}
