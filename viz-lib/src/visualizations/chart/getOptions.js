import { includes, merge } from "lodash";
import { Plotly } from "./plotly";
import { visualizationsSettings } from "@/visualizations/visualizationsSettings";

const DEFAULT_OPTIONS = {
  globalSeriesType: "column",
  sortX: true,
  legend: { enabled: true, placement: "auto", traceorder: "normal" },
  xAxis: { type: "-", labels: { enabled: true }, dateTimeFormat: visualizationsSettings.dateTimeFormat },
  yAxis: [{ type: "linear" }, { type: "linear", opposite: true }],
  alignYAxesAtZero: false,
  error_y: { type: "data", visible: true },
  series: { stacking: null, error_y: { type: "data", visible: true } },
  seriesOptions: {},
  valuesOptions: {},

  // constant Line
  constantLine: [{ name: '', reference: 0, value: null, color: '', format: 'solid' }],
  constantLineLimit: 4,

  columnMapping: {},
  direction: { type: "counterclockwise" },
  sizemode: "diameter",
  coefficient: 1,

  // showDataLabels: false, // depends on chart type
  numberFormat: "0,0[.]00000",
  percentFormat: "0[.]00%",
  // dateTimeFormat: 'DD/MM/YYYY HH:mm', // will be set from visualizationsSettings
  textFormat: "", // default: combination of {{ @@yPercent }} ({{ @@y }} ± {{ @@yError }})

  showTotalLabels: false,
  totalNumberFormat: "0,0[.]00000",

  missingValuesAsZero: true,

  onHover: null,
  markerSize: 9
};

export default function getOptions(options) {
  const result = merge(
    {},
    DEFAULT_OPTIONS,
    {
      showDataLabels: options.globalSeriesType === "pie",
      dateTimeFormat: visualizationsSettings.dateTimeFormat,
    },
    options
  );

  // Backward compatibility
  if (["normal", "percent"].indexOf(result.series.stacking) >= 0) {
    result.series.percentValues = result.series.stacking === "percent";
    result.series.stacking = "stack";
  }

  // line Animate plotly_hover 
  // todo
  // if (includes(["line"], options.globalSeriesType)) {
  //   result.coefficient = 1.4;
  //   result.onHover = function (updates) {
  //     let tn = updates.points[0].curveNumber;
  //     let pn = updates.points[0].pointNumber;
  //     Plotly.animate(this, {
  //       data: [{
  //         selectedpoints: [pn]
  //       }],
  //       traces: [tn]
  //     }, {
  //       transition: {
  //         duration: 200,
  //         easing: "quad-in-out"
  //       }
  //     })
  //   }
  //   result.onUnHover = function (updates) {
  //     let tn = updates.points[0].curveNumber;
  //     Plotly.animate(this, {
  //       data: [{
  //         selectedpoints: []
  //       }],
  //       traces: [tn]
  //     }, {
  //       transition: {
  //         duration: 100,
  //         easing: "quad-in-out"
  //       }
  //     })
  //   }
  // } else {
  //   result.onHover = null
  //   result.onUnHover = null
  // }

  return result;
}
