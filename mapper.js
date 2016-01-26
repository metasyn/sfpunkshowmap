// globals

var data;
var map;
var resp;
var geojson;
var organized;
var myLayer;
var overlays;
var filters;
var selectedDatesList;
var geoResponse;

// the scrape

var urls = "'http://www.foopee.com/punk/the-list/by-date.0.html', 'http://www.foopee.com/punk/the-list/by-date.1.html'";
var xpath = "//body/ul/li";
var query = "select * from html where url in (" + urls  + ") and xpath='" + xpath + "'";
var yql_url = "https://query.yahooapis.com/v1/public/yql?format=json&q=" + encodeURIComponent(query);


////////////
// foopee /
//////////

function get(url) {

  // Return a new promise.
  return new Promise(function(resolve, reject) {
  
  var req = new XMLHttpRequest();
  req.open('GET', url);

  req.onload = function() {
    if (req.status == 200) {
      resp = JSON.parse(req.response);
      organized = sortByDate(resp);
      resolve(console.log('Request success.'));;
    }
    else {
    reject(console.log(Error(req.statusText)));
    }
  };

  // Handle network errors
  req.onerror = function() {
    reject(Error("Network Error"));
  };

  req.send();
  });
}


////////////
// MAPBOX /
//////////

// defaults
function ModifiedClusterGroup() {
  return new L.MarkerClusterGroup({
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 1,
      spiderfyDistanceMultiplier: 3
      /* custom icons ?
      iconCreateFunction: function(cluster) {
        return L.mapbox.marker.icon({
          // show the number of markers in the cluster on the icon.
          'marker-symbol': cluster.getChildCount(),
          'marker-color': '#a0d6b4'
        });
      }
      */
    });
}


function setupMap(){
  // Return a new promise
  return new Promise(function(resolve, reject) {

    // easy to change online though if we suspect abuse
    L.mapbox.accessToken = 'pk.eyJ1IjoibWV0YXN5biIsImEiOiIwN2FmMDNhNTRhOWQ3NDExODI1MTllMDk1ODc3NTllZiJ9.Bye80QJ4r0RJsKj4Sre6KQ';

    // Init map
    map = L.mapbox.map('map', 'mapbox.dark', {
      maxZoom: 17
    })
      .setView([37.7600, -122.416], 13);

    // Locate me button
    L.control.locate().addTo(map);
  

    if (map) {
    resolve(console.log('Map is loaded.'));
    }
    else {
    reject(console.log(Error('Map not loaded!')));
    }
  });
}

// filters

function populateDates(organized){
  // grab form
  var form = document.getElementById('date-selector');
  var dates = Object.keys(organized);

  // lazy
  form.innerHTML = '<div>' 
  for (var d = 0; d < dates.length; d++){
    var le_radio = "<input type='checkbox' name='filters' onclick='showShows();' value='" + dates[d] +"' checked> " +  dates[d]
    form.innerHTML = form.innerHTML + le_radio
  }
  form.innerHTML += '</div>'
  filters = document.getElementById('date-selector').filters;
}



function showShows() {

    selectedDatesList = [];
    // first collect all of the checked boxes and create an array of strings
    for (var i = 0; i < filters.length; i++) {
        if (filters[i].checked) selectedDatesList.push(filters[i].value);
    }
    // then remove any previously-displayed marker groups
    overlays.clearLayers();
    // create a new marker group
    var clusterGroup = ModifiedClusterGroup().addTo(overlays);
    // and add any markers that fit the filtered criteria to that group.
    myLayer.eachLayer(function(layer) {
        if (selectedDatesList.indexOf(layer.feature.properties.date) !== -1) {
            clusterGroup.addLayer(layer);
        } 
    });

    // update coordinates box
    onmove()

}



////////////
// VENUES /
//////////

// Note: geojson requires lon-lat, not lat-lon.

lonlatDictionary = {
  '924 Gilman Street, Berkeley': [-122.2993211, 37.8795371],
  'Hemlock, S.F.': [-122.420301, 37.787356],
  'Chapel, S.F.': [-122.421198, 37.760528],
  'Regency Ballroom, S.F.': [ -122.421573, 37.787836],
  'Thee Parkside, S.F.': [-122.3999114, 37.765222],
  'El Rio, S.F.': [-122.4216143, 37.7468],
  'Knockout, S.F.': [-122.4221129, 37.7451999],
  'Bottom of the Hill, S.F.': [-122.3986239, 37.7649937],
  'Great American Music Hall, S.F.': [-122.4210104, 37.784807],
  'Fillmore, S.F.': [-122.4352607, 37.7839302],
  'Rickshaw Stop, S.F.': [-122.422641, 37.7760029],
  'Independent, S.F.': [-122.4398436, 37.7755465],
  'Civic Center, 99 Grove Street, S.F.': [-122.4195095, 37.7780757],
  'Masonic, S.F': [-122.4153748, 37.7912915],
  'Plough and Stars, 116 Clement St., S.F.': [-122.4627223, 37.7832646],
  'Monarch, 101 6th Street, S.F.': [-122.410645, 37.7810082],
  'Senator Theater, Chico': [-121.8397472, 39.728102],
  'Social Hall, S.F.': [-122.4234378, 37.7877708],
  'Bender\'s, S.F.': [-122.4194942, 37.7601859],
  'Fox Theater, Oakland': [-122.2722522, 37.8080016],
  'Night Light, Oakland':[-122.2781325, 37.7971539],
  'Stork Club, Oakland': [-122.2706259, 37.8131318],
  'Music City, 1353 Bush Street, S.F.' : [-122.4195814, 37.7885446],
  '518 Valencia, S.F.': [-122.4243926, 37.7644923],
  'Annex, 468 3rd Street, Oakland': [-122.2766342, 37.7972863],
  'Honey Hive Gallery, 4117 Judah Street, S.F.': [-122.5063551, 37.7601905],
  'Institute for Integral Studies, 1453 Mission Street, S.F.': [-122.4185198, 37.7746224],
  'Artist\'s Television Access, 992 Valencia St., S.F.': [-122.4236529, 37.7570751],
  'New Parish, Oakland': [-122.2747969, 37.8076511],
  'Bimbo\'s 365 Club, S.F.': [-122.4155251, 37.8037564],
  'Elbo Room, S.F.': [-122.4215391, 37.7625099],
  'Slim\'s, S.F.': [-122.4154437, 37.7714655],
  'Brick and Mortar, S.F.': [-122.4226282, 37.7697351],
  'Catalyst Atrium, Santa Cruz': [-122.0259175, 36.9712949],
  'Sweetwater Music Hall, Mill Valley': [-122.550201, 37.9069745],
  'Harlow\'s, Sacramento': [-121.4701893, 38.573828],
  'Catalyst, Santa Cruz': [-122.0281115, 36.9712992],
  'Caravan Lounge, San Jose': [-121.8946633, 37.3329336]
}

/////////////
// helpers /
///////////

function sortByDate(j){

  data = j['query']['results']['li'];

  organized = {}

  // loop through dates
  for (var i = 0; i < data.length; i++){

    organized[data[i]['a']['b']] = [];


    if (data[i]['ul']['li'].length == undefined){
      data[i]['ul']['li'] = Array(data[i]['ul']['li'])
    }

    // loop through shows
    for (var showIndex = 0; showIndex < data[i]['ul']['li'].length; showIndex++) { 

      var show = data[i]['ul']['li'][showIndex];
      var venue = show['b']['a']['content'];
      var details = show['content'] === undefined ? '' : show['content'].slice(0, -1); // new line at the end
      var lineup = show['a'];

      // In case its a single artist, we need to make an array
      var bands = (lineup.length) ? [] : [lineup['content']]

      // loop through bands
      for (var bandIndex = 0; bandIndex < lineup.length; bandIndex++){
        bands.push(lineup[bandIndex]['content'])
      }

      organized[data[i]['a']['b']].push({
        'venue': venue,
        'date' : data[i]['a']['b'],
        'details': details,
        'bands': bands
      });
    }
  }
  return organized
}



function geojsonify(data){
  // this function returns a geojson object

  var features = []
  var dateKeys = Object.keys(data)

  // loop through dates
  for (var i = 0; i < dateKeys.length; i++){

    // loop through shows
    for (var j = 0; j < data[dateKeys[i]].length; j++){

      var show = {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": lonlatDictionary[data[dateKeys[i]][j]['venue']] || [-122.422960, 37.826524]},
        "properties": {
          "date": dateKeys[i],
          "venue": data[dateKeys[i]][j]['venue'],
          "bands": data[dateKeys[i]][j]['bands'],
          "details": data[dateKeys[i]][j]['details'].replace(/ ,/g, ''), // fucking commas
          'marker-color': '#33CC33', //+Math.floor(Math.random()*16777215).toString(16), //random colors !
          'marker-size': 'large',
          'marker-symbol': 'music'
        }
      }

      // add show to features array
      features.push(show)

    }
  }

  // format for valid geojson
  var geojson = { "type": "FeatureCollection", "features": features }
  return geojson
}



function plotShows(json){

  return new Promise(function(resolve, reject){


    // update function for coordinates infobox
    window.onmove = function onmove() {
      // Get the map bounds - the top-left and bottom-right locations.
      var inBounds = [],
      bounds = map.getBounds();
      clusterGroup.eachLayer(function(marker) {
        // For each marker, consider whether it is currently visible by comparing
        // with the current map bounds.
        if (bounds.contains(marker.getLatLng()) && selectedDatesList.indexOf(marker.feature.properties.date) !== -1) {
            var feature = marker.feature;
            var coordsTemplate = L.mapbox.template('{{properties.date}} - {{properties.venue}} |{{#properties.bands}} {{.}} |{{/properties.bands}}{{properties.details}}', feature)
            inBounds.push(coordsTemplate);
        }
      });
      // Display a list of markers.
      document.getElementById('coordinates').innerHTML = inBounds.join('\n');
    }


    // get that geojson
    geojson = geojsonify(sortByDate(json));

    // attach data
    myLayer = L.mapbox.featureLayer(geojson)

    // make clustergroup
    var clusterGroup = ModifiedClusterGroup();
    // add features
    clusterGroup.addLayer(myLayer);
    overlays = L.layerGroup().addTo(map);
    // add cluster layer
    // overlays are multiple layers
    // add in showShows()
    showShows();

    // for each layer in feature layer
    myLayer.eachLayer(e => {

      var marker = e;
      var feature = e.feature;
        
      // Create custom popup content
      var popupContent = L.mapbox.template('<h1> {{properties.venue}} </h1><br><h3> {{properties.date}} </h3><br><h2> {{#properties.bands}} - {{.}} <br> {{/properties.bands}} </h2><br><h2> {{properties.details}} </h2><br>', feature)

      marker.bindPopup(popupContent,{
        closeButton: true,
        minWidth: 320
      });
    });




    map.on('move', onmove);
    // call onmove off the bat so that the list is populated.
    // otherwise, there will be no markers listed until the map is moved.
    window.onmove();


    if (geojson){
      resolve(console.log('Shows plotted.'))
    }
    else { 
      reject(console.log(Error('Shows cannot be plotted.')));
    }
  });
}

////////////////
// vex modal //
///////////////

vex.defaultOptions.className = 'vex-theme-flat-attack';


function modalPop(){  
  var modalMessage = $('#modal-template').html();
  $('#q').on("click hover", vex.dialog.alert(modalMessage))
}


///////////////////
// control logic /
/////////////////

  get(yql_url).then(resolve => {
    try {
      setupMap(); 
    } catch(err) {vex.dialog.alert('OH SHIT SOMETHINGS BROKEN. The List could be down, rawgit could be mad, or my code could be broken.')}
    populateDates(organized); 
    plotShows(resp); 
    modalPop();
  })



///////////////
// gmaps api /
/////////////

// Note: I don't think I want to use these because they were pretty inacurate when using the venue descriptions
// from foopee. But I'm going to leave them here in case they get used as a catchall once the locations are all
// added to the lonlat dictionary.


function fetchGeo(venue){

  return new Promise(function(resolve, reject){

    // api key
    var apiKey = "AIzaSyDCyj1LQMqFPcQhgfW92vR8BtXhlDIvF-4";
    // request
    var geocoder = "https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURIComponent(venue) + "&key=" + apiKey;
    
    //clear
    geoResponse = '';

    $.getJSON(geocoder, function(response){
      
      if (response){
        geoResponse = response;
        resolve(console.log('Looked up venue.'))
      }
      else { 
        reject(console.log(Error('Venue lookup failure.')));
      }
    })
  })
}

function getLonLat(venue){

  fetchGeo(venue).then(resolve =>{
    geoResponse = [geoResponse.results[0].geometry.location.lng, geoResponse.results[0].geometry.location.lat]
  })
}



