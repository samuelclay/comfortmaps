import datetime
from django.db import models
from django.contrib.gis.db import models as geomodels
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField


class SnapshotRatingScale(models.Model):
    names = ArrayField(models.CharField(max_length=1024))
    values = ArrayField(models.CharField(max_length=1024))


class Snapshot(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField()
    rating_scale = models.ForeignKey(SnapshotRatingScale, on_delete=models.CASCADE)
    # coord = geomodels.PointField()
    date = models.DateTimeField('date snapshot taken', default=datetime.datetime.now)
    


class UserSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    session_id = models.CharField(max_length=1024)
    last_seen = models.DateTimeField('date session last seen', default=datetime.datetime.now)
    date = models.DateTimeField('date session created', default=datetime.datetime.now)
