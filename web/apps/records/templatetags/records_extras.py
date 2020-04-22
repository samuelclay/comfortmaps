from django import template
from django.template.defaultfilters import stringfilter
import hashlib

register = template.Library()

@register.filter(name='md5')
@stringfilter
def md5_string(value, length=None):
    hash = hashlib.md5(value.encode('utf-8')).hexdigest()
    if length:
        return hash[:int(length)]
    return hash