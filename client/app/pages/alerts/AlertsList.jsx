import { toUpper } from "lodash";
import React, { useEffect, useRef } from "react";
import cx from "classnames";
import routeWithUserSession from "@/components/ApplicationArea/routeWithUserSession";
import Link from "@/components/Link";
import PageHeader from "@/components/PageHeader";
import Paginator from "@/components/Paginator";
import EmptyState, { EmptyStateHelpMessage } from "@/components/empty-state/EmptyState";
import { wrap as itemsList, ControllerType } from "@/components/items-list/ItemsList";
import useItemsListExtraActions from "@/components/items-list/hooks/useItemsListExtraActions";
import { ResourceItemsSource } from "@/components/items-list/classes/ItemsSource";
import { UrlStateStorage } from "@/components/items-list/classes/StateStorage";
import { StateStorage } from "@/components/items-list/classes/StateStorage";
import DynamicComponent from "@/components/DynamicComponent";

import * as Sidebar from "@/components/items-list/components/Sidebar";
import ItemsTable, { Columns } from "@/components/items-list/components/ItemsTable";

import Layout from "@/components/layouts/ContentWithSidebar";

import Alert from "@/services/alert";
import { currentUser } from "@/services/auth";
import location from "@/services/location";
import routes from "@/services/routes";

import AlertsListEmptyState from "./AlertsListEmptyState";

import "./alerts-list.css";

export const STATE_CLASS = {
  unknown: "label-warning",
  ok: "label-success",
  triggered: "label-danger"
};

const listColumns = [
  Columns.custom.sortable(
    (text, alert) => <i className={`fa fa-bell-${alert.options.muted ? "slash" : "o"} p-r-0`} />,
    {
      title: <i className="fa fa-bell p-r-0" />,
      field: "muted",
      width: "1%",
    }
  ),
  Columns.custom.sortable(
    (text, alert) => (
      <div>
        <Link className="table-main-title" href={"alerts/" + alert.id}>
          {alert.name}
        </Link>
      </div>
    ),
    {
      title: "Name",
      field: "name",
    }
  ),
  Columns.custom((text, item) => item.user.name, { title: "Created By", width: "1%" }),
  Columns.custom.sortable(
    (text, alert) => (
      <div>
        <span className={`label ${STATE_CLASS[alert.state]}`}>{toUpper(alert.state)}</span>
      </div>
    ),
    {
      title: "State",
      field: "state",
      width: "1%",
      className: "text-nowrap",
    }
  ),
  Columns.timeAgo.sortable({ title: "Last Updated At", field: "updated_at", width: "1%" }),
  Columns.dateTime.sortable({ title: "Created At", field: "created_at", width: "1%" }),
];

function AlertsListExtraActions(props) {
  return <DynamicComponent name="AlertsList.Actions" {...props} />;
}

function AlertsList({ controller }) {
  const controllerRef = useRef();
  controllerRef.current = controller;

  useEffect(() => {
    const unlistenLocationChanges = location.listen((unused, action) => {
      const searchTerm = location.search.q || "";
      if (action === "PUSH" && searchTerm !== controllerRef.current.searchTerm) {
        controllerRef.current.updateSearch(searchTerm);
      }
    });

    return () => {
      unlistenLocationChanges();
    };
  }, []);

  const {
    areExtraActionsAvailable,
    listColumns: tableColumns,
    Component: ExtraActionsComponent,
    selectedItems,
  } = useItemsListExtraActions(controller, listColumns, AlertsListExtraActions);

  return (
    <div className="page-alerts-list">
      <div className="container">
        <PageHeader
          title={controller.params.pageTitle}
          actions={
            currentUser.hasPermission("list_alerts") ? (
              <Link.Button block type="primary" href="alerts/new">
                <i className="fa fa-plus m-r-5" />
                New Alert
              </Link.Button>
            ) : null
          }
        />
        <Layout>
          <Layout.Sidebar className="m-b-0">
            <Sidebar.SearchInput
              placeholder="Search Alert..."
              value={controller.searchTerm}
              onChange={controller.updateSearch}
            />
          </Layout.Sidebar>
          <Layout.Content>
            {controller.isLoaded && controller.isEmpty ? (
              <AlertsListEmptyState
                page={controller.params.currentPage}
                searchTerm={controller.searchTerm}
              />
            ) : (
              <React.Fragment>
                <div className={cx({ "m-b-10": areExtraActionsAvailable })}>
                  <ExtraActionsComponent selectedItems={selectedItems} />
                </div>
                <div className="bg-white tiled table-responsive">
                  <ItemsTable
                    items={controller.pageItems}
                    loading={!controller.isLoaded}
                    columns={tableColumns}
                    orderByField={controller.orderByField}
                    orderByReverse={controller.orderByReverse}
                    toggleSorting={controller.toggleSorting}
                  />
                  <Paginator
                    showPageSizeSelect
                    totalCount={controller.totalItemsCount}
                    pageSize={controller.itemsPerPage}
                    onPageSizeChange={itemsPerPage => controller.updatePagination({ itemsPerPage })}
                    page={controller.page}
                    onChange={page => controller.updatePagination({ page })}
                  />
                </div>
              </React.Fragment>
            )}
          </Layout.Content>
        </Layout>
      </div>
    </div>
  );
}

AlertsList.propTypes = {
  controller: ControllerType.isRequired,
};

const AlertsListPage = itemsList(
  AlertsList,
  () =>
    new ResourceItemsSource({
      getResource({ params: { currentPage } }) {
        return {
          all: Alert.query.bind(Alert)
        }[currentPage];
      }
    }),
  () => new UrlStateStorage({ orderByField: "created_at", orderByReverse: true })
);

routes.register(
  "Alerts.List",
  routeWithUserSession({
    path: "/alerts",
    title: "Alerts",
    render: pageProps => <AlertsListPage {...pageProps} currentPage="all" />,
  })
);
