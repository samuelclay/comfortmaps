CM.initMap = function() {
  CM.MapboxMap.init();
}
CM.fontsReady = function() {


}

CM.ScrollDown = new Vue({
  el: '.scroll-down',
  
  methods: {
    scrollDown() {
      let nextSectionPos = $("#sidebar-section-2").position().top;
      $('body').animate({scrollTop: nextSectionPos - 48}, 2000)
    }
  }
});

CM.Account = new Vue({
  el: '.nav-account',
  
  data: () => {
    return {

    }
  },
  
  watch: {

  },
  
  mounted() {    
    $("#input-account-email").on('focus', () => {
      // $(".nav-account .dropdown-toggle").dropdown('toggle');
      // return true;
    });
    $("#input-account-email").on('blur', () => {
      // $(".nav-account .dropdown-toggle").dropdown('toggle');
      // return true;
    });
  }  
  
});

CM.Filters = new Vue({
  el: '.nav-filter',
  
  data: () => {
    return {
      ratings: 'all',
      days: 0,
      ownership: 'all',
      recency: 'all'
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
      } else if (rating == "none") {
        this.updateFilter();
      }
    },
    
    days(days) {
      
    },
    
    ownership(ownership) {
      if (ownership == 'all') {
        $(".btn-ownership-all").button("toggle");
        $(".btn-ownership-all").click();
      } else if (ownership == 'self') {
        $(".btn-ownership-self").button("toggle");
        $(".btn-ownership-self").click();
      }
    },
    
    recency(recency) {
      if (recency == 'all') {
        $(".btn-recency-all").button("toggle");
        $(".btn-recency-all").click();
      } else if (recency == 'week') {
        $(".btn-recency-week").button("toggle");
        $(".btn-recency-week").click();
      }
    }
  },
  
  mounted() {    
    $(".btn-filter-bad").click(() => {
      this.ratings = 'bad';
      this.updateFilter();
    });
    $(".btn-filter-none").click(() => {
      this.ratings = 'all';
      this.updateFilter();
    });
    $(".btn-filter-good").click(() => {
      this.ratings = 'good';
      this.updateFilter();
    });
    
    $(".btn-ownership-all").click(() => {
      this.ownership = 'all';
      this.updateFilter();
    });
    $(".btn-ownership-self").click(() => {
      this.ownership = 'self';
      this.updateFilter();
    });   
    
    $(".btn-ownership-all").click(() => {
      this.ownership = 'all';
      this.updateFilter();
    });
    $(".btn-ownership-self").click(() => {
      this.ownership = 'self';
      this.updateFilter();
    });
  },
  
  methods: {
    updateFilter() {
      var filters = ['all'];
      let hidden = 0.05;

      if (this.ratings == 'good') {
        filters.push(['<=', 'rating', 2]);
        CM.MapboxMap.map.setPaintProperty('snapshot-points-good', 'circle-opacity', 1);
        CM.MapboxMap.map.setPaintProperty('snapshot-points-neutral', 'circle-opacity', hidden);
        CM.MapboxMap.map.setPaintProperty('snapshot-points-bad', 'circle-opacity', hidden);
      } else if (this.ratings == 'bad') {
        filters.push(['>=', 'rating', 4]);
        CM.MapboxMap.map.setPaintProperty('snapshot-points-good', 'circle-opacity', hidden);
        CM.MapboxMap.map.setPaintProperty('snapshot-points-neutral', 'circle-opacity', hidden);
        CM.MapboxMap.map.setPaintProperty('snapshot-points-bad', 'circle-opacity', 1);
      } else if (this.ratings == 'all') {
        CM.MapboxMap.map.setPaintProperty('snapshot-points-good', 'circle-opacity', 1);
        CM.MapboxMap.map.setPaintProperty('snapshot-points-neutral', 'circle-opacity', 1);
        CM.MapboxMap.map.setPaintProperty('snapshot-points-bad', 'circle-opacity', 1);
      } else if (this.ratings == 'none') {
        filters.push(['>', 'rating', 5]);
        CM.MapboxMap.map.setPaintProperty('snapshot-points-good', 'circle-opacity', 0);
        CM.MapboxMap.map.setPaintProperty('snapshot-points-neutral', 'circle-opacity', 0);
        CM.MapboxMap.map.setPaintProperty('snapshot-points-bad', 'circle-opacity', 0);
      }
      
      if (this.ownership == 'self') {
        filters.push(['==', 'email_hash', CM.Globals.emailHash]);
      }
      
      // console.log('Filters', filters, this.ratings, this.ownership);
      _.each(this.geodata, (features, rating) => {
        CM.MapboxMap.map.setFilter('snapshot-points-'+rating, filters);
      });
    }
  }
  
});

CM.ScrollSpy = function() {
  let buffer = $(window).outerHeight() / 2;
  
  $(".sidebar > section").scrollspy({
    container: window,
    buffer: buffer,
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
    onTick: (element, position, inside, enters, leaves) => {
      // console.log(['onTick', position.top, $(".sidebar .section-scroller-fixed").offset().top]);
      CM.MapboxMap.protectMapMove();
    }
  });
  
  $(".sidebar .section-scroller .zoom-space").scrollspy({
    container: window,
    buffer: buffer,
    // buffer: $(".sidebar .section-scroller").offset().top,
    onEnter: (element, position) => {
      // console.log(['enter section scroll', element, position]);
      let num = /zoom-space-(\d+)/.exec(element.className)[1];

      $(element).addClass('active');
      $(".zoom-street-" + num).addClass('active');
      CM.MapboxMap.activateSectionFromScroll(element);
    },
    onLeave: (element, position) => {
      // console.log(['leave section scroll', element, position]);
      let num = /zoom-space-(\d+)/.exec(element.className)[1];

      $(element).removeClass('active');
      $(".zoom-street-" + num).removeClass('active');
    },
    // onTick: (element, position, inside, enters, leaves) => {
    //   let spaceHeight = $(element).outerHeight();
    //   let spacePosition = parseInt($(element).position().top, 10);
    //   let windowScroll = $(window).scrollTop();
    //   let spaceDiff = spacePosition - windowScroll - buffer;
    //   let scrollPct = 1 - spaceDiff / spaceHeight;
    //   console.log(['onTick', spaceHeight, spacePosition, position.top, windowScroll, spaceDiff, scrollPct, buffer]);
    //
    //   CM.ZoomList.scrollPct = scrollPct;
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
      clickLocked: null,
      hideSnapshotTimeout: null,
      filter: null,
      loadedSource: false,
      geodata: null,
      mapMoveProtectorTimeout: null,
      flying: 0
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
        zoom: CM.Globals.defaultZoom,
        pitchWithRotate: false,
        attributionControl: false
      });
      
      this.map.addControl(new mapboxgl.NavigationControl({
        showCompass: false
      }), 'bottom-right');
      this.map.addControl(new mapboxgl.AttributionControl(), 'bottom-right');
      
      // disable map zoom when using scroll
      this.map.scrollZoom.disable();
    },
    
    mapLoad() {
      $.getJSON("/record/snapshots_from_point.geojson", {
        lat: CM.Globals.defaultLat,
        lng: CM.Globals.defaultLng,
      }, (geodata) => {
        this.geojson = geodata;
        this.geodata = {
          'good': geodata.features.filter((f) => { return f.properties.rating >= 4; }),
          'bad': geodata.features.filter((f) => { return f.properties.rating <= 2; }),
          'neutral': geodata.features.filter((f) => { return f.properties.rating == 3; })
        };
        _.each(this.geodata, (features, rating) => {
          geodata.features = features;
          this.map.addSource('snapshots-'+rating, {
            'type': 'geojson',
            'data': geodata,
            'promoteId': 'id'
          });
        });
        
        this.map.on('sourcedata', (data) => {
          if (this.loadedSource) {
            // console.log(['Already loaded source, ignoring new sourcedata', data]);
            return;
          }
          _.each(this.geodata, (features, rating) => {
            if (this.map.getSource('snapshots-'+rating) && data.isSourceLoaded) {
              this.loadedSource = true;
              CM.ScrollSpy();
            }
          });
        });
        CM.Filters.ratings = "none";        
        this.addSnapshotPoints();
        this.bindHoverPhotos();
        this.bindClickPhoto();
        this.bindMouseSide();
        this.bindMapMove();
        this.addHeadingImage();
        $(window).resize(this.bindMouseSide.bind(this));
      });
    },
    
    updateSnapshot(photoId, data) {
      _.each(this.geodata, (features, rating) => {
        _.each(features, (feature) => {
          if (feature.id == photoId) {
            // console.log(['Extending snapshot', photoId, feature.properties, data]);
            _.extend(feature.properties, data);
          }
        });
        
        let geojson = this.geojson;
        geojson.features = features;
        this.map.getSource('snapshots-'+rating).setData(geojson);
      });
    },
    
    addSnapshotPoints() {
      _.each(this.geodata, (features, rating) => {
        this.map.addLayer(
          {
            'id': 'snapshot-points-'+rating,
            'type': 'circle',
            'source': 'snapshots-'+rating,
            'minzoom': 1,
            'paint': {
              'circle-radius': [
                'interpolate',
                ['linear'], ['zoom'],
                9, [
                  "case",
                  [
                    "==",
                    ["get", "photo_uploaded"],
                    true
                  ],
                  1,
                  1
                ],
                15, [
                  "case",
                  [
                    "==",
                    ["get", "photo_uploaded"],
                    true
                  ],
                  8,
                  4
                ],
                17, [
                  "case",
                  [
                    "==",
                    ["get", "photo_uploaded"],
                    true
                  ],
                  14,
                  10
                ]
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
              'circle-opacity': 0,
              'circle-opacity-transition': {
                "duration": 1000
              },
              
              // Stroke
              'circle-stroke-color': "rgb(255, 255, 255)",
              'circle-stroke-width': [
                'case',
                ['boolean', ['feature-state', 'selected'], false],
                3,
                0
              ],
            }
          },
          'waterway-label'
        );
      });
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
      _.each(this.geodata, (features, rating) => {
        this.map.on('mousemove', 'snapshot-points-'+rating, (e) => {
          if (e.features.length == 0) return;
          if (this.activeSnapshot && this.activeSnapshot.id ==
            e.features[0].id) return;
          // if (this.clickLocked) return; // Comment out to allow hover over photos
        
          this.activateSnapshot(e.features[0], {hover: true});
          if (this.clickLocked && e.features[0].id == this.clickLocked.id) {
            _.each(this.geodata, (features, rating) => {
              this.map.setFeatureState(
                { source: 'snapshots-'+rating, id: this.clickLocked.id },
                { selected: true }
              );
            });
          }
        });
 
        // When the mouse leaves the state-fill layer, update the feature state of the
        // previously hovered feature.
        this.map.on('mouseleave', 'snapshot-points-'+rating, () => {
          if (this.clickLocked) {
            // Go back to click locked photo
            this.activateSnapshot(this.clickLocked);
            _.each(this.geodata, (features, rating) => {
              this.map.setFeatureState(
                { source: 'snapshots-'+rating, id: this.clickLocked.id },
                { selected: true }
              );
            });
          } else {
            this.deactivateSnapshot();
          }
        });
      });
    },
    
    activateSnapshot(snapshot, options) {
      options = _.extend({hover: false}, options);
      if (options.hover && !snapshot.properties.photo_uploaded) return;
      
      if (this.activeSnapshot) {
        _.each(this.geodata, (features, rating) => {
          this.map.setFeatureState(
            { source: 'snapshots-'+rating, id: this.activeSnapshot.id },
            { hover: false, selected: false }
          );
        });
      }
      
      this.activeSnapshot = snapshot;
      clearTimeout(this.hideSnapshotTimeout);
      
      _.each(this.geodata, (features, rating) => {
        this.map.setFeatureState(
          { source: 'snapshots-'+rating, id: this.activeSnapshot.id },
          { hover: true }
        );
      });
      
      this.updateHeading();
      this.displaySnapshotDetail();
    },
    
    deactivateSnapshot() {
      if (this.activeSnapshot) {
        _.each(this.geodata, (features, rating) => {
          this.map.setFeatureState(
            { source: 'snapshots-'+rating, id: this.activeSnapshot.id },
            { hover: false, selected: false }
          );
        });
      }
      
      this.activeSnapshot = null;

      this.updateHeading();
      this.hideSnapshotDetail();
    },
    
    displaySnapshotDetail() {
      CM.SnapshotDetail.activeSnapshot = this.activeSnapshot;

      // console.log(['Snapshot detail', this.activeSnapshot, CM.SnapshotDetail.activeSnapshot]);

      this.$nextTick(() => {
        $(".snapshot-detail-container").addClass('active');
      });
    },
    
    hideSnapshotDetail() {
      // console.log(['hideSnapshotDetail', this.activeSnapshot]);
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
          this.clickLocked = null;
          this.deactivateSnapshot();
        }
      });
      
      _.each(this.geodata, (features, rating) => {
        this.map.on('click', 'snapshot-points-'+rating, (e) => {
          console.log(['Click', e.features]);
          this.flyToSnapshot(e.features[0]);
        });
      });
    },
    
    flyToPhotoId(photoId, options) {
      // console.log(['Flying to', photoId]);
      _.each(this.geodata, (features, rating) => {
        let feature = features.find((feature) => {
          return feature.id == photoId;
        });
        // let feature = this.map.querySourceFeatures('snapshots', {
        //   filter: ['==', 'id', photoId]
        // });
      
        if (feature) {
          this.flyToSnapshot(feature, options);
          return;
        }
        
        // console.log(["Error, couldn't find photo feature", photoId]);
        // this.loadedSource = false;
      });
    },
    
    flyToSnapshot(snapshot, options) {
      options = $.extend({}, {
        center: snapshot.geometry.coordinates,
        zoom: this.map.getZoom(),
        speed: 0.3
      }, options);
      this.protectMapMove(true);
      setTimeout(() => {
        // console.log(['Flying', snapshot.id, snapshot.properties.poi, this.flying]);
        this.map.flyTo(options);
      }, 0);
      this.clickLocked = snapshot;
      this.activateSnapshot(snapshot);
      _.each(this.geodata, (features, rating) => {
        this.map.setFeatureState(
          { source: 'snapshots-'+rating, id: this.activeSnapshot.id },
          { selected: true }
        );
      });
      
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
    
    protectMapMove(indefinite) {
      if (indefinite) this.flying += 1;
      if (this.flying && !indefinite) return;
      
      if (!this.mapMoveProtectorTimeout) {
        $(".map-move-protector").show();
      } else {
        clearTimeout(this.mapMoveProtectorTimeout);
      }
      
      if (!indefinite) {
        this.mapMoveProtectorTimeout = setTimeout(() => {
          this.endProtectMapMove();
        }, 500);
      } else {
        // console.log(['Protect ON', indefinite]);
      }
    },
    
    endProtectMapMove(endIndefinite) {
      if (endIndefinite) this.flying -= 1;
      if (this.flying > 0) return;
      
      // console.log(['Protect OVER AND OUT', endIndefinite, this.flying]);
      $(".map-move-protector").hide();
      clearTimeout(this.mapMoveProtectorTimeout);
      this.mapMoveProtectorTimeout = null;    
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
    
    bindMapMove() {
      this.map.on('moveend', ({ originalEvent }) => {
        if (originalEvent) {
          this.map.fire('usermoveend');
        } else {
          this.map.fire('flyend');
        }
      });
      
      this.map.on('flyend', (data, msg) => {
        this.endProtectMapMove(true);
      });
    },
    
    hideBikeLanes() {
      return;
      
      this.map.setPaintProperty('cambridge-ma-bike-facilities', 'line-opacity', 0);
      this.map.setPaintProperty('boston-ma-existing-bike-network', 'line-opacity', 0);
    },
    
    showBikeLanes() {
      return;
      
      this.map.setLayoutProperty('cambridge-ma-bike-facilities', 'visibility', 'visible');
      this.map.setLayoutProperty('boston-ma-existing-bike-network', 'visibility', 'visible');
      let zoom = [
        'interpolate',
        ['linear'],
        ['zoom'],
        10,
        0,
        17,
        1
      ];
      this.map.setPaintProperty('cambridge-ma-bike-facilities', 'line-opacity', zoom);
      this.map.setPaintProperty('boston-ma-existing-bike-network', 'line-opacity', zoom);
    },
    
    activateSectionFromScroll(sectionEl) {
      if ($(sectionEl).is("#sidebar-section-1")) {
        this.deactivateSnapshot();
        CM.Filters.ratings = "all";
        this.showBikeLanes();
        this.protectMapMove(true);
        this.map.flyTo({center: {
          lat: CM.Globals.defaultLat,
          lng: CM.Globals.defaultLng
        }, speed: 0.4, zoom: CM.Globals.defaultZoom});
      } else if ($(sectionEl).is("#sidebar-section-2")) {
        this.deactivateSnapshot();
        CM.Filters.ratings = "none";
        this.showBikeLanes();
        this.protectMapMove(true);
        this.map.flyTo({center: {
          lat: CM.Globals.defaultLat,
          lng: CM.Globals.defaultLng
        }, speed: 0.4, zoom: CM.Globals.defaultZoom});
      } else if ($(sectionEl).is("#sidebar-section-3")) {
        CM.Filters.ratings = "good";
        this.showBikeLanes();
        this.flyToPhotoId("-U9Wblf7N", {zoom: 15});
      } else if ($(sectionEl).is("#sidebar-section-4")) {
        CM.Filters.ratings = "bad";
        this.showBikeLanes();
        this.flyToPhotoId("aAJ-l6wp", {zoom: 15.5});
      } else if ($(sectionEl).is("#sidebar-section-5")) {
        CM.Filters.ratings = "bad";
        this.showBikeLanes();
        this.flyToPhotoId("55_t_gSm", {zoom: 16});
      } else if ($(sectionEl).is(".zoom-space-0")) {
        CM.Filters.ratings = "bad";
        CM.ZoomList.activeZoom = 0;
        this.showBikeLanes();
        this.flyToPhotoId("55_t_gSm", {zoom: 16});
      } else if ($(sectionEl).is(".zoom-space-1")) {
        CM.Filters.ratings = "bad";
        CM.ZoomList.activeZoom = 1;
        this.showBikeLanes();
        this.flyToPhotoId("pi-6u3xz", {zoom: 16});
      } else if ($(sectionEl).is(".zoom-space-2")) {
        CM.Filters.ratings = "bad";
        CM.ZoomList.activeZoom = 2;
        this.showBikeLanes();
        this.flyToPhotoId("tF5ZKCcW", {zoom: 16});
      } else if ($(sectionEl).is(".zoom-space-3")) {
        CM.Filters.ratings = "bad";
        CM.ZoomList.activeZoom = 3;
        this.showBikeLanes();
        this.flyToPhotoId("hV7LG2cI", {zoom: 16});
      } else if ($(sectionEl).is(".zoom-space-4")) {
        CM.Filters.ratings = "bad";
        CM.ZoomList.activeZoom = 4;
        this.showBikeLanes();
        this.flyToPhotoId("C4a6-Cce", {zoom: 16});
      } else if ($(sectionEl).is("#sidebar-section-6")) {
        CM.Filters.ratings = "all";
        this.showBikeLanes();
        this.deactivateSnapshot();
        this.protectMapMove(true);
        this.map.flyTo({center: {
          lat: CM.Globals.defaultLat,
          lng: CM.Globals.defaultLng
        }, speed: 0.4, zoom: CM.Globals.defaultZoom});
      }
      
    }
        
  }
});

CM.SnapshotDetail = new Vue({
  el: ".snapshot-detail-container",
  
  data: () => {
    return {
      activeSnapshot: null,
      owned: false,
      topSide: false,
      leftSide: false
    };
  },
  
  watch: {
    activeSnapshot(snapshot) {
      // console.log(['Active snapshot', this.activeSnapshot]);
      if (this.activeSnapshot) {
        this.owned = this.activeSnapshot.properties.email_hash == CM.Globals.emailHash;
      }
    }
  },
  
  methods: {
    changeRating(newRating) {
      $.post('/record/snapshot/rating/'+this.activeSnapshot.id+'/', {
        rating: newRating,
        photo_id: this.activeSnapshot.id
      }, (data) => {
        console.log(['Changed rating', data]);
      });
      
      CM.MapboxMap.updateSnapshot(this.activeSnapshot.id, {rating: newRating});
      this.activeSnapshot.properties.rating = newRating;
    }
  }
  
});


Vue.filter('formatDate', function(value) {
  if (value) {
    return moment(String(value)).format('LLLL')
  }
});

CM.ZoomList = new Vue({
  el: ".section-scroller",
  
  data: () => {
    return {
      activeZoom: 0,
      scrollPct: 0,
      indicatorTop: 0,
      zoomHeight: 42,
      locations: [
        {
          streetName: "MBTA Bus Stop Eliot St & JFK St",
          photoId: "55_t_gSm",
          filterRating: "bad",
          zoomLevel: 17,
        },
        {
          streetName: "Black Sheep Bagel Cafe",
          photoId: "pi-6u3xz",
          filterRating: "bad",
          zoomLevel: 17,
        },
        {
          streetName: "Capital One Café",
          photoId: "tF5ZKCcW",
          filterRating: "bad",
          zoomLevel: 17,
        },
        {
          streetName: "Straus Hall, Harvard Yard",
          photoId: "hV7LG2cI",
          filterRating: "bad",
          zoomLevel: 17,
        },
        {
          streetName: "MBTA Harvard Station",
          photoId: "C4a6-Cce",
          filterRating: "bad",
          zoomLevel: 17,
        },
      ]
    };
  },
  
  watch: {
    scrollPct() {
      console.log(['Indicator', this.activeZoom, this.zoomHeight, this.scrollPct]);
      this.indicatorTop = ((this.activeZoom) * this.zoomHeight) + (this.zoomHeight * this.scrollPct);
      // this.indicatorTop -= 24;
    },
    
    activeZoom() {
      let $activeZoom = $(".zoom-street-" + this.activeZoom);
      this.zoomHeight = $activeZoom.outerHeight(true);
      let zoomStreetPos = $activeZoom.position().top;
      this.indicatorTop = zoomStreetPos;
    }
  },
  
  methods: {
    setActive(location, index) {
      let buffer = $(window).outerHeight() / 2 - 100;
      
      this.activeZoom = index;
      
      let zoomSpacePos = $(".zoom-space-" + this.activeZoom).position().top - buffer;
      // console.log(['Scroll to zoom space', zoomSpacePos + buffer, buffer, zoomSpacePos]);
      $('body').animate({scrollTop: zoomSpacePos}, 0);
    }
  }
  
});

