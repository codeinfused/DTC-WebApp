import CONFIG from '../config.jsx';
import React from 'react';
import {FontIcon, Dropdown, Dialog} from 'react-toolbox';
import {Button, IconButton} from 'react-toolbox/lib/button';
import {assign} from 'lodash';

class MapPopup extends React.Component
{
  constructor(props)
  {
    super(props);
    var comp = this;
    this.state = {
      popup_map: false,
      styles: _.assign({display:"inline-block", textTransform:"none", position:"relative", top:"-1px", fontSize:"1.3rem"}, props.styles)
    };
  }

  componentDidMount()
  {
    var comp = this;
  }

  handleOpenMap()
  {
    this.setState({popup_map: true});
  }

  handleCloseMap()
  {
    this.setState({popup_map: false});
  }

  render()
  {
    var comp = this;
    return (
      <div className="map-popup-cm" style={comp.props.fullwidth?{}:{display:"inline-block"}}>
        <Button
          label="View DTC Floor Map"
          icon="map"
          onClick={comp.handleOpenMap.bind(comp)}
          style={comp.state.styles}
          raised={comp.props.raised}
          accent={comp.props.accent}
          primary={comp.props.primary}
        />
        <Dialog
          className="map-popup"
          title=""
          type="large"
          onEscKeyDown={comp.handleCloseMap.bind(comp)}
          onOverlayClick={comp.handleCloseMap.bind(comp)}
          active={comp.state.popup_map!==false}
          actions={[
            {label: "Close", onClick: comp.handleCloseMap.bind(comp), primary: true, raised: true}
          ]}
        >
          <img src="/images/DTCMap2019.jpg" style={{width: '100%', minWidth: '900px'}} />
        </Dialog>
      </div>
    );
  }

}

export default MapPopup;
