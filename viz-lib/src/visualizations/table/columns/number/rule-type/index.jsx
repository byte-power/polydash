import React from "react";
import PropTypes from "prop-types";
import FontSizeControl from './fontSize'
import FontStyleControl from './fontStyle'
import ColorControl from './color'
import BackgroundControl from './background'

const controlType = (props) => {
    let RenderDom = null;
    switch (props.type) {
        case 'fontSize':
            RenderDom = <FontSizeControl {...props} />
            break;
        case 'fontStyle':
            RenderDom = <FontStyleControl {...props} />
            break;
        case 'color':
            RenderDom = <ColorControl {...props} />
            break;
        case 'background':
            RenderDom = <BackgroundControl {...props} />
            break;
        default:
            RenderDom = <div></div>
            break;
    }
    return RenderDom
}

controlType.propTypes = {
    type: PropTypes.string.isRequired
};

export default controlType