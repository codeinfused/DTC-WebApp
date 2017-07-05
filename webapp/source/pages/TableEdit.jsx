import CONFIG from '../config.jsx';
import axios from 'axios';
import React from 'react';
import {browserHistory} from 'react-router';
import {Dialog, FontIcon, Input, DatePicker, TimePicker, Slider, Switch, Dropdown, RadioGroup, RadioButton} from 'react-toolbox';
import {Button, IconButton} from 'react-toolbox/lib/button';
import {cloneDeep, slice} from 'lodash';
import {XmlEntities, AllHtmlEntities} from 'html-entities';
import moment from 'moment';

import {LoadingInline} from '../components/Loaders.jsx';
import ToastsAPI from '../components/ToastsAPI.jsx';

const entities = {xml: new XmlEntities(), html: new AllHtmlEntities()};

class TableEdit extends React.Component
{
  constructor(props)
  {
    super(props);
    var comp = this;
    var action = false;

    this.state = {
      mountType: this.checkMountType(props),
      loaded: false,
      dialogActive: false,
      table_id: this.props.params.table_id,
      bgg_id: this.props.params.bgg_id,
      game: {},
      seats: 2,
      table_type: 'now',
      table_location: 'Caribbean Ballroom',
      table_sublocation_alpha: 'A',
      table_sublocation_num: '1',
      start_datetime: '',
      start_date: new Date(),
      start_time: new Date(),
      lfp: true,
      lft: false,
      allow_signups: false
    };

    this.dateRange = [
      '2017-07-04',
      '2017-07-09'
    ];

    this.sublocs_alpha = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'];
    this.sublocs_num = Array.apply(null, {length: 36}).map(Number.call, Number);
    this.sublocs_num = this.sublocs_num.slice(1);


    this.tableLocations = [
      {label: 'Caribbean Ballroom', value: 'Caribbean Ballroom' },
      {label: 'Grand Sierra Ballroom', value: 'Grand Sierra Ballroom'},
      {label: 'Boca I/II', value: 'Boca I/II'},
      {label: 'Boca V-VIII', value: 'Boca V-VIII'},
      {label: 'Antigua', value: 'Antigua'},
      {label: 'Bonaire', value: 'Bonaire'},
      {label: 'Curaco', value: 'Curaco'},
      {label: 'Hibiscus', value: 'Hibiscus'},
      {label: 'Reception Lobby', value: 'Reception Lobby'}
    ];

    this.getGameData = this.getGameData.bind(this);
    this.handleSubmitTable = this.handleSubmitTable.bind(this);
    this.handleCloseDialog = this.handleCloseDialog.bind(this);
  }

  componentDidMount()
  {
    var comp = this;
    if(!CONFIG.state.auth){ browserHistory.push('/home'); return; }
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
        var newState = Object.assign({}, curState, json.data.table);
        newState.loaded = true;
        console.log(newState);
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

  handleChangeDatetime(field, value)
  {
    var comp = this;
    var state = _.cloneDeep(comp.state);
    state[field] = value;
    var d = state.start_date;
    var t = state.start_time;
    var start_datetime = moment(d).format('YYYY-MM-DD') +' '+ moment(t).format('HH:mm:00');

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
      lft: comp.state.lft,
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

  render()
  {
    var comp = this;
    return (
      <div id="page-table-edit" className="transition-item page-table-edit page-wrap">
        {!comp.state.loaded ? (
          <LoadingInline active={!comp.state.loaded} />
        ) : (
          <div className="page-table-edit-wrap">
            <h1>Table Editor</h1>
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
                <Dropdown label='Schedule' source={[{label:'Now', value:'now'}, {label:'Later', value:'future'}]} value={comp.state.table_type} onChange={comp.handleChangeInput.bind(comp, 'table_type')} />
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
              </div>
              <div className="table-form-item">
                <div className="table-form-playerseats" style={{marginTop:'8px'}}>How Many Players <span>({comp.state.game.players[0] + '-' + comp.state.game.players[1]})</span></div>
                <Slider pinned snaps min={2} max={12} step={1} editable value={comp.state.seats} onChange={comp.handleChangeInput.bind(comp, 'seats')} />
              </div>
              <div className="table-form-item">
                <Switch label="Looking For Teacher" checked={comp.state.lft} onChange={comp.handleChangeInput.bind(comp, 'lft')} />
                {comp.state.table_type==='now' ? '' : (<Switch label="Allow Sign-ups" checked={comp.state.allow_signups} onChange={comp.handleChangeInput.bind(comp, 'allow_signups')} />)}
              </div>
              <div className="table-form-item">
                <button type="submit" className="submit">Set Table!</button>
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
