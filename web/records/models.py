import datetime
from django.utils import timezone
from django.contrib.gis.db import models
from accounts.models import User
from django.contrib.postgres.fields import ArrayField


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
    date = models.DateTimeField('date snapshot taken', default=timezone.now)
    
    def __str__(self):
        return f"<Snapshot: {self.photo_id} {self.rating}/5 {self.location} {self.date}"