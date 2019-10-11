from django.shortcuts import render
from django.http import HttpResponse
from django.contrib.auth.decorators import login_required

def get_or_create_user_session(request):
    if request.user.is_authenticated:
        return request.user
    
@login_required()
def record_snapshot(request):
    user = get_or_create_user_session(request)
    return HttpResponse("Hello, world. You're at the polls index.")

def login():
    form = LoginForm(request.POST or None)
    if form.is_valid():
        user = form.save()
        new_user = authenticate(username)
        login(request, new_user)