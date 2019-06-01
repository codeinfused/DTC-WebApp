import CONFIG from '../config.jsx';
import axios from 'axios';
import React from 'react';
import {browserHistory} from 'react-router';
import {Dialog, FontIcon, Input, DatePicker, TimePicker, Slider, Switch, Dropdown, RadioGroup, RadioButton, Tab, Tabs} from 'react-toolbox';
import {Button, IconButton} from 'react-toolbox/lib/button';
import {cloneDeep, slice} from 'lodash';
import {XmlEntities, AllHtmlEntities} from 'html-entities';
import moment from 'moment';

import {LoadingInline} from '../components/Loaders.jsx';
import ToastsAPI from '../components/ToastsAPI.jsx';
import MapPopup from '../components/MapPopup.jsx';

const entities = {xml: new XmlEntities(), html: new AllHtmlEntities()};

function MomentRound(date, duration, method) {
  return moment(Math[method]((+date) / (+duration)) * (+duration));
}

class TableEdit extends React.Component
{
  constructor(props)
  {
    super(props);
    var comp = this;
    var action = false;

    this.dateRange = [
      '2019-07-03 08:00:00',
      '2019-07-07 23:00:00'
    ];

    this.sublocs_alpha = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V'];
    this.sublocs_num = Array.apply(null, {length: 36}).map(Number.call, Number);
    this.sublocs_num = this.sublocs_num.slice(1);

    this.tableTypes = [
      {id: 'now', name: 'Play Now!'},
      {id: 'later', name: 'Schedule Later'},
      {id: 'demo', name: 'Demo'}
    ];

    this.tableLocations = [
      {label: 'Grand Sierra Ballroom (Open)', value: 'Grand Sierra Ballroom'},
      {label: 'Hall Foyer (Open)', value: 'Hall Foyer'},
      {label: 'Curaco (RPGs, War Games, Kids)', value: 'Curaco'},
      {label: 'Bonaire (Demos and Events)', value: 'Bonaire'},
      {label: 'Caribbean (Exhibitor Events)', value: 'Caribbean Ballroom' }
    ];

    this.playtimeOptions = [
      {label: 'Auto', value: ''},
      {label: '30 (half hour)', value: '0.5 hour'},
      {label: '60 (1 hour)', value: '1 hour'},
      {label: '90 (1½ hours)', value: '1.5 hours'},
      {label: '120 (2 hours)', value: '2 hours'},
      {label: '150 (2½ hours)', value: '2.5 hours'},
      {label: '180 (3 hours)', value: '3 hours'},
      {label: '240 (4 hours)', value: '4 hours'},
      {label: '300 (5+ hours)', value: '5+ hours'},
    ];

    this.reservedPlayers = [
      {label: 'None', value: ''},
      {label: '1 player', value: '1'},
      {label: '2 players', value: '2'},
      {label: '3 players', value: '3'},
      {label: '4 players', value: '4'},
      {label: '5 players', value: '5'},
    ];

    var mToday = moment();
    var defaultDate = moment.max(mToday, moment(this.dateRange[0]));
    defaultDate = moment.min(defaultDate, moment(this.dateRange[1]));

    this.state = {
      mountType: this.checkMountType(props),
      loaded: false,
      dialogActive: false,
      table_id: this.props.params.table_id,
      bgg_id: this.props.params.bgg_id,
      game: {},
      seats: 2,
      playtime: null,
      //game_type: 'normal',
      table_type: 'now',
      table_location: 'Grand Sierra Ballroom',
      table_sublocation_alpha: 'A',
      table_sublocation_num: '1',
      start_datetime: '',
      start_date: defaultDate.toDate(),
      start_time: MomentRound(defaultDate, moment.duration(15, "minutes"), "round").toDate(),
      lfp: true,
      lft: false,
      only_experienced: false,
      joined: true,
      reserved: 0,
      allow_signups: true,
      private: false
    };

    var d = moment(this.state.start_date);
    var t = moment(this.state.start_time);
    var tRounded = MomentRound(t, moment.duration(15, "minutes"), "round");
    this.state.start_datetime = d.format('YYYY-MM-DD') +' '+ tRounded.format('HH:mm:00');

    this.getGameData = this.getGameData.bind(this);
    this.handleSubmitTable = this.handleSubmitTable.bind(this);
    this.handleCloseDialog = this.handleCloseDialog.bind(this);
  }

  componentDidMount()
  {
    var comp = this;
    //moment.relativeTimeRounding(Math.floor);
    //moment.relativeTimeThreshold('m', 15);

    if(!CONFIG.state.auth || CONFIG.state.user.grant_type==='guest'){
      ToastsAPI.toast('error', "Sorry, guests can't create tables.", null, {timeOut:8000});
      browserHistory.goBack();
      return;
    }
    if(this.props.params.bgg_id){
      this.getGameData(this.props.params.bgg_id);
    }else if(this.props.params.table_id){
      this.getTableData(this.props.params.table_id);
    }
  }

  componentWillReceiveProps(nextProps)
  {
    var comp = this;
    var newMountType = comp.checkMountType(nextProps);
    if(
      comp.state.mountType !== newMountType
    ){
      comp.setState({
        mountType: newMountType
      });
    }
  }

  checkMountType(props)
  {
    if(props.params.bgg_id){
      return 'create';
    }else if(props.params.table_id){
      return 'edit';
    }else{
      browserHistory.push('/games');
      ToastsAPI.toast('error', 'Invalid Table.', null, {timeOut:8000});
      return false;
    }
  }

  getGameData(bgg_id)
  {
    var comp = this;
    comp.setState({loaded: false});
    axios.get(CONFIG.bgg.game + bgg_id, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      comp.setState({loaded: true, game: json.data.game});
    }).catch(function(json){
      //ToastsAPI.toast('error', null, '', {timeOut:8000});
      //comp.setState({loaded: true});
    });
  }

  getTableData(table_id)
  {
    var comp = this;
    var curState = _.cloneDeep(comp.state);
    comp.setState({loaded: false});

    axios.get(CONFIG.api.tableFullData + table_id, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      if(json.data.table){
        if(json.data.table.player_id !== CONFIG.state.user.id){
          ToastsAPI.toast('error', "You do not own this table.", null, {timeOut:6000});
          browserHistory.push('/home');
        }
        var newState = Object.assign({}, curState, json.data.table);
        newState.loaded = true;
        if(newState.start_datetime){
          var d = moment(newState.start_datetime);
          var d_obj = d.toDate();
          newState.start_date = d_obj;
          newState.start_time = d_obj;
        }
        comp.setState(newState);
      }
    }).catch(function(json){
      //ToastsAPI.toast('error', null, '', {timeOut:8000});
      //comp.setState({loaded: true});
    });
  }

  handleChangeInput(field, value)
  {
    this.setState({[field]: value});
  }

  handleChangeSelect(field, value)
  {
    this.setState({[field]: value.target.value});
  }

  splitDateTime(val)
  {
    var comp = this;
    var d = moment(d);
    //var start_date = d.format('YYYY-MM-DD');
    //var start_time = d.format('HH:mm:00');
    var dRounded = MomentRound(d, moment.duration(15, "minutes"), "ceil");
    var d_obj = dRounded.toDate();

    comp.setState({
      start_date: d_obj,
      start_time: d_obj
    });
  }

  handleChangeDatetime(field, value)
  {
    var comp = this;
    var state = _.cloneDeep(comp.state);
    state[field] = value;
    var d = moment(state.start_date);
    var t = moment(state.start_time);
    var tRounded = MomentRound(t, moment.duration(15, "minutes"), "round");

    if(field==='start_time'){
      value = tRounded.toDate();
    }

    var start_datetime = d.format('YYYY-MM-DD') +' '+ tRounded.format('HH:mm:00');

    comp.setState({
      [field]: value,
      start_datetime: start_datetime
    });
  }

  handleSubmitTable(evt)
  {
    var comp = this;
    evt.preventDefault();
    comp.setState({loaded: false});
    axios.post(CONFIG.api.tableEdit, {
      table_id: comp.state.table_id,
      bgg_id: comp.state.bgg_id,
      start_datetime: comp.state.start_datetime,
      seats: comp.state.seats,
      table_location: comp.state.table_location,
      table_type: comp.state.table_type,
      playtime: (comp.state.playtime == '' ? null : comp.state.playtime),
      //game_type: comp.state.game_type,
      lft: comp.state.lft,
      only_experienced: comp.state.only_experienced,
      private: comp.state.private,
      joined: comp.state.joined,
      reserved: comp.state.reserved,
      allow_signups: comp.state.allow_signups,
      table_sublocation_alpha: comp.state.table_sublocation_alpha,
      table_sublocation_num: comp.state.table_sublocation_num
    },{
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      comp.setState({loaded: true, dialogActive: true});
    }).catch(function(json){
      ToastsAPI.toast('error', 'Error creating table.', null, {timeOut:8000});
      comp.setState({loaded: true});
    });
  }

  handleCloseDialog()
  {
    this.setState({dialogActive: false});
    browserHistory.goBack();
  }

  renderReservedSpots()
  {
    var comp = this;
    var seats = comp.state.seats;
    var joined = comp.state.joined===true ? 1 : 0;

    return comp.reservedPlayers.filter(function(obj, i){
      if( i < seats - joined ){ return obj; }
    });
  }

  render()
  {
    var comp = this;
    return (
      <div id="page-table-edit" className="transition-item page-table-edit page-wrap">
        {!comp.state.loaded ? (
          <LoadingInline active={!comp.state.loaded} />
        ) : (
          <div className="page-table-edit-wrap">
            <h1>{comp.state.mountType==='create' ? 'New Table' : 'Table Editor'}</h1>
            <div className="my-profile">
              <img src={CONFIG.state.user.thumb ? CONFIG.state.user.thumb : '/images/profile-generic.jpg'} />
            </div>
            <form onSubmit={comp.handleSubmitTable}>
              <div className="table-game-details">
                {comp.state.game.title}
              </div>
              <div className="table-form-item">
                {/* <RadioGroup name='table_type' value={comp.state.table_type} onChange={comp.handleChangeInput.bind(comp, 'table_type')}>
                  <RadioButton label='Looking Now' value='now' /><RadioButton label='Scheduled' value='future' />
                </RadioGroup> */}
                {/* <Dropdown label='Schedule' source={[{label:'Now', value:'now'}, {label:'Later', value:'future'}]} value={comp.state.table_type} onChange={comp.handleChangeInput.bind(comp, 'table_type')} /> */}
                <fieldset>
                  <legend>Type of Table</legend>
                  <div className="switch-toggle switch-candy large-4">
                    <input id='type-now' name="table_type" type="radio" value='now' checked={comp.state.table_type==='now'} onChange={comp.handleChangeInput.bind(comp, 'table_type', 'now')} />
                    <label htmlFor='type-now'>Play Right Now</label>
                    <input id='type-later' name="table_type" type="radio" value='future' checked={comp.state.table_type==='future'} onChange={comp.handleChangeInput.bind(comp, 'table_type', 'future')} />
                    <label htmlFor='type-later'>Schedule Later</label>
                    <a></a>
                  </div>
                </fieldset>
              </div>
              {comp.state.table_type==='now' ? '' : (
                <div>
                  <div className="table-form-item">
                    <DatePicker label='Day' autoOk sundayFirstDayOfWeek minDate={moment(comp.dateRange[0], 'YYYY-MM-DD').toDate()} maxDate={moment(comp.dateRange[1], 'YYYY-MM-DD').toDate()}
                      value={comp.state.start_date} onChange={comp.handleChangeDatetime.bind(comp, 'start_date')}
                    />
                  </div>
                  <div className="table-form-item">
                    <TimePicker label='Time' format='ampm'
                      value={comp.state.start_time} onChange={comp.handleChangeDatetime.bind(comp, 'start_time')}
                    />
                  </div>
                </div>
              )}
              <div className="table-form-item">
                <Dropdown label='Room Location' source={comp.tableLocations} value={comp.state.table_location} onChange={comp.handleChangeInput.bind(comp, 'table_location')} />
                <select className="sublocation_alpha" value={comp.state.table_sublocation_alpha} onChange={comp.handleChangeSelect.bind(comp, 'table_sublocation_alpha')}>
                  {this.sublocs_alpha.map(function(alpha){
                    return (<option key={"localpha-"+alpha} value={alpha}>{alpha}</option>);
                  })}
                </select>
                <select className="sublocation_num" value={comp.state.table_sublocation_num} onChange={comp.handleChangeSelect.bind(comp, 'table_sublocation_num')}>
                  {this.sublocs_num.map(function(num){
                    return (<option key={"locnum"+num} value={num}>{num}</option>);
                  })}
                </select>
                <MapPopup styles={{fontSize:"1.1rem", height:"2.6rem", lineHeight:"2.6rem", marginLeft:"1rem"}} raised />
              </div>
              <div className="table-form-item">
                <div className="table-form-playtime">
                  <Dropdown label='Estimated Length' source={comp.playtimeOptions} value={comp.state.playtime} allowBlank={false} onChange={comp.handleChangeInput.bind(comp, 'playtime')} />
                  <span>{comp.state.game.playtime[0]} - {comp.state.game.playtime[1]} minutes</span>
                </div>
              </div>
              <div className="table-form-item">
                <div className="table-form-playerseats" style={{marginTop:'8px'}}>How Many Players <span>(recommended: {comp.state.game.players[0] + '-' + comp.state.game.players[1]})</span></div>
                <Slider pinned snaps min={2} max={12} step={1} editable value={comp.state.seats} onChange={comp.handleChangeInput.bind(comp, 'seats')} />
              </div>
              <div className="table-form-item">
                <Switch label="Looking For Teacher?" checked={comp.state.lft} onChange={comp.handleChangeInput.bind(comp, 'lft')} />
                <Switch label="Expert Players?" checked={comp.state.only_experienced} onChange={comp.handleChangeInput.bind(comp, 'only_experienced')} />
                {comp.state.table_type==='now' ? '' : (<Switch label="Unlisted (Only visible to you)" checked={comp.state.private} onChange={comp.handleChangeInput.bind(comp, 'private')} /> )}
                {comp.state.table_type==='now' ? '' : (<Switch label="Allow Sign-ups?" checked={comp.state.allow_signups} onChange={comp.handleChangeInput.bind(comp, 'allow_signups')} /> )}
                {comp.state.table_type==='now' ? '' : (<Switch label="Join Your Own Table?" checked={comp.state.joined} onChange={comp.handleChangeInput.bind(comp, 'joined')} /> )}
                {comp.state.table_type==='now' ? '' : (<Dropdown label="Reserve Any Other Spaces?" source={comp.renderReservedSpots()} value={comp.state.reserved} allowBlank={false} onChange={comp.handleChangeInput.bind(comp, 'reserved')} /> )}
              </div>
              <div className="table-form-item">
                <button type="submit" className="submit">Save Game Table!</button>
              </div>
            </form>

            <Dialog
              title="Your Table Is Listed"
              type="large"
              onEscKeyDown={this.handleCloseDialog}
              onOverlayClick={this.handleCloseDialog}
              active={this.state.dialogActive}
              actions={[
                {label: "Close", onClick: this.handleCloseDialog, primary: true, raised: true}
              ]}
            >
              {comp.state.table_type==='now' ? (
                <div>
                  <p>Your listing will stay up for 20 minutes. Grab a LFP sign-post so players can find you!</p>
                </div>
              ) : (
                <div>
                  <p>Your game is scheduled. If you can't make it for any reason, please remember to cancel your game in the app.</p>
                </div>
              )}
            </Dialog>
          </div>
        )}
      </div>
    );
  }
}

export default TableEdit;
