import { isUndefined, isArray, reduce, sum, filter, isNumber, add, isObject, map } from "lodash";
import moment from "moment";
import plotlyCleanNumber from "plotly.js/src/lib/clean_number";
import { createNumberFormatter } from "@/lib/value-format";

export function cleanNumber(value) {
  return isUndefined(value) ? value : plotlyCleanNumber(value);
}

export function getSeriesAxis(series, options) {
  const seriesOptions = options.seriesOptions[series.name] || { type: options.globalSeriesType };
  if (seriesOptions.yAxis === 1 && (!options.series.stacking || seriesOptions.type === "line")) {
    return "y2";
  }
  return "y";
}

export function normalizeValue(value, axisType, dateTimeFormat = "YYYY-MM-DD HH:mm:ss") {
  if (axisType === "datetime" && moment.utc(value).isValid()) {
    value = moment.utc(value);
  }
  if (moment.isMoment(value)) {
    return value.format(dateTimeFormat);
  }
  return value;
}

// Merges multiple objects and accumulates values of type number
export function polymerization(item) {
  function merge(target, ...arg) {
    return arg.reduce((acc, cur) => {
      return Object.keys(cur).reduce((subAcc, key) => {
        const srcVal = cur[key];
        if (isObject(srcVal) && !moment.isMoment(srcVal)) {
          subAcc[key] = merge(subAcc[key] ? subAcc[key] : {}, srcVal)
        } else if (isNumber(srcVal)) {
          subAcc[key] = add(subAcc[key], srcVal);
        } else {
          subAcc[key] = srcVal;
        }
        return subAcc;
      }, acc)
    }, target);
  }
  return merge({}, ...item);
}

export function productTotalSeries(seriesList, options) {
  const formatNumber = createNumberFormatter(options.totalNumberFormat);
  const visibleSeriesList = filter(seriesList, s => s.visible === true && s.name !== '@@total');
  function getTotalSeriesTemplate(xValues, yValues) {
    return {
      visible: true,
      hoverinfo: 'none',
      textposition: 'outside',
      x: xValues,
      y: yValues.map(_ => 0),
      text: map(yValues, n => formatNumber(n)),
      showlegend: false,
      name: '@@total',
      type: 'bar',
      yaxis: 'y'
    };
  }
  const afreshDefinitionData = reduce(visibleSeriesList, (pre, { sourceData }) => {
    sourceData.forEach((value, key) => {
      const curAfreshDefinitionItem = pre[key] || 0;
      if (isArray(value)) {
        pre[key] = reduce(value, (sum, n) => sum + n.y, curAfreshDefinitionItem);
      } else {
        pre[key] = sum(curAfreshDefinitionItem, value.y);
      }
    })
    return pre;
  }, []);
  return getTotalSeriesTemplate(Object.keys(afreshDefinitionData), Object.values(afreshDefinitionData))
}
