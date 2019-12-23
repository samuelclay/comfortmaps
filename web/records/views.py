from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from .models import SnapshotRatingScale, Snapshot
from django.conf import settings
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import Distance  
from django.http import JsonResponse


@login_required()
def rating_scale(request):
    snapshot_rating_scale = SnapshotRatingScale.objects.all()[0] # TODO: Rewrite for multiple scales
    return render(request, "records/record_snapshot.html", {
        'snapshot_rating_scales': zip(snapshot_rating_scale.names, snapshot_rating_scale.values),
        'GOOGLE_MAPS_API_KEY': settings.GOOGLE_MAPS_API_KEY
    })

@login_required()
def record_snapshot(request):
    print(request.POST)
    snapshot_rating_scale = SnapshotRatingScale.objects.all()[0] # TODO: Rewrite for multiple scales
    rating = int(request.POST['rating'])
    gps_lat = float(request.POST['gps[coords][latitude]'])
    gps_long = float(request.POST['gps[coords][longitude]'])
    snapshot = Snapshot(user=request.user, 
                        rating=rating, 
                        rating_scale=snapshot_rating_scale,
                        location=Point(gps_lat, gps_long))
    snapshot.save()
    return HttpResponse("OK")
    

@login_required()
def map(request):
    return render(request, "records/map.html", {        
        'GOOGLE_MAPS_API_KEY': settings.GOOGLE_MAPS_API_KEY
    })

@login_required()
def snapshots_from_point(request):
    lat = float(request.POST['lat'])
    lng = float(request.POST['lng'])
    locations = Snapshot.objects.filter(location__distance_lt=(Point(lat, lng), Distance(km=2)))
    print(f" ---> Snapshots near {lat},{lng}: {locations.count()}")
    points = [dict(lat=l.location.x, lng=l.location.y, rating=l.rating, user=l.user.pk) for l in locations]
    return JsonResponse({'points': points})