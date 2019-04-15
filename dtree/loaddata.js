var familyTree;
function ftinit(){
  var params = (new URL(document.location)).searchParams;

  if (!params.get("doc")) {
    return showDTree(getSampleData());
  }
  var doc = params.get("doc");
  if (doc.match(/\.yml$/)) {
    $.get(doc, function(data){
      var json = jsyaml.load(data);
      var familyTree = new FamilyTree();
      familyTree.processJsonInputData(json);
      return showDTree(familyTree.getJson());
    }, "text");
  } else {
    $.get(doc, function(data){
      var familyTree = new FamilyTree();
      familyTree.processCsvInputData(data);
      return showDTree(familyTree.getJson());
    }, "text");
  }

}
