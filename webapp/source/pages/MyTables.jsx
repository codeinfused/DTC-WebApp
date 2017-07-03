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
      cancelDialogActive: false,
      currentTableId: -1,
      tables: []
    };

    this.renderTableList = this.renderTableList.bind(this);
    this.renderNoTables = this.renderNoTables.bind(this);
    this.getTableList = this.getTableList.bind(this);
    this.handleToggleCancel = this.handleToggleCancel.bind(this);
    this.deleteTable = this.deleteTable.bind(this);
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
    axios.post(CONFIG.api.myTables, {
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

  deleteTable()
  {
    var comp = this;
    axios.post(CONFIG.api.cancelTable, {
      table_id: comp.state.currentTableId,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      ToastsAPI.toast('success', 'Table cancelled.', null, {timeout:6000});
      comp.setState({cancelDialogActive: false});
      comp.getTableList();
    }).catch(function(json){
      ToastsAPI.toast('error', null, json.response.data.message, {timeOut:6000});
    });
  }

  handleConfirmCancel(table)
  {
    this.setState({
      currentTableId: table.table_id,
      cancelDialogActive: true
    })
  }

  handleToggleCancel(){ this.setState({cancelDialogActive: false}); }


  refreshTable(table)
  {
    var comp = this;
    axios.post(CONFIG.api.refreshTable, {
      table_id: table.table_id,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      ToastsAPI.toast('success', 'Table updated.', null, {timeout:6000});
      comp.getTableList();
    }).catch(function(json){
      ToastsAPI.toast('error', null, json.response.data.message, {timeOut:6000});
    });
  }

  viewPlayers(table)
  {

  }


  renderTableList()
  {
    var comp = this;

    return (
      <div className="table-list">
        <h2>My Tables</h2>
        <CSSTransitionGroup
          transitionName="router"
          transitionEnterTimeout={500}
          transitionLeaveTimeout={500}
        >
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
                  <span className="table-item-tag">{table.seats} seats</span>
                  <span className="table-item-tag">{table.table_location}</span>
                </div>
                {table.status === 'cancelled' ? '' : (
                  <div className="table-item-actions">
                    <button className='delete' onClick={comp.handleConfirmCancel.bind(comp, table)}><FontIcon value='close' /></button>
                    {table.table_type==='now' ? (
                      <button onClick={comp.refreshTable.bind(comp, table)}>Refresh this listing</button>
                    ) : (
                      <button onClick={comp.viewPlayers.bind(comp, table)}>View your players</button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </CSSTransitionGroup>
      </div>
    );
  }

  renderNoTables()
  {
    return (
      <div className="game-search-list-empty"><h3>No current tables.</h3><p>Either you haven't made any tables yet, or your other games have already happened.</p></div>
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

        <Dialog
          title="Cancel This Table?"
          type="small"
          onEscKeyDown={this.handleToggleCancel}
          onOverlayClick={this.handleToggleCancel}
          active={this.state.cancelDialogActive}
          actions={[
            {label: "Nevermind", onClick: this.handleToggleCancel, raised: true},
            {label: "Cancel It", onClick: this.deleteTable, primary: true, raised: true}
          ]}
        >
          <p>You cannot undo this action if you cancel this table. If players have signed up, they will see a status change.</p>
        </Dialog>
      </div>
    );
  }
}

export default MyTables;
