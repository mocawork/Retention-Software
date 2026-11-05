from rest_framework import generics

from .serializers import MeSerializer


class MeView(generics.RetrieveUpdateAPIView):
    """The logged-in user's own profile."""

    serializer_class = MeSerializer
    http_method_names = ["get", "patch"]

    def get_object(self):
        return self.request.user
