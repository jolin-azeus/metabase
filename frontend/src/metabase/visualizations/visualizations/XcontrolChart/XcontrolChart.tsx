import { t } from "ttag";

import {
  getDefaultSize,
  getMinSize,
} from "metabase/visualizations/shared/utils/sizes";
import { CartesianChart } from "metabase/visualizations/visualizations/CartesianChart";
import {
  COMBO_CHARTS_SETTINGS_DEFINITIONS,
  getCartesianChartDefinition,
} from "metabase/visualizations/visualizations/CartesianChart/chart-definition";
import type { VisualizationSettings } from "metabase-types/api";

import type {
  VisualizationProps,
  VisualizationSettingsDefinitions,
} from "../../types";

Object.assign(
  XcontrolChart,
  getCartesianChartDefinition({
    uiName: t`Xcontrol`,
    identifier: "xcontrol",
    iconName: "xcontrol",
    noun: t`xcontrol chart`,
    minSize: getMinSize("xcontrol"),
    defaultSize: getDefaultSize("xcontrol"),
    //maxMetricsSupported: 1, /* It's possible to have multiple Y-axis */
    maxDimensionsSupported: 1, /* Only 1 X-axis */
    settings: {
      "xcontrol.show_custom": {
        section: t`Display`,
        title: t`Show custom feature`,
        widget: "toggle",
        default: true,
        inline: true,
        getHidden: () => true,
      },
      "xcontrol.show_goal_label": {
        section: t`Display`,
        title: t`Show Goal label`,
        widget: "toggle",
        default: true,
        inline: true,
        getHidden: (_series: unknown, vizSettings: VisualizationSettings) =>
          vizSettings["graph.show_goal"] !== true || vizSettings["xcontrol.show_custom"] !== true,
        readDependencies: ["graph.show_goal"],
      },
      ...COMBO_CHARTS_SETTINGS_DEFINITIONS,
    } as any as VisualizationSettingsDefinitions,
  }),
);

export function XcontrolChart(props: VisualizationProps) {
  return <CartesianChart {...props} />;
}
