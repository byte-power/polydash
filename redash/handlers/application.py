import time
from flask import request
from flask_restful import abort
from funcy import project, partial

from redash import models
from redash.permissions import require_admin, require_permission, require_admin_or_owner
from redash.handlers.base import (
    BaseResource,
    require_fields,
    get_object_or_404,
    paginate,
    order_results as _order_results,
)
from redash.serializers import ApplicationSerializer

# Ordering map for relationships
order_map = {
    "name": "lowercase_name",
    "-name": "-lowercase_name",
    "created_at": "created_at",
    "-created_at": "-created_at",
}

order_results = partial(
    _order_results, default_order="-created_at", allowed_orders=order_map
)

class ApplicationListResource(BaseResource):
    @require_admin
    def post(self):
        req = request.get_json(True)
        require_fields(req, ("name",))
        name = req["name"]

        if models.Application.get_by_name_and_org(name, self.current_org) is not None:
            abort(400, message="Name already token")

        application = models.Application(
            name=name,
            icon_url=req.get("icon_url"),
            active = req.get("active", True),
            description=req.get("description"),
            created_by_id=self.current_user.id,
            org=self.current_org,
        )

        models.db.session.add(application)
        models.db.session.commit()

        self.record_event(
            {
                "action": "create",
                "object_id": application.id,
                "object_type": "application",
            }
        )

        return application.to_dict(hide_token=False)

    @require_permission("list_applications")
    def get(self):
        search_term = request.args.get("q")
        if search_term:
            applications = models.Application.search(self.current_org, search_term)
            self.record_event(
                {"action": "search", "object_type": "application", "term": search_term}
            )
        else:
            applications = models.Application.all(self.current_org)
            self.record_event(
                {"action": "list", "object_id": "applications", "object_type": "application"}
            )

        ordered_results = order_results(applications, fallback=not bool(search_term))

        page = request.args.get("page", 1, type=int)
        page_size = request.args.get("page_size", 25, type=int)

        response = paginate(
            ordered_results,
            page=page,
            page_size=page_size,
            serializer=ApplicationSerializer,
        )
        return response


class ApplicationResource(BaseResource):
    @require_admin
    def post(self, application_id):
        req = request.get_json(True)
        params = project(req, ("name", "description", "icon_url", "active"))
        application = get_object_or_404(
            models.Application.get_by_id_and_org, application_id, self.current_org
        )

        self.update_model(application, params)
        models.db.session.commit()

        self.record_event(
            {"action": "edit", "object_id": application.id, "object_type": "application"}
        )
        return application.to_dict()

    @require_permission("list_applications")
    def get(self, application_id):
        application = get_object_or_404(
            models.Application.get_by_id_and_org, application_id, self.current_org
        )

        self.record_event(
            {"action": "view", "object_id": application_id, "object_type": "application"}
        )

        return application.to_dict()

    @require_admin
    def delete(self, application_id):
        application = get_object_or_404(
            models.Application.get_by_id_and_org, application_id, self.current_org
        )
        models.db.session.delete(application)
        models.db.session.commit()

        self.record_event(
            {"action": "delete", "object_id": application_id, "object_type": "application"}
        )


class ApplicationRegenerateSecretToken(BaseResource):
    @require_admin
    def post(self, application_id):
        application = get_object_or_404(
            models.Application.get_by_id_and_org, application_id, self.current_org
        )
        application.regenerate_secret_token()

        self.record_event(
            {
                "action": "regenerate_secret_token",
                "object_id": application.id,
                "object_type": "application",
            }
        )

        return application.to_dict(hide_token=False)

class ApplicationDashoardListResource(BaseResource):
    @require_admin
    def post(self, application_id):
        req = request.get_json(True)
        require_fields(req, ("dashboard_id",))

        Application = get_object_or_404(
            models.Application.get_by_id_and_org, application_id, self.current_org
        )

        models.ApplicationDashboard.add_dashboard_to_application(req["dashboard_id"], application_id, self.current_user)

        self.record_event(
            {
                "action": "add_dashboard_to_application",
                "object_id": application_id,
                "object_type": "application",
                "member_id": req["dashboard_id"],
            }
        )

    @require_admin
    def get(self, application_id):
        Application = get_object_or_404(
            models.Application.get_by_id_and_org, application_id, self.current_org
        )

        dashboards = models.ApplicationDashboard.get_dashboards_by_application_id(application_id)
        self.record_event(
            {"action": "list", "object_id": "dashboards", "object_type": "application"}
        )
        return dashboards


class ApplicationDashboardResource(BaseResource):
    @require_admin
    def delete(self, application_id, dashboard_id):
        models.ApplicationDashboard.delete_dashboard_from_application(dashboard_id, application_id)

        self.record_event(
            {
                "action": "delete_dashboard_from_application",
                "object_id": application_id,
                "object_type": "application",
                "member_id": dashboard_id,
            }
        )

class DashboardApplicationListResource(BaseResource):
    def post(self, dashboard_id):
        req = request.get_json(True)
        require_fields(req, ("application_id",))

        dashboard = get_object_or_404(
            models.Dashboard.get_by_id_and_org, dashboard_id, self.current_org
        )
        require_admin_or_owner(dashboard.user_id)

        models.ApplicationDashboard.add_dashboard_to_application(dashboard_id, req["application_id"], self.current_user)

        self.record_event(
            {
                "action": "add_dashboard_to_application",
                "object_id": dashboard_id,
                "object_type": "dashboard",
                "member_id": req["application_id"],
            }
        )

    def get(self, dashboard_id):
        dashboard = get_object_or_404(
            models.Dashboard.get_by_id_and_org, dashboard_id, self.current_org
        )
        applications = models.ApplicationDashboard.get_applications_by_dashboard_id(dashboard_id)
        self.record_event(
            {"action": "list", "object_id": "applications", "object_type": "dashboard"}
        )
        return applications

class DashboardApplicationResource(BaseResource):
    def delete(self, dashboard_id, application_id):
        dashboard = get_object_or_404(
            models.Dashboard.get_by_id_and_org, dashboard_id, self.current_org
        )
        require_admin_or_owner(dashboard.user_id)
        models.ApplicationDashboard.delete_dashboard_from_application(dashboard_id, application_id)

        self.record_event(
            {
                "action": "delete_dashboard_from_application",
                "object_id": dashboard_id,
                "object_type": "dashboard",
                "member_id": application_id,
            }
        )