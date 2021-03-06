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

  conDays: [
    {full:'2019-07-03', date:'3', name:'Wed'},
    {full:'2019-07-04', date:'4', name:'Thu'},
    {full:'2019-07-05', date:'5', name:'Fri'},
    {full:'2019-07-06', date:'6', name:'Sat'},
    {full:'2019-07-07', date:'7', name:'Sun'}
  ],

  api: {
    url: baseAPI,
    authenticate: baseAPI+"authenticate",
    addAuth: baseAPI+"addauth",
    changeNotify: baseAPI+"user/setnotify",
    verify: baseAPI+"verifyauth",
    wtp: baseAPI+"user/me/wtp",
    notify: baseAPI+"user/me/notify",
    dns: baseAPI+"user/me/dns",
    ignore: baseAPI+"user/me/ignore",

    getAlerts: baseAPI+"user/getalerts",
    getAllMyAlerts: baseAPI+"user/getallmyalerts",
    myAlertSettings: baseAPI+"user/myalertgames",
    cancelAlert: baseAPI+"user/cancelalert",

    tablePlayers: baseAPI+"tables/players",
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
    lfp: baseAPI+"lfp",

    getEventsByDay: baseAPI+"events/byday",

    homeLists: baseAPI+"lists/top_home"
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

    return axios.post(this.api.verify, {
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

      setTimeout(function(){
        comp.state.index.getNewAlerts();
      }, 6000);

    }).catch(function(json){
      var err = json.response ? json.response.data.message : "Could not restore session.";
      ToastsAPI.toast('error', null, err, {timeOut:6000});
      comp.state.authenticated = false;
      context.setState({appLoaded: true});
      browserHistory.push('/');
    });
  },

  handleLogout: function()
  {
    Cookies.remove('auth');
    Cookies.remove('PHPSESSID');
    Cookies.remove();
    window.location.reload();
  },

  checkApiResponse: function(json)
  {

  },


  initNotifications()
  {
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('/sw.js');
    }
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
    if ('serviceWorker' in navigator && 'Notification' in window) {
      if (Notification.permission === 'granted'){
        if(enabling===true){
          comp.sendNotification({}, 'Dice Tower Alerts', "Game alerts are enabled!");
        }
      }else{
        // notification not granted yet
        Notification.requestPermission(function(result) {
          if (result === 'granted') {
            comp.checkNotificationPermission(enabling);
          }
        });
      }
    } else {
      console.warn('Push messaging is not supported');
    }
  },

  sendNotification(obj, title, message)
  {
    var comp = this;
    console.log(arguments, Notification.permission, navigator.serviceWorker);
    if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === "granted") {
    //if ('Notification' in window && Notification.permission === "granted") {
      navigator.serviceWorker.ready.then(function(registration) {
        console.log(registration);
        registration.showNotification(title, {
          icon: "/apple-touch-icon-192.png",
          body: message,
          vibrate: 400,
          data: {
            reference_id: obj.reference_id,
            reference_type: obj.reference_type,
            notify_type: obj.notify_type
          }
        });
      });

      // var notification = new Notification(title, {
      //   icon: "/apple-touch-icon-192.png",
      //   body: message,
      //   vibrate: 400
      // });
      // notification.onclick = function(e){
      //   if(obj && obj.reference_type==='table'){
      //     window.location = '/list/table/' + obj.reference_id;
      //   }
      //   notification.close();
      // };
    }

    /*
    navigator.serviceWorker.register('sw.js');
    Notification.requestPermission(function(result) {
      if (result === 'granted') {
        navigator.serviceWorker.ready.then(function(registration) {
          registration.showNotification('Notification with ServiceWorker');
        });
      }
    });
    */
  },

  // checkNotificationPermission(enabling)
  // {
  //   var comp = this;
  //   //if (!"Notification" in window) {
  //   //ToastsAPI.toast('error', null, 'Your browser cannot send phone notifications.', {timeout:6000});
  //   if ('serviceWorker' in navigator && 'Notification' in window) {
  //     if (Notification.permission === 'granted'){
  //       navigator.serviceWorker.register('/sw.js').then(function(swReg) {
  //         //console.log('Service Worker is registered', swReg);
  //         comp.notifier = swReg;
  //         if(enabling===true){
  //           comp.sendNotification('DTC Notifications', "Notifications are enabled.");
  //         }
  //       }).catch(function(error) {
  //         //console.error('Service Worker Error', error);
  //       });
  //     }else{
  //       // notification not granted yet
  //       navigator.serviceWorker.register('/sw.js');
  //       Notification.requestPermission(function(result) {
  //         if (result === 'granted') {
  //           navigator.serviceWorker.ready.then(function(registration) {
  //             comp.notifier = registration;
  //             comp.sendNotification('DTC Notifications', "Notifications are enabled.");
  //           });
  //         }
  //       });
  //     }
  //   } else {
  //     //console.warn('Push messaging is not supported');
  //   }
  // },
  //

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
    baseUrl: window.location.origin,
    index: {},
    transitionTime: 300,
    authenticated: false,
    auth: '',
    authPromise: false,
    user: {},
    searchAction: '',
    searchDB: 'bgg',
    currentCreateGame: {},
    notifier: {}
  }

};

export default CONFIG;
