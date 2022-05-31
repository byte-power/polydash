import { isObject, isUndefined, filter, map, each, find, extend, isNumber, concat } from "lodash";
import { getPieDimensions } from "./preparePieData";
import { FORMATOPTIONS } from "../Editor/ConstantLineSettings";
import { ColorPaletteArray } from "@/visualizations/ColorPalette";

function getAxisTitle(axis) {
  return isObject(axis.title) ? axis.title.text : null;
}

function getAxisScaleType(axis) {
  switch (axis.type) {
    case "datetime":
      return "date";
    case "logarithmic":
      return "log";
    case "customTime":
      return "category";
    default:
      return axis.type;
  }
}

function prepareXAxis(axisOptions, additionalOptions) {
  const axis = {
    title: getAxisTitle(axisOptions),
    type: getAxisScaleType(axisOptions),
    automargin: true,
  };

  if (additionalOptions.sortX && axis.type === "category") {
    if (additionalOptions.reverseX) {
      axis.categoryorder = "category descending";
    } else {
      axis.categoryorder = "category ascending";
    }
  }

  if (!isUndefined(axisOptions.labels)) {
    axis.showticklabels = axisOptions.labels.enabled;
  }

  return axis;
}

function prepareYAxis(axisOptions) {
  return {
    title: getAxisTitle(axisOptions),
    type: getAxisScaleType(axisOptions),
    automargin: true,
    autorange: true,
    range: null,
  };
}

function preparePieLayout(layout, options, data) {
  const hasName = /{{\s*@@name\s*}}/.test(options.textFormat);

  const { cellsInRow, cellWidth, cellHeight, xPadding } = getPieDimensions(data);

  if (hasName) {
    layout.annotations = [];
  } else {
    layout.annotations = filter(
      map(data, (series, index) => {
        const xPosition = (index % cellsInRow) * cellWidth;
        const yPosition = Math.floor(index / cellsInRow) * cellHeight;
        return {
          x: xPosition + (cellWidth - xPadding) / 2,
          y: yPosition + cellHeight - 0.015,
          xanchor: "center",
          yanchor: "top",
          text: series.name,
          showarrow: false,
        };
      })
    );
  }

  return layout;
}

function prepareConstant(layout, options) {
  function isValid(rule) {
    return isNumber(rule.value);
  }
  function getConstantColor(item, index) {
    return item.color || ColorPaletteArray[index % ColorPaletteArray.length];
  }
  function getShapes(item, index) {
    let property = find(FORMATOPTIONS, function (o) { return o.key === item.format });
    let _ref = item.reference === 0 ? {
      xref: "paper",
      x0: 0,
      x1: 1,
      y0: item.value,
      y1: item.value
    } : {
      yref: "paper",
      y0: 0,
      y1: 1,
      x0: item.value,
      x1: item.value
    }
    const shapesTemplate = {
      type: "line",
      line: {
        color: getConstantColor(item, index),
        width: property.width,
        dash: property._property
      }
    }
    return extend(shapesTemplate, _ref)
  }
  function getSannotations(item, index) {
    let _ref = item.reference === 0 ? {
      xref: "paper",
      x: 1,
      y: item.value
    } : {
      yref: "paper",
      x: item.value,
      y: 1
    }
    const annotationsTemplate = {
      text: item.name,
      font: {
        size: 13,
        color: getConstantColor(item, index),
      },
      showarrow: false,
      align: "center",
      xanchor: 'left'
    }
    return extend(annotationsTemplate, _ref)
  }
  if (options.constantLine && options.constantLine.length) {
    // product constant line and annotations
    each(options.constantLine, (item, index) => {
      if (isValid(item)) {
        layout.shapes.push(getShapes(item, index));
        layout.annotations.push(getSannotations(item, index));
      }
    })
  }
}

function prepareDefaultLayout(layout, options, data) {
  const y2Series = data.filter(s => s.yaxis === "y2");

  layout.xaxis = prepareXAxis(options.xAxis, options);

  layout.yaxis = prepareYAxis(options.yAxis[0]);

  if (y2Series.length > 0) {
    layout.yaxis2 = prepareYAxis(options.yAxis[1]);
    layout.yaxis2.overlaying = "y";
    layout.yaxis2.side = "right";
  }

  if (options.series.stacking) {
    layout.barmode = "relative";
  }

  if (options.constantLine.length > 0) {
    prepareConstant(layout, options);
  }
  return layout;
}

function prepareBoxLayout(layout, options, data) {
  layout = prepareDefaultLayout(layout, options, data);
  layout.boxmode = "group";
  layout.boxgroupgap = 0.5;
  return layout;
}

export default function prepareLayout(element, options, data) {
  const layout = {
    margin: { l: 10, r: 10, b: 5, t: 20, pad: 4 },
    // plot size should be at least 5x5px
    width: Math.max(5, Math.floor(element.offsetWidth)),
    height: Math.max(5, Math.floor(element.offsetHeight)),
    autosize: false,
    showlegend: options.legend.enabled,
    legend: {
      traceorder: options.legend.traceorder,
    },
    shapes: [],
    annotations: [],
    // one of ( "x" | "y" | "closest" | false | "x unified" | "y unified" )
    hovermode: 'x unified'
  };

  switch (options.globalSeriesType) {
    case "pie":
      return preparePieLayout(layout, options, data);
    case "box":
      return prepareBoxLayout(layout, options, data);
    default:
      return prepareDefaultLayout(layout, options, data);
  }
}
