import React from "react";
import PropTypes from "prop-types";
import { Select } from "@/components/visualizations/editor";
import { map } from 'lodash';

function FontStyleControl({ value, index, field, onChange }) {
    const FONTSTYLEOPTIONS = [
        {
            key: 'bold',
            label: 'Bold'
        },
        {
            key: 'italic',
            label: 'Italic'
        }
    ]
    return (
        <Select
            defaultValue={value}
            onChange={typeValue => onChange(index, field, typeValue)}
            optionLabelProp="label"
            dropdownMatchSelectWidth={false}>
            {map(FONTSTYLEOPTIONS, (item, key) => (
                <Select.Option key={item.key} value={item.key}>
                    {item.label}
                </Select.Option>
            ))}
        </Select>
    );
}

FontStyleControl.propTypes = {
    type: PropTypes.string.isRequired,
    field: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object
    ]),
    onChange: PropTypes.func.isRequired
};

FontStyleControl.ruleType = "fontStyle"

export default FontStyleControl
