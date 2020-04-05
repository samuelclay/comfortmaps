from django.shortcuts import render
from django.contrib.auth import login
from django.http import HttpResponseRedirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


def main_map(request):
    return render(request, "map/main_map.html", {
    })

@csrf_exempt
def login_user_ajax(request):
    return JsonResponse({'code': 1})

