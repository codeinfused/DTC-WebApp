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
      allow_notifications: !!CONFIG.state.user.allow_notifications
    };

    this.facebookResponse = this.facebookResponse.bind(this);
    this.googleResponse = this.googleResponse.bind(this);
    this.googleDenied = this.googleDenied.bind(this);
    this.setAuthData = this.setAuthData.bind(this);
  }

  componentDidMount()
  {
  }

  componentWillReceiveProps(nextProps)
  {
  }

  setAuthData(json)
  {
    if(json && json.user){
      CONFIG.state.user = json.user;
      this.setState({loaded: true});
      this.forceUpdate();
    }
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
        ToastsAPI.toast('error', null, 'Could not connect to app, please refresh.', {timeOut:8000});
        comp.setState({loaded: true});
      }

    }).catch(function(json){
      ToastsAPI.toast('error', null, json.response.data.message, {timeOut:8000});
      comp.setState({loaded: true});
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
      ToastsAPI.toast('error', null, 'Error signing in. Please try again.', {timeOut:8000});
    }
  }


  handleChangeNotifications(val)
  {
    var comp = this;
    CONFIG.handleChangeNotifications(val);
    comp.setState({allow_notifications: val});
  }


  render()
  {
    var comp = this;
    return (
      <div id="page-my-settings" className="transition-item page-my-settings page-wrap">

        <div className="my-settings-wrap">
          <h2>My Settings</h2>

          <div className="my-settings-item">
            <Switch label='Allow Phone Notifications' checked={comp.state.allow_notifications} onChange={comp.handleChangeNotifications.bind(comp)} />
          </div>

          <div className="my-settings-item">
            <h3>Account Login</h3>
            <span className="my-current-account">Currently: <span>{CONFIG.state.user.grant_type}</span></span>
            <div className="account-option">
              <FacebookLogin
                appId="202475036823066"
                textButton="Sign in with Facebook"
                autoLoad={false}
                fields="first_name,last_name,email,picture"
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
            </div>
          </div>
        </div>

        <LoadingInline
          active={!comp.state.loaded}
        />

      </div>
    );
  }
}

export default MySettings;
