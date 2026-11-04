import os
import sys

from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from main import app

client = TestClient(app)


def test_applications_route_returns_service_unavailable_when_supabase_is_unconfigured():
    response = client.get('/api/applications/')

    assert response.status_code == 503
    assert 'Supabase' in response.json()['detail']
