window.CM = {};

window.initMap = function() {
  CM.googleMap = new google.maps.Map(document.getElementById('map'), {
    center: {lat: -34.397, lng: 150.644},
    zoom: 12,
    disableDefaultUI: true,
    gestureHandling: 'cooperative'
  });

  var bikeLayer = new google.maps.BicyclingLayer();
  bikeLayer.setMap(CM.googleMap);
  
  var infoWindow = new google.maps.InfoWindow;

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
  CM.googleMap.setZoom(14);
  
  jQuery.post("/record/snapshots_from_point/", {
    lat: position.coords.latitude,
    lng: position.coords.longitude
  }, function(data) {
    for (var p in data.points) {
      var point = data.points[p];
      console.log(['Point', point]);
      new google.maps.Marker({
        position: {lat: point.lat, lng: point.lng},
        label: ""+point.rating,
        animation: google.maps.Animation.DROP,
        map: CM.googleMap
      });
    }
  }, 'json');
};

window.collectGpsInterval = setInterval(window.collectGps, 5 * 1000);

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