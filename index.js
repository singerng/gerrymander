var width = 600;
var height = 400;

var expanse = 0.95;

var active = d3.select(null);

var projection = d3.geoAlbers().scale(1).translate([0, 0]);
var path = d3.geoPath().projection(projection);

var zoom = d3.zoom()
  .scaleExtent([1,16])
  .on("zoom", zoomed);

var svg = d3.select("#svg-wrapper").append("svg")
  .attr("width", width)
  .attr("height", height)
  .on("click", stopped, true);

svg.append("rect")
  .attr("class", "background")
  .attr("width", width)
  .attr("height", height)
  .on("click", reset);

var g = svg.append("g");

function focus(features) {
  var bounds = path.bounds(features);
  var scale = expanse / Math.max((bounds[1][0] - bounds[0][0]) / width, (bounds[1][1] - bounds[0][1]) / height),
    translate = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];
  return { scale: scale, translate: translate };
}

function update() {
  $("#cd")
}

var features;

d3.json("./moco.json", function(error, state) {
  if (error) throw error;
  var precincts = state.objects.precincts;
  features = topojson.feature(state, precincts);
  var stateFocus = focus(features);
  projection.scale(stateFocus.scale).translate(stateFocus.translate);

  g.selectAll("path")
    .data(features.features)
    .enter().append("path")
    .attr("d", path)
    .attr("class", "precinct")
    .on("click", clicked);

  g.append("path")
    .datum(topojson.mesh(state, precincts, function(a, b) { return a !== b; }))
    .attr("class", "mesh")
    .attr("d", path);

  svg.call(zoom);
});


function reset() {
  active.classed("active", false);
  active = d3.select(null);

  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity);
}

function zoomed() {
  g.style("stroke-width", 1 / d3.event.transform.k + "px");
  g.attr("transform", d3.event.transform);
}

function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
}

/* Resources:
 * https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2
 * https://bl.ocks.org/mbostock/9656675
 */

var cds = 8;

function color(cd) {
  return "hsl(" + 360 / cds * (cd - 1) + ", 60%, 70%)";
}

function setCD(precinct, elem, cd) {
  console.log(precinct);
  precinct.properties.cd = cd;
  elem.style("fill", color(cd));
}

function changeCDCount() {
  cds = $("#cd-count").val();
  $("#cd-selectors").empty();

  for (var i = 1; i <= cds; i++) {
    var radio = $("<label class='custom-control custom-radio'>" +
      "<input name='cd-selector' type='radio' class='custom-control-input' value='" + i + "'>" +
      "<span class='custom-control-indicator'></span>" +
      "<span class='custom-control-description cd-color' style='background-color: " + color(i) + ";'>District " + i + "</span></span>" +
      "</label>");
    $("#cd-selectors").append(radio);
  }

  calculateMetrics();
}

function clicked(precinct) {
//    if (active.node() === this) return reset();
//    active.classed("active", false);
//    active = d3.select(this).classed("active", true);
//    var precinctFocus = focus(precinct);
//
//    svg.transition()
//      .duration(750)
//      .call(zoom.transform, d3.zoomIdentity.translate(precinctFocus.translate[0], precinctFocus.translate[1]).scale(precinctFocus.scale));
  setCD(precinct, d3.select(this), $('input[name=cd-selector]:checked', '#cd-selectors').val());
  calculateMetrics();
}

function calculateMetrics() {
  $("#cd-metrics").empty();

  var districts = {};

  for (var i = 1; i <= cds; i++) {
    districts[i] = {
      precincts: 0
    };
  }

  for (var key in Object.values(features.features)) {
    var feature = features.features[key];
    
    if (feature.properties.cd) {
      districts[feature.properties.cd].precincts++;
    }
  }

  for (i = 1; i <= cds; i++) {
    var metric = $("<div>" +
    "<h3>District " + i + "</h3>" +
    "</div>");

    metric.append("<p># of Precincts: " + districts[i].precincts);

    $("#cd-metrics").append(metric);
  }
}