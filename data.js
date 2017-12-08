#!/usr/bin/node

const shapefile = require('shapefile');
const topojson = require('topojson-server');
const parse = require('csv-parse/lib/sync');
const console = require('console');
const fs = require('fs');

const data = fs.readFileSync("./data/moco-P3.csv");
const blocks = parse(data).slice(2);

const blockPopulations = {};

for (let block of blocks) {
  blockPopulations[block[0]] = {
    'total': block[3],
    'white': block[5],
    'black': block[6],
    'native': block[7],
    'asian': block[8],
    'pacific': block[9],
    'other': block[10],
    'two': block[11]
  }
}

console.log(blockPopulations);

// shapefile.open("data/md/tl_2017_24_tabblock10.shp")
//   .then(source => source.read().then(geojson => {
//     console.log(geojson);
//     let blocks = topojson.topology(geojson);
//     console.log(blocks);
//     fs.writeFile("md-blocks.json", blocks);
//   }));
