import CONFIG from '../config.jsx';
import axios from 'axios';
import React from 'react';
import {browserHistory} from 'react-router';
import {FontIcon} from 'react-toolbox';
import {Button, IconButton} from 'react-toolbox/lib/button';
import {LoadingInline} from '../components/Loaders.jsx';
import moment from 'moment';

class Home extends React.Component
{
  constructor(props)
  {
    super(props);
    this.state = {
      calls: {
        get: {
          url: CONFIG.bgg.url + CONFIG.bgg.hot
        }
      },
      top_wtp: [],
      top_played: [],
      my_plans: [],
      loader: false
    };
  }

  componentDidMount()
  {
    var comp = this;
    CONFIG.authPromise.then(function(){
      setTimeout(function(){
        comp.getHomeLists();
      }, 30);
    });
  }

  getHomeLists()
  {
    var comp = this;
    axios.post(CONFIG.api.homeLists, {
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      comp.setState({
        loaded: true,
        top_wtp: json.data.wtp.games,
        top_played: json.data.played.games,
        my_plans: json.data.plans.tables
      });
    }).catch(function(json){
      //ToastsAPI.toast('error', null, 'Error getting dashboard.', {timeOut:6000});
    });
  }

  openSearchPage()
  {
    CONFIG.state.searchDB = 'bgg';
    browserHistory.push('/games');
  }

  openPlansPage()
  {
    browserHistory.push('/myplans');
  }

  renderNoPlans()
  {
    return (
      <div className="table-search-list-empty"><h3>No plans yet.</h3><p>You can schedule games to play at the convention, and reserve a space at other player's tables! Go get started!</p></div>
    );
  }

  renderPlansList()
  {
    var comp = this;
    return (
      <div className="home-plans-list">
        {comp.state.my_plans.map(function(table, i)
        {
          return (
            <div className="table-item" key={"table-item-"+table.table_id}>
              <div className="table-item-header">
                <span className="table-item-title">{table.title}</span>
                <span className={"table-item-when " + table.status}>
                  {table.status === 'cancelled' ? 'Cancelled' : moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss').fromNow()}
                </span>
              </div>
              <div className="table-item-details">
                {table.private==1 ? (<span className="table-item-tag">Unlisted</span>) : (table.table_type==='future' ? (<span className="table-item-tag">{table.signups} of {table.seats} seats taken</span>) : '')}
                <span className="table-item-tag">{table.table_location +' '+ (table.table_sublocation_alpha||'') + '-' + (table.table_sublocation_num||'')}</span>
                {/* {table.table_type==='future' ? (<span className="table-item-tag">{moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss').format('ddd, MMM Do YYYY, h:mm a')}</span>) : ''} */}
              </div>
            </div>
          );
        })}
        <button className="home-plans-btn" onClick={comp.openPlansPage.bind(comp)}><FontIcon value='date_range' />View the rest of your plans</button>
      </div>
    );
  }

  render()
  {
    var comp = this;

    return (
      <div id="page-home" className="transition-item page-home page-wrap">
        <div className={"home-header" + (comp.state.loader ? " loading" : "")}>
          <div id="app-logo"><img src="images/dtc-logo-transp-full.png" /></div>
          <div className="my-profile">
            <img src={CONFIG.state.user && CONFIG.state.user.thumb ? CONFIG.state.user.thumb : '/images/profile-generic.jpg'} />
          </div>

          {/* <div className="home-action-wrap">
            <button className="btn-login btn-home-start-table" onClick={comp.openSearchPage.bind(comp)}>Start a Table Now!</button>
          </div> */}

          <div className="home-plans">
            <div className="home-plans-title">
              <h2>My Plans <span>Quick Look</span></h2>
            </div>
            {(comp.state.my_plans && comp.state.my_plans.length > 0) ? comp.renderPlansList() : comp.renderNoPlans()}
          </div>

          <div className="clearfix" style={{paddingBottom:'40px'}}>

            <div className="home-top-list home-top-wtp">
              <h2>Top Wanted Tables</h2>
              <ol>
                {comp.state.top_wtp.map(function(game, i)
                {
                  return (
                    <li className="home-list-item" key={"home-wtp-item-"+game.bgg_id}>
                      <span className="home-list-item-title">{game.title}</span>
                    </li>
                  );
                })}
              </ol>
            </div>
            <div className="home-top-list home-top-played">
              <h2>Top Games Played</h2>
              <ol>
                {comp.state.top_played.map(function(game, i)
                {
                  return (
                    <li className="home-list-item" key={"home-wtp-item-"+game.bgg_id}>
                      <span className="home-list-item-title">{game.title}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

          </div>

        </div>

        <LoadingInline
          active={comp.state.loader}
        />
      </div>
    );
  }

};

export default Home;
