import CONFIG from '../config.jsx';
import axios from 'axios';
import React from 'react';
import {browserHistory} from 'react-router';
import {FontIcon, Dialog} from 'react-toolbox';
import {Button, IconButton} from 'react-toolbox/lib/button';
import {cloneDeep, slice} from 'lodash';
import {XmlEntities, AllHtmlEntities} from 'html-entities';
import moment from 'moment';

import {LoadingInline} from '../components/Loaders.jsx';
import ToastsAPI from '../components/ToastsAPI.jsx';
import GamePopup from '../components/GamePopup.jsx';

class TableList extends React.Component
{
  constructor(props)
  {
    super(props);
    var comp = this;

    this.state = {
      loaded: false,
      cancelDialogActive: false,
      bgg_id: this.props.params.bgg_id,
      table_type: this.props.params.type,
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
    axios.post(CONFIG.api.tableList, {
      bgg_id: comp.state.bgg_id,
      table_type: comp.state.table_type,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      comp.setState({
        loaded: true,
        tables: json.data.tables
      });
    }).catch(function(json){
      comp.setState({loaded: true});
      ToastsAPI.toast('error', null, 'Failed to get.', {timeOut:6000});
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


  handleJoinGame(table)
  {
    var comp = this;
    axios.post(CONFIG.api.joinTable, {
      table_id: table.table_id,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      ToastsAPI.toast('success', 'Joined game!', null, {timeout:6000});
      comp.getTableList();
    }).catch(function(json){
      ToastsAPI.toast('error', null, json.response.data.message, {timeOut:6000});
    });
  }

  handleLeaveGame(table)
  {
    var comp = this;
    axios.post(CONFIG.api.leaveTable, {
      table_id: table.table_id,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      ToastsAPI.toast('success', 'Left game table', null, {timeout:6000});
      comp.getTableList();
    }).catch(function(json){
      ToastsAPI.toast('error', null, json.response.data.message, {timeOut:6000});
    });
  }


  renderTableList()
  {
    var comp = this;

    return (
      <div className="table-list">
        <h2>Tables By Soonest</h2>
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
                  {table.table_type==='future' ? (<span className="table-item-tag">{moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss').format('ddd, M/D/Y, h:mm a')}</span>) : ''}
                  <span className="plan-tag">{table.table_location +' '+ (table.table_sublocation_alpha||'') + '-' + (table.table_sublocation_num||'')}</span>
                  <span className="table-item-tag">Takes {table.playtime ? table.playtime : Math.round((Math.round(table.avgplay/6)/10)*2)/2 + ' hours'}</span>
                  {table.table_type==='now' ? (
                    <span className="table-item-tag">Host: {table.host_name}</span>
                  ) : (
                    <span className="table-item-tag">{table.signups} of {table.seats} seats taken</span>
                  )}
                </div>
                {table.status === 'cancelled' ? '' : (
                  <div className="table-item-actions">
                    {table.table_type==='future' && table.player_id !== CONFIG.state.user.id && table.allow_signups!=1 ? (<button disabled>First Come (no sign up)</button>) : ''}
                    {table.table_type==='future' && table.player_id !== CONFIG.state.user.id && table.allow_signups==1 && table.joined<1 ? (<button onClick={comp.handleJoinGame.bind(comp, table)}>Join Game!</button>) : ''}
                    {table.table_type==='future' && table.player_id !== CONFIG.state.user.id && table.allow_signups==1 && table.joined>0 ? (<button className='leave' onClick={comp.handleLeaveGame.bind(comp, table)}>Leave</button>) : ''}
                    {table.table_type==='future' && table.allow_signups==1 ? (<button className="players" onClick={CONFIG.state.index.openTableDialog.bind(CONFIG.state.index, table.table_id)}>Players</button>) : ''}
                    {table.player_id == CONFIG.state.user.id ? (<button className='edit has-icon' onClick={()=>{browserHistory.push('/tables/edit/'+table.table_id)}}><FontIcon value='edit' /></button>) : ''}
                    {table.status!=='cancelled' ? <button className="edit has-icon" onClick={comp.handleLinkPopup.bind(comp, table.table_id)}><FontIcon value='link' /></button> : ''}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    );
  }

  renderNoTables()
  {
    return (
      <div className="game-search-list-empty"><h3>No tables found.</h3><p>Probably these games ended, or there was a bad search.</p></div>
    );
  }

  render()
  {
    var comp = this;
    return (
      <div id="page-list-tables" className="transition-item page-list-tables page-wrap">
        <div className={"table-list-wrap" + (comp.state.loaded ? " loading" : "")} style={{paddingTop: '0'}}>
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

export default TableList;
