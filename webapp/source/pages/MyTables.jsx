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
import GamePopup from '../components/GamePopup.jsx';

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
      tables: [],
      game_popup: false,
      link_popup: false
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

  handleGamePopup(bgg_id)
  {
    var comp = this;
    comp.setState({
      game_popup: true,
      game_popup_id: bgg_id
    });
  }

  handleCloseGamePopup()
  {
    var comp = this;
    comp.setState({
      game_popup: false
    })
  }

  handleLinkPopup(table_id)
  {
    var comp = this;
    comp.setState({
      link_popup: window.location.origin+'/list/table/'+table_id
    });
  }

  handleCloseLinkPopup()
  {
    var comp = this;
    comp.setState({
      link_popup: false
    });
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
      ToastsAPI.toast('error', null, 'Error getting tables list.', {timeOut:6000});
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
                  <span className="table-item-title"><a href="" onClick={(e)=>{comp.handleGamePopup(table.bgg_id); e.preventDefault();}}>{table.title}</a></span>
                  <span className={"table-item-when " + table.status}>
                    {table.status === 'cancelled' ? 'Cancelled' : moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss').fromNow()}
                  </span>
                </div>
                <div className="table-item-details">
                  {table.private==1 ? (<span className="table-item-tag">Unlisted Table</span>) : ''}
                  {table.table_type==='future' && table.private!=1 ? (<span className="table-item-tag">{table.signups} of {table.seats} seats taken</span>) : ''}
                  <span className="table-item-tag">{table.table_location +' '+ (table.table_sublocation_alpha||'') + '-' + (table.table_sublocation_num||'')}</span>
                  {table.table_type==='future' ? (<span className="table-item-tag">{moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss').format('ddd, MMM Do YYYY, h:mm a')}</span>) : ''}
                </div>
                {table.status === 'cancelled' ? '' : (
                  <div className="table-item-actions">
                    <button className='delete has-icon' onClick={comp.handleConfirmCancel.bind(comp, table)}><FontIcon value='close' /></button>
                    <button className='edit has-icon' onClick={()=>{browserHistory.push('/tables/edit/'+table.table_id)}}><FontIcon value='edit' /></button>
                    {table.status!=='cancelled' ? <button className="edit has-icon" onClick={comp.handleLinkPopup.bind(comp, table.table_id)}><FontIcon value='link' /></button> : ''}
                    {table.table_type==='now' ? (
                      <button onClick={comp.refreshTable.bind(comp, table)}>Renew</button>
                    ) : (
                      table.allow_signups==1 ? (<button className="players" onClick={CONFIG.state.index.openTableDialog.bind(CONFIG.state.index, table.table_id)}>Players</button>) : ''
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
      <div className="table-search-list-empty"><h3>No hosted tables.</h3><p>Either you haven't made any tables yet, or your other games have already happened.</p></div>
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

        <Dialog
          className="game-popup"
          title=""
          type="normal"
          onEscKeyDown={comp.handleCloseGamePopup.bind(comp)}
          onOverlayClick={comp.handleCloseGamePopup.bind(comp)}
          active={comp.state.game_popup}
          actions={[
            {label: "Close", onClick: comp.handleCloseGamePopup.bind(comp), primary: true, raised: true}
          ]}
        >
          {comp.state.game_popup ?
            <GamePopup
              bgg_id={comp.state.game_popup_id}
            />
          : <div />}
        </Dialog>

        <Dialog
          className="link-popup"
          title=""
          type="small"
          onEscKeyDown={comp.handleCloseLinkPopup.bind(comp)}
          onOverlayClick={comp.handleCloseLinkPopup.bind(comp)}
          active={comp.state.link_popup!==false}
          actions={[
            {label: "Close", onClick: comp.handleCloseLinkPopup.bind(comp), primary: true, raised: true}
          ]}
        >
          <a href={comp.state.link_popup}>{comp.state.link_popup}</a>
        </Dialog>

      </div>
    );
  }
}

export default MyTables;
