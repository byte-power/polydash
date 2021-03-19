import { isString } from "lodash";
import React from "react";
import PropTypes from "prop-types";
import Button from "antd/lib/button";
import Modal from "antd/lib/modal";
import Tooltip from "antd/lib/tooltip";
import Application from "@/services/application";

function deleteApp(event, app, onAppDeleted) {
  Modal.confirm({
    title: "Delete App",
    content: "Are you sure you want to delete this app?",
    okText: "Yes",
    okType: "danger",
    cancelText: "No",
    onOk: () => {
      Application.deleteApplication(app).then(() => {
        onAppDeleted();
      });
    },
  });
}

export default function DeleteAppButton({ app, title, onClick, children, ...props }) {
  if (!app) {
    return null;
  }
  const button = (
    <Button {...props} type="danger" onClick={event => deleteApp(event, app, onClick)}>
      {children}
    </Button>
  );

  if (isString(title) && title !== "") {
    return (
      <Tooltip placement="top" title={title} mouseLeaveDelay={0}>
        {button}
      </Tooltip>
    );
  }

  return button;
}

DeleteAppButton.propTypes = {
  app: PropTypes.object, // eslint-disable-line react/forbid-prop-types
  title: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node,
};

DeleteAppButton.defaultProps = {
  app: null,
  title: null,
  onClick: () => {},
  children: null,
};
