CM.Globals = {
  defaultLat: 42.375,
  defaultLng: -71.115
};

CM.initMap = function() {
  CM.MapboxMap.init();
}

CM.MapboxMap = new Vue({
  el: ".CM-main-map",
  
  data: {
    hoveredStateId: 0
  },
  // props: {
  //   hoveredStateId: String
  // },
  
  methods: {
    init() {
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
    
    disableScroll(map) {
      // disable map zoom when using scroll
      map.scrollZoom.disable();
    },
    
    mapLoad(map) {
      const lat = CM.Globals.defaultLat;
      const lng = CM.Globals.defaultLng;
      map.addSource('snapshots', {
        'type': 'geojson',
        'data': "/record/snapshots_from_point.geojson?lat="+lat+"&lng="+lng,
        'promoteId': 'id'
      });
      
      // this.addHeatmap(map);
      this.addSnapshotPoints(map);
      this.addHoverPhotos(map);
    },
    
    addHeatmap(map) {
      map.addLayer(
        {
          'id': 'snapshots-heatmap',
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
    
    addSnapshotPoints(map) {
      map.addLayer(
        {
          'id': 'snapshot-points',
          'type': 'circle',
          'source': 'snapshots',
          'minzoom': 1,
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
              "step",
              ["get", "rating"],
              "rgb(186,56,51)",
              2,
              "rgb(186,110,102)",
              3,
              "rgb(255, 227, 136)",
              4,
              "rgb(100, 204, 64)",
              5,
              "rgb(48, 204, 76)"
            ],
            'circle-stroke-color': [
              "step",
              ["get", "rating"],
              "rgb(186,56,51)",
              2,
              "rgb(186,110,102)",
              3,
              "rgb(255, 227, 136)",
              4,
              "rgb(100, 204, 64)",
              5,
              "rgb(48, 204, 76)"
            ],
            'circle-stroke-width': 3,
            'circle-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              1,
              0.1
            ],
            'circle-opacity-transition': {
              "duration": 3000,
              "delay": 0
            },
            'circle-stroke-opacity': [
              "case",
              [
                "==",
                ["get", "photo_uploaded"],
                true
              ],
              1,
              0
            ]
          }
        },
        'waterway-label'
      );
    },
    
    addHoverPhotos(map) {
      map.on('mousemove', 'snapshot-points', (e) => {
        if (e.features.length > 0) {
          if (this.hoveredStateId) {
            map.setFeatureState(
              { source: 'snapshots', id: this.hoveredStateId },
              { hover: false }
            );
          }
          this.hoveredStateId = e.features[0].properties.id;
          map.setFeatureState(
            { source: 'snapshots', id: this.hoveredStateId },
            { hover: true }
          );
        }
      });
 
      // When the mouse leaves the state-fill layer, update the feature state of the
      // previously hovered feature.
      map.on('mouseleave', 'snapshot-points', () => {
        if (this.hoveredStateId) {
          map.setFeatureState(
            { source: 'snapshots', id: this.hoveredStateId },
            { hover: false }
          );
        }
        this.hoveredStateId = null;
      });
    }
  }
});