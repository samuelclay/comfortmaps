import datetime
from django.utils import timezone
from django.db import models
from django.contrib.gis.db import models as geomodels
from accounts.models import User
from django.contrib.postgres.fields import ArrayField


class SnapshotRatingScale(models.Model):
    names = ArrayField(models.CharField(max_length=1024))
    values = ArrayField(models.CharField(max_length=1024))

    def __str__(self):
        names = (f"{name} ({value})" for name, value in zip(self.names, self.values))
        return f"<SnapshotRatingScale {self.pk}: {', '.join(names)}>"

class Snapshot(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rating = models.IntegerField()
    rating_scale = models.ForeignKey(SnapshotRatingScale, on_delete=models.CASCADE)
    # coord = geomodels.PointField()
    date = models.DateTimeField('date snapshot taken', default=timezone.now)
    
