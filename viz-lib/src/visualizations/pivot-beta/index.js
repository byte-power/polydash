import { merge } from "lodash";

import Renderer from "./Renderer";
import Editor from "./Editor";

const DEFAULT_OPTIONS = {
  controls: {
    enabled: false, // `false` means "show controls" o_O
  },
  rendererOptions: {
    table: {
      colTotals: true,
      rowTotals: true,
    }
  }
};


export default {
  type: "PIVOTBETA",
  name: "透视表",
  getOptions: options => merge({}, DEFAULT_OPTIONS, options),
  Renderer,
  Editor,

  defaultRows: 10,
  defaultColumns: 3,
  minColumns: 2,
  sort: 2
};
