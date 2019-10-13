window.CM = {};

CM.snapshotVue = new Vue({
    el: ".CM-ratings",
    
    methods: {
        sendSnapshot: function(rating) {
            console.log(['sendSnapshot', rating]);
            jQuery.post("/record/snapshot/", {
                rating: rating,
                gps: CM.geolocation
            });
            
            new google.maps.Marker({
              position: CM.googleMap.getCenter(),
              label: ""+rating,
              animation: google.maps.Animation.DROP,
              map: CM.googleMap
            })
        }
    }
});

window.initMap = function() {
  CM.googleMap = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 12,
    disableDefaultUI: true,
    gestureHandling: 'cooperative'
  });

  var bikeLayer = new google.maps.BicyclingLayer();
  bikeLayer.setMap(CM.googleMap);
  
  let infoWindow = new google.maps.InfoWindow;

  // Try HTML5 geolocation.
  window.collectGps();

}

window.collectGps = function() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(window.processGpsPosition, function() {
      console.log(['No permission for GPS', true]);
    }, {
      enableHighAccuracy: true
    });
  } else {
    // Browser doesn't support Geolocation
    console.log(['No permission for GPS', false]);
  }
};
window.processGpsPosition = function(position) {
  CM.geolocation = position;
  CM.seenLocations = CM.seenLocations || [];
  CM.lastPos = CM.lastPos || {lat: 0, long: 0};
  
  var pos = {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  };

  if (!CM.googleMap) return;
  CM.googleMap.setCenter(pos);
  CM.googleMap.setZoom(16);
  const distanceFromLastPoint = window.distanceBetweenLatLongs(pos.lat, CM.lastPos.lat, 
                                                               pos.lng, CM.lastPos.lng);
  CM.lastPos = pos;
  
  if (distanceBetweenLatLongs < 0.1) {
    return;
  }
  
  const rotation = position.coords.heading + 90;
  const chevron = {
    path: 'M 13 3 L 7 12 L 13 21 L 17 21 L 11 12 L 17 3 L 13 3 z',
    strokeColor: '#F00',
    fillColor: '#F00',
    fillOpacity: 1,
    rotation: rotation
  };
  const chevronOld = $.extend({}, chevron, {fillColor: '#FF0', strokeColor: '#FF0'});
  new google.maps.Marker({
    position: CM.googleMap.getCenter(),
    icon: chevron,
    map: CM.googleMap
  });
};
window.distanceBetweenLatLongs = function(lat1, lat2, lon1, lon2) {
  var R = 6371e3; // metres
  var φ1 = lat1.toRadians();
  var φ2 = lat2.toRadians();
  var Δφ = (lat2-lat1).toRadians();
  var Δλ = (lon2-lon1).toRadians();

  var a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  var d = R * c;
  
  return d;
}
window.collectGpsInterval = setInterval(window.collectGps, 5 * 1000);
navigator.geolocation.watchPosition(window.processGpsPosition, function() {
  console.log(['No permission for GPS', true]);
});


function resizeVh() {
  let vh = window.innerHeight * 0.01;
  // Then we set the value in the --vh custom property to the root of the document
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}
window.addEventListener('resize', () => {
  resizeVh();
});
window.addEventListener('orientationchange', () => {
  resizeVh();
});

resizeVh();