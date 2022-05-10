import React from "react";
import PropTypes from "prop-types";
import { useDebouncedCallback } from "use-debounce";
import { Section, Input, InputNumber, ContextHelp, Checkbox, ControlLabel } from "@/components/visualizations/editor";
import { createNumberFormatter } from "@/lib/value-format";
import { newEval } from "@/lib/utils";
import PlusCircleOutlined from "@ant-design/icons/PlusCircleOutlined";
import MinusCircleOutlined from '@ant-design/icons/MinusCircleOutlined';
import Select from "antd/lib/select";
import Divider from "antd/lib/divider";
import { CONDITIONS, TYPEOPTIONS } from './constant'
import controlType from "./rule-type";
import { values, map } from 'lodash';

function Editor({ column, onChange }) {

  function handleChange(index, filed, value) {
    const displayRules = column.displayRules;
    displayRules[index][filed] = value
    onChange({ displayRules });
  }
  const [handleChangeDebounced] = useDebouncedCallback(handleChange, 400);
  const [onChangeDebounced] = useDebouncedCallback(onChange, 200);

  function addRuleItem() {
    column.displayRules.push({
      op: ">",
      opValue: 1.00,
      type: '',
      typeValue: null
    })
    return column.displayRules
  }

  function deleteRuleItem(index) {
    column.displayRules.splice(index, 1)
    return column.displayRules
  }

  return (
    <React.Fragment>
      <Section>
        <Input
          label={
            <React.Fragment>
              Number format
              <ContextHelp.NumberFormatSpecs />
            </React.Fragment>
          }
          data-test="Table.ColumnEditor.Number.Format"
          defaultValue={column.numberFormat}
          onChange={event => onChangeDebounced({ numberFormat: event.target.value })}
        />
      </Section>

      <Section>
        <Checkbox
          checked={column.displayRuleSwitch}
          onChange={event => onChange({ displayRuleSwitch: event.target.checked })}>
          Number dispaly rule
        </Checkbox>
        {column.displayRuleSwitch && <PlusCircleOutlined style={{ cursor: "pointer", float: 'right' }} onClick={() => onChange({ displayRules: addRuleItem() })} />}
      </Section>

      <React.Fragment>
        {column.displayRuleSwitch && map(column.displayRules, (ruleItem, index) => {
          return <Section key={index}>
            <ControlLabel
              label={
                <React.Fragment>
                  {`Condition${index + 1}`}
                  <MinusCircleOutlined style={{ cursor: "pointer" }} onClick={() => onChange({ displayRules: deleteRuleItem(index) })} />
                </React.Fragment>
              }>
              <div className="image-dimension-selector">
                <Select
                  value={ruleItem.op}
                  onChange={op => handleChange(index, 'op', op)}
                  optionLabelProp="label"
                  dropdownMatchSelectWidth={false}
                  style={{ width: 100 }}>
                  <Select.Option value=">" label={CONDITIONS[">"]}>
                    {CONDITIONS[">"]} greater than
                  </Select.Option>
                  <Select.Option value=">=" label={CONDITIONS[">="]}>
                    {CONDITIONS[">="]} greater than or equals
                  </Select.Option>
                  <Select.Option disabled key="dv1">
                    <Divider className="select-option-divider m-t-10 m-b-5" />
                  </Select.Option>
                  <Select.Option value="<" label={CONDITIONS["<"]}>
                    {CONDITIONS["<"]} less than
                  </Select.Option>
                  <Select.Option value="<=" label={CONDITIONS["<="]}>
                    {CONDITIONS["<="]} less than or equals
                  </Select.Option>
                  <Select.Option disabled key="dv2">
                    <Divider className="select-option-divider m-t-10 m-b-5" />
                  </Select.Option>
                  <Select.Option value="==" label={CONDITIONS["=="]}>
                    {CONDITIONS["=="]} equals
                  </Select.Option>
                  <Select.Option value="!=" label={CONDITIONS["!="]}>
                    {CONDITIONS["!="]} not equal to
                  </Select.Option>
                </Select>
                <span className="image-dimension-selector-spacer"></span>
                <InputNumber
                  placeholder="Value"
                  defaultValue={ruleItem.opValue}
                  step="0.01"
                  onChange={opValue => handleChangeDebounced(index, 'opValue', opValue)}
                />
              </div>
            </ControlLabel>
            <ControlLabel
              label={
                <React.Fragment>
                  {`Result${index + 1}`}
                </React.Fragment>
              }>
              <div className="image-dimension-selector">
                <Select
                  value={ruleItem.type}
                  onChange={type => handleChange(index, 'type', type)}
                  optionLabelProp="label"
                  dropdownMatchSelectWidth={false}
                  style={{ width: 100 }}>
                  {map(TYPEOPTIONS, (item, key) => (
                    <Select.Option key={item.key} value={item.key}>
                      {item.label}
                    </Select.Option>
                  ))}
                </Select>
                <span className="image-dimension-selector-spacer"></span>
                {
                  controlType({ type: ruleItem.type, field: 'typeValue', index: index, value: ruleItem.typeValue, onChange: handleChange })
                }
              </div>
            </ControlLabel>
          </Section>
        })}
      </React.Fragment>
    </React.Fragment>
  );
}

Editor.propTypes = {
  column: PropTypes.shape({
    name: PropTypes.string.isRequired,
    numberFormat: PropTypes.string,
    displayRuleSwitch: PropTypes.bool,
    displayRules: PropTypes.array
  }).isRequired,
  onChange: PropTypes.func.isRequired,
};

export default function initNumberColumn(column) {

  const format = createNumberFormatter(column.numberFormat);

  function prepareData(row) {
    let styleProperty = displayRuleFormatter(column, row)
    return {
      text: <div style={styleProperty}>{format(row[column.name])}</div>,
    };
  }

  function isValid(rule) {
    let forInValues = values(rule);
    if (forInValues.every(item => item && item !== '' && typeof (item) !== null)) {
      return true;
    } else {
      return false;
    }
  }

  function displayRuleFormatter(column, row) {
    let property = new Object({})
    if (column.displayRuleSwitch && column.displayRules.length) {
      column.displayRules.forEach(item => {
        if (isValid(item)) {
          if (newEval(`${row[column.name]}${item.op}${item.opValue}`)) {
            switch (item.type) {
              case 'fontSize':
              case 'color':
              case 'background':
                property[item.type] = item.typeValue;
                break;
              case 'fontStyle':
                switch (item.typeValue) {
                  case 'bold':
                    property['fontWeight'] = item.typeValue;
                    break;
                  case 'italic':
                    property['font-style'] = item.typeValue;
                    break;
                }
                break;
            }
            property[item.type] = item.typeValue;
          }
        }
      })
    }
    return property;
  }

  function NumberColumn({ row }) {
    // eslint-disable-line react/prop-types
    const { text } = prepareData(row);
    return text;
  }

  NumberColumn.prepareData = prepareData;

  return NumberColumn;
}

initNumberColumn.friendlyName = "Number";
initNumberColumn.Editor = Editor;
