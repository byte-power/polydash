import time
from tests import BaseTestCase
from redash.models import db
from redash import settings
from redash.authentication import get_embed_signature, encode_params


class TestUnembedables(BaseTestCase):
    def test_not_embedable(self):
        query = self.factory.create_query()
        res = self.make_request("get", "/api/queries/{0}".format(query.id))
        self.assertEqual(res.status_code, 200)
        self.assertIn("frame-ancestors 'none'", res.headers["Content-Security-Policy"])
        self.assertEqual(res.headers["X-Frame-Options"], "deny")


class TestEmbedVisualization(BaseTestCase):
    def test_sucesss(self):
        vis = self.factory.create_visualization()
        vis.query_rel.latest_query_data = self.factory.create_query_result()
        db.session.add(vis.query_rel)

        res = self.make_request(
            "get",
            "/embed/query/{}/visualization/{}".format(vis.query_rel.id, vis.id),
            is_json=False,
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("frame-ancestors *", res.headers["Content-Security-Policy"])
        self.assertNotIn("X-Frame-Options", res.headers)

class TestUnembedablesDashboard(BaseTestCase):
    def test_not_embedable(self):
        dashboard = self.factory.create_dashboard()
        res = self.make_request("get", "/api/dashboards/embed/{0}".format(dashboard.id))
        self.assertEqual(res.status_code, 200)
        self.assertIn("frame-ancestors 'none'", res.headers["Content-Security-Policy"])
        self.assertEqual(res.headers["X-Frame-Options"], "deny")

class TestEmbedDashboardList(BaseTestCase):
    def setUp(self):
       super(TestEmbedDashboardList, self).setUp()

    def test_get_success(self):
        admin = self.factory.create_admin()
        dashboard1 = self.factory.create_dashboard(is_archived=True, is_draft=True)
        dashboard2 = self.factory.create_dashboard(is_archived=True, is_draft=False)
        dashboard3 = self.factory.create_dashboard(is_archived=False, is_draft=False)
        dashboard4 = self.factory.create_dashboard(is_archived=False, is_draft=False)

        rv = self.make_request("get", "/api/dashboards/embed", user=admin)
        assert len(rv.json["results"]) == 2

    def test_get_not_admin(self):
        dashboard1 = self.factory.create_dashboard(is_archived=True, is_draft=True)
        dashboard2 = self.factory.create_dashboard(is_archived=True, is_draft=False)
        dashboard3 = self.factory.create_dashboard(is_archived=False, is_draft=False)

        rv = self.make_request("get", "/api/dashboards/embed")
        self.assertEqual(rv.status_code, 403)

class TestEmbedDashboard(BaseTestCase):
    def setUp(self):
        super(TestEmbedDashboard, self).setUp()
        self.dashboard = self.factory.create_dashboard()
        self.application = self.factory.create_application()
        db.session.flush()
        self.basic_url = "http://localhost/{}".format(self.factory.org.slug)
        self.embed_url = "/embed/dashboard/{}".format(self.dashboard.id)

    def test_not_add_dashboard_to_application(self):
        timestamp = int(time.time())
        params = {
            "secret_key": self.application.secret_key,
            "timestamp": str(timestamp),
        }
        s = encode_params(params)
        url = "?".join([self.embed_url, s])
        signature = get_embed_signature(self.application.secret_token, self.basic_url+url, timestamp)
        path = "{}&signature={}".format(url, signature)
        print(path)
        res = self.make_request(
            "get",
            path,
            user=False,
            is_json=False,
        )
        self.assertEqual(res.status_code, 403)

    #
    # This is a bad way to write these tests, but the way Flask works doesn't make it easy to write them properly...
    #
    def test_success(self):
        self.factory.create_application_dashboard(application_id=self.application.id, dashboard_id=self.dashboard.id)
        timestamp = int(time.time())
        params = {
            "secret_key": self.application.secret_key,
            "timestamp": str(timestamp),
            "max_age": "3600",
            "p_countries": "['us', 'ke', 'en']",
            "p_type": "游戏",
            "p_time": "['2021年01月01日', '2022年12月31日']",
        }
        s = encode_params(params)
        url = "?".join([self.embed_url, s])
        signature = get_embed_signature(self.application.secret_token, self.basic_url+url, timestamp)
        path = "{}&signature={}".format(url, signature)

        res = self.make_request(
            "get",
            path,
            user=False,
            is_json=False,
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("frame-ancestors *", res.headers["Content-Security-Policy"])
        self.assertNotIn("X-Frame-Options", res.headers)

    def test_works_for_logged_in_user(self):
        application = self.factory.create_application(name="test_works_for_logged_in_user")
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=self.dashboard.id)

        timestamp = int(time.time())
        params = {
            "secret_key": application.secret_key,
            "timestamp": str(timestamp),
        }
        s = encode_params(params)
        url = "?".join([self.embed_url, s])
        signature = get_embed_signature(application.secret_token, self.basic_url+url, timestamp)
        path = "{}&signature={}".format(url, signature)

        res = self.make_request(
            "get",
            path,
            is_json=False,
        )
        self.assertEqual(res.status_code, 200)

    def test_bad_serect_token(self):
        application = self.factory.create_application(name="test_bad_serect_token")
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=self.dashboard.id)

        timestamp = int(time.time())
        params = {
            "secret_key": application.secret_key,
            "timestamp": str(timestamp),
        }
        s = encode_params(params)
        url = "?".join([self.embed_url, s])
        signature = get_embed_signature("bad_api_serect", self.basic_url+url, timestamp)
        path = "{}&signature={}".format(url, signature)

        res = self.make_request(
            "get",
            path,
            is_json=False,
        )
        self.assertEqual(res.status_code, 401)

    def test_deactive_appcliation(self):
        application = self.factory.create_application(name="test_deactive_appcliation", active=False)
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=self.dashboard.id)

        timestamp = int(time.time())
        params = {
            "secret_key": application.secret_key,
            "timestamp": str(timestamp),
        }
        s = encode_params(params)
        url = "?".join([self.embed_url, s])
        signature = get_embed_signature(application.secret_token, self.basic_url+url, timestamp)
        path = "{}&signature={}".format(url, signature)

        res = self.make_request(
            "get",
            path,
            is_json=False,
        )
        self.assertEqual(res.status_code, 401)

    def test_expired_timestamp(self):
        application = self.factory.create_application(name="test_expired_timestamp")
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=self.dashboard.id)

        timestamp = int(time.time())
        timestamp = timestamp - 10 - 1
        params = {
            "secret_key": application.secret_key,
            "timestamp": str(timestamp),
        }
        s = encode_params(params)
        url = "?".join([self.embed_url, s])
        signature = get_embed_signature(application.secret_token, self.basic_url+url, timestamp)
        path = "{}&signature={}".format(url, signature)
        res = self.make_request(
            "get",
            path,
            is_json=False,
        )
        self.assertEqual(res.status_code, 401)

        timestamp = int(time.time())
        timestamp = timestamp + 10 + 1
        params = {
            "secret_key": application.secret_key,
            "timestamp": str(timestamp),
        }
        s = encode_params(params)
        url = "?".join([self.embed_url, s])
        signature = get_embed_signature(application.secret_token, self.basic_url+url, timestamp)
        path = "{}&signature={}".format(url, signature)
        res = self.make_request(
            "get",
            path,
            is_json=False,
        )
        self.assertEqual(res.status_code, 401)

    def test_no_timestamp(self):
        application = self.factory.create_application(name="test_no_timestamp")
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=self.dashboard.id)

        timestamp = int(time.time())
        params = {
            "secret_key": application.secret_key,
        }
        s = encode_params(params)
        url = "?".join([self.embed_url, s])
        signature = get_embed_signature(application.secret_token, self.basic_url+url, timestamp)
        path = "{}&signature={}".format(url, signature)
        res = self.make_request(
            "get",
            path,
            is_json=False,
        )
        self.assertEqual(res.status_code, 401)

    def test_no_signature(self):
        application = self.factory.create_application(name="test_no_signature")
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=self.dashboard.id)

        timestamp = int(time.time())
        params = {
            "secret_key": application.secret_key,
            "timestamp": str(timestamp),
        }
        s = encode_params(params)
        url = "?".join([self.embed_url, s])

        res = self.make_request(
            "get",
            url,
            is_json=False,
        )
        self.assertEqual(res.status_code, 401)

# TODO: this should be applied to the new API endpoint
class TestPublicDashboard(BaseTestCase):
    def test_success(self):
        dashboard = self.factory.create_dashboard()
        api_key = self.factory.create_api_key(object=dashboard)

        res = self.make_request(
            "get",
            "/public/dashboards/{}".format(api_key.api_key),
            user=False,
            is_json=False,
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("frame-ancestors *", res.headers["Content-Security-Policy"])
        self.assertNotIn("X-Frame-Options", res.headers)

    def test_works_for_logged_in_user(self):
        dashboard = self.factory.create_dashboard()
        api_key = self.factory.create_api_key(object=dashboard)

        res = self.make_request(
            "get", "/public/dashboards/{}".format(api_key.api_key), is_json=False
        )
        self.assertEqual(res.status_code, 200)

    def test_bad_token(self):
        res = self.make_request(
            "get", "/public/dashboards/bad-token", user=False, is_json=False
        )
        self.assertEqual(res.status_code, 302)

    def test_inactive_token(self):
        dashboard = self.factory.create_dashboard()
        api_key = self.factory.create_api_key(object=dashboard, active=False)
        res = self.make_request(
            "get",
            "/public/dashboards/{}".format(api_key.api_key),
            user=False,
            is_json=False,
        )
        self.assertEqual(res.status_code, 302)

    # Not relevant for now, as tokens in api_keys table are only created for dashboards. Once this changes, we should
    # add this test.
    # def test_token_doesnt_belong_to_dashboard(self):
    #     pass


class TestAPIPublicDashboard(BaseTestCase):
    def test_success(self):
        dashboard = self.factory.create_dashboard()
        api_key = self.factory.create_api_key(object=dashboard)

        res = self.make_request(
            "get",
            "/api/dashboards/public/{}".format(api_key.api_key),
            user=False,
            is_json=False,
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("frame-ancestors *", res.headers["Content-Security-Policy"])
        self.assertNotIn("X-Frame-Options", res.headers)

    def test_works_for_logged_in_user(self):
        dashboard = self.factory.create_dashboard()
        api_key = self.factory.create_api_key(object=dashboard)

        res = self.make_request(
            "get", "/api/dashboards/public/{}".format(api_key.api_key), is_json=False
        )
        self.assertEqual(res.status_code, 200)

    def test_bad_token(self):
        res = self.make_request(
            "get", "/api/dashboards/public/bad-token", user=False, is_json=False
        )
        self.assertEqual(res.status_code, 404)

    def test_inactive_token(self):
        dashboard = self.factory.create_dashboard()
        api_key = self.factory.create_api_key(object=dashboard, active=False)
        res = self.make_request(
            "get",
            "/api/dashboards/public/{}".format(api_key.api_key),
            user=False,
            is_json=False,
        )
        self.assertEqual(res.status_code, 404)

    # Not relevant for now, as tokens in api_keys table are only created for dashboards. Once this changes, we should
    # add this test.
    # def test_token_doesnt_belong_to_dashboard(self):
    #     pass