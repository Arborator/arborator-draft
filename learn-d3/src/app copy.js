import * as d3 from 'd3'
import * as d3array from 'd3-array'
import * as d3path from 'd3-path'
import * as d3drag from 'd3-drag'
import * as d3selection from 'd3-selection'
// import {checkbox, slider} from "@jashkenas/inputs"

// d3 = require("d3-array@2", "d3-drag@1", "d3-path@1", "d3-selection@1")


/* Functions */

function update(chart, points, labels, lines, draw) {
  // console.log(chart)
  // console.log(chart.select(".u-path"))
  
  // d3.select(chart)
    chart.select(".u-path")
    .attr("d", draw());

    

  // d3.select(chart)
    chart.selectAll(".u-point")
    .data(points)
    .join(enter =>
      enter
        .append("g")
        .classed("u-point", true)
        .call(g => {
          g.append("circle").attr("r", 3).attr("stroke", "black").attr("stroke-width", 2).attr("fill", "orange");
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
    if (dist(subject) > 48) subject = null;
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
  cpx = 200,
  cpy = 20,
  x = 300,
  y = 150;

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
  labels = ["Start", "Control", "End"],
  lines = [[points[0], points[1]], [points[1], points[2]]],
  draw = () => {
    const path = d3.path();
    path.moveTo(...points[0]);
    path.quadraticCurveTo(...points[1], ...points[2]);
    return path;
  };

draggable(chart, points, labels, lines, draw);

}) ();