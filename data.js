#!/usr/bin/node

const shapefile = require('shapefile');
const topojson = require('topojson-server');
const simplify = require('topojson-simplify');
const parse = require('csv-parse/lib/sync');
const console = require('console');
const fs = require('fs');
const request = require('request');
const util = require('util');
const unzip = require('unzipper');
const path = require('path');

const state = "md";
const state_fips = "24";

const counties_pattern = "https://www2.census.gov/geo/docs/reference/codes/files/st%s_%s_cou.txt";
const vtd_pattern = "https://www2.census.gov/geo/tiger/TIGER2010/VTD/2010/tl_2010_%s%s_vtd10.zip";
const vtd_temp_pattern = "./tmp/%s";

request.get(util.format(counties_pattern, state_fips, state), (err, code, body) => {
  Promise.all(parse(body).map(county => new Promise((resolve, reject) => {
    let countyCode = county[2];

    let tmp = util.format(vtd_temp_pattern, countyCode);
    return request.get(util.format(vtd_pattern, state_fips, countyCode))
      .pipe(unzip.Extract({ path: tmp }))
      .on("close", () =>
        shapefile.read(
          path.join(tmp, util.format("tl_2010_%s%s_vtd10.shp", state_fips, countyCode)),
          path.join(tmp, util.format("tl_2010_%s%s_vtd10.dbf", state_fips, countyCode))
        ).then(geojson => resolve(geojson)));
  })))
    .then(inputs => {
      let geojson = { type: 'FeatureCollection', features: [] };
      for (let input of inputs) {
        for (let feature of input.features) {
          if (feature.properties.VTDST10 !== "ZZZZZZ") geojson.features.push(feature);
        }
      }
      let topology = topojson.topology({ precincts: geojson });
      fs.writeFile("md.json", JSON.stringify(simplify.simplify(simplify.presimplify(topology))));
    });
});

// const data = fs.readFileSync("./data/moco-P3.csv");
// const blocks = parse(data).slice(2);
//
// const blockPopulations = {};
//
// for (let block of blocks) {
//   blockPopulations[block[0]] = {
//     'total': block[3],
//     'white': block[5],
//     'black': block[6],
//     'native': block[7],
//     'asian': block[8],
//     'pacific': block[9],
//     'other': block[10],
//     'two': block[11]
//   }
// }
//
// console.log(blockPopulations);
//
// shapefile.open("data/md/tl_2017_24_tabblock10.shp")
//   .then(source => source.read().then(geojson => {
//     console.log(geojson);
//     let blocks = topojson.topology(geojson);
//     console.log(blocks);
//     fs.writeFile("md-blocks.json", blocks);
//   }));
