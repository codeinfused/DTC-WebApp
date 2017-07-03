import React from 'react';
import { Router, Route, IndexRoute, Link, browserHistory } from 'react-router';
import {Button, IconButton} from 'react-toolbox/lib/button';
import FontIcon from 'react-toolbox/lib/font_icon';

const HeaderBar = React.createClass({
  bookmarkAction: function(e){
    this.props.toggleGlobalDrawer();
    //browserHistory.push('/users');
  },
  render: function(){
    return (
      <div id="header-bar">
        <IconButton icon='menu' className='global-nav-open' onClick={this.bookmarkAction} />
      </div>
    );
  }
});

export default HeaderBar;