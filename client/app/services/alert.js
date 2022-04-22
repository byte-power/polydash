import { axios } from "@/services/axios";
import { merge, clone, map } from "lodash";

// backwards compatibility
const normalizeCondition = {
  "greater than": ">",
  "less than": "<",
  equals: "=",
};

const transformResponse = data =>
  merge({}, data, {
    options: {
      op: normalizeCondition[data.options.op] || data.options.op,
    },
  });

const transformRequest = data => {
  const newData = Object.assign({}, data);
  if (newData.query_id === undefined) {
    newData.query_id = newData.query.id;
    newData.destination_id = newData.destinations;
    delete newData.query;
    delete newData.destinations;
  }

  return newData;
};

const mapResults = data => ({ count: 20, results: map(data, item => item) });

const saveOrCreateUrl = data => (data.id ? `api/alerts/${data.id}` : "api/alerts");

const Alert = {
  query: (params) => axios.get("api/alerts", { params }).then(mapResults),
  get: ({ id }) => axios.get(`api/alerts/${id}`).then(transformResponse),
  save: data => axios.post(saveOrCreateUrl(data), transformRequest(data)),
  delete: data => axios.delete(`api/alerts/${data.id}`),
  mute: data => axios.post(`api/alerts/${data.id}/mute`),
  unmute: data => axios.delete(`api/alerts/${data.id}/mute`),
};

export default Alert;
