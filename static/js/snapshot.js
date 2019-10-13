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
  CM.lastPos = CM.lastPos || {lat: 10, long: 10};
  
  var pos = {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  };

  if (!CM.googleMap) return;
  CM.googleMap.setCenter(pos);
  CM.googleMap.setZoom(16);
  const distanceFromLastPoint = window.distanceBetweenLatLongs(pos.lat, CM.lastPos.lat, 
                                                               pos.lng, CM.lastPos.lng);
  console.log(['New position', pos, distanceFromLastPoint, distanceBetweenLatLongs < 0.05]);
  if (distanceBetweenLatLongs < 0.05) {
    return;
  }
  CM.lastPos = pos;
  
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
  var p = 0.017453292519943295;    // Math.PI / 180
  var c = Math.cos;
  var a = 0.5 - c((lat2 - lat1) * p)/2 + 
          c(lat1 * p) * c(lat2 * p) * 
          (1 - c((lon2 - lon1) * p))/2;

  return 12742 * Math.asin(Math.sqrt(a)); // 2 * R; R = 6371 km
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