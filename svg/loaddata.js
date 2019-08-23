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

var peopleSort = function(a, b){
  var x = a.birth - b.birth;
  x = (x == 0) ? a.id - b.id : x;
  return x;
}

function initDiagram(fperson, fcopar){
  if (!fperson) return false;
  var family = new FamilyViz();

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
      family.addChild(children[i]);
    }
  }
  if (mom != null) {
    family.setMother(mom);
    var msibs = mom.getSiblings().sort(peopleSort);
    for(var i=0; i<msibs.length; i++) {
      family.addMaternalSibling(msibs[i]);
    }
    if (mom.getMom()) {
      family.setMaternalGM(mom.getMom());
    }
    if (mom.getDad()) {
      family.setMaternalGF(mom.getDad());
    }
    var pars = mom.getAltParents(dad).sort(peopleSort);;
    for(var i=0; i<pars.length; i++) {
      family.addMaternalAlt(new PersonRel(pars[i], "Spouse/Coparent", true));
    }
    for(var i=0; i<mom.otherrel.length; i++) {
      family.addMaternalAlt(mom.otherrel[i]);
    }
  }
  if (dad) {
    family.setFather(dad);
    var psibs = dad.getSiblings().sort(peopleSort);
    for(var i=0; i<psibs.length; i++) {
      family.addPaternalSibling(psibs[i]);
    }
    if (dad.getMom()) {
      family.setPaternalGM(dad.getMom());
    }
    if (dad.getDad()) {
      family.setPaternalGF(dad.getDad());
    }
    var pars = dad.getAltParents(mom).sort(peopleSort);
    for(var i=0; i<pars.length; i++) {
      family.addPaternalAlt(new PersonRel(pars[i], "Spouse/Coparent", true));
    }
    for(var i=0; i<dad.otherrel.length; i++) {
      family.addPaternalAlt(dad.otherrel[i]);
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
