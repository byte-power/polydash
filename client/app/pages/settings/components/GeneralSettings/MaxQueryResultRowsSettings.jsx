import React from "react";
import { SettingsEditorPropTypes, SettingsEditorDefaultProps } from "../prop-types";
import Form from "antd/lib/form";
import Input from "antd/lib/input";
import DynamicComponent from "@/components/DynamicComponent";

export default function MaxQueryResultRowsSettings(props) {
  const { values, onChange } = props;

  return (
    <DynamicComponent name="OrganizationSettings.MaxQueryResultRowsSettings" {...props}>
      <Form.Item label="Max Query Result Rows">
      <Input
        type='number'
        value={values.max_query_result_rows}
        onChange={e => onChange({ max_query_result_rows: e.target.value})}
      />
      </Form.Item>
    </DynamicComponent>
  );
}

MaxQueryResultRowsSettings.propTypes = SettingsEditorPropTypes;

MaxQueryResultRowsSettings.defaultProps = SettingsEditorDefaultProps;
