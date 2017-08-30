(function () {

    xTextPlacement = 100;
    yHorizAnchors = {};
    distanceHeight = 23;
    labelColor = '#1d2ec1';
    arrowColor = '#000';
    wordColor = '#000';
    lemmaColor = '#006400';
    posColor = '#9e04de';
    pathColor = '#000';
    pathWidth = 1;
    myData = null;
    sentData = null;
    sidIndex = 0;
    idIndex = 0;
    wordIndex = 1;
    lemmaIndex = 2;
    posIndex = 3;
    headIndex = 6;
    labelIndex = 7;

    this.ArboratorDraft = function (options) {
        if(options.hasOwnProperty('labelColor')){labelColor = options['labelColor']}
        if(options.hasOwnProperty('arrowColor')){arrowcolor = options['arrow Color']}
        if(options.hasOwnProperty('wordColor')){wordColor = options['wordColor']}
        if(options.hasOwnProperty('lemmaColor')){lemmaColor = options['lemmaColor']}
        if(options.hasOwnProperty('posColor')){posColor = options['posColor']}
        if(options.hasOwnProperty('pathColor')){pathColor = options['pathColor']}
        
        if(options.hasOwnProperty('pathWidth')){pathWidth = options['pathWidth']}
        if(options.hasOwnProperty('pathWidth')){distanceHeight = options['pathHeight']}

        if(options.hasOwnProperty('format')){sidIndex = options['format']['sid']}
        if(options.hasOwnProperty('format')){idIndex = options['format']['id']}
        if(options.hasOwnProperty('format')){wordIndex = options['format']['word']}
        if(options.hasOwnProperty('format')){lemmaIndex = options['format']['lemma']}
        if(options.hasOwnProperty('format')){posIndex = options['format']['pos']}
        if(options.hasOwnProperty('format')){headIndex = options['format']['head']}
        if(options.hasOwnProperty('format')){labelIndex = options['format']['deprel']}

        this.transformConllTags();
    }

    function unpackConll(myString) {
        var newArray = [];
        var lines = myString.split('\n');
        for (var i = 0; i < lines.length; i++) {
            var newLine = lines[i].split('\t');
            newArray.push(newLine);
        };
        return newArray;
    }

    function setSentence(data) {
        var newData = [];
        var sentIDs = [];


        if (data !== null) {
            data.forEach(function (d) {
                var newObject = {};
                if ($.inArray(d.sid, sentIDs) === -1) {
                    sentIDs.push(d.sid);
                    newObject['sid'] = d.sid;
                    newObject['y_sent'] = d.y_sent;
                    var conll_y_array = unpackConll(d.conll_y_text);
                    newObject['conll_y_array'] = conll_y_array;
                    newData.push(newObject);
                    fillHorizAnchors(conll_y_array, yHorizAnchors);
                };
            });
        };
        return [newData, yHorizAnchors];
    }

    function getCharLengthInSVG(conll_array) {
        var tokenLen = conll_array[wordIndex].length;
        var tagLen = conll_array[posIndex].length;
        upperMatch = conll_array[wordIndex].match(/[A-Z]/g);
        lowerMatch = conll_array[wordIndex].match(/[a-z0-9\'\:\-]/g);
        if (upperMatch === null) {
            var engUppers = 0;
        } else {
            var engUppers = upperMatch.length;
        };
        if (lowerMatch === null) {
            var engLowers = 0;
        } else {
            var engLowers = lowerMatch.length;
        };
        var tokenPxLen = (engUppers * 12) + (engLowers * 8) +
            (((tokenLen - engUppers) - engLowers) * 18);
        var tagPxLen = (tagLen) * 10;
        return [tokenPxLen, tagPxLen];
    }


    function getWidth(conll_y_array) {
        var sentYLength = conll_y_array.length;
        function returnMaxLengthArray(sentLength, conll_array) {
            var myArray = [];
            for (var i = 0; i < sentLength; i++) {
                var pxLens = getCharLengthInSVG(conll_array[i]);
                var tokenPxLen = pxLens[0];
                var tagPxLen = pxLens[1];
                if (tokenPxLen > tagPxLen) {
                    myArray.push(tokenPxLen);
                } else {
                    myArray.push(tagPxLen);
                };

            };
            return myArray;
        };
        var yArray = returnMaxLengthArray(sentYLength, conll_y_array);
        yLen = yArray.reduce((a, b) => a + b, 0) + ((yArray.length) * 12);

        return yLen;

    }

    function getHeight(conll_array) {
        function returnDiffs(conll_array) {
            var diffs = [];
            for (var i = 0; i < conll_array.length; i++) {
                var wid = conll_array[i][idIndex];
                var hid = conll_array[i][headIndex];
                if (wid !== '0' && hid !== '0') {
                    diffs.push(Math.abs(Number(wid) - Number(hid)));
                };
            };
            return Math.max.apply(Math, diffs);
        };
        var maxDiff = returnDiffs(conll_array);
        maxDiff = (maxDiff * 20) + 25;
        return maxDiff;
    }

    function fillHorizAnchors(matrixData, horizAnchors) {
        horizAnchors[matrixData[0][0]] = {};
        for (var i = 0; i < matrixData.length; i++) {
            var conll_array = matrixData[i];
            var lens = xStart(conll_array);
            var groupLen = lens[0];
            var tokenStart = lens[1];
            if (i === 0) {
                textStart = xTextPlacement;
            } else {
                textStart += groupLen + 10;
            };
            var anchor = textStart + tokenStart - groupLen - 10 + 50;
            var sid = conll_array[sidIndex];
            var wid = conll_array[idIndex];
            horizAnchors[sid][i + 1] = anchor;
        };
        return false;
    }

    function xStart(conll_array) {
        /*
        returns length of token-tag group and where the token/tag should start
        */
        var pxLens = getCharLengthInSVG(conll_array);
        var tokenPxLen = pxLens[0];
        var tagPxLen = pxLens[1];
        if (tokenPxLen > tagPxLen) {
            var groupLen = tokenPxLen;
            var tokenStart = tokenPxLen / 2;
        } else {
            var groupLen = tagPxLen;
            var tokenStart = tagPxLen / 2;
        };
        return [groupLen, tokenStart];
    }

    function getSVGPath(conll_line, y_coordinate, y_or_z) {
        /*
        - points A and H are the end nodes of the dependency arrow
        - the others, B-G, are intermediate points
        - returns "d" attr for svg element "path"
        */
        var sid = conll_line[sidIndex];
        var indexA = conll_line[idIndex];
        var indexH = conll_line[headIndex];
        var distance = Math.abs(Number(indexA) - Number(indexH));

        var horizAnchors = yHorizAnchors;

        if (Number(indexA) > Number(indexH)) {
            // if the arrow points backwards, make pointA the leftside point instead
            var pointA = [horizAnchors[sid][indexH] + 6, y_coordinate + 5];
            var pointH = [horizAnchors[sid][indexA], y_coordinate];
        } else {
            var pointA = [horizAnchors[sid][indexA], y_coordinate];
            var pointH = [horizAnchors[sid][indexH] - 6, y_coordinate + 5];
        };
        
        var pointMid_y_coordinate = pointA[1] - distanceHeight * distance;

        var pointMid1 = [pointA[0] + ((pointH[0] - pointA[0]) / 16), pointMid_y_coordinate];
        var pointMid2 = [pointH[0] - ((pointH[0] - pointA[0]) / 16), pointMid_y_coordinate];

        var pathAll = 'M ' + pointA + ' C ' + pointMid1 + ' ' + pointMid2 + ' ' + pointH;
        if (indexH === '0' || indexA === '0') { // for drawing roots
            pathAll = 'M ' + pointH + ' L ' + pointH[0] + ',30';
            if (y_or_z === 'z') {
                pathAll = 'M ' + pointH + ' L ' + pointH[0] + ',' + '1000';
            }
        };
        return pathAll;
    }

    function getArrow(conll_line, y_coordinate, y_or_z) {
        var sid = conll_line[sidIndex];
        var indexA = conll_line[idIndex]; // the dependent's point
        var indexH = conll_line[headIndex]; // the head's point (for determining rotation)
        if (y_or_z === 'y') {
            var pathAB = [4, -8], // right point of arrow
                pathAC = [0, -6], // center dip
                pathAD = [-4, -8]; // left point of arrow
        } else {
            var pathAB = [2, 4], // right point of arrow
                pathAC = [0, 3], // center dip
                pathAD = [-2, 4]; // left point of arrow
        };
        
        var horizAnchors = yHorizAnchors;

        var pointA = [horizAnchors[sid][indexA], y_coordinate];
        if (indexA === '0' || indexH === '0') {
            pointA = [NaN, NaN];
        };
        var pointB = [pointA[0] + pathAB[0], pointA[1] + pathAB[1]];
        var pointC = [pointA[0] + pathAC[0], pointA[1] + pathAC[1]];
        var pointD = [pointA[0] + pathAD[0], pointA[1] + pathAD[1]];
        var pointsArrow = pointA + ' ' + pointB + ' ' + pointC + ' ' + pointD;
        var degrees = 15;
        var distance = Math.abs(Number(indexA) - Number(indexH));
        degrees = degrees - 1 / 10 * distance;
        if (Number(indexA) < Number(indexH)) {
            if (y_or_z === 'z') {
                degrees = "-" + degrees;
            };
            var rotation = 'rotate(' + degrees + ' ' + pointA[0] + ' ' + pointA[1] + ')';
        } else {
            if (y_or_z === 'y') {
                degrees = "-" + degrees;
            };
            var rotation = 'rotate(' + degrees + ' ' + pointA[0] + ' ' + pointA[1] + ')';
        };
        return [pointsArrow, rotation];
    }

    function getLabelAnchor(conll_line, y_coordinate) {
        var sid = conll_line[sidIndex];
        var indexA = conll_line[idIndex];
        var indexH = conll_line[headIndex];
        var label = conll_line[labelIndex];
        var distance = Math.abs(Number(indexA) - Number(indexH));
        var horizAnchors = yHorizAnchors;
        if (Number(indexA) > Number(indexH)) {
            // if the arrow points backwards, make pointA the leftside point instead
            var pointA = [horizAnchors[sid][indexH], y_coordinate];
            var pointH = [horizAnchors[sid][indexA], y_coordinate];
        } else {
            var pointA = [horizAnchors[sid][indexA], y_coordinate];
            var pointH = [horizAnchors[sid][indexH], y_coordinate];
        };
        if (distance === 1) {
            distance = 1.5;
        } else if (distance > 3 && distance < 12) {
            distance *= 0.9;
        } else if (distance === 3) {
            distance *= 0.85;
        } else if (distance > 11) {
            distance *= 0.88;
        };
        var pointMid_y_coordinate = pointA[1] - distanceHeight * (distance - Math.abs(1 - Math.log(distance)));
        var pointMid = [pointA[0] + ((pointH[0] - pointA[0]) / 2), pointMid_y_coordinate];
        return pointMid;
    };


    function getLabelAnchorNew(arc, conll_line){
        var label = conll_line[labelIndex]
        
    }

    function getAlignmentPoints(conll_line, y_base_coordinate) {
        var sid = conll_line[sidIndex];
        var y1 = y_base_coordinate + 34;
        var y2 = y_base_coordinate + 83;
        var wid = conll_line[idIndex];
        var alignId = conll_line[labelIndex];
        if (alignId.search(/,/) < 0) {
            if (wid !== 'NONE' && alignId !== 'NONE' && alignId !== '0') {
                var x1 = yHorizAnchors[sid][wid];
                var x2 = zHorizAnchors[sid][alignId];
            } else {
                var x1 = NaN;
                var x2 = NaN;
            }
            var points = x1 + ',' + y1 + ' ' + x2 + ',' + y2;
        } else {
            var x1 = yHorizAnchors[sid][wid];
            var otherPointsArray = alignId.split(',');
            var startPoint = x1 + ',' + y1;
            var otherPoints = startPoint;
            for (var i = 0; i < otherPointsArray.length; i++) {
                var aid = otherPointsArray[i];
                var xOther = zHorizAnchors[sid][aid];
                otherPoints += ' ' + String(xOther) + ',' + y2 + ' ' + startPoint;
            };
            var points = otherPoints;
        };
        return points;
    }

    function autoConsoleLog(myData, sentData) {
        if (myData === null) {
            var myDataLength = '0';
        } else {
            var myDataLength = myData.length;
        };
        if (sentData.length === 0) {
            var sentDataLength = '0';
        } else {
            var sentDataLength = sentData.length;
        };
        console.log('No. of rows returned: ' + myDataLength);
        console.log('No. of sents returned: ' + sentDataLength);
        if (myData !== null) {
            console.log('First item conll_y_text: \n' + myData[0].conll_y_text);
        };
    }


    function draw(data, conllId) {

        var yTextAnchor = 100;
        var yHeights = {}; // store as {sid: height, ...}

        "use strict";

        d3.select(conllId)
            .select("div").remove();

        d3.select(conllId)
            .selectAll("p").remove();

        d3.select(conllId)
            .selectAll("svg").remove();

        d3.select(conllId)
            .append("div")
            .attr("style", "display:inline; overflow-x:auto;");
        

        var results = d3.select(conllId)
            .selectAll('svg')
            .data(sentData)
            .enter()
            .append('svg')
            .attr("style", "display:list-item;")
            .attr("width", function (d) {
                var width = getWidth(d.conll_y_array) + 100;
                if (width < 800) {
                    width = 800;
                };
                return width;
            })
            .attr("height", function (d) {
                yHeight = getHeight(d.conll_y_array) + 100;
                yHeights[d.sid] = yHeight;
                var fullHeight = yHeight + 50;
                if (fullHeight < 10) {
                    fullHeight = 10;
                };
                return fullHeight;
            })
            .attr("margin", 10);

        var resultsEachY = results.selectAll('text')
            .attr("class", "words")
            .data(function (dd) { return dd.conll_y_array; })
            .enter();

        // insert words
        resultsEachY.append('text')
            .attr("x", function (dd, i) {
                var lens = xStart(dd);
                var groupLen = lens[0];
                var tokenStart = lens[1];
                if (i === 0) {
                    textStart = xTextPlacement;
                } else {
                    textStart += groupLen + 10;
                };
                var anchor = textStart + tokenStart - groupLen - 10 + 50;
                return anchor;
            })
            .attr("y", function (dd, i) {
                var sid = dd[sidIndex];
                var myHeight = yHeights[sid];
                return myHeight + 4;
            })
            //yTextAnchor + 25)
            .attr("text-anchor", "middle")
            .attr("fill", wordColor)
            .text(function (dd, i) { return dd[wordIndex]; });


        // insert lemmas 
        resultsEachY.append('text')
            .attr("x", function (dd, i) {
                var lens = xStart(dd);
                var groupLen = lens[0]
                var tokenStart = lens[1];
                if (i === 0) {
                    textStart = xTextPlacement;
                } else {
                    textStart += groupLen + 10;
                };
                return textStart + tokenStart - groupLen - 10 + 50;
            })
            .attr("y", function (dd, i) {
                var sid = dd[sidIndex];
                var myHeight = yHeights[sid];
                return myHeight + 25;
            })
            .style("font-size", "small")
            .style("font-style", "oblique")
            .attr("text-anchor", "middle")
            .attr("fill", lemmaColor)
            .text(function (dd, i) { return dd[lemmaIndex]; });


        // insert tags 
        resultsEachY.append('text')
            .attr("x", function (dd, i) {
                var lens = xStart(dd);
                var groupLen = lens[0]
                var tokenStart = lens[1];
                if (i === 0) {
                    textStart = xTextPlacement;
                } else {
                    textStart += groupLen + 10;
                };
                return textStart + tokenStart - groupLen - 10 + 50;
            })
            .attr("y", function (dd, i) {
                var sid = dd[sidIndex];
                var myHeight = yHeights[sid];
                return myHeight + 45;
            })
            .style("font-size", "small")
            .attr("fill", posColor)
            .attr("text-anchor", "middle")
            .text(function (dd, i) { return dd[posIndex]; });

        // insert arrow paths 

        var paths=[]

        paths.push(resultsEachY.append("path")
            .attr("d", function (dd, i) {
                var sid = dd[sidIndex];
                var path = getSVGPath(dd, yHeights[sid] - 15, 'y');
                return path;
            })
            .attr("fill", "none")
            .attr("stroke", pathColor)
            .attr("stroke-width", pathWidth));
        console.log("pathq", paths);

        // insert arrow shapes 
        resultsEachY.filter(function (dd, i) {
            return dd[headIndex] != 0;
        }).append("polygon")
            .attr("points", function (dd, i) {
                var sid = dd[sidIndex];

                var arrowInfo = getArrow(dd, yHeights[sid] - 10, 'y');
                // console.log("sid", dd[1])
                // stackdict[dd[1]] = 
                return arrowInfo[0];
            })
            .attr("fill", arrowColor);
            

        // insert relation label
        resultsEachY.append("text")
            .attr("x", function (dd, i) {
                var sid = dd[sidIndex];
                console.log("kkk",i,paths.length,paths[i]);
                var labelAnchor = getLabelAnchor(dd, yHeights[sid] - 14)[0];
                if (isNaN(labelAnchor)) {
                    labelAnchor = 0;
                }
                return labelAnchor;
            })
            .attr("y", function (dd, i) {
                var sid = dd[sidIndex];
                return getLabelAnchor(dd, yHeights[sid] - 14)[1];
            })
            .style("font-size", "small")
            .style("font-style", "italic")
            .attr("text-anchor", "middle")
            .attr("fill", labelColor)
            .text(function (dd, i) {
                var label = dd[labelIndex];
                var wid = dd[idIndex];
                var hid = dd[headIndex];
                // if (Number(wid) > Number(hid)) {
                //     label = label;
                // } else {
                //     label = label;
                // };
                if (label.search(/root|ROOT/) > -1) {
                    label = '';
                };
                return label;
            })
            // .each(function(dd, i) {
            //     var thisWidth = this.getComputedTextLength();
            //     console.log(thisWidth);
            // })
            ;

            console.log( "path", resultsEachY.select("path") );

        // el = resultsEachY.select("text");
        // console.log(el.text());
        // console.log(el.node().getComputedTextLength());

        // console.log( resultsEachY.select('text').node().getComputedTextLength() )    

        // sid (sentence ID)
        results.append("text")
            .attr("x", 10)
            .attr("y", 20)
            .attr("font-weight", "bold")
            .attr("fill", "#610396")
            .text(function (d) { return 'Sent id: ' + d.sid + ' : ' + d.y_sent; });

        

    }

    function drawConll(id) {
        document.getElementById(id).outerHTML = document.getElementById(id).outerHTML.replace(/conll/g, "div");
        document.getElementById(id).style.height = "100%";
        document.getElementById(id).style.width = "100%";
        document.getElementById(id).style.margin = "10px";
        // document.getElementById(id).style.overflowY = "auto";
        var dataElement = formatElement(document.getElementById(id), id);
        console.log(dataElement);

        idIndex++; wordIndex++; lemmaIndex++; headIndex++; labelIndex++; posIndex++;

        threeData = setSentence([dataElement]);
        console.log("threeData", threeData);
        sentData = threeData[0];
        yHorizAnchors = threeData[1];

        document.getElementById(id).innerHTML = "";
        idselector = "#" + id;

        draw(sentData, idselector);
    }

    function formatElement(elementConll, num) {
        var content = elementConll.innerHTML;
        content = content.replace(/&Tab;/g, "\t")
        content = content.replace(/&NewLine;/g, "\n")
        content = content.replace(/\n$/g, "");
        content = content.replace(/^\n/g, "");
        content = content.replace(/\n/g, "\n" + num + "\t");
        content = num + "\t" + content;

        var sent = elementConll.innerHTML;
        var lines = sent.split("\n");
        var y_sent = [];
        for (var i = 0; i < lines.length; i++) {
            var cols = lines[i].split("\t");
            y_sent.push(cols[wordIndex]);
        }

        var dataElement = {
            "sid": num,
            "y_sent": y_sent.join(" "),
            "conll_y_text": content
        };

        return dataElement;
    }


    ArboratorDraft.prototype.transformConllTags = function () {
        var list = document.getElementsByTagName("conll");
        var idrange = list.length;
        for (var i = 0; i < list.length; i++) {
            list[i].setAttribute("id", "test" + i);
        }
        for (var i = 0; i < idrange; i++) {
            drawConll("test" + i);
            idIndex--; wordIndex--; lemmaIndex--; headIndex--; labelIndex--; posIndex--;
            console.log(i, "/", list.length);
        }
    }

}());