CM.Globals = {
  defaultLat: 42.375,
  defaultLng: -71.122
};

CM.initMap = function() {
  CM.MapboxMap.init();
}
CM.fontsReady = function() {


}

CM.ScrollSpy = function() {
  $(".sidebar > section").scrollspy({
    container: window,
    buffer: $(window).outerHeight() / 2,
    onEnter: (element, position) => {
      console.log(['enter', element]);
      $(element).addClass('active');
      CM.MapboxMap.activateSectionFromScroll(element)
    },
    onLeave: (element, position) => {
      // console.log(['leave', element]);
      $(element).removeClass('active');
      // CM.MapboxMap.activateSectionFromScroll(element)
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
      filter: null,
      loadedSource: false
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
      
      this.map.on('sourcedata', (data) => {
        if (this.loadedSource) {
          // console.log(['Already loaded source, ignoring new sourcedata', data]);
          return;
        }
        if (this.map.getSource('snapshots') && data.isSourceLoaded) {
          this.loadedSource = true;
          CM.ScrollSpy();
        }
      });
      this.addSnapshotPoints();
      this.bindHoverPhotos();
      this.bindClickPhoto();
      this.bindMouseSide();
      this.bindNavbar();
      $(window).resize(this.bindMouseSide.bind(this));
    },
    
    addSnapshotPoints() {
      this.map.addLayer(
        {
          'id': 'snapshot-points',
          'type': 'circle',
          'source': 'snapshots',
          'minzoom': 1,
          'paint': {
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

            // Circle color
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
            'circle-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              1,
              0.1
            ],
            'circle-opacity-transition': {
              "duration": 1000
            },
            
            // Stroke
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
      
      this.displaySnapshotDetail();
    },
    
    deactivateSnapshot() {
      if (this.activeSnapshot) {
        this.map.setFeatureState(
          { source: 'snapshots', id: this.activeSnapshot.properties.id },
          { hover: false }
        );
      }
      
      this.activeSnapshot = null;
      
      this.hideSnapshotDetail();
    },
    
    displaySnapshotDetail() {
      console.log(['Snapshot detail', this.activeSnapshot]);
      CM.SnapshotDetail.activeSnapshot = this.activeSnapshot;
      this.$nextTick(() => {
        $(".snapshot-detail-container").addClass('active');
      });
    },
    
    hideSnapshotDetail() {
      console.log(['hideSnapshotDetail', this.activeSnapshot]);
      $(".snapshot-detail-container").removeClass('active');
      this.hideSnapshotTimeout = setTimeout(() => {
        if (this.activeSnapshot == null) {
          CM.SnapshotDetail.activeSnapshot = null;
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
        this.flyToSnapshot(e.features[0]);
      });
    },
    
    flyToSnapshot(snapshot) {
      this.map.flyTo({
        center: snapshot.geometry.coordinates,
        speed: 0.2
      });
      this.clickLocked = true;
      this.activateSnapshot(snapshot);
      
      if (CM.SnapshotDetail.topSide && CM.SnapshotDetail.rightSide) {
        setTimeout(() => {
          CM.SnapshotDetail.topSide = true;
          CM.SnapshotDetail.leftSide = true;
        }, 1000);
      } else {
        CM.SnapshotDetail.topSide = false;
        CM.SnapshotDetail.leftSide = true;
      }
    },
    
    flyToPhotoId(photoId) {
      console.log(['Flying to', photoId]);
      let feature = CM.MapboxMap.map.querySourceFeatures('snapshots', { 
        filter: ['==', 'id', photoId] 
      });
      
      if (!feature || !feature.length) {
        console.log(["Error, couldn't find photo feature", photoId]);
        this.loadedSource = false;
        return;
      }

      this.flyToSnapshot(feature[0]);
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
          if (CM.SnapshotDetail.topSide != topSide) 
            CM.SnapshotDetail.topSide = topSide;
          
          if (CM.SnapshotDetail.leftSide != leftSide) 
            CM.SnapshotDetail.leftSide = leftSide
        } else {
          CM.SnapshotDetail.topSide = false;
          CM.SnapshotDetail.leftSide = true;
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
    },
    
    activateSectionFromScroll(sectionEl) {
      if ($(sectionEl).is("#sidebar-section-2")) {
        this.flyToPhotoId("aAJ-l6wp");
      } else if ($(sectionEl).is("#sidebar-section-3")) {
        this.flyToPhotoId("55_t_gSm");
      } else if ($(sectionEl).is("#sidebar-section-4")) {
        this.flyToPhotoId("7I1g61mU");
      }
    }
        
  }
});

CM.SnapshotDetail = new Vue({
  el: ".snapshot-detail-container",
  
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