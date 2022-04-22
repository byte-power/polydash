import time

from flask import request
from funcy import project, partial

from redash import models
from redash.serializers import serialize_alert
from redash.permissions import (
    require_access,
    require_admin_or_owner,
    require_permission,
    view_only,
)
from redash.handlers.base import (
    BaseResource,
    require_fields,
    get_object_or_404,
    paginate,
    order_results as _order_results,
)
from redash.utils import json_dumps

order_map = {
    "name": "lowercase_name",
    "-name": "-lowercase_name",
    "created_at": "created_at",
    "-created_at": "-created_at",
    "created_by": "users-name",
    "-created_by": "-users-name"
}

order_results = partial(
    _order_results, default_order="-created_at", allowed_orders=order_map
)


class AlertResource(BaseResource):
    def get(self, alert_id):
        alert = get_object_or_404(
            models.Alert.get_by_id_and_org, alert_id, self.current_org
        )
        require_access(alert, self.current_user, view_only)
        self.record_event(
            {"action": "view", "object_id": alert.id, "object_type": "alert"}
        )
        return serialize_alert(alert)

    def post(self, alert_id):
        req = request.get_json(True)
        params = project(req, ("options", "name", "query_id", "rearm"))
        alert = get_object_or_404(
            models.Alert.get_by_id_and_org, alert_id, self.current_org
        )
        require_admin_or_owner(alert.user.id)

        self.update_model(alert, params)
        models.db.session.commit()

        self.record_event(
            {"action": "edit", "object_id": alert.id, "object_type": "alert"}
        )

        return serialize_alert(alert)

    def delete(self, alert_id):
        alert = get_object_or_404(
            models.Alert.get_by_id_and_org, alert_id, self.current_org
        )
        require_admin_or_owner(alert.user_id)
        models.db.session.delete(alert)
        models.db.session.commit()


class AlertMuteResource(BaseResource):
    def post(self, alert_id):
        alert = get_object_or_404(
            models.Alert.get_by_id_and_org, alert_id, self.current_org
        )
        require_admin_or_owner(alert.user.id)

        alert.options["muted"] = True
        models.db.session.commit()

        self.record_event(
            {"action": "mute", "object_id": alert.id, "object_type": "alert"}
        )

    def delete(self, alert_id):
        alert = get_object_or_404(
            models.Alert.get_by_id_and_org, alert_id, self.current_org
        )
        require_admin_or_owner(alert.user.id)

        alert.options["muted"] = False
        models.db.session.commit()

        self.record_event(
            {"action": "unmute", "object_id": alert.id, "object_type": "alert"}
        )


class AlertListResource(BaseResource):
    def get_queries(self, search_term):
        if search_term:
            return models.Alert.search(
                search_term=search_term,
                group_ids=self.current_user.group_ids
            )
        return models.Alert.all(group_ids=self.current_user.group_ids)

    def post(self):
        req = request.get_json(True)
        require_fields(req, ("options", "name", "query_id"))

        query = models.Query.get_by_id_and_org(req["query_id"], self.current_org)
        require_access(query, self.current_user, view_only)

        alert = models.Alert(
            name=req["name"],
            query_rel=query,
            user=self.current_user,
            rearm=req.get("rearm"),
            options=req["options"],
        )

        models.db.session.add(alert)
        models.db.session.flush()
        models.db.session.commit()

        self.record_event(
            {"action": "create", "object_id": alert.id, "object_type": "alert"}
        )

        return serialize_alert(alert)

    @require_permission("list_alerts")
    def get(self):
        """
        Retrieve a list of alerts.

        :qparam number page_size: Number of alerts to return per page
        :qparam number page: Page number to retrieve
        :qparam number order: Name of column to order by
        :qparam number q: Full text search term

        Responds with an array of :ref:`query <query-response-label>` objects.
        """
        search_term = request.args.get("q", "")
        queries = self.get_queries(search_term)

        # order results according to passed order parameter,
        # special-casing search queries where the database
        # provides an order by search rank
        ordered_results = _order_results(queries, fallback=not bool(search_term))

        page = request.args.get("page", 1, type=int)
        page_size = request.args.get("page_size", 25, type=int)

        response = paginate(
            ordered_results,
            page=page,
            page_size=page_size,
            serializer=serialize_alert,
            with_stats=True,
            with_last_modified_by=False,
        )

        if search_term:
            self.record_event(
                {"action": "search", "object_type": "alert", "term": search_term}
            )
        else:
            self.record_event({"action": "list", "object_type": "alert"})

        return response
        


class AlertSubscriptionListResource(BaseResource):
    def post(self, alert_id):
        req = request.get_json(True)

        alert = models.Alert.get_by_id_and_org(alert_id, self.current_org)
        require_access(alert, self.current_user, view_only)
        kwargs = {"alert": alert, "user": self.current_user}

        if "destination_id" in req:
            destination = models.NotificationDestination.get_by_id_and_org(
                req["destination_id"], self.current_org
            )
            kwargs["destination"] = destination

        subscription = models.AlertSubscription(**kwargs)
        models.db.session.add(subscription)
        models.db.session.commit()

        self.record_event(
            {
                "action": "subscribe",
                "object_id": alert_id,
                "object_type": "alert",
                "destination": req.get("destination_id"),
            }
        )

        d = subscription.to_dict()
        return d

    def get(self, alert_id):
        alert = models.Alert.get_by_id_and_org(alert_id, self.current_org)
        require_access(alert, self.current_user, view_only)

        subscriptions = models.AlertSubscription.all(alert_id)
        return [s.to_dict() for s in subscriptions]


class AlertSubscriptionResource(BaseResource):
    def delete(self, alert_id, subscriber_id):
        subscription = models.AlertSubscription.query.get_or_404(subscriber_id)
        require_admin_or_owner(subscription.user.id)
        models.db.session.delete(subscription)
        models.db.session.commit()

        self.record_event(
            {"action": "unsubscribe", "object_id": alert_id, "object_type": "alert"}
        )
