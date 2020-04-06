from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from .models import SnapshotRatingScale, Snapshot
from django.conf import settings
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import Distance  
from django.http import JsonResponse
import logging
from django.views.decorators.csrf import csrf_exempt
import boto3
from PIL import Image
from io import BytesIO
import geojson

logger = logging.getLogger(__name__)


@login_required()
def rating_scale(request):
    snapshot_rating_scale = SnapshotRatingScale.objects.all()[0] # TODO: Rewrite for multiple scales
    return render(request, "records/record_snapshot.html", {
        'snapshot_rating_scales': zip(snapshot_rating_scale.names, snapshot_rating_scale.values),
        'GOOGLE_MAPS_API_KEY': settings.GOOGLE_MAPS_API_KEY
    })

# @login_required()
@csrf_exempt
def record_snapshot(request):
    snapshot_rating_scale = SnapshotRatingScale.objects.all()[0] # TODO: Rewrite for multiple scales
    
    photo_id = request.POST['photo_id']
    rating = int(request.POST['rating'])
    gps_lat = float(request.POST['gps[latitude]'])
    gps_long = float(request.POST['gps[longitude]'])
    heading = float(request.POST['heading'])
    speed_mph = float(request.POST['speed_mph'])

    snapshot = Snapshot(user=request.user, 
                        photo_id=photo_id,
                        rating=rating, 
                        rating_scale=snapshot_rating_scale,
                        heading=heading,
                        speed_mph=speed_mph,
                        location=Point(gps_lat, gps_long))
    snapshot.save()
    logging.info(" ---> Snapshot: %s / %s" % (snapshot, request.POST))
    return HttpResponse("OK")
    
@login_required()
@csrf_exempt
def record_photo(request, photo_id):
    image_file = request.FILES.get('photo')
    image = Image.open(image_file)
    (width, height) = image.size
    s3 = boto3.client('s3',
                      aws_access_key_id=settings.AWS_ACCESS_KEY,
                      aws_secret_access_key=settings.AWS_SECRET_KEY)
    bucket = 'camera.comfortmaps.com'
    key_name = '%sx/%s.jpg' % (width, photo_id)
    image_file.seek(0)
    s3.upload_fileobj(image_file, bucket, key_name, ExtraArgs={
        'ACL':'public-read', 
        'ContentType': "image/jpeg",
    })
    logging.info(" ---> Uploaded %s: %s" % (photo_id, image))
    return JsonResponse({"code": 1, "image_size": len(image_file)})
    
@login_required()
def map(request):
    return render(request, "records/map.html", {        
        'GOOGLE_MAPS_API_KEY': settings.GOOGLE_MAPS_API_KEY
    })

@login_required()
def snapshots_from_point(request, format="json"):
    lat = float(request.POST.get('lat') or request.GET.get('lat'))
    lng = float(request.POST.get('lng') or request.GET.get('lng'))
    locations = Snapshot.objects.filter(location__distance_lt=(Point(lat, lng), Distance(km=5)))
    logging.info(f" ---> Snapshots near {lat},{lng}: {locations.count()}")
    
    if format == "json":
        points = [dict(lat=l.location.x, lng=l.location.y, rating=l.rating, user=l.user.pk, photo_id=l.photo_id) for l in locations]
        return JsonResponse({'points': points})
    elif format == "geojson":
        features = [geojson.Feature(properties={
            "rating": l.rating
        }, geometry=geojson.Point((l.location.y, l.location.x))) for l in locations]
        feature_collection = geojson.FeatureCollection(features)
        return JsonResponse(feature_collection)