import { isString, get, find } from "lodash";
import sanitize from "@/services/sanitize";
import { axios } from "@/services/axios";
import notification from "@/services/notification";

function getErrorMessage(error) {
  return find([get(error, "response.data.message"), get(error, "response.statusText"), "Unknown error"], isString);
}

function disableResource(app) {
  return `api/applications/${app.id}`;
}

function enableApplication(app) {
  const appName = sanitize(app.name);
  return axios
    .post(disableResource(app), {
      active: true,
    })
    .then(data => {
      notification.success(`Application ${appName} is now actived.`);
      return data;
    })
    .catch(error => {
      notification.error("Cannot active application", getErrorMessage(error));
    });
}

function disableApplication(app) {
  const appName = sanitize(app.name);
  return axios
    .post(disableResource(app), {
      active: false,
    })
    .then(data => {
      notification.warning(`Application ${appName} is now deactived.`);
      return data;
    })
    .catch(error => {
      notification.error("Cannot deactive application", getErrorMessage(error));
    });
}

function deleteApplication(app) {
  const appName = sanitize(app.name);
  return axios
    .delete(disableResource(app))
    .then(data => {
      notification.warning(`Application ${appName} has been deleted.`);
      return data;
    })
    .catch(error => {
      notification.error("Cannot delete application", getErrorMessage(error));
    });
}

function regenerateApiKey(app) {
  return axios
    .post(`api/applications/${app.id}/regenerate_secret_token`)
    .then(data => {
      notification.success("The secret token has been updated.");
      return data.secret_token;
    })
    .catch(error => {
      notification.error("Failed regenerating secret token", getErrorMessage(error));
    });
}

const Application = {
  query: params => axios.get("api/applications", { params }),
  get: ({ id }) => axios.get(`api/applications/${id}`),
  create: data => axios.post(`api/applications`, data),
  save: data => axios.post(`api/applications/${data.id}`, data),
  enableApplication,
  disableApplication,
  deleteApplication,
  regenerateApiKey,
  dashboards: ({ id }) => axios.get(`api/applications/${id}/dashboards`),
  addDashboard: ({ id }, data) => axios.post(`api/applications/${id}/dashboards`, data),
  removeDashboard: ({ id, dashboardId }) => axios.delete(`api/applications/${id}/dashboards/${dashboardId}`),
};

export default Application;
