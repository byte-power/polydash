import { isFinite } from "lodash";
import React, { useState, useEffect } from "react";
import cx from "classnames";
import resizeObserver from "@/services/resizeObserver";
import { RendererPropTypes } from "@/visualizations/prop-types";

import { getCounterData } from "./utils";

import "./render.less";

function getCounterStyles(scale) {
  return {
    msTransform: `scale(${scale})`,
    MozTransform: `scale(${scale})`,
    WebkitTransform: `scale(${scale})`,
    transform: `scale(${scale})`,
  };
}

function getCounterScale(container) {
  const inner = container.firstChild;
  const scale = Math.min(container.offsetWidth / inner.offsetWidth, container.offsetHeight / inner.offsetHeight);
  return Number(isFinite(scale) ? scale : 1).toFixed(2); // keep only two decimal places
}

export default function Renderer({ data, options, visualizationName }) {
  const [scale, setScale] = useState("1.00");
  const [container, setContainer] = useState(null);

  useEffect(() => {
    if (container) {
      const unwatch = resizeObserver(container, () => {
        setScale(getCounterScale(container));
      });
      return unwatch;
    }
  }, [container]);

  useEffect(() => {
    if (container) {
      // update scaling when options or data change (new formatting, values, etc.
      // may change inner container dimensions which will not be tracked by `resizeObserver`);
      setScale(getCounterScale(container));
    }
  }, [data, options, container]);

  const {
    showTrend,
    deviationValue,
    counterValue,
    counterValueTooltip,
    targetValue,
    counterLabel,
    deviationExper
  } = getCounterData(data.rows, options, visualizationName);
  return (
    <div
      className={cx("counter-visualization-container", {
        "trend-positive": showTrend && deviationValue > 0,
        "trend-negative": showTrend && deviationValue < 0,
        "trend-invariant": showTrend && deviationValue === 0,
      })}>
      <div className="counter-visualization-content" ref={setContainer}>
        <div style={getCounterStyles(scale)}>
          <div className="counter-visualization-label">{counterLabel}</div>
          <div className="counter-visualization-value" title={counterValueTooltip}>
            {counterValue}
          </div>
          {targetValue && (
            <div className="counter-visualization-deviation">
              {deviationExper}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

Renderer.propTypes = RendererPropTypes;
