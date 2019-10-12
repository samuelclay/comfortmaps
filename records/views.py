from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required
from .models import SnapshotRatingScale, Snapshot


@login_required()
def rating_scale(request):
    snapshot_rating_scale = SnapshotRatingScale.objects.all()[0] # TODO: Rewrite for multiple scales
    return render(request, "records/record_snapshot.html", {
        'snapshot_rating_scales': zip(snapshot_rating_scale.names, snapshot_rating_scale.values)
    })

@login_required()
def record_snapshot(request):
    print(request.POST)
    snapshot_rating_scale = SnapshotRatingScale.objects.all()[0] # TODO: Rewrite for multiple scales
    rating = int(request.POST['rating'])
    snapshot = Snapshot(user=request.user, rating=rating, rating_scale=snapshot_rating_scale)
    snapshot.save()
    return HttpResponse("OK")