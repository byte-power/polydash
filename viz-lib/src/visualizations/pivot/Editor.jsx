import { merge, map } from "lodash";
import React from "react";
import { Section, Switch, Select } from "@/components/visualizations/editor";
import { EditorPropTypes } from "@/visualizations/prop-types";


export default function Editor({ options, onOptionsChange }) {
  const updateOptions = updates => {
    onOptionsChange(merge({}, options, updates));
  };

  const povitTableOptions = [
    {
      key: 'Exportable TSV',
      value: 'Exportable TSV'
    },
    {
      key: 'Table',
      value: 'Table'
    },
    {
      key: 'Table Col Heatmap',
      value: 'Table Col Heatmap'
    }, {
      key: 'Table Heatmap',
      value: 'Table Heatmap'
    }, {
      key: 'Table Row Heatmap',
      value: 'Table Row Heatmap'
    },
  ];

  return (
    <React.Fragment>
      <Section>
        <Switch
          data-test="PivotEditor.HideControls"
          id="pivot-show-controls"
          defaultChecked={!options.controls.enabled}
          onChange={enabled => updateOptions({ controls: { enabled: !enabled } })}>
          Show Pivot Controls
        </Switch>
      </Section>
      <Section>
        <Switch
          id="pivot-show-row-totals"
          defaultChecked={options.rendererOptions.table.rowTotals}
          onChange={rowTotals => updateOptions({ rendererOptions: { table: { rowTotals } } })}>
          Show Row Totals
        </Switch>
      </Section>
      <Section>
        <Switch
          id="pivot-show-column-totals"
          defaultChecked={options.rendererOptions.table.colTotals}
          onChange={colTotals => updateOptions({ rendererOptions: { table: { colTotals } } })}>
          Show Column Totals
        </Switch>
      </Section>
      <Section>
        <Select
          label="Pivot Table Type"
          showSearch
          placeholder="Choose Pivot Table Type"
          value={options.rendererName}
          onChange={value => updateOptions({ rendererName: value })}
        >
          {map(povitTableOptions, c => (
            <Select.Option key={c.key} value={c.value}>
              {c.value}
            </Select.Option>
          ))}
        </Select>
      </Section>
    </React.Fragment >
  );
}

Editor.propTypes = EditorPropTypes;
