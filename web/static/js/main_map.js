CM.Globals = {
  defaultLat: 42.375,
  defaultLng: -71.122
};

CM.initMap = function() {
  CM.MapboxMap.init();
}
CM.fontsReady = function() {


}

CM.Filters = new Vue({
  el: '.nav-filter',
  
  data: () => {
    return {
      ratings: 'all',
      days: 0,
      owned: false
    }
  },
  
  watch: {
    ratings(rating) {
      if (rating == "all") {
        $(".btn-filter-none").button("toggle");
        $(".btn-filter-none").click();
      } else if (rating == "bad") {
        $(".btn-filter-bad").button("toggle");
        $(".btn-filter-bad").click();
      } else if (rating == "good") {
        $(".btn-filter-good").button("toggle");
        $(".btn-filter-good").click();
      }
    },
    
    days(days) {
      
    },
    
    owned(owned) {
      
    }
  },
  
  mounted() {    
    $(".btn-filter-bad").click(() => {
      CM.MapboxMap.map.setFilter('snapshot-points', ['<=', 'rating', 2]);
    });
    $(".btn-filter-none").click(() => {
      CM.MapboxMap.map.setFilter('snapshot-points', null);
    });
    $(".btn-filter-good").click(() => {
      CM.MapboxMap.map.setFilter('snapshot-points', ['>=', 'rating', 4]);
    });
  }  
  
});

CM.ScrollSpy = function() {
  $(".sidebar > section").scrollspy({
    container: window,
    buffer: $(window).outerHeight() / 2,
    onEnter: (element, position) => {
      // console.log(['enter', element]);
      $(element).addClass('active');
      CM.MapboxMap.activateSectionFromScroll(element)
    },
    onLeave: (element, position) => {
      // console.log(['leave', element]);
      $(element).removeClass('active');
      // CM.MapboxMap.activateSectionFromScroll(element)
    },
    // onTick: (element, position, inside, enters, leaves) => {
    //   console.log(['onTick', element, position, inside, enters, leaves]);
    // }
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
      loadedSource: false,
      geodata: null
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
      $.getJSON("/record/snapshots_from_point.geojson", {
        lat: CM.Globals.defaultLat,
        lng: CM.Globals.defaultLng
      }, (geodata) => {
        this.geodata = geodata;
        this.map.addSource('snapshots', {
          'type': 'geojson',
          'data': geodata,
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
        this.addHeadingImage();
        $(window).resize(this.bindMouseSide.bind(this));
      });
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
              'case',
              ['boolean', ['feature-state', 'selected'], false],
              "rgb(255, 255, 255)",
              [
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
              ]
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
    
    addHeadingImage() {
      this.map.loadImage('/static/img/heading.png', (err, image) => {
        this.map.addImage('heading-image', image);
        this.map.addSource('heading', { type: 'geojson', data: {type: 'FeatureCollection', features: []} });
        this.map.addLayer({
          'id': 'headings',
          'type': 'symbol',
          'source': 'heading',
          'layout': {
            'icon-image': 'heading-image',
            'icon-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              9,
              0.1,
              15,
              0.5,
              17,
              1
            ],
            "icon-rotate": ["get", "heading"],
          }
        });
        this.updateHeading();
      });
    },
    
    updateHeading() {
      let heading = this.map.getSource('heading');
      if (!heading) return; // Not loaded yet
      
      if (this.activeSnapshot && this.activeSnapshot.properties.heading) {
        heading.setData({type: 'FeatureCollection', features: [
          this.activeSnapshot
        ]});
      } else {
        heading.setData({type: 'FeatureCollection', features: []});
      }
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
          { hover: false, selected: false }
        );
      }
      
      this.activeSnapshot = snapshot;
      clearTimeout(this.hideSnapshotTimeout);
      
      this.map.setFeatureState(
        { source: 'snapshots', id: this.activeSnapshot.properties.id },
        { hover: true }
      );
      
      this.updateHeading();
      this.displaySnapshotDetail();
    },
    
    deactivateSnapshot() {
      if (this.activeSnapshot) {
        this.map.setFeatureState(
          { source: 'snapshots', id: this.activeSnapshot.properties.id },
          { hover: false, selected: false }
        );
      }
      
      this.activeSnapshot = null;

      this.updateHeading();
      this.hideSnapshotDetail();
    },
    
    displaySnapshotDetail() {
      CM.SnapshotDetail.activeSnapshot = this.activeSnapshot;
      console.log(['Snapshot detail', this.activeSnapshot, CM.SnapshotDetail.activeSnapshot]);
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
        console.log(['Click', e.features]);
        this.flyToSnapshot(e.features[0]);
      });
    },
    
    flyToPhotoId(photoId, options) {
      console.log(['Flying to', photoId]);
      let feature = this.geodata.features.find((feature) => {
        return feature.id == photoId;
      });
      // let feature = CM.MapboxMap.map.querySourceFeatures('snapshots', {
      //   filter: ['==', 'id', photoId]
      // });
      
      if (!feature) {
        console.log(["Error, couldn't find photo feature", photoId]);
        this.loadedSource = false;
        return;
      }

      this.flyToSnapshot(feature, options);
    },
    
    flyToSnapshot(snapshot, options) {
      options = $.extend({}, {
        center: snapshot.geometry.coordinates,
        zoom: this.map.getZoom(),
        speed: 0.2
      }, options);
      setTimeout(() => {
        console.log(['Flying', options]);
        this.map.flyTo(options);
      }, 0);
      this.clickLocked = true;
      this.activateSnapshot(snapshot);
      this.map.setFeatureState(
        { source: 'snapshots', id: this.activeSnapshot.properties.id },
        { selected: true }
      );
      
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
    
    activateSectionFromScroll(sectionEl) {
      if ($(sectionEl).is("#sidebar-section-1")) {
        this.map.setFilter('snapshot-points', null);
        setTimeout(() => {
          this.map.flyTo({center: {
            lat: CM.Globals.defaultLat,
            lng: CM.Globals.defaultLng
          }, speed: 0.2, zoom: 15});
        }, 0);
        this.deactivateSnapshot();
        CM.Filters.ratings = "all";
      } else if ($(sectionEl).is("#sidebar-section-2")) {
        this.flyToPhotoId("-U9Wblf7N", {zoom: 17});
        CM.Filters.ratings = "good";
      } else if ($(sectionEl).is("#sidebar-section-3")) {
        this.flyToPhotoId("aAJ-l6wp", {zoom: 16});
        CM.Filters.ratings = "bad";
      } else if ($(sectionEl).is("#sidebar-section-4")) {
        this.flyToPhotoId("7I1g61mU", {zoom: 15});
        CM.Filters.ratings = "bad";
      } else if ($(sectionEl).is("#sidebar-section-5")) {
        this.flyToPhotoId("55_t_gSm", {zoom: 17});
        CM.Filters.ratings = "bad";
      }
    }
        
  }
});

CM.SnapshotDetail = new Vue({
  el: ".snapshot-detail-container",
  
  // data: () => {
  //   return {
  data: {
      activeSnapshot: null,
      topSide: false,
      leftSide: false
    // };
  },
  
  watch: {
    activeSnapshot(snapshot) {
      console.log(['Snapshot', snapshot, this.activeSnapshot, this]);
    }
  },
  
  methods: {
    
  }
  
});


Vue.filter('formatDate', function(value) {
  if (value) {
    return moment(String(value)).format('LLLL')
  }
});