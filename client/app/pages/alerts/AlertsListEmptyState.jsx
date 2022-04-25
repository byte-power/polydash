import React from "react";
import PropTypes from "prop-types";
import Link from "@/components/Link";
import BigMessage from "@/components/BigMessage";
import NoTaggedObjectsFound from "@/components/NoTaggedObjectsFound";
import EmptyState, { EmptyStateHelpMessage } from "@/components/empty-state/EmptyState";
import DynamicComponent from "@/components/DynamicComponent";

export default function AlertListEmptyState({ page, searchTerm, selectedTags }) {
    if (searchTerm !== "") {
        return <BigMessage message="Sorry, we couldn't find anything." icon="fa-search" />;
    }
    switch (page) {
        case "all":
            return (
                <DynamicComponent name="QueriesList.EmptyState">
                    <EmptyState
                        icon="fa fa-bell-o"
                        illustration="alert"
                        description="Get notified on certain events"
                        helpMessage={<EmptyStateHelpMessage helpTriggerType="ALERTS" />}
                        showAlertStep
                    />
                </DynamicComponent>
            );
        default:
    }
}

AlertListEmptyState.propTypes = {
    page: PropTypes.string.isRequired,
    searchTerm: PropTypes.string.isRequired,
    selectedTags: PropTypes.array, // eslint-disable-line react/forbid-prop-types
};
