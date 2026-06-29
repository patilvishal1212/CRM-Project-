# from django import forms
# from django.contrib.auth.forms import AuthenticationForm

# from .models import User

# class LoginForm(AuthenticationForm):
#     username = forms.EmailField(widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': 'Email'}))
#     password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Password'}))

#     class EmployeeCreationForm(forms.ModelForm):
#         password = forms.CharField(widget=forms.PasswordInput)

#         class Meta:
#             model = User
#             fields = ['full_name', 'email', 'username', 'role', 'password']

#         def save(self, commit=True):
#             user = super().save(commit=False)
#             user.set_password(self.cleaned_data['password'])
#             if commit:
#                 user.save()

                
#             return user    