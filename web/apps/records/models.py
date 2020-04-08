import datetime
from django.utils import timezone
from django.contrib.gis.db import models
from apps.accounts.models import User
from django.contrib.postgres.fields import ArrayField
from django.conf import settings

class SnapshotRatingScale(models.Model):
    names = ArrayField(models.CharField(max_length=1024))
    values = ArrayField(models.CharField(max_length=1024))

    def __str__(self):
        names = (f"{name} ({value})" for name, value in zip(self.names, self.values))
        return f"<SnapshotRatingScale {self.pk}: {', '.join(names)}>"

class Snapshot(models.Model):
    photo_id = models.TextField(max_length=32)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField()
    rating_scale = models.ForeignKey(SnapshotRatingScale, on_delete=models.CASCADE)
    location = models.PointField()
    heading = models.FloatField()
    speed_mph = models.FloatField()
    width = models.IntegerField(default=488)
    photo_uploaded = models.BooleanField(default=False)
    date = models.DateTimeField('date snapshot taken', default=timezone.now)
    
    def __str__(self):
        return f"<Snapshot: {self.photo_id} {self.rating}/5 {self.location} {self.date}"
        
    @property
    def s3_key_name(self):
        return '%sx/%s.jpg' % (self.width, self.photo_id)
    
    @property
    def full_photo_url(self):
        return f"https://s3.amazonaws.com/{settings.S3_PHOTOS_BUCKET}/{self.s3_key_name}"