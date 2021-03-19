import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";

import routeWithUserSession from "@/components/ApplicationArea/routeWithUserSession";
import DynamicComponent from "@/components/DynamicComponent";
import LoadingState from "@/components/items-list/components/LoadingState";
import wrapSettingsTab from "@/components/SettingsWrapper";

import Application from "@/services/application";
import { currentUser } from "@/services/auth";
import routes from "@/services/routes";
import useImmutableCallback from "@/lib/hooks/useImmutableCallback";

import EditableAppDetail from "./components/EditableAppDetail";
import ReadOnlyAppDetail from "./components/ReadOnlyAppDetail";

import "./settings.less";

function AppDetail({ appId, onError }) {
  const [app, setApp] = useState(null);

  const handleError = useImmutableCallback(onError);

  useEffect(() => {
    let isCancelled = false;
    let detail = window.sessionStorage.getItem("newAppDetail");
    if (detail) {
      isCancelled = true;
      setApp(JSON.parse(detail));
      window.sessionStorage.removeItem("newAppDetail");
    }
    Application.get({ id: appId })
      .then(app => {
        if (!isCancelled) {
          setApp(app);
        }
      })
      .catch(error => {
        if (!isCancelled) {
          handleError(error);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [appId, handleError]);

  const canEdit = app && currentUser.isAdmin;
  return (
    <React.Fragment>
      <div className="row">
        {!app && <LoadingState className="" />}
        {app && (
          <DynamicComponent name="AppDetail" app={app}>
            {!canEdit && <ReadOnlyAppDetail app={app} />}
            {canEdit && <EditableAppDetail app={app} />}
          </DynamicComponent>
        )}
      </div>
    </React.Fragment>
  );
}

AppDetail.propTypes = {
  appId: PropTypes.string,
  onError: PropTypes.func,
};

AppDetail.defaultProps = {
  appId: null,
  onError: () => {},
};

const AppDetailPage = wrapSettingsTab("Apps.Detail", null, AppDetail);

routes.register(
  "Apps.ViewOrEdit",
  routeWithUserSession({
    path: "/applications/:appId",
    title: "Application",
    render: pageProps => <AppDetailPage {...pageProps} />,
  })
);
