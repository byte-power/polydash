import Plotly from "plotly.js/lib/core";
import bar from "plotly.js/lib/bar";
import pie from "plotly.js/lib/pie";
import histogram from "plotly.js/lib/histogram";
import box from "plotly.js/lib/box";
import heatmap from "plotly.js/lib/heatmap";

import prepareData from "./prepareData";
import prepareLayout from "./prepareLayout";
import updateData from "./updateData";
import updateAxes from "./updateAxes";
import updateChartSize from "./updateChartSize";
import { prepareCustomChartData, createCustomChartRenderer } from "./customChartUtils";

import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { LineChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent
} from 'echarts/components';
import { LabelLayout } from 'echarts/features';
import { CanvasRenderer } from 'echarts/renderers';
echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LineChart,
  BarChart,
  LabelLayout,
  CanvasRenderer
]);

Plotly.register([bar, pie, histogram, box, heatmap]);
Plotly.setPlotConfig({
  modeBarButtonsToRemove: ["sendDataToCloud"],
});

export {
  echarts,
  Plotly,
  prepareData,
  prepareLayout,
  updateData,
  updateAxes,
  updateChartSize,
  prepareCustomChartData,
  createCustomChartRenderer,
};
