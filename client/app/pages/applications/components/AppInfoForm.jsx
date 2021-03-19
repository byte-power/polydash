import { get, map } from "lodash";
import React, { useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { AppDetail } from "@/components/proptypes";
import DynamicComponent from "@/components/DynamicComponent";
import DynamicForm from "@/components/dynamic-form/DynamicForm";

import Application from "@/services/application";
import useImmutableCallback from "@/lib/hooks/useImmutableCallback";

export default function AppInfoForm(props) {
  const { app, onChange } = props;

  const handleChange = useImmutableCallback(onChange);

  const saveApp = useCallback(
    (values, successCallback, errorCallback) => {
      const data = {
        ...values,
        id: app.id,
      };

      Application.save(data)
        .then(app => {
          successCallback("Saved.");
          handleChange(app);
        })
        .catch(error => {
          errorCallback(get(error, "response.data.message", "Failed saving."));
        });
    },
    [app, handleChange]
  );

  const formFields = useMemo(
    () =>
      map(
        [
          {
            name: "name",
            title: "Name",
            type: "text",
            required: true,
            initialValue: app.name,
          },
          {
            name: "icon_url",
            title: "Icon Url",
            type: "text",
            initialValue: app.icon_url,
          },
          {
            name: "description",
            title: "Description",
            type: "text",
            initialValue: app.description,
          },
        ],
        field => field
      ),
    [app]
  );

  return (
    <DynamicComponent name="AppDetail.AppInfoForm" {...props}>
      <DynamicForm fields={formFields} onSubmit={saveApp} hideSubmitButton={app.isDisabled} />
    </DynamicComponent>
  );
}

AppInfoForm.propTypes = {
  app: AppDetail.isRequired,
  onChange: PropTypes.func,
};

AppInfoForm.defaultProps = {
  onChange: () => {},
};
