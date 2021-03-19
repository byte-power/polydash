from tests import BaseTestCase
from redash.models import Application, ApplicationDashboard

from sqlalchemy.orm.exc import NoResultFound


class TestApplicationGetByObject(BaseTestCase):
    def test_create_application(self):
        application = self.factory.create_application()
        self.assertIsNotNone(Application.get_by_secret_key(application.secret_key))

class TestApplicationDashboard(BaseTestCase):
    def test_add_dashboard_to_application(self):
        application = self.factory.create_application()
        dashboard1 = self.factory.create_dashboard()
        dashboard2 = self.factory.create_dashboard()

        ApplicationDashboard.add_dashboard_to_application(dashboard1.id, application.id)
        ApplicationDashboard.add_dashboard_to_application(dashboard2.id, application.id)

        rv = ApplicationDashboard.get_dashboards_by_application_id(application.id)
        self.assertEqual(len(rv), 2)
        rv = ApplicationDashboard.get_applications_by_dashboard_id(dashboard1.id)
        self.assertEqual(len(rv), 1)
        rv = ApplicationDashboard.get_applications_by_dashboard_id(dashboard2.id)
        self.assertEqual(len(rv), 1)

        ApplicationDashboard.delete_dashboard_from_application(dashboard1.id, application.id)
        rv = ApplicationDashboard.get_dashboards_by_application_id(application.id)
        self.assertEqual(len(rv), 1)
        rv = ApplicationDashboard.check_dashboard_in_application(application.id, dashboard2.id)
        self.assertTrue(rv)
        rv = ApplicationDashboard.check_dashboard_in_application(application.id, dashboard1.id)
        self.assertFalse(rv)