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
      tables: []
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
                <li key={"table-item-"+table.table_id} className={table.status+" "+(isMyTable?"mytable":"")}>
                  <i className={table.status==='cancelled' ? "fa fa-calendar-times-o cancelled" : "fa "+calIcon}></i>
                  {table.lft=='1' ? (<i className="fa fa-graduation-cap"></i>) : ''}
                  <div className="plans-item">
                    <div className="plans-item-head">{table.title}</div>
                    <div className="plans-item-body">
                      <p className="plans-time">{table.status==='cancelled' ? 'Cancelled' : moment(table.start_datetime).fromNow()}</p>
                      <span className="plan-tag">{moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss').format('ddd, MMM Do YYYY, h:mm a')}</span>
                      <span className="plan-tag">{table.table_location +' '+ (table.table_sublocation_alpha||'') + '-' + (table.table_sublocation_num||'')}</span>
                      <span className={"plan-tag" + (isMyTable ? " hosting" : "")}>Host: {(isMyTable ? "Me" : table.host_name)}</span>
                      {table.allow_signups==1 ? (<span className="plan-tag">{table.signups} of {table.seats} seats taken</span>) : ''}
                    </div>
                    <div className="plans-btns">
                      {table.player_id === CONFIG.state.user.id ? (<button className='delete' onClick={comp.handleConfirmCancel.bind(comp, table)}><FontIcon value='close' /></button>) : ''}
                      {table.player_id !== CONFIG.state.user.id ? (<button onClick={comp.handleLeaveGame.bind(comp, table)}>Leave Game</button>) : ''}
                      {table.allow_signups==1 ? (<button className="players" onClick={CONFIG.state.index.openTableDialog.bind(CONFIG.state.index, table.table_id)}>See Players</button>) : ''}
                      {table.player_id === CONFIG.state.user.id ? (<button className='edit' onClick={()=>{browserHistory.push('/tables/edit/'+table.table_id)}}>Edit</button>) : ''}
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

      </div>
    );
  }
}

export default MyPlans;
