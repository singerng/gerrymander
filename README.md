# gerrymander
An HTML5/D3 interactive mapping application for visualizing the results of gerrymandering. Centrally, the application lets you select a state, assign its *voting precincts* to *congressional districts* however you want, and then analyze the demographic and political characteristics of your new congressional map.

`index.js` is the client-side application. It loads `json` files containing map data and then visualizes them and allows the user to analyze the data.

`data.js` is a script for the server that downloads geographic data from the U.S. Census and then converts it to `json` files which can be statically served in the application.
