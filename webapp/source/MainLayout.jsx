import React from 'react';
import { Router, Route, IndexRoute, Link, browserHistory } from 'react-router';

/*
import HeaderBar from '../components/HeaderBar';
import GlobalDrawer from '../components/GlobalDrawer';
*/

class MainLayout extends React.Component
{
  constructor() {
    this.state = {
      drawerOpened: false
    };
  }

  toggleGlobalDrawer(){
    this.setState({
      drawerOpened: !this.state.drawerOpened
    })
  }

  render(){
    return (
      <div id="app-layout" className={this.state.drawerOpened===true?"drawer-open":"drawer-closed"}>
        {this.props.children}
      </div>
    );
  }
};

/*
<GlobalDrawer toggleGlobalDrawer={this.toggleGlobalDrawer} drawerOpened={this.state.drawerOpened} />
<HeaderBar toggleGlobalDrawer={this.toggleGlobalDrawer} />
<div id="site-main">
  {this.props.children}
</div>
*/

export default MainLayout;
