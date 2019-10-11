from django.contrib.auth import get_user_model
from django import forms
# from django.contrib.auth.forms import UserCreationForm

User = get_user_model()

class UserLoginForm(forms.Form):
    email = forms.EmailField(label="Email address")

    def __init__(self, *args, **kwargs):
        super(UserLoginForm, self).__init__(*args, **kwargs)
        self.fields['email'].widget.attrs.update({
            'class': 'form-control',
            "name":"email"})

    def clean(self, *args, **keyargs):
        email = self.cleaned_data.get("email")

        if email:
            # Login if exists, otherwise create account
            try:
                user = User.objects.get(email__iexact=email)
            except User.DoesNotExist:
                return super(UserLoginForm, self).clean(*args, **keyargs)
                
            if not user.is_active:
                raise forms.ValidationError("User is no longer active")

        return super(UserLoginForm, self).clean(*args, **keyargs)
 
    def save(self):
        print("save user")
        email = self.cleaned_data.get("email")
        
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Create a new user. There's no need to set a password
            # because only the password from settings.py is checked.
            user = User(email=email)
            user.save()
        return user
