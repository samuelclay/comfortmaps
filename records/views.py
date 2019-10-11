from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required


@login_required()
def record_snapshot(request):
    return HttpResponse("Hello, world.")
