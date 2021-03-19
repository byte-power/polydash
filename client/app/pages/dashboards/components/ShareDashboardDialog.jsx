import { replace } from "lodash";
import React from "react";
import { axios } from "@/services/axios";
import PropTypes from "prop-types";
import Switch from "antd/lib/switch";
import Modal from "antd/lib/modal";
import Form from "antd/lib/form";
import Alert from "antd/lib/alert";
import notification from "@/services/notification";
import { wrap as wrapDialog, DialogPropType } from "@/components/DialogWrapper";
import { clientConfig } from "@/services/auth";
import CodeBlock from "@/components/CodeBlock";
import InputWithCopy from "@/components/InputWithCopy";
import HelpTrigger from "@/components/HelpTrigger";

const API_SHARE_URL = "api/dashboards/{id}/share";

class ShareDashboardDialog extends React.Component {
  static propTypes = {
    dashboard: PropTypes.object.isRequired, // eslint-disable-line react/forbid-prop-types
    hasOnlySafeQueries: PropTypes.bool.isRequired,
    dialog: DialogPropType.isRequired,
  };

  formItemProps = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
    style: { marginBottom: 7 },
  };

  constructor(props) {
    super(props);
    const { dashboard } = this.props;

    this.state = {
      saving: false,
      iframeHeight: 300,
    };

    let query = "?";
    if (window.location.search) {
      let searchParams = new URLSearchParams(window.location.search);
      for (let key of searchParams.keys()) {
        query += key + "=[xxx]&";
      }
    }
    this.apiUrl = replace(API_SHARE_URL, "{id}", dashboard.id);
    this.enabled = this.props.hasOnlySafeQueries || dashboard.publicAccessEnabled;
    this.embedUrl = `${clientConfig.basePath}embed/dashboard/${dashboard.id}${query}secret_key=[xxx]&timestamp=[xxx]&signature=[xxx]}`;
  }

  static get headerContent() {
    return (
      <React.Fragment>
        Share Dashboard
        <div className="modal-header-desc">
          Allow public access to this dashboard with a secret address. <HelpTrigger type="SHARE_DASHBOARD" />
        </div>
      </React.Fragment>
    );
  }

  enableAccess = () => {
    const { dashboard } = this.props;
    this.setState({ saving: true });

    axios
      .post(this.apiUrl)
      .then(data => {
        dashboard.publicAccessEnabled = true;
        dashboard.public_url = data.public_url;
      })
      .catch(() => {
        notification.error("Failed to turn on sharing for this dashboard");
      })
      .finally(() => {
        this.setState({ saving: false });
      });
  };

  disableAccess = () => {
    const { dashboard } = this.props;
    this.setState({ saving: true });

    axios
      .delete(this.apiUrl)
      .then(() => {
        dashboard.publicAccessEnabled = false;
        delete dashboard.public_url;
      })
      .catch(() => {
        notification.error("Failed to turn off sharing for this dashboard");
      })
      .finally(() => {
        this.setState({ saving: false });
      });
  };

  onChange = checked => {
    if (checked) {
      this.enableAccess();
    } else {
      this.disableAccess();
    }
  };

  render() {
    const { dialog, dashboard, showPublic, showEmbed } = this.props;

    return (
      <Modal {...dialog.props} title={this.constructor.headerContent} footer={null}>
        <Form layout="horizontal">
          {!this.props.hasOnlySafeQueries && (
            <Form.Item>
              <Alert
                message="For your security, sharing is currently not supported for dashboards containing queries with text parameters. Consider changing the text parameters in your query to a different type."
                type="error"
              />
            </Form.Item>
          )}
          {showPublic && (
            <div className="section">
              <h5 className="m-t-0">Public URL</h5>
              <Form.Item label="Allow public access" {...this.formItemProps}>
                <Switch
                  checked={dashboard.publicAccessEnabled}
                  onChange={this.onChange}
                  loading={this.state.saving}
                  disabled={!this.enabled}
                  data-test="PublicAccessEnabled"
                />
              </Form.Item>
              {dashboard.public_url && (
                <Form.Item label="Secret address" {...this.formItemProps}>
                  <InputWithCopy value={dashboard.public_url} data-test="SecretAddress" />
                </Form.Item>
              )}
            </div>
          )}
          {showEmbed && (
            <div className="section">
              <h5 className="m-t-0">IFrame Embed</h5>
              <CodeBlock copyable>
                {`<iframe src="${this.embedUrl}" width="100%" height="${this.state.iframeHeight}" frameborder="0"></iframe>`}
              </CodeBlock>
            </div>
          )}
        </Form>
      </Modal>
    );
  }
}

export default wrapDialog(ShareDashboardDialog);
