import React from 'react';
import {browserHistory} from 'react-router';
import axios from 'axios';
import Cookies from 'js-cookie';
import {cloneDeep} from 'lodash';

import ToastsAPI from './components/ToastsAPI.jsx';

const CONFIG = {

  bgg: {
    search: baseAPI+"games/search/",
    game: baseAPI+"games/"
  },

  api: {
    url: baseAPI,
    authenticate: baseAPI+"authenticate",
    addAuth: baseAPI+"addauth",
    changeNotify: baseAPI+"user/setnotify",
    verify: baseAPI+"verifyauth",
    wtp: baseAPI+"user/me/wtp",
    notify: baseAPI+"user/me/notify",
    getAlerts: baseAPI+"user/getalerts",
    myAlertSettings: baseAPI+"user/myalertgames",

    getSchedulesByDay: baseAPI+"tables/byday",
    tableFullData: baseAPI+"table_data/",
    tableList: baseAPI+"tables/list",
    tableEdit: baseAPI+"tables/edit",
    myTables: baseAPI+"tables/mine",
    myPlans: baseAPI+"me/plans",
    cancelTable: baseAPI+"tables/cancel",
    refreshTable: baseAPI+"tables/refresh",
    joinTable: baseAPI+"tables/join",
    leaveTable: baseAPI+"tables/leave",
    lfp: baseAPI+"lfp"
  },

  checkAuth: function(context, loadVar)
  {
    var comp = this;
    var auth = Cookies.get('auth');
    if(!auth){
      comp.state.authenticated = false;
      setTimeout(function(){
        //context.setState({[loadVar]: true});
        if(window.location.search.match(/^\?code=/)){
          // response to facebook oauth
        }else{
          browserHistory.push('/');
        }
        context.setState({appLoaded: true});
      }, 50);
      return;
    }

    this.getRequest = axios.post(this.api.verify, {
      auth: auth,
      t: (new Date()).getTime()
    }).then(function(json)
    {
      comp.state.user = json.data;
      comp.state.authenticated = true;
      comp.state.auth = auth;
      context.setState({appLoaded: true});

      if(!!comp.state.user.allow_notifications){
        comp.checkNotificationPermission(false);
      }

      if(location.pathname === '/'){
        browserHistory.push('/home');
      }

      comp.state.index.getNewAlerts();

    }).catch(function(json){
      ToastsAPI.toast('error', null, json.response.data.message, {timeOut:6000});
      comp.state.authenticated = false;
      context.setState({appLoaded: true});
      browserHistory.push('/');
    });
  },

  checkApiResponse: function(json)
  {

  },


  handleChangeNotifications(val)
  {
    var comp = this;
    var req = comp.api.changeNotify;

    var getRequest = axios({
      method: 'post',
      url: req,
      responseType: 'json',
      data: {
        allow_notifications: val,
        t: (new Date()).getTime()
      },
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json)
    {
      comp.state.user.allow_notifications = val;
      if(val){ comp.checkNotificationPermission(true); }
    }).catch(function(json){
      ToastsAPI.toast('error', null, json.response.data.message, {timeOut:8000}); // json.response.data.message
    });
  },


  checkNotificationPermission(enabling)
  {
    var comp = this;
    //if (!"Notification" in window) {
    //ToastsAPI.toast('error', null, 'Your browser cannot send phone notifications.', {timeout:6000});
    if ('serviceWorker' in navigator && 'Notification' in window) {
      if (Notification.permission === 'granted'){
        navigator.serviceWorker.register('/sw.js').then(function(swReg) {
          //console.log('Service Worker is registered', swReg);
          comp.notifier = swReg;
          if(enabling===true){
            comp.sendNotification('DTC Notifications', "Notifications are enabled.");
          }
        }).catch(function(error) {
          //console.error('Service Worker Error', error);
        });
      }else{
        // notification not granted yet
        navigator.serviceWorker.register('/sw.js');
        Notification.requestPermission(function(result) {
          if (result === 'granted') {
            navigator.serviceWorker.ready.then(function(registration) {
              comp.notifier = registration;
              comp.sendNotification('DTC Notifications', "Notifications are enabled.");
            });
          }
        });
      }
    } else {
      //console.warn('Push messaging is not supported');
    }
  },


  sendNotification(title, message)
  {
    var comp = this;
    if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === "granted") {
      comp.notifier.showNotification(title, {
        body: message,
        icon: "/apple-touch-icon-192.png",
        vibrate: 400
      });
    }
  },

  phraseCapitalize: function(str)
  {
    return str
      .toLowerCase()
      .split(' ')
      .map(function(word) {
          return word[0].toUpperCase() + word.substr(1);
      })
      .join(' ')
    ;
  },

  // transitionIn: function(context, callback)
  // {
  //   context.setState({transition: 'in'}, function(){
  //     setTimeout(function(){
  //       context.setState({transition: 'in-anim'});
  //       setTimeout(callback, CONFIG.state.transitionTime);
  //     }, 20);
  //   });
  // },
  //
  // transitionOut: function(context, callback)
  // {
  //   context.setState({transition: 'out'}, function(){
  //     setTimeout(function(){
  //       context.setState({transition: 'out-anim'});
  //       setTimeout(callback, CONFIG.state.transitionTime);
  //     }, 20);
  //   });
  // },

  state: {
    index: {},
    transitionTime: 300,
    authenticated: false,
    auth: '',
    user: {},
    searchAction: '',
    searchDB: 'bgg',
    currentCreateGame: {},
    notifier: {}
  }

};

export default CONFIG;
