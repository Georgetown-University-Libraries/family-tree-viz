var labelType, useGradients, nativeTextSupport, animate;

(function() {
  var ua = navigator.userAgent,
      iStuff = ua.match(/iPhone/i) || ua.match(/iPad/i),
      typeOfCanvas = typeof HTMLCanvasElement,
      nativeCanvasSupport = (typeOfCanvas == 'object' || typeOfCanvas == 'function'),
      textSupport = nativeCanvasSupport
        && (typeof document.createElement('canvas').getContext('2d').fillText == 'function');
  //I'm setting this based on the fact that ExCanvas provides text support for IE
  //and that as of today iPhone/iPad current text support is lame
  labelType = (!nativeCanvasSupport || (textSupport && !iStuff))? 'Native' : 'HTML';
  nativeTextSupport = labelType == 'Native';
  useGradients = nativeCanvasSupport;
  animate = !(iStuff || !nativeCanvasSupport);
})();

var Log = {
  elem: false,
  write: function(text){
    if (!this.elem)
      this.elem = document.getElementById('log');
    this.elem.innerHTML = text;
    this.elem.style.left = (500 - this.elem.offsetWidth / 2) + 'px';
  }
};


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
      initDiagram(familyTree.getJson());
    }, "text");
  } else {
    $.get(doc, function(data){
      var familyTree = new FamilyTree();
      familyTree.processCsvInputData(data);
      initDiagram(familyTree.getJson());
    }, "text");
  }

}
function initDiagram(json){
    var $orn = "left";
    //preprocess subtrees orientation
    var arr = json.children, len = arr.length;
    for(var i=0; i < len; i++) {
      //split half left orientation

      arr[i].data.$orn = arr[i].data.myorn;
      $jit.json.each(arr[i], function(n) {
        n.data.$orn = arr[i].data.myorn;
      });

      /*
      if(arr[i].data.myorn == "left") {
        arr[i].data.$orn = 'left';
        $jit.json.each(arr[i], function(n) {
          n.data.$orn = 'left';
        });
      } else {
      //half right
        arr[i].data.$orn = 'right';
        $jit.json.each(arr[i], function(n) {
          n.data.$orn = 'right';
        });
      }
      */
    }
    //end
    //grab radio button
    var normal = $jit.id('s-normal');
    //init Spacetree
    //Create a new ST instance
    var st = new $jit.ST({
        //id of viz container element
        injectInto: 'infovis',
        //multitree
        multitree: true,
        //set duration for the animation
        duration: 800,
        //set animation transition type
        transition: $jit.Trans.Quart.easeInOut,
        //set distance between node and its children
        levelDistance: 40,
        //sibling and subtrees offsets
        siblingOffset: 3,
        subtreeOffset: 3,
        //set node and edge styles
        //set overridable=true for styling individual
        //nodes or edges
        Node: {
            height: 55,
            width: 150,
            type: 'ellipse',
            color: '#aaa',
            overridable: true,
            //set canvas specific styles
            //like shadows
            CanvasStyles: {
              shadowColor: '#ccc',
              shadowBlur: 10
            }
        },
        Edge: {
            type: 'line',
            color: 'black',
            overridable: true
        },

        onBeforeCompute: function(node){
            Log.write("loading " + node.name);
        },

        onAfterCompute: function(){
            Log.write("done");
        },

        //This method is called on DOM label creation.
        //Use this method to add event handlers and styles to
        //your node.
        onCreateLabel: function(label, node){
            label.id = node.id;
            var targetid = node.id
            label.innerHTML = node.name;
            if (node.data.cid) {
              targetid = node.data.cid;
            } else if (node.data.link) {
              if (node.data.focus) {
                label.innerHTML += "<br/><a href='"+node.data.link+"'>Details</a> <a href='javascript:dofocus()'>View ALL</a>";
              } else {
                label.innerHTML += "<br/><a href='"+node.data.link+"'>Details</a> <a href='javascript:dofocus("+node.id.replace("node","")+")'>focus</a>";
              }
            }
            label.onclick = function(){
              if(true) {
                st.onClick(targetid);
              } else {
                st.setRoot(targetid, 'animate');
              }
            };
            //set label styles
            var style = label.style;
            style.width = 150 + 'px';
            style.height = 55 + 'px';
            style.cursor = 'pointer';
            style.color = '#333';
            style.fontSize = '0.8em';
            style.textAlign= 'center';
            style.paddingTop = '10px';
        },

        //This method is called right before plotting
        //a node. It's useful for changing an individual node
        //style properties before plotting it.
        //The data properties prefixed with a dollar
        //sign will override the global node style properties.
        onBeforePlotNode: function(node){
            //add some color to the nodes in the path between the
            //root node and the selected node.
            if (node.selected) {
                node.data.$color = "#64a70b";
            }
            else {
                delete node.data.$color;
                //if the node belongs to the last plotted level
                node.data.$color = node.data.mycolor;
                if(!node.anySubnode("exist")) {
                    //count children number
                    var count = 0;
                    node.eachSubnode(function(n) { count++; });
                    //assign a node color based on
                    //how many children it has
                    //node.data.$color = ['#aaa', '#baa', '#caa', '#daa', '#eaa', '#faa', '#faa', '#faa', '#faa', '#faa'][count];
                }
            }
        },

        //This method is called right before plotting
        //an edge. It's useful for changing an individual edge
        //style properties before plotting it.
        //Edge data proprties prefixed with a dollar sign will
        //override the Edge global style properties.
        onBeforePlotLine: function(adj){
            if (adj.nodeFrom.selected && adj.nodeTo.selected) {
                adj.data.$color = "#eed";
                adj.data.$lineWidth = 3;
            }
            else {
                delete adj.data.$color;
                delete adj.data.$lineWidth;
            }
        }
    });
    //load json data
    st.loadJSON(json);
    //compute node positions and layout
    st.compute('end');
    st.select(st.root);
    //end

}
