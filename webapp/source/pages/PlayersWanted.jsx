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

class PlayersWanted extends React.Component
{
  constructor(props)
  {
    super(props);
    var comp = this;

    this.state = {
      loaded: false,
      tables: [],
      game_popup: false
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
    })
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
      ToastsAPI.toast('error', null, 'Error getting table list.', {timeOut:6000});
    });
  }


  renderTableList()
  {
    var comp = this;

    return (
      <div className="table-list">
        <h2>Players Wanted Signs:</h2>
          {comp.state.tables.map(function(table, i)
          {
            return (
              <div className="table-item" key={"table-item-"+table.table_id}>
                <div className="table-item-header">
                  <span className="table-item-title"><a href="" onClick={(e)=>{comp.handleGamePopup(table.bgg_id, table.player_id); e.preventDefault();}}>{table.title}</a></span>
                  <span className={"table-item-when " + table.status}>
                    {table.status === 'cancelled' ? 'Cancelled' : moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss').fromNow()}
                  </span>
                </div>
                <div className="table-item-details">
                  {table.table_type==='future' ? (<span className="table-item-tag">{table.signups} of {table.seats} seats taken</span>) : ''}
                  <span className="plan-tag">{table.table_location +' '+ (table.table_sublocation_alpha||'') + '-' + (table.table_sublocation_num||'')}</span>
                  {table.table_type==='future' ? (<span className="table-item-tag">{moment(table.start_datetime, 'YYYY-MM-DD HH:mm:ss').format('ddd, MMM Do YYYY, h:mm a')}</span>) : ''}
                  <span className="table-item-tag">Takes {table.playtime ? table.playtime : Math.round((Math.round(table.avgplay/6)/10)*2)/2 + ' hours'}</span>
                  <div></div>
                  <span className="table-item-tag">Host: {table.host_name}</span>
                  {table.lft=='1' ? (<span className="table-item-tag">Teacher Needed</span>) : ''}
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
      <div className="game-search-list-empty">
        <h3>No tables waiting.</h3><p>Start up one! Pick up a game at the library, grab a "Players Wanted" sign, and post your table in the app!</p>
      </div>
    );
  }

  render()
  {
    var comp = this;
    return (
      <div id="page-my-tables" className="transition-item page-my-tables page-wrap">
        <div className={"table-list-wrap" + (comp.state.loader ? " loading" : "")} style={{paddingTop: '0'}}>
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

      </div>
    );
  }
}

export default PlayersWanted;
