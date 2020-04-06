CM.Globals = {
  defaultLat: 42.375,
  defaultLng: -71.115
};

CM.initMap = function() {
  CM.MapboxMap.init();
}

CM.MapboxMap = new Vue({
  el: ".CM-main-map",
  
  methods: {
    init: function() {
      mapboxgl.accessToken = 'pk.eyJ1Ijoic2NsYXkiLCJhIjoiY2szcTl2czU2MDlnejNldWd1ZnBrOW5wcyJ9.BdZP1b0mQlxRuK2UST4d7A';
      var map = new mapboxgl.Map({
          container: 'map',
          style: 'mapbox://styles/sclay/ck73tassr0wqw1inzezyxzs54',
          center: [CM.Globals.defaultLng, CM.Globals.defaultLat], // [long, lat]
          zoom: 15
      });
      
      // this.disableScroll(map);
      map.on('load', this.mapLoad.bind(this, map));
    },
    
    disableScroll: function(map) {
      // disable map zoom when using scroll
      map.scrollZoom.disable();
    },
    
    mapLoad: function(map) {
      const lat = CM.Globals.defaultLat;
      const lng = CM.Globals.defaultLng;
      map.addSource('snapshots', {
        'type': 'geojson',
        'data': "/record/snapshots_from_point.geojson?lat="+lat+"&lng="+lng
      });
      
      // this.addHeatmap(map);
      this.addSnapshotPoints(map);
    },
    
    addHeatmap: function(map) {
      map.addLayer(
        {
          'id': 'snapshots-heat',
          'type': 'heatmap',
          'source': 'snapshots',
          'maxzoom': 22,
          'paint': {
            // Increase the heatmap weight based on frequency and property magnitude
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'mag'],
              0,
              0,
              6,
              1
            ],
            // Increase the heatmap color weight weight by zoom level
            // heatmap-intensity is a multiplier on top of heatmap-weight
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0,
              1,
              22,
              3
            ],
            // Color ramp for heatmap.  Domain is 0 (low) to 1 (high).
            // Begin color ramp at 0-stop with a 0-transparancy color
            // to create a blur-like effect.
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0,
              'rgba(186,56,51,0.5)',
              0.2,
              'rgb(186,110,102)',
              0.4,
              'rgb(255, 227, 136)',
              0.6,
              'rgb(100, 204, 64)',
              1,
              'rgb(48, 204, 76)'
            ],
            // Adjust the heatmap radius by zoom level
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0,
              40,
              22,
              40
            ],
            // Transition from heatmap to circle layer by zoom level
            'heatmap-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              12,
              1,
              22,
              0.5
            ]
          }
        },
        'waterway-label'
      );
    },
    
    addSnapshotPoints: function(map) {
      map.addLayer(
        {
          'id': 'snapshots-point',
          'type': 'circle',
          'source': 'snapshots',
          'minzoom': 7,
          'paint': {
            // Size circle radius by earthquake magnitude and zoom level
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              9,
              1,
              15,
              10,
              17,
              19
            ],
            // Color circle by earthquake magnitude
            'circle-color': [
              'interpolate',
              ['linear'],
              ['get', 'rating'],
              1,
              'rgb(186,56,51)',
              2,
              'rgb(186,110,102)',
              3,
              'rgb(255, 227, 136)',
              4,
              'rgb(100, 204, 64)',
              5,
              'rgb(48, 204, 76)'
            ],
            'circle-stroke-color': 'white',
            'circle-stroke-width': 0,
            // Transition from heatmap to circle layer by zoom level
            'circle-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              7,
              0,
              8,
              1
            ]
          }
        },
        'waterway-label'
      );
    }
  }
});