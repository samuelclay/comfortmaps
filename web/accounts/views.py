from django.shortcuts import render
from django.contrib.auth import login
from django.http import HttpResponseRedirect
from . forms import UserLoginForm
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


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

@csrf_exempt
def login_user_ajax(request):
    form = UserLoginForm(request.POST)
    if form.is_valid():
        user = form.save()
        login(request, user)
        return JsonResponse({'error': None, 'code': 1})
    error = ' '.join([' '.join(x for x in l) for l in list(form.errors.values())])
    return JsonResponse({'error': error, 'code': -1})

