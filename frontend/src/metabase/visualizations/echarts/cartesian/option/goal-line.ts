import type { CustomSeriesOption } from "echarts/charts";

import { isNotNull, isValidNumber } from "metabase/lib/types";
import type {
  ComputedVisualizationSettings,
  RenderingContext,
} from "metabase/visualizations/types";

import type { EChartsCartesianCoordinateSystem } from "../../types";
import { GOAL_LINE_SERIES_ID, X_AXIS_DATA_KEY } from "../constants/dataset";
import { CHART_STYLE, Z_INDEXES } from "../constants/style";
import type { ChartDataset, BaseCartesianChartModel } from "../model/types";

export const GOAL_LINE_DASH = [3, 4];

function getFirstNonNullXValue(dataset: ChartDataset) {
  for (let i = 0; i < dataset.length; i++) {
    const xValue = dataset[i][X_AXIS_DATA_KEY];

    if (xValue != null) {
      if (typeof xValue === "boolean") {
        return String(xValue); // convert bool to string since echarts doesn't support null as data value
      }
      return xValue;
    }
  }
  return String(null);
}

export function getGoalLineSeriesOption(
  chartModel: BaseCartesianChartModel,
  settings: ComputedVisualizationSettings,
  renderingContext: RenderingContext,
): CustomSeriesOption | null {
  if (!settings["graph.show_goal"] || settings["graph.goal_value"] == null) {
    return null;
  }

  const scaleTransformedGoalValue =
    chartModel.yAxisScaleTransforms.toEChartsAxisValue(
      settings["graph.goal_value"],
    );
  const { fontSize } = renderingContext.theme.cartesian.goalLine.label;

  return {
    id: GOAL_LINE_SERIES_ID,
    type: "custom",
    data: [
      [getFirstNonNullXValue(chartModel.dataset), scaleTransformedGoalValue],
    ],
    z: Z_INDEXES.goalLine,
    blur: {
      opacity: 1,
    },
    renderItem: (params, api) => {
      const [_x, y] = api.coord([null, scaleTransformedGoalValue]);
      const coordSys =
        params.coordSys as unknown as EChartsCartesianCoordinateSystem;
      const xStart = coordSys.x;
      const xEnd = coordSys.width + coordSys.x;

      const line = {
        type: "line" as const,
        shape: {
          x1: xStart,
          x2: xEnd,
          y1: y,
          y2: y,
        },
        blur: {
          style: {
            opacity: 1,
          },
        },
        style: {
          lineWidth: 2,
          stroke: renderingContext.getColor("text-medium"),
          color: renderingContext.getColor("text-medium"),
          lineDash: GOAL_LINE_DASH,
        },
      };

      const hasRightYAxis = chartModel.rightAxisModel == null;
      const align = hasRightYAxis ? ("right" as const) : ("left" as const);
      const labelX = hasRightYAxis ? xEnd : xStart;
      const labelY = y - fontSize - CHART_STYLE.goalLine.label.margin;

      const label = {
        type: "text" as const,
        x: labelX,
        y: labelY,
        blur: {
          style: {
            opacity: 1,
          },
        },
        style: {
          align,
          text: settings["graph.goal_label"] ?? "",
          fontFamily: renderingContext.fontFamily,
          fontSize,
          fontWeight: CHART_STYLE.goalLine.label.weight,
          fill: renderingContext.getColor("text-medium"),
        },
      };

      return {
        type: "group" as const,
        children: [line, label],
      };
    },
  };
}

/* Only called when settings["xcontrol.show_custom"] is true */
export function getXcontrolGoalLineSeriesOption(
  chartModel: BaseCartesianChartModel,
  settings: ComputedVisualizationSettings,
  renderingContext: RenderingContext,
): CustomSeriesOption | null {
  const [xCL, xUCLA, xUCLB, xUCL, xLCLA, xLCLB, xLCL, xSTDDEV] = ["CL", "UCLA", "UCLB", "UCL", "LCLA", "LCLB", "LCL", "STDDEV"];
  const cardId = chartModel.seriesModels?.[0].cardId;
  const valCL = Number(chartModel.dataset?.[0][cardId+":"+xCL]);
  const valSTDDEV = Number(chartModel.dataset?.[0][cardId+":"+xSTDDEV]);
  if (!settings["graph.show_goal"] || !isValidNumber(valCL)) {
    return null;
  }

  const scaleTransformedGoalValue =
    chartModel.yAxisScaleTransforms.toEChartsAxisValue(
      valCL,
    );
  const scaleTransformedGoalValueSTDDEV =
    isValidNumber(valSTDDEV)?
    chartModel.yAxisScaleTransforms.toEChartsAxisValue(
      valSTDDEV,
    ) : null;
  const scaleTransformedGoalValueLDEV =
    isValidNumber(scaleTransformedGoalValue) && isValidNumber(scaleTransformedGoalValueSTDDEV)?
    (
      (scaleTransformedGoalValue - scaleTransformedGoalValueSTDDEV * 3) > 0?
      scaleTransformedGoalValueSTDDEV : scaleTransformedGoalValue / 3
    ) : null;

  const scaleTransformedGoalValueUCL =
    isValidNumber(scaleTransformedGoalValue) && isValidNumber(scaleTransformedGoalValueSTDDEV)?
    (scaleTransformedGoalValue + scaleTransformedGoalValueSTDDEV * 3) : null;
  const scaleTransformedGoalValueUCLA =
    isValidNumber(scaleTransformedGoalValue) && isValidNumber(scaleTransformedGoalValueSTDDEV)?
    (scaleTransformedGoalValue + scaleTransformedGoalValueSTDDEV * 2) : null;
  const scaleTransformedGoalValueUCLB =
    isValidNumber(scaleTransformedGoalValue) && isValidNumber(scaleTransformedGoalValueSTDDEV)?
    (scaleTransformedGoalValue + scaleTransformedGoalValueSTDDEV) : null;
  const scaleTransformedGoalValueLCL =
    isValidNumber(scaleTransformedGoalValue) && isValidNumber(scaleTransformedGoalValueLDEV)?
    (scaleTransformedGoalValue - scaleTransformedGoalValueLDEV * 3) : null;
  const scaleTransformedGoalValueLCLA =
    isValidNumber(scaleTransformedGoalValue) && isValidNumber(scaleTransformedGoalValueLDEV)?
    (scaleTransformedGoalValue - scaleTransformedGoalValueLDEV * 2) : null;
  const scaleTransformedGoalValueLCLB =
    isValidNumber(scaleTransformedGoalValue) && isValidNumber(scaleTransformedGoalValueLDEV)?
    (scaleTransformedGoalValue - scaleTransformedGoalValueLDEV) : null;

  const { fontSize } = renderingContext.theme.cartesian.goalLine.label;

  return {
    id: GOAL_LINE_SERIES_ID,
    type: "custom",
    data: [
      [getFirstNonNullXValue(chartModel.dataset), scaleTransformedGoalValue],
    ],
    z: Z_INDEXES.goalLine,
    blur: {
      opacity: 1,
    },
    renderItem: (params, api) => {
      const [_x, y] = api.coord([null, scaleTransformedGoalValue]);
      const [_xUCL,  yUCL]  = api.coord([null, scaleTransformedGoalValueUCL]);
      const [_xUCLA, yUCLA] = api.coord([null, scaleTransformedGoalValueUCLA]);
      const [_xUCLB, yUCLB] = api.coord([null, scaleTransformedGoalValueUCLB]);
      const [_xLCL,  yLCL]  = api.coord([null, scaleTransformedGoalValueLCL]);
      const [_xLCLA, yLCLA] = api.coord([null, scaleTransformedGoalValueLCLA]);
      const [_xLCLB, yLCLB] = api.coord([null, scaleTransformedGoalValueLCLB]);
      const coordSys =
        params.coordSys as unknown as EChartsCartesianCoordinateSystem;
      const xStart = coordSys.x;
      const xEnd = coordSys.width + coordSys.x;

      const line = {
        type: "line" as const,
        shape: {
          x1: xStart,
          x2: xEnd,
          y1: y,
          y2: y,
        },
        blur: {
          style: {
            opacity: 1,
          },
        },
        style: {
          lineWidth: 1,
          stroke: "blue",
          color: "blue",
          lineDash: GOAL_LINE_DASH,
        },
      };
      const lineUCL = isValidNumber(scaleTransformedGoalValueUCL)? {
        type: "line" as const,
        shape: {
          x1: xStart,
          x2: xEnd,
          y1: yUCL,
          y2: yUCL,
        },
        blur: {
          style: {
            opacity: 1,
          },
        },
        style: {
          lineWidth: 1,
          stroke: "red",
          color: "red",
          lineDash: GOAL_LINE_DASH,
        },
      } : null;
      const lineUCLA = isValidNumber(scaleTransformedGoalValueUCLA)? {
        type: "line" as const,
        shape: {
          x1: xStart,
          x2: xEnd,
          y1: yUCLA,
          y2: yUCLA,
        },
        blur: {
          style: {
            opacity: 1,
          },
        },
        style: {
          lineWidth: 1,
          stroke: renderingContext.getColor("text-medium"),
          color: renderingContext.getColor("text-medium"),
          lineDash: GOAL_LINE_DASH,
        },
      } : null;
      const lineUCLB = isValidNumber(scaleTransformedGoalValueUCLB)? {
        type: "line" as const,
        shape: {
          x1: xStart,
          x2: xEnd,
          y1: yUCLB,
          y2: yUCLB,
        },
        blur: {
          style: {
            opacity: 1,
          },
        },
        style: {
          lineWidth: 1,
          stroke: renderingContext.getColor("text-medium"),
          color: renderingContext.getColor("text-medium"),
          lineDash: GOAL_LINE_DASH,
        },
      } : null;
      const lineLCL = isValidNumber(scaleTransformedGoalValueLCL)? {
        type: "line" as const,
        shape: {
          x1: xStart,
          x2: xEnd,
          y1: yLCL,
          y2: yLCL,
        },
        blur: {
          style: {
            opacity: 1,
          },
        },
        style: {
          lineWidth: 1,
          stroke: "red",
          color: "red",
          lineDash: GOAL_LINE_DASH,
        },
      } : null;
      const lineLCLA = isValidNumber(scaleTransformedGoalValueLCLA)? {
        type: "line" as const,
        shape: {
          x1: xStart,
          x2: xEnd,
          y1: yLCLA,
          y2: yLCLA,
        },
        blur: {
          style: {
            opacity: 1,
          },
        },
        style: {
          lineWidth: 1,
          stroke: renderingContext.getColor("text-medium"),
          color: renderingContext.getColor("text-medium"),
          lineDash: GOAL_LINE_DASH,
        },
      } : null;
      const lineLCLB = isValidNumber(scaleTransformedGoalValueLCLB)? {
        type: "line" as const,
        shape: {
          x1: xStart,
          x2: xEnd,
          y1: yLCLB,
          y2: yLCLB,
        },
        blur: {
          style: {
            opacity: 1,
          },
        },
        style: {
          lineWidth: 1,
          stroke: renderingContext.getColor("text-medium"),
          color: renderingContext.getColor("text-medium"),
          lineDash: GOAL_LINE_DASH,
        },
      } : null;

      const hasRightYAxis = chartModel.rightAxisModel == null;
      const align = hasRightYAxis ? ("right" as const) : ("left" as const);
      const labelX = hasRightYAxis ? xEnd : xStart;
      const labelY = y - fontSize - CHART_STYLE.goalLine.label.margin;
      const labelYUCL  = yUCL  - fontSize - CHART_STYLE.goalLine.label.margin;
      const labelYUCLA = yUCLA - fontSize - CHART_STYLE.goalLine.label.margin;
      const labelYUCLB = yUCLB - fontSize - CHART_STYLE.goalLine.label.margin;
      const labelYLCL  = yLCL  - fontSize - CHART_STYLE.goalLine.label.margin;
      const labelYLCLA = yLCLA - fontSize - CHART_STYLE.goalLine.label.margin;
      const labelYLCLB = yLCLB - fontSize - CHART_STYLE.goalLine.label.margin;
      const xcontrolShowGoalLabel = !!settings["xcontrol.show_goal_label"];

      const label = {
        type: "text" as const,
        x: labelX,
        y: labelY,
        blur: {
          style: {
            opacity: 1,
          },
        },
        style: {
          align,
          text: xcontrolShowGoalLabel? xCL : "",
          fontFamily: renderingContext.fontFamily,
          fontSize,
          fontWeight: CHART_STYLE.goalLine.label.weight,
          fill: "blue",
        },
      };
      const labelUCL = isValidNumber(scaleTransformedGoalValueUCL)? {
        type: "text" as const,
        x: labelX,
        y: labelYUCL,
        blur: {
          style: {
            opacity: 1,
          },
        },
        style: {
          align,
          text: xcontrolShowGoalLabel? xUCL : "",
          fontFamily: renderingContext.fontFamily,
          fontSize,
          fontWeight: CHART_STYLE.goalLine.label.weight,
          fill: "red",
        },
      } : null;
      const labelUCLA = isValidNumber(scaleTransformedGoalValueUCLA)? {
        type: "text" as const,
        x: labelX,
        y: labelYUCLA,
        blur: {
          style: {
            opacity: 1,
          },
        },
        style: {
          align,
          text: xcontrolShowGoalLabel? xUCLA : "",
          fontFamily: renderingContext.fontFamily,
          fontSize,
          fontWeight: CHART_STYLE.goalLine.label.weight,
          fill: renderingContext.getColor("text-medium"),
        },
      } : null;
      const labelUCLB = isValidNumber(scaleTransformedGoalValueUCLB)? {
        type: "text" as const,
        x: labelX,
        y: labelYUCLB,
        blur: {
          style: {
            opacity: 1,
          },
        },
        style: {
          align,
          text: xcontrolShowGoalLabel? xUCLB : "",
          fontFamily: renderingContext.fontFamily,
          fontSize,
          fontWeight: CHART_STYLE.goalLine.label.weight,
          fill: renderingContext.getColor("text-medium"),
        },
      } : null;
      const labelLCL = isValidNumber(scaleTransformedGoalValueLCL)? {
        type: "text" as const,
        x: labelX,
        y: labelYLCL,
        blur: {
          style: {
            opacity: 1,
          },
        },
        style: {
          align,
          text: xcontrolShowGoalLabel? xLCL : "",
          fontFamily: renderingContext.fontFamily,
          fontSize,
          fontWeight: CHART_STYLE.goalLine.label.weight,
          fill: "red",
        },
      } : null;
      const labelLCLA = isValidNumber(scaleTransformedGoalValueLCLA)? {
        type: "text" as const,
        x: labelX,
        y: labelYLCLA,
        blur: {
          style: {
            opacity: 1,
          },
        },
        style: {
          align,
          text: xcontrolShowGoalLabel? xLCLA : "",
          fontFamily: renderingContext.fontFamily,
          fontSize,
          fontWeight: CHART_STYLE.goalLine.label.weight,
          fill: renderingContext.getColor("text-medium"),
        },
      } : null;
      const labelLCLB = isValidNumber(scaleTransformedGoalValueLCLB)? {
        type: "text" as const,
        x: labelX,
        y: labelYLCLB,
        blur: {
          style: {
            opacity: 1,
          },
        },
        style: {
          align,
          text: xcontrolShowGoalLabel? xLCLB : "",
          fontFamily: renderingContext.fontFamily,
          fontSize,
          fontWeight: CHART_STYLE.goalLine.label.weight,
          fill: renderingContext.getColor("text-medium"),
        },
      } : null;

      return {
        type: "group" as const,
        children: [line, label,
                   lineUCL, labelUCL, lineUCLA, labelUCLA, lineUCLB, labelUCLB,
                   lineLCL, labelLCL, lineLCLA, labelLCLA, lineLCLB, labelLCLB].filter(isNotNull),
      };
    },
  };
}
