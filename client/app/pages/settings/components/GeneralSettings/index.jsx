import React from "react";
import DynamicComponent from "@/components/DynamicComponent";

import FormatSettings from "./FormatSettings";
import PlotlySettings from "./PlotlySettings";
import MaxQueryResultRowsSettings from "./MaxQueryResultRowsSettings";
import FeatureFlagsSettings from "./FeatureFlagsSettings";
import BeaconConsentSettings from "./BeaconConsentSettings";

export default function GeneralSettings(props) {
  return (
    <DynamicComponent name="OrganizationSettings.GeneralSettings" {...props}>
      <h3 className="m-t-0">General</h3>
      <hr />
      <FormatSettings {...props} />
      <PlotlySettings {...props} />
      <MaxQueryResultRowsSettings {...props} />
      <FeatureFlagsSettings {...props} />
      <BeaconConsentSettings {...props} />
    </DynamicComponent>
  );
}
