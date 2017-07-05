import CONFIG from '../config.jsx';
import axios from 'axios';
import React from 'react';
import {browserHistory} from 'react-router';
import {FontIcon, Dialog} from 'react-toolbox';
import {Button, IconButton} from 'react-toolbox/lib/button';
import {CSSTransitionGroup} from 'react-transition-group';
import {cloneDeep, slice} from 'lodash';
import moment from 'moment';

import {LoadingInline} from '../components/Loaders.jsx';
import ToastsAPI from '../components/ToastsAPI.jsx';

class MyTables extends React.Component
{
  constructor(props)
  {
    super(props);
    var comp = this;

    this.state = {
      loaded: false,
      tables: []
    };

    this.renderTableList = this.renderTableList.bind(this);
    this.renderNoTables = this.renderNoTables.bind(this);
    this.getTableList = this.getTableList.bind(this);
  }

  componentDidMount()
  {
    this.getTableList();
  }

  componentWillReceiveProps(nextProps)
  {

  }

  getTableList()
  {
    var comp = this;
    axios.post(CONFIG.api.lfp, {
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      comp.setState({
        loaded: true,
        tables: json.data.tables
      });
    }).catch(function(json){
      ToastsAPI.toast('error', null, 'Failed to set.', {timeOut:6000});
    });
  }


  renderTableList()
  {
    var comp = this;

    return (
      <div className="table-list">
        <h2>Players Wanted For:</h2>
          {comp.state.tables.map(function(table, i)
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
                  {table.table_type==='future' ? (<span className="table-item-tag">{table.signups} of {table.seats} seats taken</span>) : ''}
                  <span className="table-item-tag">{table.table_location +' '+ (table.table_sublocation_alpha||'') + '-' + (table.table_sublocation_num||'')}</span>
                  {table.table_type==='future' ? (<span className="table-item-tag">{moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss').format('ddd, MMM Do YYYY, h:mm a')}</span>) : ''}
                  <span className="table-item-tag">Host: {table.host_name}</span>
                </div>
              </div>
            );
          })}
      </div>
    );
  }

  renderNoTables()
  {
    return (
      <div className="game-search-list-empty"><h3>No tables found.</h3><p>Start up one! Pick up a game at the library, grab a "Players Wanted" sign, and post your table in the app!</p></div>
    );
  }

  render()
  {
    var comp = this;
    return (
      <div id="page-my-tables" className="transition-item page-my-tables page-wrap">
        <div className={"table-list-wrap" + (comp.state.loader ? " loading" : "")}>
          {(comp.state.tables && comp.state.tables.length > 0) ? comp.renderTableList() : comp.renderNoTables()}
        </div>

        <LoadingInline
          active={!comp.state.loaded}
        />
      </div>
    );
  }
}

export default MyTables;
