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
var query = "select * from htmlstring where url in (" + urls + ") and xpath='" + xpath + "'";
var yql_url = "https://query.yahooapis.com/v1/public/yql?format=json&q=" + encodeURIComponent(query) + "&format=json&env=store%3A%2F%2Fdatatables.org%2Falltableswithkeys";


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
            } else {
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


function setupMap() {
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
        } else {
            reject(console.log(Error('Map not loaded!')));
        }
    });
}

// filters

function populateDates(organized) {
    // grab form
    var form = document.getElementById('date-selector');
    var dates = Object.keys(organized);

    // lazy
    form.innerHTML = '<div>'
    for (var d = 0; d < dates.length; d++) {
        var le_radio = "<input type='checkbox' name='filters' onclick='showShows();' value='" + dates[d] + "' checked> " + dates[d]
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
    onmove();

}



////////////
// VENUES /
//////////

// Note: geojson requires lon-lat, not lat-lon.

lonlatDictionary = {
    '924 Gilman Street, Berkeley': [-122.2993211, 37.8795371],
    'DNA Lounge, S.F.': [122.4126746, 37.7710559],
    'Eagle, S.F.': [122.4133666, 37.7700044],
    'Jazzschool, 2087 Addison Street, Berkeley': [122.2709651, 37.8712507],
    'Warfield, S.F.': [122.4123447, 37.782739],
    'Neck of the Woods, S.F.': [122.4657314, 37.784179],
    'Lost Church, 65 Capp, S.F.': [122.418409, 37.765783],
    'Starline Social Club, 2232 MLK, Oakland': [122.27253, 37.8122828],
    'Second Act, 1727 Haight Street, S.F.': [122.4534067, 37.769298],
    'Amoeba Music, S.F.': [122.4548087, 37.768922],
    'Lobot Gallery, 1800 Campbell St., Oakland': [122.2948787, 37.814835],
    'Civic Center, S.F.': [-122.4195095, 37.7780757],
    'Amnesia, S.F.': [122.4233043, 37.75931],
    'Amnesia, 853 Valencia at 20th, S.F.': [122.4233043, 37.75931],
    'Crate, 420 14th Street, Oakland': [-122.2703209, 37.8042683],
    'Golden Bull, Oakland': [122.2724634, 37.8042002],
    'Metro, Oakland': [122.2777909, 37.797058],
    'Mezzanine, S.F.': [122.4102674, 37.7825541],
    'UC Theater, Berkeley': [122.2719536, 37.8718207],
    'Legionnaire Saloon, Oakland': [122.2708187, 37.8123826],
    'Merchants Saloon, 401 2nd Street, Oakland': [122.2775095, 37.7954984],
    'Masonic, S.F.': [-122.4153747, 37.791287],
    'Hemlock, S.F.': [-122.420301, 37.787356],
    'Chapel, S.F.': [-122.421198, 37.760528],
    'Regency Ballroom, S.F.': [-122.421573, 37.787836],
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
    'Night Light, Oakland': [-122.2781325, 37.7971539],
    'Stork Club, Oakland': [-122.2706259, 37.8131318],
    'Music City, 1353 Bush Street, S.F.': [-122.4195814, 37.7885446],
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
    'Caravan Lounge, San Jose': [-121.8946633, 37.3329336],
    'Public Works, 161 Erie Street at Mission, S.F.': [-122.4194268, 37.7688759],
    'Greek Theater, UC Berkeley Campus': [-122.2566602, 37.8735759],
    'El Rey Theater, Chico': [-121.8441985, 39.7295038],
    'Hatch, 402 15th Street, Oakland': [-122.2717416, 37.8050561],
    'Octopus Literary Salon, Oakland': [-122.2676085, 37.8104379],
    'Milk Bar, 1840 Haight St., S.F.': [-122.4548054, 37.7695363],
    'Starline Social Club, Oakland': [-122.272508, 37.812282],
    'Sharon Meadow, Golden Gate Park, S.F.': [-122.4576422, 37.7680894],
    'Robert Mondavi Winery, Oakville': [-122.4096888, 38.4414921],
    'Plough and Stars, S.F.': [-122.4605347, 37.7832657],
    'Planet Gemini, 2110 Fremont Street, Monterey': [-121.861826, 36.595963],
    'Phoenix Theater, Petaluma': [-122.6430667, 38.2348794],
    'Cornerstone, Berkeley': [-122.2671952, 37.8663488],
    'Yoshi\'s, Oakland': [-122.2785532, 37.796237],
    'Streetlight Records, Santa Cruz': [-122.0253594, 36.9707881],
    'Maltese, 1600 Park Avenue, Chico': [-121.8271249, 39.7212474],
    'Cafe du Nord, S.F.': [-122.4304562, 37.7667174],
    'Shoreline Amphitheater, Mountain View': [-122.080765, 37.4268879],
    'Eli\'s Mile High Club, Oakland': [-122.269671, 37.825786],
    'Rite Spot, S.F.': [-122.4149695, 37.7638409],
    
};

/////////////
// helpers /
///////////

function parseHTMLToDOM(j){
    var res = j['query']['results']['result'];
    var results = res.join('\n');

    // array of dates
    p = new DOMParser();
    results = p.parseFromString(results, 'text/html');
    $results = $(results);

    return $results;
}

function sortByDate(j) {

    $results = parseHTMLToDOM(j);

    // grab the dates to use as keys
    dates = $results.find('body > li > a').map(function() {
        return $.trim(this.text);
    }).get();

    organized = {};

    for (var i = 0; i < dates.length; i++) {

        // empty date
        organized[dates[i]] = [];

        // Array is zero indexed but nth-child starts at 1
        var $shows = $results.find('body > li:nth-child(' + i + 1 + ')').find('li');

        for (var si = 0; si < $shows.length; si++) {

            // god save us all, i'm so sorry
            var things= $($shows[si]).find('a').map(function() {
                return $.trim(this.text);
            }).get();

            // really, I am
            var venue = things.shift();
            var bands = things;
            var deets = $.trim($shows[si].innerText.split('\n').slice(-3, -2));
            
            organized[dates[i]].push({
                'venue': venue,
                'date': dates[i],
                'details': deets,
                'bands': bands,
            });
        }
    }

    // lol "organized"
    return organized;
}


// Compute the edit distance between the two given strings
function getEditDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    var matrix = [];

    // increment along the first column of each row
    var i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // increment each column in the first row
    var j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                    Math.min(matrix[i][j - 1] + 1, // insertion
                        matrix[i - 1][j] + 1)); // deletion
            }
        }
    }

    return matrix[b.length][a.length];
};


function geojsonify(data) {
    // this function returns a geojson object

    var features = []
    var dateKeys = Object.keys(data)

    // loop through dates
    for (var i = 0; i < dateKeys.length; i++) {

        // loop through shows
        for (var j = 0; j < data[dateKeys[i]].length; j++) {


            var showData = data[dateKeys[i]][j];
            var venueList = Object.keys(lonlatDictionary);

            // check for misspellings
            if (!lonlatDictionary[showData['venue']]) {
                try {
                    for (var v = 0; v < venueList.length; v++) {
                        var misspelled = showData['venue'].replace(/\W/g, '')
                        var spelledCorrect = venueList[v].replace(/\W/g, '')
                        var editDistance = getEditDistance(misspelled, spelledCorrect);
                        if (editDistance <= 3) {
                            console.log('"' + showData['venue'] + '" has been replaced with "' + venueList[v] + '"');
                            showData['venue'] = venueList[v];
                        }
                    }
                } catch (e) {
                    console.log('Missing Venue?', e);
                }
            }

            var show = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": lonlatDictionary[showData['venue']] || [-122.422960, 37.826524]
                },
                "properties": {
                    "date": dateKeys[i],
                    "venue": showData['venue'],
                    "bands": showData['bands'],
                    "details": showData['details'].replace(/ ,/g, ''), // fucking commas
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
    var geojson = {
        "type": "FeatureCollection",
        "features": features
    }
    return geojson
}



function plotShows(json) {

    return new Promise(function(resolve, reject) {


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
            inBounds.reverse()
            document.getElementById('coordinates').innerHTML = inBounds.join('\n');
        }


        // get that geojson
        geojson = geojsonify(organized);

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
        myLayer.eachLayer(function(e) {

            var marker = e;
            var feature = e.feature;

            // Create custom popup content
            var popupContent = L.mapbox.template('<h1> {{properties.venue}} </h1><br><h3> {{properties.date}} </h3><br><h2> {{#properties.bands}} - {{.}} <br> {{/properties.bands}} </h2><br><h2> {{properties.details}} </h2><br>', feature)

            marker.bindPopup(popupContent, {
                closeButton: true,
                minWidth: 320
            });
        });




        map.on('move', onmove);
        // call onmove off the bat so that the list is populated.
        // otherwise, there will be no markers listed until the map is moved.
        window.onmove();


        if (geojson) {
            resolve(console.log('Shows plotted.'))
        } else {
            reject(console.log(Error('Shows cannot be plotted.')));
        }
    });
}


function toggleDate(desc) {
    for (var i = 0; i < filters.length; i++) {

        if (desc == 'today') {
            var day = Date().slice(0, 10) // this gives us the foopee time format
        } else if (desc == 'tomorrow') {
            var d = new Date();
            var day = new Date(((d.getTime() / 1000) + (60 * 60 * 24)) * 1000); // milliseconds not seconds
            day = day.toString().slice(0, 10);
        }

        // lol, so foopee puts its date with no zero padding:
        if (day) {
            var day_list = day.split(' ');
            day_list[2] = String(parseInt(day_list[2]));
            day = day_list.join(' ');
        }

        if (filters[i].value == day) {
            filters[i].checked = 1;
        } else {
            filters[i].checked = 0;
        }

        if (desc == 'all') {
            filters[i].checked = 1
        }
    }

    // update
    showShows();

}
////////////////
// vex modal //
///////////////

vex.defaultOptions.className = 'vex-theme-flat-attack';


function modalPop() {
    var modalMessage = $('#modal-template').html();
    $('#q').on("click hover", vex.dialog.alert(modalMessage))
}


///////////////////
// control logic /
/////////////////

get(yql_url).then(function(resolve) {
    try {
        setupMap();
    } catch (err) {
        vex.dialog.alert('OH SHIT SOMETHINGS BROKEN. The List could be down, rawgit could be mad, or my code could be broken.')
    }
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


function fetchGeo(venue) {

    return new Promise(function(resolve, reject) {

        // api key
        var apiKey = "AIzaSyDCyj1LQMqFPcQhgfW92vR8BtXhlDIvF-4";
        // request
        var geocoder = "https://maps.googleapis.com/maps/api/geocode/json?address=" + encodeURIComponent(venue) + "&key=" + apiKey;

        //clear
        geoResponse = '';

        $.getJSON(geocoder, function(response) {

            if (response) {
                geoResponse = response;
                resolve(console.log('Looked up venue.'))
            } else {
                reject(console.log(Error('Venue lookup failure.')));
            }
        })
    })
}

function getLonLat(venue) {

    fetchGeo(venue).then(function(resolve) {
        geoResponse = [geoResponse.results[0].geometry.location.lng, geoResponse.results[0].geometry.location.lat]
    })
}
