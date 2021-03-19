import { includes, map } from "lodash";
import React from "react";
import Button from "antd/lib/button";

import routeWithUserSession from "@/components/ApplicationArea/routeWithUserSession";
import Paginator from "@/components/Paginator";

import { wrap as itemsList, ControllerType } from "@/components/items-list/ItemsList";
import { ResourceItemsSource } from "@/components/items-list/classes/ItemsSource";
import { StateStorage } from "@/components/items-list/classes/StateStorage";

import LoadingState from "@/components/items-list/components/LoadingState";
import ItemsTable, { Columns } from "@/components/items-list/components/ItemsTable";
import SelectItemsDialog from "@/components/SelectItemsDialog";
import { DashboardPreviewCard } from "@/components/PreviewCard";

import ListItemAddon from "@/components/groups/ListItemAddon";
import Layout from "@/components/layouts/ContentWithSidebar";
import wrapSettingsTab from "@/components/SettingsWrapper";

import notification from "@/services/notification";
import { currentUser } from "@/services/auth";
import Application from "@/services/application";
import { Dashboard } from "@/services/dashboard";
import routes from "@/services/routes";

class AppDashboards extends React.Component {
  static propTypes = {
    controller: ControllerType.isRequired,
  };

  appId = parseInt(this.props.controller.params.appId, 10);

  app = null;

  listColumns = [
    Columns.custom((text, user) => <div>{text}</div>, {
      title: "Name",
      field: "name",
      width: null,
    }),
    Columns.custom(
      (text, user) => {
        if (!this.app) {
          return null;
        }

        return (
          <Button className="w-100" type="danger" onClick={event => this.removeDashboard(event, user)}>
            Remove
          </Button>
        );
      },
      {
        width: "1%",
        isAvailable: () => currentUser.isAdmin,
      }
    ),
  ];

  componentDidMount() {
    Application.get({ id: this.appId })
      .then(app => {
        this.app = app;
        this.forceUpdate();
      })
      .catch(error => {
        this.props.controller.handleError(error);
      });
  }

  removeDashboard = (event, dash) =>
    Application.removeDashboard({ id: this.appId, dashboardId: dash.id })
      .then(() => {
        this.props.controller.updatePagination({ page: 1 });
        this.props.controller.update();
      })
      .catch(() => {
        notification.error("Failed to remove member from group.");
      });

  addDashboard = () => {
    const alreadyAddedDashboards = map(this.props.controller.allItems, u => u.id);
    SelectItemsDialog.showModal({
      dialogTitle: "Add Dashboard",
      inputPlaceholder: "Search dashboards...",
      selectedItemsTitle: "New Dashboard",
      searchItems: searchTerm =>
        Dashboard.queryAll({ q: searchTerm }).then(({ results }) => {
          return results;
        }),
      renderItem: (item, { isSelected }) => {
        const alreadyInGroup = includes(alreadyAddedDashboards, item.id);
        return {
          content: (
            <DashboardPreviewCard dashboard={item}>
              <ListItemAddon isSelected={isSelected} alreadyInGroup={alreadyInGroup} />
            </DashboardPreviewCard>
          ),
          isDisabled: alreadyInGroup,
          className: isSelected || alreadyInGroup ? "selected" : "",
        };
      },
      renderStagedItem: (item, { isSelected }) => ({
        content: (
          <DashboardPreviewCard dashboard={item}>
            <ListItemAddon isSelected={isSelected} isStaged />
          </DashboardPreviewCard>
        ),
      }),
    }).onClose(items => {
      const promises = map(items, u => Application.addDashboard({ id: this.appId }, { dashboard_id: u.id }));
      return Promise.all(promises).then(() => this.props.controller.update());
    });
  };

  render() {
    const { controller } = this.props;
    return (
      <div data-test="Group">
        <h4>{this.app && this.app.name}</h4>
        <Layout>
          <Layout.Content>
            {currentUser.isAdmin && (
              <Button type="primary" onClick={this.addDashboard}>
                <i className="fa fa-plus m-r-5" />
                Add Dashboard
              </Button>
            )}
            {!controller.isLoaded && <LoadingState className="" />}
            {controller.isLoaded && controller.isEmpty && (
              <div className="text-center">
                <p>There are no dashboard in this application yet.</p>
              </div>
            )}
            {controller.isLoaded && !controller.isEmpty && (
              <div className="table-responsive">
                <ItemsTable
                  items={controller.pageItems}
                  columns={this.listColumns}
                  showHeader={false}
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
          </Layout.Content>
        </Layout>
      </div>
    );
  }
}

const AppDashboardPage = wrapSettingsTab(
  "Apps.Dashboards",
  null,
  itemsList(
    AppDashboards,
    () =>
      new ResourceItemsSource({
        isPlainList: true,
        getRequest(unused, { params: { appId } }) {
          return { id: appId };
        },
        getResource() {
          return Application.dashboards.bind(Application);
        },
      }),
    () => new StateStorage({ orderByField: "name" })
  )
);

routes.register(
  "Apps.Dashboards",
  routeWithUserSession({
    path: "/applications/:appId/dashboard",
    title: "Apps Dashboards",
    render: pageProps => <AppDashboardPage {...pageProps} />,
  })
);
