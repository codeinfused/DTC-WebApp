import React from 'react';
import { Router, Route, IndexRoute, Link, browserHistory } from 'react-router';
import {Avatar, Button, IconButton, Drawer, FontIcon, List, ListItem, ListSubHeader} from 'react-toolbox/';
import ThemeConfig from '../config.jsx';
//import FontIcon from 'react-toolbox/lib/font_icon';

const GlobalDrawer = React.createClass(
{
  getInitialState: function() {
    return {
      globalDrawerNav: [
        {caption: 'Dashboard', to: '/'},
        {caption: 'Users', to: '/users'},
        {caption: 'Locations', to: '/locations'},
        {caption: 'Contracts', to: '/contracts'},
        {caption: 'Data Entry', to: '/'}
      ]
    };
  },
  
  handleMenuClick: function(item){
    browserHistory.push(item.to);
    this.props.toggleGlobalDrawer();
  },
  
  render: function(){
    var that = this;
    return (
      <Drawer className="global-drawer" active={this.props.drawerOpened} onOverlayClick={this.props.toggleGlobalDrawer}>
        <div className="global-drawer-user">
          <Avatar cover={true} image={ThemeConfig.path+'images/generic_avatar_300.gif'} />
          <div className="global-drawer-user-name">Mike</div>
        </div>
        <div className="global-drawer-nav">
          <List selectable ripple className='global-drawer-nav-main'>
            {this.state.globalDrawerNav.map(function(item) {
              return (
                <ListItem caption={item.caption} ripple selectable key={item.caption} onClick={that.handleMenuClick.bind(that, item)} />
              );
            })}
          </List>
        </div>
      </Drawer>
    );
  }
});

export default GlobalDrawer;