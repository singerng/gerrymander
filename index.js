const width = 900;
const height = 600;
const expanse = 0.95;

let active = d3.select(null);

let projection = d3.geoMercator().scale(1).translate([0, 0]);
let path = d3.geoPath().projection(projection);

let getSelectMode = () => $("input[type=radio][name=selectMode]:checked").val();
let getSelectedCD = () => $('input[name=cd-selector]:checked', '#cd-selectors').val();

// Setup zooming
let zoom = d3.zoom()
  .scaleExtent([1,16])
  .on("zoom", zoomed)
  .filter(() => getSelectMode() === "none" || getSelectMode() === "single");

// Attach d3 to the SVG
let svg = d3.select("#svg-wrapper").append("svg")
  .attr("width", width)
  .attr("height", height)
  .on("click", stopped, true);
svg.append("rect")
  .attr("class", "background")
  .attr("width", width)
  .attr("height", height)
  .on("click", reset);

svg
  .on("mousedown", function() {
    if (getSelectMode() !== "rect") return;
    let mouse = d3.mouse(this);
    svg.append("rect")
      .attrs({ class: "selection", origX: mouse[0], origY: mouse[1], width: 0, height: 0 });
  })
  .on("mousemove", function() {
    if (getSelectMode() !== "rect") return;
    let rect = svg.select(".selection");

    if (!rect.empty()) {
      let mouse = d3.mouse(this);

      let attr = {
        origX: parseInt(rect.attr("origX"), 10),
        origY: parseInt(rect.attr("origY"), 10),
        width: parseInt(rect.attr("width"), 10),
        height: parseInt(rect.attr("height"), 10)
      };

      attr.width = Math.abs(mouse[0] - attr.origX);
      attr.height = Math.abs(mouse[1] - attr.origY);
      attr.x = Math.min(attr.origX, mouse[0]);
      attr.y = Math.min(attr.origY, mouse[1]);

      rect.attrs(attr);
    }
  })
  .on("mouseup", function() {
    svg.select("rect.selection").remove();
  });

let g = svg.append("g");

// Focus on a set of features in the map
function focus(features) {
  let bounds = path.bounds(features);
  let scale = expanse / Math.max((bounds[1][0] - bounds[0][0]) / width, (bounds[1][1] - bounds[0][1]) / height),
    translate = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];
  return { scale: scale, translate: translate };
}

let features;

// Load the "moco.json" file
d3.json("./md.json", function(error, state) {
  if (error) throw error;
  let precincts = state.objects.precincts;
  features = topojson.feature(state, precincts);

  // Setup the initial focus on the entire map
  let stateFocus = focus(features);
  projection.scale(stateFocus.scale).translate(stateFocus.translate);

  // Add the features to the SVG
  g.selectAll("path")
    .data(features.features)
    .enter().append("path")
    .attr("d", path)
    .attr("class", "precinct")
    .on("click", function(precinct) {
      if (getSelectMode() === "single") {
        setCD(precinct, d3.select(this), getSelectedCD());
        calculateMetrics();
      }
    })
    .on("dblclick", function(precinct) {
      d3.event.stopImmediatePropagation();
      let precinctFocus = focus(precinct);
      svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(precinctFocus.translate[0], precinctFocus.translate[1]).scale(precinctFocus.scale));
    });
  g.append("path")
    .datum(topojson.mesh(state, precincts, function(a, b) { return a !== b; }))
    .attr("class", "mesh")
    .attr("d", path);

  svg.call(zoom);
});

// Reset when a region outside the map is clicked
function reset() {
  active.classed("active", false);
  active = d3.select(null);

  svg.transition()
    .duration(750)
    .call(zoom.transform, d3.zoomIdentity);
}

// Change the SVG when the map is zoomed
function zoomed() {
  // Keep the lines the same thickness
  g.style("stroke-width", 1 / d3.event.transform.k + "px");
  // Actually apply the transform
  g.attr("transform", d3.event.transform);
}

function stopped() {
  if (d3.event.defaultPrevented) d3.event.stopPropagation();
}

/* Resources:
 * https://bl.ocks.org/iamkevinv/0a24e9126cd2fa6b283c6f2d774b69a2
 * https://bl.ocks.org/mbostock/9656675
 */
let cds = 8;

// Compute the color of a district
function color(cd) {
  return "hsl(" + 360 / cds * (cd - 1) + ", 70%, 70%)";
}

// Set the district of a given precinct
function setCD(precinct, elem, cd) {
  precinct.properties.cd = cd;
  elem.style("fill", color(cd));
}

function changeCDCount() {
  cds = $("#cd-count").val();
  $("#cd-selectors").empty();

  for (let i = 1; i <= cds; i++) {
    let radio = $("<label class='custom-control custom-radio'>" +
      "<input name='cd-selector' type='radio' class='custom-control-input' value='" + i + "'>" +
      "<span class='custom-control-indicator'></span>" +
      "<span class='custom-control-description cd-color' style='background-color: " + color(i) + ";'>District " + i + "</span></span>" +
      "</label>");
    $("#cd-selectors").append(radio);
  }

  calculateMetrics();
}

// Calculate metrics for those districts
function calculateMetrics() {
  $("#cd-metrics").empty();

  let districts = {};

  for (let i = 1; i <= cds; i++) {
    districts[i] = {
      precincts: 0
    };
  }

  for (let key in Object.values(features.features)) {
    let feature = features.features[key];
    
    if (feature.properties.cd) {
      districts[feature.properties.cd].precincts++;
    }
  }

  for (i = 1; i <= cds; i++) {
    let metric = $("<div>" +
    "<h3>District " + i + "</h3>" +
    "</div>");

    metric.append("<p># of Precincts: " + districts[i].precincts);

    $("#cd-metrics").append(metric);
  }
}
