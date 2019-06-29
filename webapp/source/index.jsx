import React from 'react';
import ReactDOM from 'react-dom';
import { Route, IndexRoute, Router, browserHistory } from 'react-router';
import { Layout, AppBar, NavDrawer, Panel, Sidebar, FontIcon, Button, Dialog, Navigation } from 'react-toolbox';
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
import OfficialEvents from './pages/OfficialEvents.jsx';
import Privacy from './pages/Privacy.jsx';

class AppLayout extends React.Component
{
  constructor(props)
  {
    super(props);
    var comp = this;
    var test = this;
    CONFIG.state.index = comp;

    this.state = {
      askDialogActive: false,
      appLoaded: false,
      appLoading: false,
      sideMenuOpen: false,
      ignoreLandscape: false,
      tabletMin: 768,
      desktopMin: 1440,
      isTabletWide: false,
      isDesktopWide: false,
      alerts: [],
      alertCount: 0,
      tableDialogActive: false,
      tableDialogData: {},
      tableDialogLoading: false,
      activeNav: (props.location.pathname ? props.location.pathname : '/home')
    };

    this.navButtons = [
      {label:'Home',                path:'/home', icon:'home'},
      {label:'Tables Right Now',    path:'/lfp', icon:'casino'}, // video_library
      {label:'Scheduled Tables',    path:'/schedules', icon:'event_note'},
      {label:'Start/Search Games',  path:'/games', icon:'search', callback: comp.DBLoadBGG}, // library_books
      // {label:'Con Library',         path:'/library', icon:'import_contacts', callback: comp.DBLoadLibrary},
      {label:'Official Events',     path:'/events', icon:'local_play'}, // dvr
      {label:'Game Alerts',         path:'/alerts', icon:'notifications'},
      {label:'My Plans',            path:'/myplans', icon:'date_range'},
      {label:'My Tables',           path:'/mytables', icon:'playlist_add_check'},
      {label:'My Settings',         path:'/me', icon:'settings_applications'},
      {label:'About & Map',         path:'/about', icon:'info'}
    ];

    this.getNewAlerts = this.getNewAlerts.bind(this);
    this.openTableDialog = this.openTableDialog.bind(this);
    this.handleCloseTableDialog = this.handleCloseTableDialog.bind(this);
    this.renderTableDialog = this.renderTableDialog.bind(this);
  }

  componentDidMount()
  {
    var comp = this;
    CONFIG.authPromise = new Promise((resolve, reject) => {
      var checkPromise = CONFIG.checkAuth(comp, 'appLoaded');
      checkPromise.then(resolve);
      checkPromise.catch(reject);
    });
    comp.checkScreenWidth();
    window.addEventListener("resize", comp.checkScreenWidth.bind(comp));
  }

  checkScreenWidth()
  {
    var comp = this;
    var sw = window.innerWidth;
    var stateObj = {};

    if(sw >= comp.state.desktopMin && !comp.state.isDesktopWide){
      stateObj.isDesktopWide = true;
    }else if(sw < comp.state.desktopMin && comp.state.isDesktopWide){
      stateObj.isDesktopWide = false;
    }

    if(sw >= comp.state.tabletMin && !comp.state.isTabletWide){
      stateObj.isTabletWide = true;
    }else if(sw < comp.state.tabletMin && comp.state.isTabletWide){
      stateObj.isTabletWide = false;
    }

    if(Object.keys(stateObj).length > 0){
      comp.setState(stateObj);
    }
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
    this.setState({activeNav: item.path});
    browserHistory.push(item.path);
  }

  getNewAlerts()
  {
    var comp = this;
    var req = CONFIG.api.getAlerts;
    if(CONFIG.state.user.allow_notifications=='1'){
      axios({
        method: 'post',
        url: req,
        responseType: 'json',
        data: { t: (new Date()).getTime() },
        headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
      }).then(function(json){
        if(json.data && json.data.alerts){
          json.data.alerts.forEach(function(alert, i){
            CONFIG.sendNotification(alert, alert.title, alert.message);
          });
        }
        comp.setState({"alertCount": json.data.count});
      }).catch(function(){
        //
      });
    }
    setTimeout(comp.getNewAlerts, 60000);
  }


  openTableDialog(table_id)
  {
    var comp = this;
    this.setState({tableDialogActive: true, tableDialogLoading: true});

    axios.post(CONFIG.api.tablePlayers, {
      table_id: table_id,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      comp.setState({
        tableDialogLoading: false,
        tableDialogData: json.data
      });
    }).catch(function(json){
      comp.setState({tableDialogActive: false});
      ToastsAPI.toast('error', null, 'Failed to get player data.', {timeOut:6000});
    });
  }

  handleCloseTableDialog()
  {
    this.setState({tableDialogActive: false, tableDialogLoading: false});
  }

  renderTableDialog()
  {
    var comp = this;
    var data = comp.state.tableDialogData;
    if(data.table){
      return (
        <div className="table-players-data">
          <div className="table-host">Host: <span>{data.table.host_name}</span></div>
          <h3>Players</h3>
          <div className="table-players-list">
            {data.players.filter(function(player, i){ return i < data.table.seats; }).map(function(player, i){
              return (<div key={"table-players-"+i} className="table-player"><span>{+i+1}</span> {player.player_name}</div>);
            })}
          </div>
          <h3>Waitlist</h3>
          <div className="table-players-waitlist">
            {data.players.filter(function(player, i){ return i >= data.table.seats; }).map(function(player, i){
              return (<div key={"table-waits-"+i} className="table-player"><span>{+data.table.seats+i+1}</span> {player.player_name}</div>);
            })}
          </div>
        </div>
      );
    }
  }


  render()
  {
    var comp = this;
    var path = this.props.location.pathname;
    var pathpage = path.split('/')[1] || 'root';

    var kids = this.props.children;

    return (
      <div id="app" className={(comp.state.sideMenuOpen?"menu-open":"menu-closed")}>


        {/* <MediaQuery minDeviceWidth={900}>
          {comp.state.ignoreLandscape ? '' : (
            <div id="landscape-warning">
              <span>For the best experience, view on a mobile device.</span><button onClick={comp.handleIgnoreLandscape.bind(comp)}><FontIcon value='remove_circle' /></button>
            </div>
          )}
        </MediaQuery> */}

        {!comp.state.appLoaded ? <LoadingInline active={true} /> : (
        <div id="app-wrap">
          <AppMenu width={280} pageWrapId={"app-main-body"} outerContainerId={"app-wrap"} isOpen={comp.state.sideMenuOpen} onStateChange={comp.isMenuOpen.bind(comp)} customBurgerIcon={false} customCrossIcon={<FontIcon value='close' />}>
            <h2 className="app-menu-head" onClick={()=>{comp.toggleSideMenu(); browserHistory.push('/home');}}><img src="/images/dtc-logo-transp-full.png" /></h2>
            {comp.navButtons.map(function(item, i){
              return (<Button
                className={comp.state.activeNav===item.path ? 'active' : ''}
                onClick={comp.handleAppNav.bind(comp, item)}
                key={'app-nav-'+i}
                icon={item.icon}
              >{item.label}{item.path==='/alerts'?(<span className="alerts-count">{comp.state.alertCount}</span>):''}</Button>);
            })}
          </AppMenu>

          <div id="app-main-body">
            <CSSTransitionGroup
              transitionName="router"
              transitionEnterTimeout={500}
              transitionLeaveTimeout={500}
            >
              {React.cloneElement(this.props.children, {key: pathpage, appLoading: comp.state.appLoading, renderView: (comp.state.isDesktopWide?'desktop':comp.state.isTabletWide?'tablet':'phone')})}
            </CSSTransitionGroup>
          </div>

          {pathpage==='root' ? '' : (
             <AppBar
               className="app-headerbar"
               title="Dice Tower Con '19"
               leftIcon="menu"
               rightIcon={<FontIcon value='arrow_back' />}
               onLeftIconClick={comp.toggleSideMenu.bind(comp)}
               onRightIconClick={()=>{browserHistory.goBack();}}
               >
             </AppBar>
            // <div id="app-navbar">
            //   <button className="btn-global-menu app-navbar-btn" onClick={()=>{browserHistory.goBack();}}><FontIcon value='keyboard_arrow_left' /></button>
            //   <button className="btn-global-menu app-navbar-btn" onClick={comp.toggleSideMenu.bind(comp)}><FontIcon value='menu' /></button>
            // </div>
          )}
        </div>
        )}

        <Dialog
          title="Table Players"
          type="normal"
          onEscKeyDown={this.handleCloseTableDialog}
          onOverlayClick={this.handleCloseTableDialog}
          active={this.state.tableDialogActive}
          actions={[
            {label: "Close", onClick: this.handleCloseTableDialog, primary: true, raised: true}
          ]}
        >
          {comp.state.tableDialogLoading ? (
            <LoadingInline active={comp.state.tableDialogLoading} />
          ) : (
            comp.renderTableDialog()
          )}
        </Dialog>

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
      <Route path="events" component={OfficialEvents} />
      <Route path="privacy" component={Privacy} />
    </Route>
  </Router>,
  document.getElementById('app-wrapper')
);
