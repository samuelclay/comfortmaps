from django.shortcuts import render
from django.contrib.auth import login
from accounts.models import User
from django.http import HttpResponseRedirect
from . forms import UserLoginForm


def login_user(request):
    form = UserLoginForm(request.POST or None)
    if form.is_valid():
        
        user = form.save()
        # if not user:
            # user = User.objects.create(email=email)
        login(request, user)
        return HttpResponseRedirect(request.GET['next'])
    else:
        print('invalid')
    return render(request, "accounts/login.html", {
        "form": form,
    })