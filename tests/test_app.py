import pytest
from webssapp import app


@pytest.fixture
def client():
    app.config['TESTING'] = True
    client = app.test_client()

    yield client


def test_landing_page(client):
    response = client.get('/landing_page', follow_redirects=True)
    assert response.status_code == 200


def test_new_user(client):
    response = client.get('/new_user', follow_redirects=True)
    assert response.status_code == 200


def test_settings(client):
    response = client.get('/settings', follow_redirects=True)
    assert response.status_code == 200


def test_select_schedule(client):
    response = client.get('/select_schedule', follow_redirects=True)
    assert response.status_code == 200
