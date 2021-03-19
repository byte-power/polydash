import React from "react";

import Button from "antd/lib/button";
import routeWithUserSession from "@/components/ApplicationArea/routeWithUserSession";
import Link from "@/components/Link";
import navigateTo from "@/components/ApplicationArea/navigateTo";
import Paginator from "@/components/Paginator";

import { wrap as itemsList, ControllerType } from "@/components/items-list/ItemsList";
import { ResourceItemsSource } from "@/components/items-list/classes/ItemsSource";
import { UrlStateStorage } from "@/components/items-list/classes/StateStorage";

import LoadingState from "@/components/items-list/components/LoadingState";
import EmptyState from "@/components/items-list/components/EmptyState";
import ItemsTable, { Columns } from "@/components/items-list/components/ItemsTable";

import CreateAppDialog from "./components/CreateAppDialog";
import DeleteAppButton from "./components/DeleteAppButton";
import wrapSettingsTab from "@/components/SettingsWrapper";

import Application from "@/services/application";
import { currentUser } from "@/services/auth";
import routes from "@/services/routes";

class AppsList extends React.Component {
  static propTypes = {
    controller: ControllerType.isRequired,
  };

  listColumns = [
    Columns.custom(
      (text, app) => (
        <div>
          <Link href={"applications/" + app.id}>{text}</Link>
          {app.type === "builtin" && <span className="label label-default m-l-10">built-in</span>}
        </div>
      ),
      {
        title: "Name",
        field: "name",
        width: null,
      }
    ),
    Columns.custom((text, app) => <div>{text}</div>, {
      title: "Description",
      field: "description",
      width: null,
    }),
    Columns.custom(
      (text, app) => (
        <Button.Group>
          <Link.Button href={`applications/${app.id}/dashboard`}>Dashboards</Link.Button>
        </Button.Group>
      ),
      {
        title: "",
        width: "1%",
        className: "text-nowrap",
      }
    ),
    Columns.custom(
      (text, app) => {
        const canRemove = app.type !== "builtin";
        return (
          <DeleteAppButton
            className="w-100"
            disabled={!canRemove}
            app={app}
            title={canRemove ? null : "Cannot delete built-in app"}
            onClick={() => this.onAppDeleted()}>
            Delete
          </DeleteAppButton>
        );
      },
      {
        title: "",
        width: "1%",
        className: "text-nowrap p-l-0",
        isAvailable: () => currentUser.isAdmin,
      }
    ),
  ];

  createApp = () => {
    CreateAppDialog.showModal().onClose(app =>
      Application.create(app).then(newApp => {
        navigateTo(`applications/${newApp.id}`);
        window.sessionStorage.setItem("newAppDetail", JSON.stringify(newApp));
      })
    );
  };

  onAppDeleted = () => {
    this.props.controller.updatePagination({ page: 1 });
    this.props.controller.update();
  };

  render() {
    const { controller } = this.props;

    return (
      <div data-test="GroupList">
        {currentUser.isAdmin && (
          <div className="m-b-15">
            <Button type="primary" onClick={this.createApp}>
              <i className="fa fa-plus m-r-5" />
              New Application
            </Button>
          </div>
        )}

        {!controller.isLoaded && <LoadingState className="" />}
        {controller.isLoaded && controller.isEmpty && <EmptyState className="" />}
        {controller.isLoaded && !controller.isEmpty && (
          <div className="table-responsive">
            <ItemsTable
              items={controller.pageItems}
              columns={this.listColumns}
              showHeader={true}
              context={this.actions}
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
        )}
      </div>
    );
  }
}

const AppsListPage = wrapSettingsTab(
  "Apps.List",
  {
    permission: "list_users",
    title: "Applications",
    path: "applications",
    order: 2,
  },
  itemsList(
    AppsList,
    () =>
      new ResourceItemsSource({
        getResource() {
          return Application.query.bind(Application);
        },
      }),
    () => new UrlStateStorage({ orderByField: "name", itemsPerPage: 10 })
  )
);

routes.register(
  "Apps.List",
  routeWithUserSession({
    path: "/applications",
    title: "Applications",
    render: pageProps => <AppsListPage {...pageProps} currentPage="groups" />,
  })
);
