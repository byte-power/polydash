import { map, extend } from "lodash";
import React, { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { useDebouncedCallback } from "use-debounce";
import InputNumber from "antd/lib/input-number";
import Table from "antd/lib/table";
import Input from "antd/lib/input";
import Radio from "antd/lib/radio";
import Button from 'antd/lib/button';
import Select from 'antd/lib/select';
import ColorPicker from "@/components/ColorPicker";
import { EditorPropTypes } from "@/visualizations/prop-types";
import ColorPalette from "@/visualizations/ColorPalette";
import PlusOutlined from '@ant-design/icons/PlusOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';

export const FORMATOPTIONS = [
    {
        key: 'solid',
        _property: 'solid',
        label: '———',
        width: 2,
        fontWeight: 600
    },
    {
        key: 'blodSolid',
        _property: 'solid',
        label: '———',
        width: 4,
        fontWeight: 700
    },
    {
        key: 'dotted',
        _property: 'dot',
        label: '- - - -',
        width: 2,
        fontWeight: 600
    }
]

function getTableColumns(updateConstantOption, debouncedUpdateConstantOption, colors) {
    const result = [
        {
            title: "Name",
            dataIndex: "name",
            render: (unused, item, index) => (
                <Input
                    placeholder="Constant Line Name"
                    defaultValue={item.name}
                    onChange={event => debouncedUpdateConstantOption(index, "name", event.target.value)}
                />
            ),
        },
        {
            title: "Reference Axis",
            dataIndex: "reference",
            render: (unused, item, index) => (
                <Radio.Group
                    className="series-settings-y-axis"
                    value={item.reference === 1 ? 1 : 0}
                    onChange={event => updateConstantOption(index, "reference", event.target.value)}>
                    <Radio value={0}>
                        X Axis
                    </Radio>
                    <Radio value={1}>
                        Y Axis
                    </Radio>
                </Radio.Group>
            ),
        },
        {
            title: "Value",
            dataIndex: "value",
            render: (unused, item, index) => (
                <InputNumber
                    placeholder="Value"
                    value={item.value}
                    step="0.01"
                    onChange={value => debouncedUpdateConstantOption(index, "value", value)}
                />
            ),
        },
        {
            title: "Color",
            dataIndex: "color",
            render: (unused, item, index) => (
                <ColorPicker
                    interactive
                    presetColors={colors}
                    placement="topRight"
                    color={item.color}
                    onChange={value => updateConstantOption(index, "color", value)}
                    addonAfter={<ColorPicker.Label color={item.color} presetColors={colors} />}
                />
            ),
        },
        {
            title: "Format",
            dataIndex: "format",
            render: (unused, item, index) => (
                <Select
                    value={item.format}
                    onChange={value => updateConstantOption(index, 'format', value)}
                    dropdownMatchSelectWidth={false}
                    style={{ width: 100 }}>
                    {map(FORMATOPTIONS, (item, key) => (
                        <Select.Option key={item.key} value={item.key}>
                            <span style={{ fontWeight: item.fontWeight }}>
                                {item.label}
                            </span>
                        </Select.Option>
                    ))}
                </Select>
            ),
        }
    ];

    return result;
}

function ToolRow({ row, index, options, onOptionsChange }) {
    function addConstantItem() {
        options.constantLine.push({
            name: "",
            value: null,
            reference: 0,
            color: '',
            format: 'solid'
        })
        return options.constantLine
    }
    function delConstantItem(index) {
        options.constantLine.splice(index, 1)
        return options.constantLine
    }
    return (
        <p style={{ margin: 0 }}>
            <Button onClick={() => onOptionsChange({ constantLine: addConstantItem() })} type="link" disabled={options.constantLine.length === options.constantLineLimit}>
                <PlusOutlined /> Add
            </Button>
            <Button onClick={() => onOptionsChange({ constantLine: delConstantItem(index) })} type="link" disabled={options.constantLine.length === 1 && row.key === 0}>
                <DeleteOutlined /> Del
            </Button>
        </p>)
}

ToolRow.propTypes = {
    row: PropTypes.object,
    index: PropTypes.number,
    options: PropTypes.object,
    onOptionsChange: PropTypes.func.isRequired
};

export default function ConstantLineSettings({ options, onOptionsChange }) {
    const series = useMemo(
        () =>
            map(
                options.constantLine,
                (item, index) =>
                    extend(item, { key: index })
            ),
        [options]
    );

    const colors = useMemo(
        () => ({
            Automatic: null,
            ...ColorPalette,
        }),
        []
    );

    const updateConstantOption = useCallback(
        (index, prop, value) => {
            options.constantLine[index][prop] = value
            onOptionsChange({
                constantLine: options.constantLine
            });
        },
        [onOptionsChange]
    );

    const [debouncedUpdateConstantOption] = useDebouncedCallback(updateConstantOption, 200);

    const columns = useMemo(() => getTableColumns(updateConstantOption, debouncedUpdateConstantOption, colors), [
        updateConstantOption,
        debouncedUpdateConstantOption,
        colors
    ]);

    return (
        <Table
            expandIconAsCell={false}
            expandIconColumnIndex={-1}
            expandedRowKeys={series.map(item => item.key)}
            dataSource={series}
            columns={columns}
            expandable={{
                expandedRowRender: (row, index) => <ToolRow row={row} index={index} options={options} onOptionsChange={onOptionsChange} />,
            }}
            pagination={false}
        />
    );
}

ConstantLineSettings.propTypes = EditorPropTypes;

ConstantLineSettings.FORMATOPTIONS = FORMATOPTIONS;

