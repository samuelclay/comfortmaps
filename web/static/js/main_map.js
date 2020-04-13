CM.Globals = {
  defaultLat: 42.375,
  defaultLng: -71.122
};

CM.initMap = function() {
  CM.MapboxMap.init();
  CM.ScrollSpy();
}
CM.fontsReady = function() {


}

CM.ScrollSpy = function() {
  $(".sidebar > section").scrollspy({
    container: window,
    buffer: $(window).outerHeight() / 2,
    onEnter: (element, position) => {
      console.log(['enter', element, position]);
      $(element).addClass('active');
    },
    onLeave: (element, position) => {
      console.log(['leave', element, position]);
      $(element).removeClass('active');
    }
  });
  $(window).scroll();
}

CM.MapboxMap = new Vue({
  el: "#CM-main-map",
  
  data: () => {
    return {
      hoveredStateId: 0,
      activeSnapshot: null,
      map: null,
      clickLocked: false,
      hideSnapshotTimeout: null,
      filter: none
    };
  },
  // props: {
  //   hoveredStateId: String
  // },
  
  methods: {
    init() {      
      this.setupMap();
      this.map.on('load', this.mapLoad.bind(this));
    },
    
    setupMap() {
      mapboxgl.accessToken = 'pk.eyJ1Ijoic2NsYXkiLCJhIjoiY2szcTl2czU2MDlnejNldWd1ZnBrOW5wcyJ9.BdZP1b0mQlxRuK2UST4d7A';
      this.map = new mapboxgl.Map({
        container: 'CM-main-map',
        style: 'mapbox://styles/sclay/ck73tassr0wqw1inzezyxzs54',
        center: [CM.Globals.defaultLng, CM.Globals.defaultLat], // [long, lat]
        zoom: 15,
        pitchWithRotate: false
      });
      
      this.map.addControl(new mapboxgl.NavigationControl({
        showCompass: false
      }));
      
      // disable map zoom when using scroll
      this.map.scrollZoom.disable();
    },
    
    mapLoad() {
      const lat = CM.Globals.defaultLat;
      const lng = CM.Globals.defaultLng;
      this.map.addSource('snapshots', {
        'type': 'geojson',
        'data': "/record/snapshots_from_point.geojson?lat="+lat+"&lng="+lng,
        'promoteId': 'id'
      });
      
      // this.addHeatmap();
      this.addSnapshotPoints();
      this.bindHoverPhotos();
      this.bindClickPhoto();
      this.bindMouseSide();
      this.bindNavbar();
      $(window).resize(this.bindMouseSide.bind(this));
    },
    
    addHeatmap() {
      this.map.addLayer(
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
    
    addSnapshotPoints() {
      this.map.addLayer(
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
    
    bindHoverPhotos() {
      this.map.on('mousemove', 'snapshot-points', (e) => {
        if (e.features.length == 0) return;
        if (this.activeSnapshot && this.activeSnapshot.properties.id ==
          e.features[0].properties.id) return;
        if (this.clickLocked) return;

        this.activateSnapshot(e.features[0]);
      });
 
      // When the mouse leaves the state-fill layer, update the feature state of the
      // previously hovered feature.
      this.map.on('mouseleave', 'snapshot-points', () => {
        if (this.clickLocked) return;
        this.deactivateSnapshot();
      });
    },
    
    activateSnapshot(snapshot) {
      if (!snapshot.properties.photo_uploaded) return;
      
      if (this.activeSnapshot) {
        this.map.setFeatureState(
          { source: 'snapshots', id: this.activeSnapshot.properties.id },
          { hover: false }
        );
      }
      
      this.activeSnapshot = snapshot;
      clearTimeout(this.hideSnapshotTimeout);
      
      this.map.setFeatureState(
        { source: 'snapshots', id: this.activeSnapshot.properties.id },
        { hover: true }
      );
      
      this.displaySnapshotPhoto();
    },
    
    deactivateSnapshot() {
      if (this.activeSnapshot) {
        this.map.setFeatureState(
          { source: 'snapshots', id: this.activeSnapshot.properties.id },
          { hover: false }
        );
      }
      
      this.activeSnapshot = null;
      
      this.hideSnapshotPhoto();
    },
    
    displaySnapshotPhoto() {
      console.log(['displaySnapshotPhoto', this.activeSnapshot]);
      CM.SnapshotPhoto.activeSnapshot = this.activeSnapshot;
      this.$nextTick(() => {
        $(".snapshot-photo-container").addClass('active');
      });
    },
    
    hideSnapshotPhoto() {
      console.log(['hideSnapshotPhoto', this.activeSnapshot]);
      $(".snapshot-photo-container").removeClass('active');
      this.hideSnapshotTimeout = setTimeout(() => {
        if (this.activeSnapshot == null) {
          CM.SnapshotPhoto.activeSnapshot = null;
        }
      }, 1000);
    },
    
    bindClickPhoto() {      
      this.map.on('click', () => {
        console.log(['clickLocked?', this.clickLocked]);
        if (this.clickLocked) {
          this.clickLocked = false;
          this.deactivateSnapshot();
        }
      });
      
      this.map.on('click', 'snapshot-points', (e) => {
        this.map.flyTo({
          center: e.features[0].geometry.coordinates
        });
        this.clickLocked = !this.clickLocked;
        var snapshot = e.features[0];
        setTimeout(() => {
          CM.SnapshotPhoto.topSide = false;
          CM.SnapshotPhoto.leftSide = true;
          this.activateSnapshot(snapshot);
        }, 1000);
      });
    },
    
    bindMouseSide() {
      let $map = $("#CM-main-map");
      let sidebar = $(".sidebar").width();
      let navHeight = $(".navbar").height();
      let topHalf = ($map.height() / 2) + navHeight;
      let leftHalf = (($map.width() - sidebar) / 2);
      
      $(window).off('mousemove.mapposition').on('mousemove.mapposition', (e) => {
        var top = e.pageY - $(window).scrollTop();
        // console.log(['mouse', top, $map.height()/2, navHeight]);
        
        if (!this.clickLocked) {
          var topSide = topHalf >= top;
          var leftSide = sidebar + leftHalf >= e.pageX;;
          if (CM.SnapshotPhoto.topSide != topSide) 
            CM.SnapshotPhoto.topSide = topSide;
          
          if (CM.SnapshotPhoto.leftSide != leftSide) 
            CM.SnapshotPhoto.leftSide = leftSide
        } else {
          CM.SnapshotPhoto.topSide = false;
          CM.SnapshotPhoto.leftSide = true;
        }
      });
    },
    
    bindNavbar() {
      $(".btn-filter-bad").click(() => {
        this.filter = "bad";
        this.map.setFilter('snapshot-points', ['<=', 'rating', 2]);
      });
      $(".btn-filter-none").click(() => {
        this.filter = null;
        this.map.setFilter('snapshot-points', null);
      });
      $(".btn-filter-good").click(() => {
        this.filter = "good";
        this.map.setFilter('snapshot-points', ['>=', 'rating', 4]);
      });
    }
    
  }
});

CM.SnapshotPhoto = new Vue({
  el: ".snapshot-photo-container",
  
  data: () => {
    return {
      activeSnapshot: null,
      topSide: false,
      leftSide: false
    };
  },
  
  methods: {
    
  }
  
})