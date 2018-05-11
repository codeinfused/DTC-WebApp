import React from 'react';
import {browserHistory} from 'react-router';
import FacebookLogin from 'react-facebook-login';
import GoogleLogin from 'react-google-login';
import axios from 'axios';
import {cloneDeep} from 'lodash';
import Cookies from 'js-cookie';

import Dialog from 'react-toolbox/lib/dialog';

import CONFIG from '../config.jsx';
import ToastsAPI from '../components/ToastsAPI.jsx';
import {LoadingFull, LoadingInline} from '../components/Loaders.jsx';

class SplashIntro extends React.Component
{
  constructor(props)
  {
    super(props);
    this.state = {
      askDialogActive: false,
      appLoading: false
    };

    this.handleGuestOpen = this.handleGuestOpen.bind(this);
    this.handleToggleAskDialog = this.handleToggleAskDialog.bind(this);
    this.googleDenied = this.googleDenied.bind(this);
    this.googleResponse = this.googleResponse.bind(this);
    this.facebookResponse = this.facebookResponse.bind(this);
  }

  setAuthData(json)
  {
    if(json && json.access_token){
      CONFIG.state.user = json.user;
      CONFIG.state.auth = json.access_token;
      Cookies.set('auth', json.access_token, {
        path: '/',
        expires: 60 // days
      });
      browserHistory.push('/home');
    }
  }

  handleGuestOpen()
  {
    var comp = this;
    var req = CONFIG.api.authenticate;
    comp.setState({loaded: false});

    comp.getRequest = axios.post(req, {
      grant_type: 'guest',
      token: '',
      user: {},
      t: (new Date()).getTime()
    }).then(function(json)
    {
      comp.setAuthData(json.data);

    }).catch(function(json){
      ToastsAPI.toast('error', null, json.response.data.message, {timeOut:8000});
      comp.setState({loaded: true});
    });

    /*
    this.context.transitionRouter.show({
      pathname: '/games',
      state: {
        showTransition: {
          transitionName: 'show-fade',
          transitionEnterTimeout: 500,
          transitionLeaveTimeout: 300,
        },
        dismissTransition: {
          transitionName: 'dismiss-fade',
          transitionEnterTimeout: 500,
          transitionLeaveTimeout: 300,
        },
      },
    });
    */
    // browserHistory.push('/');
  }

  facebookResponse(response)
  {
    var comp = this;
    var req = CONFIG.api.authenticate;
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
      if(json.data && json.data.access_token){
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
    var req = CONFIG.api.authenticate;
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
      if(json.data && json.data.access_token){
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
      ToastsAPI.toast('error', null, 'Google connection error. Please try again.', {timeOut:8000});
    }
  }

  handleToggleAskDialog()
  {
    this.setState({askDialogActive: !this.state.askDialogActive});
  }

  render(){
    var comp = this;
    return (
      <div id="app-splash-intro" className="transition-item page-login page-wrap">
        <div id="app-splash-inner">

          <div id="app-logo"><img src="images/dtc-logo-transp-full.png" /></div>

          <div className="app-splash-actions-wrap">
            <LoadingInline active={comp.state.appLoading} />

            <div className="app-splash-actions" style={{opacity: (comp.state.appLoading===true ? '0' : '1')}}>
              <div className="app-splash-action">
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
              <div className="app-splash-action">
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
              <div className="app-splash-action"><button className="btn-login btn-login-guest" onClick={this.handleGuestOpen}>Continue as guest</button></div>
              <div className="app-splash-action"><button className="btn-login-link" onClick={this.handleToggleAskDialog}>Why am I being asked to sign in?</button></div>
            </div>

          </div>

        </div>

        <Dialog
          title="Why am I being asked to sign in?"
          type="large"
          onEscKeyDown={this.handleToggleAskDialog}
          onOverlayClick={this.handleToggleAskDialog}
          active={this.state.askDialogActive}
          actions={[
            {label: "Close", onClick: this.handleToggleAskDialog, primary: true, raised: true}
          ]}
        >
          <p>As a guest, you can still see games needing players! However, if you would like to reserve spots at tables or create your own table, you must use an account.</p>
          <p>Logging in helps hosts verify their players, and reduces system abuse.</p>
        </Dialog>
      </div>
    );
  }

};

export default SplashIntro;
