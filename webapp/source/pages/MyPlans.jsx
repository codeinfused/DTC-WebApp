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

    this.state = {
      loaded: false,
      currentDay: moment().date(),
      tables: []
    };

    this.conDays = [
      {full:'2017-07-04', date:'4', name:'Tue'},
      {full:'2017-07-05', date:'5', name:'Wed'},
      {full:'2017-07-06', date:'6', name:'Thu'},
      {full:'2017-07-07', date:'7', name:'Fri'},
      {full:'2017-07-08', date:'8', name:'Sat'},
      {full:'2017-07-09', date:'9', name:'Sun'},
    ];

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
      ToastsAPI.toast('error', null, json.response.data.message, {timeOut:6000});
    });
  }

  viewPlayers(table)
  {

  }


  renderCalendar()
  {
    var comp = this;
    return comp.conDays.map(function(day, i){
      var isSel = day.date === comp.state.currentDay ? ' active' : '';
      return (
        <div className={"calendar-day" + isSel} key={"calendar-day-"+day.date} onClick={comp.handleSelectDay.bind(comp, day.date)}>
          <span className="calendar-day-date">{day.date}</span>
          <span className="calendar-day-name">{day.name}</span>
        </div>
      );
    });
  }


  renderTableList()
  {
    var comp = this;

    return (
      <ul className="plans-timeline">
        <CSSTransitionGroup
          transitionName="router"
          transitionEnterTimeout={500}
          transitionLeaveTimeout={500}
        >
          {comp.state.tables.map(function(table, i)
          {
            return (
              <li key={"table-item-"+table.table_id} className={table.status}>
                <i className={table.status==='cancelled' ? "fa fa-calendar-times-o cancelled" : "fa fa-calendar-check-o"}></i> {/*  */}
                <div className="plans-item">
                  <div className="plans-item-head">{table.title}</div>
                  <div className="plans-item-body">
                    <p className="plans-time">{table.status==='cancelled' ? 'Cancelled' : moment(table.start_datetime).fromNow()}</p>
                    <span className="plan-tag">{moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss').format('ddd, MMM Do YYYY, h:mm a')}</span>
                    <span className="plan-tag">Room: {table.table_location}</span>
                    <span className={"plan-tag" + (table.player_id === CONFIG.state.user.id ? " hosting" : "")}>Host: {table.host_name}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </CSSTransitionGroup>
      </ul>




      //         <div className="table-item" key={"table-item-"+table.table_id}>
      //           <div className="table-item-header">
      //             <span className="table-item-title">{table.title}</span>
      //             <span className={"table-item-when " + table.status}>
      //               {table.status === 'cancelled' ? 'Cancelled' : moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss').fromNow()}
      //             </span>
      //           </div>
      //           <div className="table-item-details">
      //             <span className="table-item-tag">{table.seats} seats</span>
      //             <span className="table-item-tag">{table.table_location}</span>
      //           </div>
      //           {table.status === 'cancelled' ? '' : (
      //             <div className="table-item-actions">
      //               <button className='delete' onClick={comp.handleConfirmCancel.bind(comp, table)}><FontIcon value='close' /></button>
      //               {table.table_type==='now' ? (
      //                 <button onClick={comp.refreshTable.bind(comp, table)}>Refresh this listing</button>
      //               ) : (
      //                 <button onClick={comp.viewPlayers.bind(comp, table)}>View your players</button>
      //               )}
      //             </div>
      //           )}
      //         </div>
      //       );
      //     })}
      //   </CSSTransitionGroup>
      // </div>
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
