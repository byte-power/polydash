import React, { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { useDebouncedCallback } from "use-debounce";
import { ColorPicker } from "@/components/visualizations/editor";
import ColorPalette from "@/visualizations/ColorPalette";

function ColorControl({ value, index, field, onChange }) {
    const [onChangeDebounced] = useDebouncedCallback(onChange, 200);
    const colors = useMemo(
        () => ({
            Automatic: null,
            ...ColorPalette,
        }),
        []
    );
    const updateValuesOption = useCallback(
        (index, field, value) => {
            onChangeDebounced(index, field, value);
        },
        [onChangeDebounced]
    );
    return (
        <ColorPicker
            interactive
            presetColors={colors}
            placement="topRight"
            color={value}
            onChange={typeValue => updateValuesOption(index, field, typeValue)}
            addonAfter={<ColorPicker.Label color={value} presetColors={colors} />}
        />
    );
}

ColorControl.propTypes = {
    type: PropTypes.string.isRequired,
    field: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.object
    ]),
    onChange: PropTypes.func.isRequired
};

ColorControl.ruleType = "color"

export default ColorControl
