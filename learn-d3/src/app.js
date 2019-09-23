import * as d3 from 'd3'
import * as d3array from 'd3-array'
import * as d3path from 'd3-path'
import * as d3drag from 'd3-drag'
import * as d3selection from 'd3-selection'
// import {checkbox, slider} from "@jashkenas/inputs"

// d3 = require("d3-array@2", "d3-drag@1", "d3-path@1", "d3-selection@1")


/* Functions */

//(x0,y0) is start point; (x1,y1),(x2,y2) is control points; (x3,y3) is end point.
function bezierMinMax(x0, y0, x1, y1, x2, y2, x3, y3) {
  var tvalues = [], xvalues = [], yvalues = [],
      a, b, c, t, t1, t2, b2ac, sqrtb2ac;
  for (var i = 0; i < 2; ++i) {
      if (i == 0) {
          b = 6 * x0 - 12 * x1 + 6 * x2;
          a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
          c = 3 * x1 - 3 * x0;
      } else {
          b = 6 * y0 - 12 * y1 + 6 * y2;
          a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
          c = 3 * y1 - 3 * y0;
      }
      if (Math.abs(a) < 1e-12) {
          if (Math.abs(b) < 1e-12) {
              continue;
          }
          t = -c / b;
          if (0 < t && t < 1) {
              tvalues.push(t);
          }
          continue;
      }
      b2ac = b * b - 4 * c * a;
      if (b2ac < 0) {
          continue;
      }
      sqrtb2ac = Math.sqrt(b2ac);
      t1 = (-b + sqrtb2ac) / (2 * a);
      if (0 < t1 && t1 < 1) {
          tvalues.push(t1);
      }
      t2 = (-b - sqrtb2ac) / (2 * a);
      if (0 < t2 && t2 < 1) {
          tvalues.push(t2);
      }
  }

  var j = tvalues.length, mt;
  while (j--) {
      t = tvalues[j];
      mt = 1 - t;
      xvalues[j] = (mt * mt * mt * x0) + (3 * mt * mt * t * x1) + (3 * mt * t * t * x2) + (t * t * t * x3);
      yvalues[j] = (mt * mt * mt * y0) + (3 * mt * mt * t * y1) + (3 * mt * t * t * y2) + (t * t * t * y3);
  }

  xvalues.push(x0,x3);
  yvalues.push(y0,y3);

  return {
      min: {x: Math.min.apply(0, xvalues), y: Math.min.apply(0, yvalues)},
      max: {x: Math.max.apply(0, xvalues), y: Math.max.apply(0, yvalues)}
  };
}

function update(chart, points, labels, lines, draw) {
  // console.log(chart)
  // console.log(chart.select(".u-path"))
  
  // d3.select(chart)
    chart.select(".u-path")
    .attr("d", draw());

    let cpx = points[1][0], cpy = points[1][0], x0 = points[0][0], y0 = points[0][1], x = points[2][0], y = points[2][1];
    cpx = (x0+((x-x0)/2)), 
    cpy = (y-y0)+(y-y0)/2;
    if(cpy<0){cpy = 0} if(cpx<0){cpx = 0}
    points[1] = [cpx, cpy];

    lines = [[points[0], points[1]], [points[1], points[2]]],

  // d3.select(chart)
    chart.selectAll(".u-point")
    .data(points)
    .join(enter =>
      enter
        .append("g")
        .classed("u-point", true)
        .call(g => {
          g.append("circle").attr("r", 3).attr("fill", "orange");
          // .attr("stroke", "orange").attr("stroke-width", 2)
            // .attr("cx", 50).attr("cy", 50);
          g.append("text")
            .text((d, i) => labels[i])
            .attr("dy", d => (d[1] > 100 ? 15 : -5));
        })
    )
    .attr("transform", d => `translate(${d})`);

  // d3.select(chart)
    chart.selectAll(".u-line")
    .data(lines)
    .join("line")
    .attr("x1", d => d[0][0])
    .attr("y1", d => d[0][1])
    .attr("x2", d => d[1][0])
    .attr("y2", d => d[1][1])
    .classed("u-line", true);
}




function draggable(chart, points, labels, lines, draw) {
  update(chart, points, labels, lines, draw);

  const dist = p => {
    const m = d3selection.mouse(chart.node());
    return Math.sqrt((p[0] - m[0]) ** 2 + (p[1] - m[1]) ** 2);
  };

  var subject, dx, dy;

  function dragSubject() {
    subject = d3array.least(points, (a, b) => dist(a) - dist(b));
    if (dist(subject) > 14) subject = null;
    if (subject)
      // d3.select(chart)
      chart
        .style("cursor", "hand")
        .style("cursor", "grab");
    // else d3.select(chart).style("cursor", null);
    else chart.style("cursor", null);
    return subject;
  }

  // d3.select(chart)
    chart.on("mousemove", dragSubject)
    .call(
      d3
        .drag()
        .subject(dragSubject)
        .on("start", () => {
          if (subject) {
            chart.style("cursor", "grabbing");
            dx = subject[0] - d3.event.x;
            dy = subject[1] - d3.event.y;
          }
        })
        .on("drag", () => {
          if (subject) {
            subject[0] = d3.event.x + dx;
            subject[1] = d3.event.y + dy;
          }
        })
        .on("end", () => {
          chart.style("cursor", "grab");
        })
        .on("start.render drag.render end.render", () =>
          update(chart, points, labels, lines, draw)
        )
    );
}




(async function () {
  // Selecting and appending elements
  d3.select('#root')
    .append('h5')
    .append('text')
    .text(`D3 versioning: ${d3.version}`);

  

  // Loading external data
  const dataset = await d3.csv('/data/sample.csv')
  dataset.forEach((data) => {
    console.log(data)
  })


const x0 = 100,
  y0 = 150,
  x = 300,
  y = 150;
const cpx = (x0+((x-x0)/2)), 
cpy = (y-y0)+((y-y0)/2);

const path = d3.path();
path.moveTo(x0, y0);
path.quadraticCurveTo(cpx, cpy, x, y);

// const chart = svg`<svg viewBox="0 0 450 300" class="chart">
//   <path class="u-path" d="${path}" />
// </svg>`;
d3.select('#root').append('div').attr("id", "chartdiv").html(`<svg viewBox="0 0 450 300" id="chartsvg" class="chart">
  <path class="u-path" d="${path}" />
  </svg>`);
d3.select('head').append('style').text(`.chart { width: 100vw; max-width: 100vh; height: auto; overflow: visible; }
.chart .u-line { stroke: #aaa; stroke-dasharray: 2 2; }
.chart .u-path { stroke: orange; fill: none; }
.chart .u-point circle { fill: orange; }
.chart { text-anchor: middle; font: 11px var(--sans-serif); user-select:none; }`);

const chart = d3.select("#chartsvg");

/**
 *  Add control elements and prepare interactions
 */

const points = [[x0, y0], [cpx, cpy], [x, y]],
  labels = ["Start", "Control", "End!"],
  lines = [[points[0], points[1]], [points[1], points[2]]],
  draw = () => {
    const path = d3.path();
    path.moveTo(...points[0]);
    path.quadraticCurveTo(...points[1], ...points[2]);
    return path;
  };

draggable(chart, points, labels, lines, draw);

}) ();