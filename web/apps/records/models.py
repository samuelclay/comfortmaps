import datetime
from django.utils import timezone
from django.contrib.gis.db import models
from apps.accounts.models import User
from django.contrib.postgres.fields import ArrayField
from django.conf import settings
from mapbox import Geocoder

class SnapshotRatingScale(models.Model):
    names = ArrayField(models.CharField(max_length=1024))
    values = ArrayField(models.CharField(max_length=1024))

    def __str__(self):
        names = (f"{name} ({value})" for name, value in zip(self.names, self.values))
        return f"<SnapshotRatingScale {self.pk}: {', '.join(names)}>"

class Snapshot(models.Model):
    photo_id = models.TextField(max_length=32)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    email_hash = models.CharField(max_length=64)
    rating = models.IntegerField()
    rating_scale = models.ForeignKey(SnapshotRatingScale, on_delete=models.CASCADE)
    location = models.PointField()
    poi = models.CharField(max_length=128, null=True)
    address = models.CharField(max_length=128, null=True)
    place_name = models.CharField(max_length=256, null=True)
    heading = models.FloatField()
    speed_mph = models.FloatField()
    width = models.IntegerField(default=488)
    photo_uploaded = models.BooleanField(default=False)
    date = models.DateTimeField('date snapshot taken', default=timezone.now)
    
    def __str__(self):
        return f"<Snapshot: {self.photo_id} {self.rating}/5 {self.location} {self.date}"
    
    def save(self, *args, **kwargs):
        self.email_hash = hashlib.md5(self.user.email.encode('utf-8')).hexdigest()
        super(Snapshot, self).save(*args, **kwargs)
    
    @property
    def s3_key_name(self):
        return '%sx/%s.jpg' % (self.width, self.photo_id)
    
    @property
    def full_photo_url(self):
        return f"https://s3.amazonaws.com/{settings.S3_PHOTOS_BUCKET}/{self.s3_key_name}"
    
    def fetch_reverse_geocode(self):
        geocoder = Geocoder(access_token=settings.MAPBOX_ACCESS_TOKEN)
        
        response = geocoder.reverse(lon=self.location.y, lat=self.location.x, types=["poi"])
        
        if response.status_code == 200:
            features = response.geojson()['features']
            if len(features) == 0: return
            poi = features[0]['text']
            address = features[0]['properties']['address']
            place_name = features[0]['place_name']
            self.poi = poi
            self.address = address
            self.place_name = place_name
            self.save()
            # print(f"\n\t ---> Snapshot: {self.geocode}\n")
        # else:
        #     print(f"\n\t ---> ERROR Snapshot: {response} {self}\n")