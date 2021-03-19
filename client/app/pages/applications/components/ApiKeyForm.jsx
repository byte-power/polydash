import React, { useState, useCallback } from "react";
import PropTypes from "prop-types";
import Button from "antd/lib/button";
import Form from "antd/lib/form";
import Modal from "antd/lib/modal";
import DynamicComponent from "@/components/DynamicComponent";
import InputWithCopy from "@/components/InputWithCopy";
import { AppDetail } from "@/components/proptypes";
import Application from "@/services/application";
import useImmutableCallback from "@/lib/hooks/useImmutableCallback";

export default function ApiKeyForm(props) {
  const { app, onChange } = props;

  const [loading, setLoading] = useState(false);
  const handleChange = useImmutableCallback(onChange);

  const regenerateApiKey = useCallback(() => {
    const doRegenerate = () => {
      setLoading(true);
      Application.regenerateApiKey(app)
        .then(apiKey => {
          if (apiKey) {
            handleChange({ ...app, secret_token: apiKey });
          }
        })
        .finally(() => {
          setLoading(false);
        });
    };

    Modal.confirm({
      title: "Regenerate Secret Token",
      content: "Are you sure you want to regenerate?",
      okText: "Regenerate",
      onOk: doRegenerate,
      maskClosable: true,
      autoFocusButton: null,
    });
  }, [app, handleChange]);

  return (
    <DynamicComponent name="AppDetail.ApiKeyForm" {...props}>
      <Form layout="vertical">
        <hr />
        <Form.Item label="Secret Key" className="m-b-10">
          <InputWithCopy className="hide-in-percy" value={app.secret_key} readOnly />
        </Form.Item>
        <Form.Item label="Secret Token" className="m-b-10">
          <InputWithCopy id="apiKey" className="hide-in-percy" value={app.secret_token} data-test="ApiKey" readOnly />
        </Form.Item>
        <Button className="w-100" onClick={regenerateApiKey} loading={loading} data-test="RegenerateApiKey">
          Regenerate
        </Button>
      </Form>
    </DynamicComponent>
  );
}

ApiKeyForm.propTypes = {
  app: AppDetail.isRequired,
  onChange: PropTypes.func,
};

ApiKeyForm.defaultProps = {
  onChange: () => {},
};
