// global variables:
fontSize = 0; // computed from css value for .token in arborator-draft.css
svgDefaultHeight = 500;
el=10; // type of conll (10, 14, or 4), computed in conllNodesToTree
trees=[]; // list of tree objects
uextras=[]; // list of comments. each comment is a hashtable position(=line)->comment TODO: add this to the display
conlltrees=[]; // list of conll strings
defaultCat="_"
shownfeatures=["t", "cat", "lemma","gloss"]; // recomputed in readConll
conlls = {	
	10: 	{"id": 0, "t":1, "lemma": 2, "cat": 3, "xpos":4, "morph":5, "gov":6, "func":7, "xgov":8, "gloss":9}, 
	14: 	{"id": 0, "t":1, "lemma": 3, "cat": 5, "gov":9, "func":11}, 
	4: 	{"t":0, "lemma": 0, "cat": 1, "gov":2, "func":3} 
}

// debug:
log = console.log.bind(console);

// TODO: add lemmas and pos!!!
lemmaColor = '#006400';
posColor = '#9e04de';


function ArboratorDraft() {
	// main function called from html file
// 	$("conll").css("white-space", "pre"); //.css("display", "none"); 
// 	$("conll").before("<div class='expander'>View Conll</div>");
	$( ".expander" ).click(function(){
		log(99,$(this).next('conll'));
		$(this).next('conll').toggle();});    
	readConll(); 
}


function readConll() {
	// reads the conll representation of the whole treebank that is in the conll field
		
	trees=[]; // list of tree objects 
	uextras=[]; // list of comments. each comment is a hashtable position(=line)->comment # TODO: show sentence features!
	conlltrees=[]; // list of conll strings, one string per tree
	d3.selectAll('conll').each(function(d) { // for each <conll> section:
		
		var conll = d3.select(this).attr("class", 'conll'); 
		conll.html(conll.html().trim())
		var pnode = d3.select(this.parentNode);
		var toggle = false;
		pnode.insert('div',':first-child'); // just to get a new line
		var showHideConll = pnode.insert('div',':first-child').html("View Conll").attr("class", 'showHideConll')
		showHideConll.on("click", ()=>{
			log(111,toggle);
			conll.style("display", toggle ? "none" : "inline");
			showHideConll.html(toggle ? "View Conll": "Hide Conll");
			toggle = !toggle;
		});
		var treelines = conll.html().trim().split(/\n\s*\n\s*\n*/);	
		for (let singleConll of treelines) { // for each conll tree:
			conlltrees.push(singleConll);
			var data=conllNodesToTree(singleConll);
			trees.push(data.tree);
			uextras.push(data.uextra)						 
			var divsvgbox = pnode.insert('div').attr("class", 'svgbox');  	
			divsvgbox.insert('div').html(data.sentence).attr("class", 'sentencebox'); 
			draw(divsvgbox, data.tree);
		}
		 
	});
	// 	TODO: check whether this is useful: adapt which nodes should be shown depending on what we find on the first node
	firstnode=trees[0][Math.min.apply(Math,Object.keys(trees[0]))]; // take lowest existing treenode number
	shownfeatures = $.grep(shownfeatures, function (attri,i)
		{ // for each shownfeatures :
		if (i < 2 || ((attri in firstnode) && firstnode[attri]!=defaultCat)) { 
			// either the first two (token and cat) or non default value:
			return true; // keep it
			}
		return false; // kick it out
	});
}


function conllNodesToTree(treeline) {
	// reads a conll representation of a single tree TODO: replace jquery by d3
	
	var nodes = treeline.split('\n');
	var tree={};
	var uextra={};
	var lastid=0;
	var skipuntil=0;
	var words=[]
	$.each(nodes, function(id,nodeline){ // for each conll line:
		var nodeline=$.trim(nodeline);
		if (nodeline.charAt(0) == "#") {
			if (!(lastid in uextra)) uextra[lastid]=[];
			uextra[lastid].push(nodeline)
			return true;
		}
		var elements = nodeline.split('\t');
		el=elements.length;

		if (!(el in conlls) && el>10) el=10;
		if (el > 4) id=elements[conlls[el]["id"]];
		else if (elements[conlls[el]["t"]] != "_") id++;
		if (lastid!=id) // needed for the arborator encoding of multiple govs
		{
			var t=elements[conlls[el]["t"]];
			var tokids=id.split("-")
			if (tokids.length == 1) {
				tree[id]={}
				tree[id]["gov"]={};
				tree[id]["t"]=t;
				tree[id]["id"]=id;
				tree[id]["lemma"]=elements[conlls[el]["lemma"]];
				tree[id]["cat"]=elements[conlls[el]["cat"]];
				if (id>skipuntil) words.push(t);
				if (el==10) {
					tree[id]["xpos"]=elements[conlls[el]["xpos"]];
					tree[id]["morph"]=elements[conlls[el]["morph"]];
					tree[id]["gloss"]=elements[conlls[el]["gloss"]];
					if (tree[id]["gloss"]=="SpaceAfter=No"){
						tree[id]["gloss"]="_";
						tree[id]["NoSpaceAfter"]=true;
					}
					var xgov = elements[conlls[el]["xgov"]];
					if (xgov.indexOf(':') > -1){
						var xgovs=xgov.split("|");
						$.each(xgovs, function(ind,xg){ 
							// for each extra governor line:
							var xgs=xg.split(":")
							if (xgs.length >=2) {
								// if it's not just _
								var gov=xgs[0];
								var func= xgs.slice(1).join(":");
								tree[id]["gov"][gov]=func;
							}
						});
					}
				}
			}
			else if (tokids.length == 2){
				skipuntil = parseInt(tokids[1])
				words.push(elements[conlls[el]["t"]]);
				if (!(lastid in uextra)) uextra[lastid]=[];
				uextra[lastid].push(nodeline)
			}
			else {
				if (!(lastid in uextra)) uextra[lastid]=[];
				uextra[lastid].push(nodeline)
			}
		}
		gov = elements[conlls[el]["gov"]];
		if (gov!="" && gov!="_") 
		{
			if (gov==-1)
			{
				gov = elements[conlls[el]["gov"]+1];
			}
			var func = elements[conlls[el]["func"]];
			if (func.indexOf('::') !== -1) 
				{	
					var stydic = func.substring(func.indexOf("::") + 1);
					func = func.split("::")[0];
					if (stydic!="") funcDic[func] = $.parseJSON(stydic);
					$('#styleconllcheck').prop('checked', true);
				};
			tree[id]["gov"][gov]=func;
			
		}
		lastid=id;
		});
	
	
	var sentence="";
	words.forEach(function (word, i) {
		sentence+=word;
		if (i+1 in tree && !(("NoSpaceAfter" in tree[i+1]) && tree[i+1]["NoSpaceAfter"]==true)) sentence+=" ";
	});
	return {tree:tree, uextra:uextra, sentence:sentence};
}


function getSVGPath(startPoint,endPoint,computedStyle) {
	// startPoint and endPoint are objects for the corresponding nodes
	
	var tokDepDist = parseInt(computedStyle.getPropertyValue('--tokDepDist'));
	var depMinHeight = parseInt(computedStyle.getPropertyValue('--depMinHeight'));
	var wordDistanceFactor = parseInt(computedStyle.getPropertyValue('--wordDistanceFactor'));
	var startOffset = parseInt(computedStyle.getPropertyValue('--startOffset'));
	var startOff=(startPoint['id']-endPoint['id']>0)?-startOffset:startOffset
	var x1 = startPoint['x']+startPoint['w']/2+startOff;
	var x2 = endPoint['x']+endPoint['w']/2;
	var y1 = svgDefaultHeight-fontSize*2;
	var y2 = svgDefaultHeight-fontSize*2;
	var x1x2=Math.abs(x1-x2)/2;		
	var yy = Math.max(y1-x1x2-wordDistanceFactor*Math.abs(endPoint['id']-startPoint['id']),-tokDepDist);
	var yy = Math.min(yy,y1)-depMinHeight;
	var cstr="M"+x1+","+y1+"C"+x1+","+yy+" "+x2+","+yy+" "+(x2+.01)+","+y2; // 0.01: workaround for strange bug in the computation of getTotalLength!!!
	return cstr;
}


function arrowhead(x,y) {
	// gives path for arrowhead x,y startpoint (end of arrow)
	
	var pathAB = [4, -8]; // right point of arrow
	var pathAC = [0, -6]; // center dip
	var pathAD = [-4, -8]; // left point of arrow
	var pointB = [x + pathAB[0], y + pathAB[1]];
	var pointC = [x + pathAC[0], y + pathAC[1]];
	var pointD = [x + pathAD[0], y + pathAD[1]];
	return [x,y] + ' ' + pointB + ' ' + pointC + ' ' + pointD;
}


function draw(div, tree) {
	// draws json tree on svg in div
	
	var runningWidth = 0;
	var smallestY = svgDefaultHeight;
	var treeArray = $.map(tree, function(value, index) {return [value];});
	var svg = div.append("svg:svg")
	.attr("width",  1000)
	.attr("height", svgDefaultHeight);
	var group = svg.append("g");
	// write tokens:
	texts = group.selectAll("text")
		.data(treeArray)
		.enter()
		.append('text')
		.attr("class", "token")
		.text(function(d){return d["t"]})
		.attr("id",function(d) {return d["id"];})
		.attr("x", function(d) {
			var w = this.getComputedTextLength()
			var wordDistance = parseInt(getComputedStyle(this).getPropertyValue('--wordDistance'));
			var x = runningWidth; //<-- previous length to return
			runningWidth += w + wordDistance; //<-- total
			tree[d["id"]]["x"]=x;
			tree[d["id"]]["w"]=w;
			fontSize = parseInt(getComputedStyle(this).fontSize, 10);
			return x;
		})
		.attr("y", svgDefaultHeight-fontSize);			
	svg.attr("width", runningWidth); // adapt svg width
	// draw dependency links
	group.selectAll("text").each(function(d) { // for each token:
		var txt = d3.select(this); 
		for (var govid in tree[d3.select(this).attr("id")]["gov"]) { // for each governor
			x=tree[txt.attr("id")]['x']+tree[txt.attr("id")]['w']/2;
			var ligneDep = group.append("path")
			.attr("class", "curve")
			.attr("d", function (dd) {
				if (govid==0) // sentence root:
				{
					var y=svgDefaultHeight-fontSize*2;
					return "M"+x+","+y+"L"+x+","+0;
				}
				// normal link:
				else return getSVGPath(tree[govid],tree[txt.attr("id")], getComputedStyle(this));
			});
			group.append("polygon")
			.attr("class", "arrowhead")
			.attr("points", function (dd) {
				return arrowhead(x, svgDefaultHeight - fontSize*2);
			});
			var label=tree[d3.select(this).attr("id")]["gov"][govid];
			var depLineBbox=ligneDep.node().getBBox();
			group.append('text') 
			// TODO: move the "root" label to a good position! (possibly to a group that has to be transformed separately!)
			// TODO: handle mutliple governors!
			.attr("class", "deprel")
			.text(function(d){return label})
			.attr("x", function(d) {
				relFontSize = parseInt(getComputedStyle(this).fontSize, 10);
				var w = this.getComputedTextLength(); //<-- length of this node
				return depLineBbox.x + depLineBbox.width/2 - w/2})
			.attr("y", function(d) {
				funcCurveDist = parseInt(getComputedStyle(this).getPropertyValue('--funcCurveDist'));
				return depLineBbox.y-funcCurveDist});
			if (govid!=0) { // if not root, check how high we got
				var smallY = depLineBbox.y-funcCurveDist-relFontSize
				smallestY = smallY < smallestY ? smallY : smallestY;
			}
		}
		
	});	
	group.attr("transform", "translate(" + 0 + "," + (-smallestY) + ")");
	svg.attr("height", svgDefaultHeight-smallestY); // adapt svg height
}
