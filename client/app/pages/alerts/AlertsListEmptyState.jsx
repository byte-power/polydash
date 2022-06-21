import React from "react";
import PropTypes from "prop-types";
import BigMessage from "@/components/BigMessage";
import EmptyState, { EmptyStateHelpMessage } from "@/components/empty-state/EmptyState";
import DynamicComponent from "@/components/DynamicComponent";

export default function AlertListEmptyState({ page, searchTerm, selectedTags }) {
    if (searchTerm !== "") {
        return <BigMessage message="Sorry, we couldn't find anything." icon="fa-search" />;
    }
    if (page === 'all') {
        return (
            <DynamicComponent name="AlertsList.EmptyState">
                <EmptyState
                    icon="fa fa-bell-o"
                    illustration="alert"
                    description="Get notified on certain events"
                    helpMessage={<EmptyStateHelpMessage helpTriggerType="ALERTS" />}
                    showAlertStep
                />
            </DynamicComponent>
        );
    }
}

AlertListEmptyState.propTypes = {
    page: PropTypes.string.isRequired,
    searchTerm: PropTypes.string.isRequired,
    selectedTags: PropTypes.array, // eslint-disable-line react/forbid-prop-types
};
