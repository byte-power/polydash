import React, { useState, useEffect, useCallback } from "react";
import Button from "antd/lib/button";
import Modal from "antd/lib/modal";
import Alert from "antd/lib/alert";
import DynamicForm from "@/components/dynamic-form/DynamicForm";
import { wrap as wrapDialog, DialogPropType } from "@/components/DialogWrapper";
import recordEvent from "@/services/recordEvent";

const formFields = [
  { required: true, name: "name", title: "Name", type: "text", autoFocus: true },
  { required: false, name: "icon_url", title: "Icon Url", type: "text" },
  { required: false, name: "description", title: "Description", type: "text" },
];

function CreateAppDialog({ dialog }) {
  const [error, setError] = useState(null);
  useEffect(() => {
    recordEvent("view", "page", "apps/new");
  }, []);

  const handleSubmit = useCallback(values => dialog.close(values).catch(setError), [dialog]);

  return (
    <Modal
      {...dialog.props}
      title="Create a New Application"
      footer={[
        <Button key="cancel" {...dialog.props.cancelButtonProps} onClick={dialog.dismiss}>
          Cancel
        </Button>,
        <Button
          key="submit"
          {...dialog.props.okButtonProps}
          htmlType="submit"
          type="primary"
          form="appForm"
          data-test="SaveAppButton">
          Create
        </Button>,
      ]}
      wrapProps={{
        "data-test": "CreateAppDialog",
      }}>
      <DynamicForm id="appForm" fields={formFields} onSubmit={handleSubmit} hideSubmitButton />
      {error && <Alert message={error.message} type="error" showIcon data-test="CreateAppErrorAlert" />}
    </Modal>
  );
}

CreateAppDialog.propTypes = {
  dialog: DialogPropType.isRequired,
};

export default wrapDialog(CreateAppDialog);
