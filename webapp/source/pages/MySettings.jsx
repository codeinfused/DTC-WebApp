import CONFIG from '../config.jsx';
import axios from 'axios';
import React from 'react';
import {browserHistory} from 'react-router';
import {FontIcon, Dialog, Switch} from 'react-toolbox';
import {Button, IconButton} from 'react-toolbox/lib/button';
import {cloneDeep, slice} from 'lodash';
import moment from 'moment';
import FacebookLogin from 'react-facebook-login';
import GoogleLogin from 'react-google-login';

import {LoadingInline} from '../components/Loaders.jsx';
import ToastsAPI from '../components/ToastsAPI.jsx';

class MySettings extends React.Component
{
  constructor(props)
  {
    super(props);
    var comp = this;

    this.state = {
      loaded: true,
      wtp: [],
      ignore: [],
      dns: [],
      allow_notifications: !!+(CONFIG.state.user.allow_notifications)
    };

    this.facebookResponse = this.facebookResponse.bind(this);
    this.googleResponse = this.googleResponse.bind(this);
    this.googleDenied = this.googleDenied.bind(this);
    this.setAuthData = this.setAuthData.bind(this);
    this.getMyAlertSettings = this.getMyAlertSettings.bind(this);
  }

  componentDidMount()
  {
    this.getMyAlertSettings();
  }

  componentWillReceiveProps(nextProps)
  {
  }

  setAuthData(json)
  {
    if(json && json.user){
      CONFIG.state.user = Object.assign(CONFIG.state.user, json.user);
      this.setState({loaded: true});
      this.forceUpdate();
    }
  }

  getMyAlertSettings()
  {
    var comp = this;
    axios.post(CONFIG.api.myAlertSettings, {
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      comp.setState({
        loaded: true,
        wtp: json.data.wtp,
        dns: json.data.dns,
        ignore: json.data.ignore
      });
    }).catch(function(json){
      console.log(json);
      ToastsAPI.toast('error', null, 'Failed to get some settings.', {timeOut:6000});
    });
  }

  facebookResponse(response)
  {
    var comp = this;
    var req = CONFIG.api.addAuth;
    comp.setState({loaded: false, appLoading:true});

    comp.getRequest = axios.post(req, {
      grant_type: 'facebook',
      token: response.accessToken,
      user: {
        email: response.email,
        first_name: response.first_name,
        last_name: response.last_name,
        thumb: response.picture.data.url
      },
      t: (new Date()).getTime()
    }).then(function(json)
    {
      if(json.data && json.data.user){
        comp.setAuthData(json.data);
      }else{
        ToastsAPI.toast('error', null, "Couldn't connect to app, please refresh.", {timeOut:8000});
        comp.setState({loaded: true});
      }

    }).catch(function(json){
      if(json.response){
        ToastsAPI.toast('error', null, json.response.data.message, {timeOut:8000});
        comp.setState({loaded: true});
      }else{
        ToastsAPI.toast('error', null, "Couldn't connect to facebook.", {timeOut:8000});
        comp.setState({loaded: true});
      }
    });
  }

  googleResponse(response)
  {
    var comp = this;
    var req = CONFIG.api.addAuth;
    comp.setState({loaded: false});

    comp.getRequest = axios({
      method: 'post',
      url: req,
      responseType: 'json',
      data: {
        grant_type: 'google',
        token: response.tokenId,
        user: {
          email: response.profileObj.email,
          first_name: response.profileObj.givenName,
          last_name: response.profileObj.familyName,
          thumb: response.profileObj.imageUrl
        },
        t: (new Date()).getTime()
      }
    }).then(function(json)
    {
      if(json.data && json.data.user){
        comp.setAuthData(json.data);
      }else{
        ToastsAPI.toast('error', null, 'Could not connect to app, please refresh.', {timeOut:8000});
        comp.setState({loaded: true});
      }

    }).catch(function(json){
      ToastsAPI.toast('error', null, json, {timeOut:8000}); // json.response.data.message
      comp.setState({loaded: true});
    });
  }

  googleDenied(response)
  {
    if(response.error != 'popup_closed_by_user'){
      ToastsAPI.toast('error', null, 'Error logging in to Google. Please try again.', {timeOut:8000});
    }
  }


  handleChangeNotifications(val)
  {
    var comp = this;
    CONFIG.handleChangeNotifications(val);
    comp.setState({allow_notifications: val});
  }

  handleToggleWTP(bgg_id)
  {
    var comp = this;
    if(CONFIG.state.user.wtp.indexOf(bgg_id) < 0){
      comp.addWTP(bgg_id);
    }else{
      comp.deleteWTP(bgg_id);
    }
  }

  handleToggleNotify(bgg_id)
  {
    var comp = this;
    if(CONFIG.state.user.notify.indexOf(bgg_id) < 0){
      comp.addNotify(bgg_id);
    }else{
      comp.deleteNotify(bgg_id);
    }
  }


  addWTP(bgg_id)
  {
    var comp = this;
    CONFIG.state.user.wtp.push(bgg_id);
    CONFIG.state.user.wtp = _.uniq(CONFIG.state.user.wtp);

    axios.post(CONFIG.api.wtp, {
      bgg_id: bgg_id,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).catch(function(json){
      ToastsAPI.toast('error', null, 'Error adding your game.', {timeOut:6000});
    });
    this.forceUpdate();
  }

  deleteWTP(bgg_id)
  {
    var comp = this;
    var ind = CONFIG.state.user.wtp.indexOf(bgg_id);
    if(ind > -1){
      CONFIG.state.user.wtp.splice(ind, 1);
      var ind2 = CONFIG.state.user.notify.indexOf(bgg_id);
      if(ind2 > -1){
        CONFIG.state.user.notify.splice(ind2, 1);
      }
    }

    axios.post(CONFIG.api.wtp+'/delete', {
      bgg_id: bgg_id,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).catch(function(json){
      ToastsAPI.toast('error', null, 'Failed to delete game.', {timeOut:6000});
    });
    this.forceUpdate();
  }

  addNotify(bgg_id)
  {
    var comp = this;
    var wtp_ind = CONFIG.state.user.wtp.indexOf(bgg_id);
    if(wtp_ind < 0){
      CONFIG.state.user.wtp.push(bgg_id);
    }
    CONFIG.state.user.notify.push(bgg_id);
    CONFIG.state.user.notify = _.uniq(CONFIG.state.user.notify);

    axios.post(CONFIG.api.notify, {
      bgg_id: bgg_id,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(){
      ToastsAPI.toast('success', null, 'You will be notified of tables for this game.', {timeOut:6000});
    }).catch(function(json){
      ToastsAPI.toast('error', null, 'Failed to add notification.', {timeOut:6000});
    });
    this.forceUpdate();
  }

  deleteNotify(bgg_id)
  {
    var comp = this;
    var ind = CONFIG.state.user.notify.indexOf(bgg_id);
    CONFIG.state.user.notify.splice(ind, 1);

    axios.post(CONFIG.api.notify+'/delete', {
      bgg_id: bgg_id,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).catch(function(json){
      ToastsAPI.toast('error', null, 'Failed to delete notification.', {timeOut:6000});
    });
    this.forceUpdate();
  }


  // BUTTON: DO NOT SHOW GAME
  // -----------------------------------------------

  addDNS(bgg_id)
  {
    var comp = this;
    CONFIG.state.user.dns.push(bgg_id);
    CONFIG.state.user.dns = _.uniq(CONFIG.state.user.dns);
    if(comp.props.onToggleDNS){
      comp.props.onToggleDNS('add', bgg_id);
    }
    var ax = axios.post(CONFIG.api.dns, {bgg_id: bgg_id, t: (new Date()).getTime()}, {headers: {'Authorization': 'Bearer '+CONFIG.state.auth}})
    ax.catch(function(json){
      ToastsAPI.toast('error', null, 'Error adding game.', {timeOut:6000});
    });
    ax.then(function(){ comp.getMyAlertSettings(); });
  }

  deleteDNS(bgg_id)
  {
    var comp = this;
    var ind = CONFIG.state.user.dns.indexOf(bgg_id);
    CONFIG.state.user.dns.splice(ind, 1);
    if(comp.props.onToggleDNS){
      comp.props.onToggleDNS('delete', bgg_id);
    }
    var ax = axios.post(CONFIG.api.dns+'/delete', {bgg_id: bgg_id,t: (new Date()).getTime()}, {headers: {'Authorization': 'Bearer '+CONFIG.state.auth}})
    ax.catch(function(json){
      ToastsAPI.toast('error', null, 'Error deleting notification.', {timeOut:6000});
    });
    ax.then(function(){ comp.getMyAlertSettings(); });
  }

  handleToggleDNS(bgg_id)
  {
    var comp = this;
    if(CONFIG.state.user.dns.indexOf(bgg_id) < 0){
      comp.addDNS(bgg_id);
    }else{
      comp.deleteDNS(bgg_id);
    }
  }


  // BUTTON: IGNORE GAME HOST
  // -----------------------------------------------

  addIgnore(bad_player_id)
  {
    var comp = this;
    CONFIG.state.user.ignore.push(bad_player_id);
    CONFIG.state.user.ignore = _.uniq(CONFIG.state.user.ignore);
    if(comp.props.onToggleIgnore){
      comp.props.onToggleIgnore('add', bad_player_id);
    }
    var ax = axios.post(CONFIG.api.ignore, {bad_player_id: bad_player_id, t: (new Date()).getTime()}, {headers: {'Authorization': 'Bearer '+CONFIG.state.auth}})
    ax.catch(function(json){
      ToastsAPI.toast('error', null, 'Error adding game.', {timeOut:6000});
    });
    ax.then(function(){ comp.getMyAlertSettings(); });
  }

  deleteIgnore(bad_player_id)
  {
    var comp = this;
    var ind = CONFIG.state.user.ignore.indexOf(bad_player_id);
    CONFIG.state.user.ignore.splice(ind, 1);
    if(comp.props.onToggleIgnore){
      comp.props.onToggleIgnore('delete', bad_player_id);
    }
    var ax = axios.post(CONFIG.api.ignore+'/delete', {bad_player_id: bad_player_id, t: (new Date()).getTime()}, {headers: {'Authorization': 'Bearer '+CONFIG.state.auth}})
    ax.catch(function(json){
      ToastsAPI.toast('error', null, 'Error deleting notification.', {timeOut:6000});
    });
    ax.then(function(){ comp.getMyAlertSettings(); });
  }

  handleToggleIgnore(bad_player_id)
  {
    var comp = this;
    console.log(CONFIG.state.user.ignore, bad_player_id);
    if(CONFIG.state.user.ignore.indexOf(bad_player_id) < 0){
      comp.addIgnore(bad_player_id);
    }else{
      comp.deleteIgnore(bad_player_id);
    }
  }

  // -----------------------
  //
  render()
  {
    var comp = this;
    return (
      <div id="page-my-settings" className="transition-item page-my-settings page-wrap">

        <div className="my-settings-wrap">
          <h2>My Settings</h2>

          <div className="my-profile-name"><span>{CONFIG.state.user && CONFIG.state.user.firstname ? CONFIG.state.user.firstname + " " + CONFIG.state.user.lastname.slice(0,1) : "Guest"}</span></div>

          <div className="my-profile">
            <img src={CONFIG.state.user.thumb ? CONFIG.state.user.thumb : '/images/profile-generic.jpg'} />
          </div>

          <div className="my-settings-item">
            <h3 style={{marginBottom:'3px'}}>Your Account</h3>
            <span className="my-current-account">Currently: <span>{CONFIG.state.user.grant_type}</span></span>
            {/* <div><Switch label='Show My Profile Photo In Tables' check={comp.state.show_photo} onChange={comp.handleChangeInput.bind(comp)}</div> */}
            <Switch label='Allow Phone Notifications' checked={comp.state.allow_notifications} onChange={comp.handleChangeNotifications.bind(comp)} />
            <span style={{marginBottom:"1rem",display:"block"}}>Works only in Chrome Browser</span>
            <Button mini neutral raised className="btn metro" style={{fontSize:"1.1rem"}} onClick={()=>{CONFIG.sendNotification({alert_type:'',reference_id:'',reference_type:'test'}, 'DTC Test Alert', 'Your game alert test has worked!');}}>Send test notification</Button>
            <div className="account-option">
              <button type="button" className="btn-login btn-login-logout metro" onClick={CONFIG.handleLogout}>Log out to switch accounts</button>
            </div>
            {/* <div className="account-option">
              <FacebookLogin
                appId="202475036823066"
                textButton="Sign in with Facebook"
                autoLoad={false}
                fields="first_name,last_name,email,picture.type(normal)"
                callback={this.facebookResponse}
                onClick={()=>{comp.setState({appLoading:true});}}
                icon={false}
                redirectUri={window.location.href}
                cssClass="btn-login btn-login-facebook"
              />
            </div>
            <div className="account-option">
              <GoogleLogin
                clientId="1018275567135-e9q9n0aoc1l7bn8doq8q394t1so9gn5b.apps.googleusercontent.com"
                buttonText="Sign in with Google"
                scope="profile email"
                autoLoad={false}
                uxMode="popup"
                onSuccess={this.googleResponse}
                onFailure={this.googleDenied}
                onRequest={()=>{comp.setState({appLoading:true});}}
                className="btn-login btn-login-google"
              />
            </div> */}
          </div>

          <div className="my-settings-item">
            <h3>My Game Preferences</h3>
            <p><em>Your "want to play" and alert settings on games.</em></p>
            <div className="page-game-search my-game-list my-wtp-list clearfix">
              {comp.state.wtp.map(function(game){
                //var notifyActive = CONFIG.state.user.notify.indexOf(game.bgg_id) > -1 ? " active" : "";
                //var wtpActive = CONFIG.state.user.wtp.indexOf(game.bgg_id) > -1 ? " active" : "";

                // change these to handle empty error state // CONFIG.state.user.notify &&
                var notifyActive = CONFIG.state.user.notify.indexOf(game.bgg_id) > -1 ? " active" : "";
                var wtpActive = CONFIG.state.user.wtp.indexOf(game.bgg_id) > -1 ? " active" : "";
                return (
                  <div className="game-item-action" key={'alert-settings-'+game.bgg_id}>
                    <div className="game-item-action-line">
                      <div className="game-item-action-title">{game.game_title}</div>
                      <div className={"game-item-action-btn action-notify-btn" + notifyActive}><IconButton icon='notifications' onClick={comp.handleToggleNotify.bind(comp, game.bgg_id)} /></div> {/* Detect support for notifications before displaying */}
                      <div className={"game-item-action-btn action-wtp-btn" + wtpActive}><IconButton icon='check' onClick={comp.handleToggleWTP.bind(comp, game.bgg_id)} /></div>
                    </div>
                  </div>
                );
              })}
              {comp.state.wtp.length > 0 ? '' : (<div className="game-item-action"><div className="game-item-action-line empty"><div className="game-item-action-title">Your "Want To Play" list is empty!</div></div></div>)}
            </div>
            <p style={{marginTop: '30px'}}><em>Don't show me these games in Scheduling:</em></p>
            <div className="page-game-search my-game-list my-dns-list clearfix">
              {comp.state.dns.map(function(game){
                return (
                  <div className="game-item-action" key={'alert-settings-'+game.bgg_id}>
                    <div className="game-item-action-line">
                      <div className="game-item-action-title">{game.game_title}</div>
                      <div className={"game-item-action-btn action-dns-btn active"}><IconButton icon='remove_circle' onClick={comp.handleToggleDNS.bind(comp, game.bgg_id)} /></div>
                    </div>
                  </div>
                );
              })}
              {comp.state.dns.length > 0 ? '' : (<div className="game-item-action"><div className="game-item-action-line empty"><div className="game-item-action-title">No board games being ignored.</div></div></div>)}
            </div>
            <p style={{marginTop: '30px'}}><em>Don't show me scheduled games from these Hosts:</em></p>
            <div className="page-game-search my-game-list my-ignore-list clearfix">
              {comp.state.ignore.map(function(host){
                return (
                  <div className="game-item-action" key={'alert-settings-'+host.bad_player_id}>
                    <div className="game-item-action-line">
                      <div className="game-item-action-title">{host.fullname}</div>
                      <div className={"game-item-action-btn action-ignore-btn active"}><IconButton icon='person' onClick={comp.handleToggleIgnore.bind(comp, host.bad_player_id)} /></div>
                    </div>
                  </div>
                );
              })}
              {comp.state.ignore.length > 0 ? '' : (<div className="game-item-action"><div className="game-item-action-line empty"><div className="game-item-action-title">You haven't blocked any hosts.</div></div></div>)}
            </div>
          </div>

        </div> {/* <!-- /wrap --> */}

        <LoadingInline
          active={!comp.state.loaded}
        />

      </div>
    );
  }
}

export default MySettings;
