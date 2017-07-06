import React from 'react';
import ReactDOM from 'react-dom';
import { Route, IndexRoute, Router, browserHistory } from 'react-router';
import { Layout, NavDrawer, Panel, Sidebar, FontIcon, Button } from 'react-toolbox';
import PageTransition from 'react-router-page-transition';
import {push as AppMenu} from 'react-burger-menu';
import MediaQuery from 'react-responsive';
import axios from 'axios';
import {CSSTransitionGroup} from 'react-transition-group';

import CONFIG from './config.jsx';
import ToastsAPI from './components/ToastsAPI.jsx';
import {LoadingFull, LoadingInline} from './components/Loaders.jsx';

import SplashIntro from './pages/SplashIntro.jsx';
import Home from './pages/Home.jsx';
import GamesList from './pages/GamesList.jsx';
import SearchGames from './pages/SearchGames.jsx';
import About from './pages/About.jsx';
import TableEdit from './pages/TableEdit.jsx';
import TableList from './pages/TableList.jsx';
import MyTables from './pages/MyTables.jsx';
import MyPlans from './pages/MyPlans.jsx';
import MySettings from './pages/MySettings.jsx';
import MyAlerts from './pages/MyAlerts.jsx';
import PlayersWanted from './pages/PlayersWanted.jsx';
import ScheduledList from './pages/ScheduledList.jsx';

class AppLayout extends React.Component
{
  constructor(props)
  {
    super(props);
    var comp = this;
    CONFIG.state.index = comp;

    this.state = {
      askDialogActive: false,
      appLoaded: false,
      appLoading: false,
      sideMenuOpen: false,
      ignoreLandscape: false,
      alerts: []
    };

    this.navButtons = [
      {label:'Players Wanted',      path:'/lfp', icon:'video_library'},
      {label:'Scheduled Games',     path:'/schedules', icon:'event_note'},
      {label:'Search By Game',      path:'/games', icon:'library_books', callback: comp.DBLoadBGG},
      {label:'Con Library',         path:'/library', icon:'import_contacts', callback: comp.DBLoadLibrary},
      {label:'Game Alerts',         path:'/alerts', icon:'notifications'},
      {label:'My Plans',            path:'/myplans', icon:'date_range'},
      {label:'My Tables',           path:'/mytables', icon:'playlist_add_check'},
      {label:'My Settings',         path:'/me', icon:'settings_applications'},
      {label:'About',               path:'/about', icon:'info'}
    ];

    this.getNewAlerts = this.getNewAlerts.bind(this);
  }

  componentDidMount()
  {
    CONFIG.checkAuth(this, 'appLoaded');
  }

  DBLoadBGG()
  {
    CONFIG.state.searchDB = 'bgg';
  }

  DBLoadLibrary()
  {
    CONFIG.state.searchDB = 'library';
  }

  setAppLoading(bool)
  {
    this.setState({appLoaded: bool});
  }

  toggleSideMenu()
  {
    this.setState({sideMenuOpen: !this.state.sideMenuOpen});
  }

  isMenuOpen(menustate)
  {
    this.setState({sideMenuOpen: menustate.isOpen});
  }

  handleIgnoreLandscape()
  {
    this.setState({ignoreLandscape: true});
  }

  handleAppNav(item)
  {
    this.toggleSideMenu();
    if(item.callback){ item.callback.call(this); }
    browserHistory.push(item.path);
  }

  getNewAlerts()
  {
    var comp = this;
    var req = CONFIG.api.getAlerts;

    axios({
      method: 'post',
      url: req,
      responseType: 'json',
      data: { t: (new Date()).getTime() },
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      if(json.data && json.data.alerts){
        comp.setState({alerts: json.data.alerts});
      }
      setTimeout(comp.getNewAlerts, 120000);
    }).catch(function(){
      setTimeout(comp.getNewAlerts, 120000);
    });
  }

  render()
  {
    var comp = this;
    var path = this.props.location.pathname;
    var pathpage = path.split('/')[1] || 'root';

    var kids = this.props.children;
    //var clonekids = React.cloneElement(kids, {key: pathpage});

    return (
      <div id="app">


        <MediaQuery minDeviceWidth={500}>
          {comp.state.ignoreLandscape ? '' : (
            <div id="landscape-warning">
              <span>For the best experience, view in portrait on a mobile device.</span><button onClick={comp.handleIgnoreLandscape.bind(comp)}><FontIcon value='remove_circle' /></button>
            </div>
          )}
        </MediaQuery>

        {!comp.state.appLoaded ? <LoadingInline active={true} /> : (
        <div id="app-wrap">
          <AppMenu width={280} pageWrapId={"app-main-body"} outerContainerId={"app-wrap"} isOpen={comp.state.sideMenuOpen} onStateChange={comp.isMenuOpen.bind(comp)} customBurgerIcon={false} customCrossIcon={<FontIcon value='close' />}>
            <h2 className="app-menu-head"><img src="/images/dtc-logo-transp-full.png" /></h2>
            {comp.navButtons.map(function(item, i){
              return (<Button
                onClick={comp.handleAppNav.bind(comp, item)}
                key={'app-nav-'+i}
                icon={item.icon}
              >{item.label}{item.path==='/alerts'?(<span className="alerts-count">{comp.state.alerts.length}</span>):''}</Button>);
            })}
          </AppMenu>

          <div id="app-main-body">
            <CSSTransitionGroup
              transitionName="router"
              transitionEnterTimeout={500}
              transitionLeaveTimeout={500}
            >
              {React.cloneElement(this.props.children, {key: pathpage, appLoading: comp.state.appLoading})}
            </CSSTransitionGroup>
          </div>

          {pathpage==='root' ? '' : (
            <div id="app-navbar">
              <button className="btn-global-menu app-navbar-btn" onClick={()=>{browserHistory.goBack();}}><FontIcon value='keyboard_arrow_left' /></button>
              <button className="btn-global-menu app-navbar-btn" onClick={comp.toggleSideMenu.bind(comp)}><FontIcon value='menu' /></button>
            </div>
          )}
        </div>
        )}

      </div>
    );
  }
}

ReactDOM.render(
  <Router history={browserHistory}>
    <Route path="/" component={AppLayout} drawerstate="false">
      <Route path="home" component={Home} />
      <IndexRoute component={SplashIntro} />
      <Route path="games" component={SearchGames} source="bgg" />
      <Route path="library" component={SearchGames} source="library" />
      <Route path="about" component={About} />
      <Route path="list/:type/:bgg_id" component={TableList} />
      <Route path="tables/create/:bgg_id" component={TableEdit} />
      <Route path="tables/edit/:table_id" component={TableEdit} />
      <Route path="mytables" component={MyTables} />
      <Route path="myplans" component={MyPlans} />
      <Route path="me" component={MySettings} />
      <Route path="alerts" component={MyAlerts} />
      <Route path="lfp" component={PlayersWanted} />
      <Route path="schedules" component={ScheduledList} />
    </Route>
  </Router>,
  document.getElementById('app-wrapper')
);
