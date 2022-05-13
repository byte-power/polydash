import React from "react";
import PropTypes from "prop-types";
import { useDebouncedCallback } from "use-debounce";
import { InputNumber } from "@/components/visualizations/editor";

function FontSizeControl({ value, index, field, onChange }) {
    const [onChangeDebounced] = useDebouncedCallback(onChange, 200);
    return (
        <InputNumber
            min={9}
            defaultValue={value}
            onChange={typeValue => onChangeDebounced(index, field, typeValue)}
        />
    );
}

FontSizeControl.propTypes = {
    type: PropTypes.string.isRequired,
    field: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
        PropTypes.number,
        PropTypes.object
    ]),
    onChange: PropTypes.func.isRequired
};

FontSizeControl.ruleType = "fontSize"

export default FontSizeControl
