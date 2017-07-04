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
    verify: baseAPI+"verifyauth",
    wtp: baseAPI+"user/me/wtp",
    notify: baseAPI+"user/me/notify",

    tableList: baseAPI+"tables/list",
    tableEdit: baseAPI+"tables/edit",
    myTables: baseAPI+"tables/mine",
    myPlans: baseAPI+"me/plans",
    cancelTable: baseAPI+"tables/cancel",
    refreshTable: baseAPI+"tables/refresh",
    joinTable: baseAPI+"tables/join",
    leaveTable: baseAPI+"tables/leave"
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

      if(location.pathname === '/'){
        browserHistory.push('/home');
      }

    }).catch(function(json){
      ToastsAPI.toast('error', null, json.response.data.message, {timeOut:8000});
      comp.state.authenticated = false;
      context.setState({appLoaded: true});
      browserHistory.push('/');
    });
  },

  checkApiResponse: function(json)
  {

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
    transitionTime: 300,
    authenticated: false,
    auth: '',
    user: {},
    searchAction: '',
    searchDB: 'bgg',
    currentCreateGame: {}
  }

};

export default CONFIG;
