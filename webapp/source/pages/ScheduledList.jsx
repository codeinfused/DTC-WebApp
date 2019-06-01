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

class ScheduledList extends React.Component
{
  constructor(props)
  {
    super(props);
    var comp = this;
    var mo = moment();
    var day = mo.format('YYYY-MM-DD');

    this.state = {
      loaded: false,
      currentDayObj: {},
      currentDayFull: day,
      tables: [],
      game_popup: false,
      link_popup: false
    };

    this.conDays = CONFIG.conDays;

    this.renderTableList = this.renderTableList.bind(this);
    this.renderNoTables = this.renderNoTables.bind(this);
    this.getTableList = this.getTableList.bind(this);
  }

  componentDidMount()
  {
    var comp = this;
    var selectedObj = comp.conDays.filter(function(item){ return item.full==comp.state.currentDayFull; });
    if(!selectedObj.length){ selectedObj = comp.conDays; }

    this.setState({
      currentDayFull: selectedObj[0].full
    });
    this.getTableList(selectedObj[0].full);
  }

  componentWillReceiveProps(nextProps)
  {

  }

  getTableList(fulldate)
  {
    var comp = this;
    comp.setState({loaded: false, currentDayFull: fulldate});
    axios.post(CONFIG.api.getSchedulesByDay, {
      date: fulldate,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      comp.setState({
        loaded: true,
        tables: json.data.tables,
        game_popup: false
      });
    }).catch(function(json){
      console.log(json);
      ToastsAPI.toast('error', null, 'Error getting tables list.', {timeOut:6000});
    });
  }

  handleSelectDay(day)
  {
    var comp = this;
    var selectedObj = comp.conDays.filter(function(item){ return item.full==day; });
    var date = selectedObj[0].full;

    comp.setState({currentDayFull: day}, function(){
      comp.getTableList(date);
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
      comp.getTableList(comp.state.currentDayFull);
    }).catch(function(json){
      ToastsAPI.toast('error', null, json.response.data.message, {timeOut:6000});
    });
  }

  handleJoinGame(table)
  {
    var comp = this;
    if(!CONFIG.state.auth || CONFIG.state.user.grant_type==='guest'){
      ToastsAPI.toast('error', "Sorry, guests can't reserve table spots.", null, {timeOut:8000});
      return;
    }

    axios.post(CONFIG.api.joinTable, {
      table_id: table.table_id,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      ToastsAPI.toast('success', 'Joined game!', null, {timeout:6000});
      comp.getTableList(comp.state.currentDayFull);
    }).catch(function(json){
      ToastsAPI.toast('error', null, json.response.data.message, {timeOut:6000});
    });
  }

  handleGamePopup(bgg_id, host_id)
  {
    var comp = this;
    comp.setState({
      game_popup: true,
      game_popup_id: bgg_id,
      game_host_id: host_id
    });
  }

  handleCloseGamePopup()
  {
    var comp = this;
    comp.setState({
      game_popup: false
    });
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

  onToggleIgnore(type, bad_player_id)
  {
    var comp = this;
    var tables = _.cloneDeep(comp.state.tables);

    var newtables = tables.map(function(g){
      if(g.player_id == bad_player_id){
        g.ignore = (type==='add');
      }
      return g;
    });
    comp.setState({tables: tables});
  }

  onToggleDNS(type, bgg_id)
  {
    var comp = this;
    var tables = _.cloneDeep(comp.state.tables);

    var newtables = tables.map(function(g){
      if(g.bgg_id == bgg_id){
        g.ignore = (type==='add');
      }
      return g;
    });
    comp.setState({tables: tables});
  }


  renderCalendar()
  {
    var comp = this;
    return comp.conDays.map(function(day, i){
      var isSel = day.full == comp.state.currentDayFull ? ' active' : '';
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
    var selectedObj = comp.conDays.filter(function(item){ return item.full==comp.state.currentDayFull; });

    var thisDayList = comp.state.tables.filter(function(table, i){
      var isSelected = moment(selectedObj[0].full, 'YYYY-MM-DD').isSame(moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss'), 'day');
      if(table.ignore){ isSelected = false; }
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
                <li key={"table-item-"+table.table_id} className={table.status+" "+(isMyTable?"mytable":table.joined==1?"joined":"")}>
                  <i className={table.status==='cancelled' ? "fa fa-calendar-times-o cancelled" : "fa "+calIcon}></i>
                  {table.lft=='1' ? (<i className="fa fa-graduation-cap"></i>) : ''}
                  <div className="plans-item">
                    <div className="plans-item-head"><a href="" onClick={(e)=>{comp.handleGamePopup(table.bgg_id, table.player_id); e.preventDefault();}}>{table.title}</a></div>
                    <div className="plans-item-body">
                      <p className="plans-time">{table.status==='cancelled' ? 'Cancelled' : moment(table.start_datetime).fromNow()}</p>
                      {/* <span className="plan-tag">{moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss').format('ddd, MMM Do YYYY, h:mm a')}</span> */}
                      <span className="plan-tag">{moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss').format('ddd, h:mm a')}</span>
                      <span className="plan-tag">Takes {table.playtime ? table.playtime : Math.round((Math.round(table.avgplay/6)/10)*2)/2 + ' hours'}</span>
                      <span className="plan-tag">{table.table_location +' '+ (table.table_sublocation_alpha||'') + '-' + (table.table_sublocation_num||'')}</span>
                      <span className={"plan-tag" + (isMyTable ? " hosting" : " otherhost")}>Host: {(isMyTable ? "Me" : table.host_name)}</span>
                      {table.only_experienced==1 ? (<span className="plan-tag experts">Experts</span>) : ''}
                      {table.allow_signups==1 ? (<span className="plan-tag">{table.signups} of {table.seats} seats taken</span>) : ''}
                    </div>
                    <div className="plans-btns">
                      {/* leave game, join game, see players, first come, edit */}
                      {table.player_id !== CONFIG.state.user.id && table.allow_signups!=1 ? (<button disabled>First Come (no sign up)</button>) : ''}
                      {table.player_id !== CONFIG.state.user.id && table.allow_signups==1 && table.joined==1 ? (<button className='leave' onClick={comp.handleLeaveGame.bind(comp, table)}>Leave</button>) : ''}
                      {table.player_id !== CONFIG.state.user.id && table.allow_signups==1 && table.joined<1 ? (<button className='join' onClick={comp.handleJoinGame.bind(comp, table)}>{+table.signups >= +table.seats ? 'Join Waitlist' : 'Join Game'}</button>) : ''}
                      {table.allow_signups==1 ? (<button className="players" onClick={CONFIG.state.index.openTableDialog.bind(CONFIG.state.index, table.table_id)}>Players</button>) : ''}
                      {table.player_id == CONFIG.state.user.id ? (<button className='edit has-icon' onClick={()=>{browserHistory.push('/tables/edit/'+table.table_id)}}><FontIcon value='edit' /></button>) : ''}
                      {table.status!=='cancelled' ? <button className="edit has-icon" onClick={comp.handleLinkPopup.bind(comp, table.table_id)}><FontIcon value='link' /></button> : ''}
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
      <div className="table-search-list-empty"><h3>No games listed.</h3><p>There are no games left planned for this day.</p></div>
    );
  }

  render()
  {
    var comp = this;
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
              host_id={comp.state.game_host_id}
              onToggleIgnore={comp.onToggleIgnore.bind(comp)}
              onToggleDNS={comp.onToggleDNS.bind(comp)}
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

export default ScheduledList;
