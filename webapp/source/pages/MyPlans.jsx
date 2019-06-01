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

import {XmlEntities, AllHtmlEntities} from 'html-entities';
const entities = {xml: new XmlEntities(), html: new AllHtmlEntities()};

class MyPlans extends React.Component
{
  constructor(props)
  {
    super(props);
    var comp = this;
    var mo = moment();
    var day = mo.format('YYYY-MM-DD');

    this.state = {
      loaded: false,
      currentDay: day,
      cancelDialogActive: false,
      currentTableId: -1,
      tables: [],
      game_popup: false,
      link_popup: false,
      event_popup: false
    };

    this.conDays = CONFIG.conDays;

    this.renderTableList = this.renderTableList.bind(this);
    this.renderNoTables = this.renderNoTables.bind(this);
    this.getTableList = this.getTableList.bind(this);
    this.handleToggleCancel = this.handleToggleCancel.bind(this);
    this.deleteTable = this.deleteTable.bind(this);
  }

  componentDidMount()
  {
    var comp = this;
    var selectedObj = comp.conDays.filter(function(item){ return item.full==comp.state.currentDay; });
    if(!selectedObj.length){ selectedObj = comp.conDays; }

    this.setState({
      currentDay: selectedObj[0].full
    });
    this.getTableList();
  }

  componentWillReceiveProps(nextProps)
  {

  }

  handleEventPopup(table)
  {
    var comp = this;
    comp.setState({
      event_popup: true,
      active_event: table
    });
  }

  handleCloseEventPopup()
  {
    var comp = this;
    comp.setState({
      event_popup: false
    });
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
    axios.post(CONFIG.api.myPlans, {
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      comp.setState({
        loaded: true,
        tables: json.data.tables
      });
    }).catch(function(json){
      ToastsAPI.toast('error', null, 'Error getting table list.', {timeOut:6000});
    });
  }

  handleSelectDay(day)
  {
    this.setState({currentDay: day});
  }

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
      ToastsAPI.toast('error', null, 'Error refreshing table.', {timeOut:6000});
    });
  }


  viewPlayers(table)
  {

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
      ToastsAPI.toast('error', null, 'Error leaving game.', {timeOut:6000});
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


  renderCalendar()
  {
    var comp = this;
    return comp.conDays.map(function(day, i){
      var isSel = day.full == comp.state.currentDay ? ' active' : '';
      return (
        <div className={"calendar-day" + isSel} key={"calendar-day-"+day.date} onClick={comp.handleSelectDay.bind(comp, day.full)}>
          <div className="calendar-day-inner">
            <span className="calendar-day-date">{day.date}</span>
            <span className="calendar-day-name">{day.name}</span>
          </div>
        </div>
      );
    });
  }


  renderTableList()
  {
    var comp = this;
    var selectedObj = comp.conDays.filter(function(item){ return item.full==comp.state.currentDay; });

    var thisDayList = comp.state.tables.filter(function(table, i){
      var isSelected = moment(selectedObj[0].full, 'YYYY-MM-DD').isSame(moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss'), 'day');
      return isSelected;
    });

    if(thisDayList.length < 1){
      return comp.renderNoTables();
    }else{
      return (
        <ul className="plans-timeline">
          {thisDayList.map(function(table, i)
          {
            var isMyTable = table.player_id === CONFIG.state.user.id;
            var calIcon = table.joined==1 ? "fa-calendar-check-o" : "fa-calendar-o";
            //var isSelected = moment(selectedObj[0].full, 'YYYY-MM-DD').isSame(moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss'), 'day');
            //if(isSelected){
              return (
                <li key={"table-item-"+table.table_id} className={table.table_type+" "+table.status+" "+(isMyTable?"mytable":table.joined==1?"joined":"")}>
                  <i className={table.status==='cancelled' ? "fa fa-calendar-times-o cancelled" : "fa "+calIcon}></i>
                  {table.lft=='1' ? (<i className="fa fa-graduation-cap"></i>) : ''}
                  <div className="plans-item">
                    <div className="plans-item-head"><a href="" onClick={(e)=>{if(table.bgg_id){comp.handleGamePopup(table.bgg_id);}else{comp.handleEventPopup(table);} e.preventDefault();}}>
                      {table.title ? table.title : table.event_title}
                    </a></div>
                    <div className="plans-item-body">
                      <p className="plans-time">{table.status==='cancelled' ? 'Cancelled' : moment(table.start_datetime).fromNow()}</p>
                      <span className="plan-tag">{moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss').format('ddd, h:mm a')}</span>
                      {!table.playtime && !table.avgplay ? '' : (<span className="plan-tag">Takes {table.playtime ? table.playtime : Math.round((Math.round(table.avgplay/6)/10)*2)/2 + ' hours'}</span>)}
                      <span className="plan-tag">{table.table_location + (table.table_sublocation_alpha ? (' ' + table.table_sublocation_alpha + '-' + table.table_sublocation_num) : '')}</span>
                      <span className={"plan-tag" + (isMyTable ? " hosting" : " otherhost")}>{(isMyTable ? (table.private==1?"Unlisted":"Host: Me") : "Host: "+(table.host ? table.host : table.host_name))}</span>
                      {table.allow_signups==1 && table.table_type!=='dtc-event' ? (<span className="plan-tag">{table.signups} of {table.seats} seats taken</span>) : table.table_type==='dtc_event' ? (<span className="plan-tag">Seats: {table.seats}</span>) : ''}
                      {table.only_experienced==1 ? (<span className="plan-tag experts">Experts</span>) : ''}
                    </div>
                    <div className="plans-btns">
                      {table.player_id === CONFIG.state.user.id ? (<button className='delete has-icon' onClick={comp.handleConfirmCancel.bind(comp, table)}><FontIcon value='close' /></button>) : ''}
                      {table.player_id !== CONFIG.state.user.id ? (<button onClick={comp.handleLeaveGame.bind(comp, table)}>Leave</button>) : ''}
                      {table.allow_signups==1 && table.table_type!=='dtc-event' ? (<button className="players" onClick={CONFIG.state.index.openTableDialog.bind(CONFIG.state.index, table.table_id)}>Players</button>) : ''}
                      {table.player_id === CONFIG.state.user.id ? (<button className='edit has-icon' onClick={()=>{browserHistory.push('/tables/edit/'+table.table_id)}}><FontIcon value='edit' /></button>) : ''}
                      {table.status!=='cancelled' && table.table_type!=='dtc-event' ? <button className="edit has-icon" onClick={comp.handleLinkPopup.bind(comp, table.table_id)}><FontIcon value='link' /></button> : ''}
                    </div>
                  </div>
                </li>
              );
            //}else{
              //return '';
            //}
          })}
        </ul>
      );
    } // end if
  }

  renderNoTables()
  {
    return (
      <div className="table-search-list-empty"><h3>No plans this day.</h3><p>Either you don't have plans for this day, or your other games have already happened.</p></div>
    );
  }

  render()
  {
    var comp = this;
    var table = comp.state.active_event;

    return (
      <div id="page-my-plans" className="transition-item page-my-plans page-wrap">

        <div className="calendar-days">{comp.renderCalendar()}</div>
        <div className={"table-list-wrap" + (comp.state.loaded ? " loading" : "")}>
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

        <Dialog
          className="event-popup"
          title=""
          type="normal"
          onEscKeyDown={comp.handleCloseEventPopup.bind(comp)}
          onOverlayClick={comp.handleCloseEventPopup.bind(comp)}
          active={comp.state.event_popup}
          actions={[
            {label: "Close", onClick: comp.handleCloseEventPopup.bind(comp), primary: true, raised: true}
          ]}
        >
          {comp.state.active_event ?
            <div className="dtc-event">
              <h2>{table.event_title}</h2>
              <div><span className="table-item-tag">Host: {table.host}</span></div>
              <div><span className="table-item-tag">{moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss').format('ddd, h:mm a')}</span><span className="table-item-tag">{table.table_location}</span></div>
              <div>{table.allow_signups==1 ? (<span className="plan-tag">Seats: {table.seats}</span>) : ''}{table.playtime && table.playtime!=='0' ? (<span className="plan-tag">Takes {table.playtime}</span>) : ''}</div>
              <div style={{marginTop: '10px'}}>{entities.html.decode(entities.xml.decode(table.description))}<p style={{fontStyle:'italic', color:'#aaa'}}><strong>Note:</strong> adding this to your plans does not gaurantee a seat at the event. Sign up at the DTC Headquarters table.</p></div>
            </div>
          : <div />}
        </Dialog>

      </div>
    );
  }
}

export default MyPlans;
