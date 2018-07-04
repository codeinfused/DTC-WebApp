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

class MyAlerts extends React.Component
{
  constructor(props)
  {
    super(props);
    var comp = this;

    this.state = {
      loaded: true,
      alerts: []
    };

    this.renderAlertList = this.renderAlertList.bind(this);
    this.getAlertList = this.getAlertList.bind(this);
    this.deleteAlert = this.deleteAlert.bind(this);
  }

  componentDidMount()
  {
    this.getAlertList();
  }

  componentWillReceiveProps(nextProps)
  {

  }

  getAlertList()
  {
    var comp = this;
    axios.post(CONFIG.api.getAllMyAlerts, {
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json)
    {
      comp.setState({
        loaded: true,
        alerts: json.data.alerts
      });
    }).catch(function(json){
      ToastsAPI.toast('error', null, 'Error getting list.', {timeOut:6000});
    });
  }

  deleteAlert(alert_id)
  {
    var comp = this;
    axios.post(CONFIG.api.cancelAlert, {
      alert_id: alert_id,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      //ToastsAPI.toast('success', 'Alert cancelled.', null, {timeout:6000});
      //comp.setState({cancelDialogActive: false});
      comp.getAlertList();
    }).catch(function(json){
      ToastsAPI.toast('error', null, json.response.data.message, {timeOut:6000});
    });
  }

  viewTable(table_id)
  {
    var comp = this;
    browserHistory.push('/list/table/'+table_id);
  }


  renderAlertList()
  {
    var comp = this;

    return (
      <div className="table-list" style={{padding:"0px"}}>
        <CSSTransitionGroup
          transitionName="router"
          transitionEnterTimeout={500}
          transitionLeaveTimeout={500}
        >
          {comp.state.alerts.map(function(alert, i)
          {
            return (
              <div className="table-item" key={"alert-item-"+alert.id}>
                <div className="table-item-header">
                  <span className="table-item-title">{alert.title}</span>
                  <span className={"table-item-when " + alert.notify_type}>
                    {alert.notify_type === 'cancel_table' ? 'Cancelled' : moment(alert.start_datetime, 'YYYY-MM-DD HH:mm:ss').fromNow()}
                  </span>
                </div>
                <div className="table-item-details">
                  <span className="table-item-tag">{alert.message}</span>
                </div>
                <div className="table-item-actions">
                  <button className='delete' onClick={comp.deleteAlert.bind(comp, alert.id)}><FontIcon value='close' /></button>
                  {alert.alert_type!=='cancel_table' ? (
                    <button onClick={comp.viewTable.bind(comp, alert.table_id)}>View Table</button>
                  ) : ''}
                </div>
              </div>
            );
          })}
        </CSSTransitionGroup>
      </div>
    );
  }

  render()
  {
    var comp = this;
    return (
      <div id="page-my-alerts" className="transition-item page-my-alerts page-wrap">

        <h2>Game Alerts</h2>
        <div className={"alert-list-wrap" + (comp.state.loader ? " loading" : "")}>
          {(comp.state.alerts && comp.state.alerts.length > 0) ? comp.renderAlertList() : <p>No new alerts on upcoming games yet.</p>}
        </div>

        <LoadingInline
          active={!comp.state.loaded}
        />

      </div>
    );
  }
}

export default MyAlerts;
