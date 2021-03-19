from funcy import project

from tests import BaseTestCase
from redash.models import Application, ApplicationDashboard, DataSource, NoResultFound, db

hiden_token = "*" * 16
class TestApplicationResourceList(BaseTestCase):

    def test_get_application_list(self):
        application1 = self.factory.create_application(name="Test_Application1", icon_url="", description="Just for test")
        application2 = self.factory.create_application(name="Test_Application2", icon_url="", description="Just for test")
        application_diff_org = self.factory.create_application(org=self.factory.create_org())

        rv = self.make_request("get", "/api/applications")
        results = rv.json["results"]
        ids = [s["id"] for s in results]

        assert len(rv.json["results"]) == 2
        self.assertIn(application1.id, ids)
        self.assertIn(application2.id, ids)
        self.assertNotIn(application_diff_org.id, ids)

        for app in results:
            self.assertIn(hiden_token, app["secret_token"])

    def test_get_application_list2(self):
        application1 = self.factory.create_application(name="Test1", icon_url="", description="Just for test")
        application2 = self.factory.create_application(name="Test2", icon_url="", description="Just for test")
        application_diff_org = self.factory.create_application(org=self.factory.create_org())

        rv = self.make_request("get", "/api/applications?q=")
        results = rv.json["results"]
        ids = [s["id"] for s in results]

        assert len(rv.json["results"]) == 2
        self.assertIn(application1.id, ids)
        self.assertIn(application2.id, ids)
        self.assertNotIn(application_diff_org.id, ids)

        for app in results:
            self.assertIn(hiden_token, app["secret_token"])

    def test_search_application(self):
        application1 = self.factory.create_application(name="ZZZ", icon_url="", description="Just for test")
        application2 = self.factory.create_application(name="AAA", icon_url="", description="Just for test")
        application_diff_org = self.factory.create_application(org=self.factory.create_org())

        rv = self.make_request("get", "/api/applications?q=AA")
        results = rv.json["results"]
        ids = [s["id"] for s in results]

        assert len(rv.json["results"]) == 1
        self.assertIn(application2.id, ids)
        self.assertNotIn(application_diff_org.id, ids)

    def test_search_application2(self):
        application1 = self.factory.create_application(name="ZZZ2", icon_url="", description="Just for test")
        application2 = self.factory.create_application(name="AAA2", icon_url="", description="Just for test")
        application_diff_org = self.factory.create_application(org=self.factory.create_org())

        rv = self.make_request("get", "/api/applications?q=test")
        results = rv.json["results"]
        ids = [s["id"] for s in results]

        assert len(rv.json["results"]) == 2
        self.assertIn(application1.id, ids)
        self.assertIn(application2.id, ids)
        self.assertNotIn(application_diff_org.id, ids)

    def test_create_same_name_application(self):
        name = "Test_SAME"
        application1 = self.factory.create_application(name=name, icon_url="", description="Just for test")
        admin = self.factory.create_admin()
        data = {
            "name": name,
            "icon_url": "https://xx.xx.com/1.jpg",
            "description": "updated description",
        }
        rv = self.make_request("post", "/api/applications", data=data, user=admin)
        self.assertEqual(rv.status_code, 400)

    def test_create_same_name_application_ignorecase(self):
        name = "Test_SAME_NaME"
        application1 = self.factory.create_application(name=name, icon_url="", description="Just for test")
        admin = self.factory.create_admin()
        data = {
            "name": name.lower(),
            "icon_url": "https://xx.xx.com/1.jpg",
            "description": "updated description",
        }
        rv = self.make_request("post", "/api/applications", data=data, user=admin)
        self.assertEqual(rv.status_code, 400)

    def test_create_application_not_admin(self):
        data = {
            "name": "test_create_application_not_admin",
            "icon_url": "",
            "description": "updated description",
        }

        rv = self.make_request("post", "/api/applications", data=data)
        self.assertEqual(rv.status_code, 403)

    def test_create_application_admin(self):
        admin = self.factory.create_admin()
        data = {
            "name": "test_create_application_admin",
            "icon_url": "https://xx.xx.com/1.jpg",
            "description": "updated description",
        }
        rv = self.make_request("post", "/api/applications", data=data, user=admin)
        self.assertEqual(rv.status_code, 200)
        for f in ["secret_key", "secret_token"]:
            self.assertIn(f, rv.json.keys())
        self.assertNotIn(hiden_token, rv.json["secret_token"])


class TestApplicationResource(BaseTestCase):
    def test_get_application(self):
        application = self.factory.create_application(name="test_get_application", icon_url="", description="Just for test")

        rv = self.make_request("get", "/api/applications/{}".format(application.id))

        self.assertEqual(rv.status_code, 200)
        for field in ("name", "description", "icon_url"):
            self.assertEqual(rv.json[field], getattr(application, field))
            self.assertTrue(hiden_token in rv.json['secret_token'])

    def test_update_application_admin(self):
        admin = self.factory.create_admin()
        application = self.factory.create_application(name="test_get_application", icon_url="", description="Just for test")
        data = {
            "name": "test_get_application", 
            "icon_url": "https://ddd.jp", 
            "description": "Just for test22222222",
        }
        rv = self.make_request("post", "/api/applications/{}".format(application.id), data=data, user=admin)
        self.assertEqual(rv.status_code, 200)
        for d in ["name", "icon_url", "description"]:
            self.assertEqual(data[d], rv.json[d])
        for f in ["secret_key", "secret_token"]:
            self.assertIn(f, rv.json.keys())
        self.assertIn(hiden_token, rv.json["secret_token"])

    def test_update_application_not_admin(self):
        application = self.factory.create_application(name="test_update_application_not_admin", icon_url="", description="Just for test")
        data = {
            "name": "test_get_application", 
            "icon_url": "https://ddd.jp", 
            "description": "Just for test22222222",
        }
        rv = self.make_request("post", "/api/applications/{}".format(application.id), data=data)
        self.assertEqual(rv.status_code, 403)

    def test_delete_application_admin(self):
        admin = self.factory.create_admin()
        application = self.factory.create_application(name="test_delete_application_admin", icon_url="", description="Just for test")
        rv = self.make_request("delete", "/api/applications/{}".format(application.id), user=admin)
        self.assertEqual(rv.status_code, 200)

    def test_delete_application_not_admin(self):
        application = self.factory.create_application(name="test_delete_application_not_admin", icon_url="", description="Just for test")
        rv = self.make_request("delete", "/api/applications/{}".format(application.id))
        self.assertEqual(rv.status_code, 403)

 

class TestApplicationRegenerateSecretToken(BaseTestCase):
    def test_regenerate_not_admin(self):
        application = self.factory.create_application(name="test_regenerate_not_admin", icon_url="", description="Just for test")
        rv = self.make_request("post", "/api/applications/{}/regenerate_secret_token".format(application.id))
        self.assertEqual(rv.status_code, 403)
    
    def test_regenerate_admin(self):
        admin = self.factory.create_admin()
        application = self.factory.create_application(name="test_regenerate_admin", icon_url="", description="Just for test")
        rv = self.make_request("post", "/api/applications/{}/regenerate_secret_token".format(application.id), user=admin)
        self.assertEqual(rv.status_code, 200)
        for f in ["secret_key", "secret_token"]:
            self.assertIn(f, rv.json.keys())
        self.assertNotIn(hiden_token, rv.json["secret_token"])
        self.assertNotEqual(application.to_dict()["secret_token"], rv.json["secret_token"])


class TestApplicationDashoardListResource(BaseTestCase):
    def test_add_dashboard_to_application_not_admin(self):
        application = self.factory.create_application(name="test_add_dashboard_to_application_not_admin", icon_url="", description="Just for test")
        dashboard = self.factory.create_dashboard()
        data = {
            "dashboard_id": dashboard.id
        }
        rv = self.make_request("post", "/api/applications/{}/dashboards".format(application.id), data=data)
        self.assertEqual(rv.status_code, 403)

    def test_add_dashboard_to_application_admin(self):
        admin = self.factory.create_admin()
        application = self.factory.create_application(name="test_add_dashboard_to_application_admin", icon_url="", description="Just for test")
        dashboard = self.factory.create_dashboard()
        data = {
            "dashboard_id": dashboard.id
        }
        rv = self.make_request("post", "/api/applications/{}/dashboards".format(application.id), data=data, user=admin)
        self.assertEqual(rv.status_code, 200)

    def test_get_dashboard_list_not_admin(self):
        application = self.factory.create_application(name="test_get_dashboard_list_not_admin", icon_url="", description="Just for test")
        d1 = self.factory.create_dashboard()
        d2 = self.factory.create_dashboard()
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=d1.id)
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=d2.id)

        rv = self.make_request("get", "/api/applications/{}/dashboards".format(application.id))
        self.assertEqual(rv.status_code, 403)

    def test_get_dashboard_list_admin(self):
        admin = self.factory.create_admin()
        application = self.factory.create_application(name="test_get_dashboard_list_admin", icon_url="", description="Just for test")
        d1 = self.factory.create_dashboard()
        d2 = self.factory.create_dashboard()
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=d1.id)
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=d2.id)

        rv = self.make_request("get", "/api/applications/{}/dashboards".format(application.id), user=admin)
        self.assertEqual(rv.status_code, 200)
        ids = [d["id"] for d in rv.json]
        self.assertIn(d1.id, ids)
        self.assertIn(d2.id, ids)

class TestApplicationDashboardResource(BaseTestCase):
    def test_delete_dashboard_from_application_not_admin(self):
        application = self.factory.create_application(name="test_delete_dashboard_from_application_not_admin", icon_url="", description="Just for test")
        d1 = self.factory.create_dashboard()
        d2 = self.factory.create_dashboard(is_archived=True)
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=d1.id)
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=d2.id)

        rv = self.make_request("delete", "/api/applications/{}/dashboards/{}".format(application.id, d2.id))
        self.assertEqual(rv.status_code, 403)


    def test_delete_dashboard_from_application_admin(self):
        admin = self.factory.create_admin()
        application = self.factory.create_application(name="test_delete_dashboard_from_application_admin", icon_url="", description="Just for test")
        d1 = self.factory.create_dashboard()
        d2 = self.factory.create_dashboard()
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=d1.id)
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=d2.id)

        rv = self.make_request("delete", "/api/applications/{}/dashboards/{}".format(application.id, d2.id), user=admin)
        self.assertEqual(rv.status_code, 200)

        dashboards = ApplicationDashboard.get_dashboards_by_application_id(application.id)
        ids = [d["id"] for d in dashboards]
        self.assertIn(d1.id, ids)
        self.assertNotIn(d2.id, ids)        


class TestDashboardApplicationListResource(BaseTestCase):
    def test_add_dashboard_to_application_not_owner(self):
        dashboard = self.factory.create_dashboard()
        application = self.factory.create_application(name="test_add_dashboard_to_application_not_owner", icon_url="", description="Just for test")
        data = {
            "application_id": application.id
        }
        other_user = self.factory.create_user()

        rv = self.make_request("post", "/api/dashboards/{}/applications".format(dashboard.id), data=data, user=other_user)
        self.assertEqual(rv.status_code, 403)

    def test_add_dashboard_to_application_admin(self):
        admin = self.factory.create_admin()
        dashboard = self.factory.create_dashboard()
        application = self.factory.create_application(name="test_add_dashboard_to_application_admin", icon_url="", description="Just for test")
        data = {
            "application_id": application.id
        }
        admin = self.factory.create_admin()

        rv = self.make_request("post", "/api/dashboards/{}/applications".format(dashboard.id), data=data, user=admin)
        self.assertEqual(rv.status_code, 200)
        self.assertTrue(ApplicationDashboard.check_dashboard_in_application(application.id, dashboard.id))

    def test_add_dashboard_to_application_owner(self):
        admin = self.factory.create_admin()
        dashboard = self.factory.create_dashboard()
        application = self.factory.create_application(name="test_add_dashboard_to_application_owner", icon_url="", description="Just for test")
        data = {
            "application_id": application.id
        }

        rv = self.make_request("post", "/api/dashboards/{}/applications".format(dashboard.id), data=data, user=self.factory.user)
        self.assertEqual(rv.status_code, 200)
        self.assertTrue(ApplicationDashboard.check_dashboard_in_application(application.id, dashboard.id))

    def test_get_application_list(self):
        application1 = self.factory.create_application(name="test_get_application_list1", icon_url="", description="Just for test")
        application2 = self.factory.create_application(name="test_get_application_list2", icon_url="", description="Just for test")
        dashboard = self.factory.create_dashboard()
        self.factory.create_application_dashboard(application_id=application1.id, dashboard_id=dashboard.id)
        self.factory.create_application_dashboard(application_id=application2.id, dashboard_id=dashboard.id)

        rv = self.make_request("get", "/api/dashboards/{}/applications".format(dashboard.id))
        self.assertEqual(rv.status_code, 200)
        ids = [d["id"] for d in rv.json]
        self.assertIn(application1.id, ids)
        self.assertIn(application2.id, ids)

class TestDashboardApplicationResource(BaseTestCase):
    def test_delete_dashboard_from_application_not_owner(self):
        application = self.factory.create_application(name="test_delete_dashboard_from_application_not_owner", icon_url="", description="Just for test")
        d1 = self.factory.create_dashboard()
        d2 = self.factory.create_dashboard()
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=d1.id)
        self.factory.create_application_dashboard(application_id=application.id, dashboard_id=d2.id)
        other_user = self.factory.create_user()

        rv = self.make_request("delete", "/api/dashboards/{}/applications/{}".format(d2.id, application.id), user=other_user)
        self.assertEqual(rv.status_code, 403)

    def test_delete_dashboard_from_application_owner(self):
        application1 = self.factory.create_application(name="test_delete_dashboard_from_application_owner1", icon_url="", description="Just for test")
        application2 = self.factory.create_application(name="test_delete_dashboard_from_application_owner2", icon_url="", description="Just for test")
        dashboard = self.factory.create_dashboard()
        self.factory.create_application_dashboard(application_id=application1.id, dashboard_id=dashboard.id)
        self.factory.create_application_dashboard(application_id=application2.id, dashboard_id=dashboard.id)

        rv = self.make_request("delete", "/api/dashboards/{}/applications/{}".format(dashboard.id, application2.id), user=self.factory.user)
        self.assertEqual(rv.status_code, 200)
        self.assertTrue(ApplicationDashboard.check_dashboard_in_application(application1.id, dashboard.id))
        self.assertFalse(ApplicationDashboard.check_dashboard_in_application(application2.id, dashboard.id))


    def test_delete_dashboard_from_application_admin(self):
        application1 = self.factory.create_application(name="test_delete_dashboard_from_application_owner1", icon_url="", description="Just for test")
        application2 = self.factory.create_application(name="test_delete_dashboard_from_application_owner2", icon_url="", description="Just for test")
        dashboard = self.factory.create_dashboard()
        self.factory.create_application_dashboard(application_id=application1.id, dashboard_id=dashboard.id)
        self.factory.create_application_dashboard(application_id=application2.id, dashboard_id=dashboard.id)
        admin = self.factory.create_admin()

        rv = self.make_request("delete", "/api/dashboards/{}/applications/{}".format(dashboard.id, application2.id), user=admin)
        self.assertEqual(rv.status_code, 200)
        self.assertTrue(ApplicationDashboard.check_dashboard_in_application(application1.id, dashboard.id))
        self.assertFalse(ApplicationDashboard.check_dashboard_in_application(application2.id, dashboard.id))