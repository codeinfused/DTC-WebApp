import CONFIG from '../config.jsx';
import axios from 'axios';
import React from 'react';
import {browserHistory} from 'react-router';
import {FontIcon, Dropdown} from 'react-toolbox';
import {Button, IconButton} from 'react-toolbox/lib/button';
import {cloneDeep, slice, uniq, findIndex} from 'lodash';
import {XmlEntities, AllHtmlEntities} from 'html-entities';

import {LoadingInline} from '../components/Loaders.jsx';
import ToastsAPI from '../components/ToastsAPI.jsx';

const entities = {xml: new XmlEntities(), html: new AllHtmlEntities()};

class GamePopup extends React.Component
{
  constructor(props)
  {
    super(props);
    var comp = this;
    this.state = {
      bgg_id: props.bgg_id,
      game: {},
      loaded: false,
      show_tags: false
    };
  }

  componentDidMount()
  {
    var comp = this;
    comp.searchGame();
  }

  searchGame()
  {
    var comp = this;

    axios.get(CONFIG.bgg.game + comp.state.bgg_id, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      comp.setState({loaded: true, game: json.data.game});
    }).catch(function(json){
      //ToastsAPI.toast('error', null, json.response.data.message, {timeOut:6000});
      //comp.setState({loaded: true, game: {}});
    });
  }

  handleShowTags()
  {
    var comp = this;
    comp.setState({
      show_tags: true
    })
  }

  handleFindTables(bgg_id, type)
  {
    browserHistory.push('/list/'+type+'/'+bgg_id);
  }

  // WTP Want To Play ACTIONS
  // -------------------------------------------

  updateGameWTP(bgg_id, inc)
  {
    var comp = this;
    var games = _.cloneDeep(comp.state.games);

    var gameI = _.findIndex(games, function(g){ return g.bgg_id == bgg_id; });
    if(gameI > -1){
      games[gameI].wtp = (+games[gameI].wtp) + inc;
      comp.setState({games: games});
    }
  }

  addWTP(bgg_id)
  {
    var comp = this;
    CONFIG.state.user.wtp.push(bgg_id);
    CONFIG.state.user.wtp = _.uniq(CONFIG.state.user.wtp);

    comp.updateGameWTP(bgg_id, 1);

    axios.post(CONFIG.api.wtp, {
      bgg_id: bgg_id,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).catch(function(json){
      ToastsAPI.toast('error', null, 'Error adding game.', {timeOut:6000});
    });
    this.forceUpdate();
  }

  deleteWTP(bgg_id)
  {
    var comp = this;
    var ind = CONFIG.state.user.wtp.indexOf(bgg_id);
    CONFIG.state.user.wtp.splice(ind, 1);
    var ind2 = CONFIG.state.user.notify.indexOf(bgg_id);
    CONFIG.state.user.notify.splice(ind2, 1);

    comp.updateGameWTP(bgg_id, -1);

    axios.post(CONFIG.api.wtp+'/delete', {
      bgg_id: bgg_id,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).catch(function(json){
      ToastsAPI.toast('error', null, 'Error deleting game.', {timeOut:6000});
    });
    this.forceUpdate();
  }

  handleToggleWTP(bgg_id)
  {
    var comp = this;
    if(CONFIG.state.user.wtp.indexOf(bgg_id) < 0){
      comp.addWTP(bgg_id);
    }else{
      comp.deleteWTP(bgg_id);
    }
  }

  // BUTTON: NOTIFICATIONS TOGGLE
  // -----------------------------------------------

  addNotify(bgg_id)
  {
    var comp = this;
    var wtp_ind = CONFIG.state.user.wtp.indexOf(bgg_id);
    if(wtp_ind < 0){
      CONFIG.state.user.wtp.push(bgg_id);
      comp.updateGameWTP(bgg_id, 1);
    }
    CONFIG.state.user.notify.push(bgg_id);
    CONFIG.state.user.notify = _.uniq(CONFIG.state.user.notify);

    axios.post(CONFIG.api.notify, {
      bgg_id: bgg_id,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(){
      ToastsAPI.toast('success', null, 'You will be notified of tables for this game.', {timeOut:6000});
    }).catch(function(json){
      ToastsAPI.toast('error', null, 'Error adding notification.', {timeOut:6000});
    });
    this.forceUpdate();
  }

  deleteNotify(bgg_id)
  {
    var comp = this;
    var ind = CONFIG.state.user.notify.indexOf(bgg_id);
    CONFIG.state.user.notify.splice(ind, 1);

    axios.post(CONFIG.api.notify+'/delete', {bgg_id: bgg_id,t: (new Date()).getTime()}, {headers: {'Authorization': 'Bearer '+CONFIG.state.auth}}).catch(function(json){
      ToastsAPI.toast('error', null, 'Error deleting notification.', {timeOut:6000});
    });
    this.forceUpdate();
  }

  handleToggleNotify(bgg_id)
  {
    var comp = this;
    if(CONFIG.state.user.notify.indexOf(bgg_id) < 0){
      comp.addNotify(bgg_id);
    }else{
      comp.deleteNotify(bgg_id);
    }
  }


  // BUTTON: DO NOT SHOW GAME
  // -----------------------------------------------

  addDNS(bgg_id)
  {
    var comp = this;
    CONFIG.state.user.dns.push(bgg_id);
    CONFIG.state.user.dns = _.uniq(CONFIG.state.user.dns);
    if(comp.props.onToggleDNS){
      comp.props.onToggleDNS('add', bgg_id);
    }
    axios.post(CONFIG.api.dns, {bgg_id: bgg_id, t: (new Date()).getTime()}, {headers: {'Authorization': 'Bearer '+CONFIG.state.auth}}).catch(function(json){
      ToastsAPI.toast('error', null, 'Error adding game.', {timeOut:6000});
    });
    this.forceUpdate();
  }

  deleteDNS(bgg_id)
  {
    var comp = this;
    var ind = CONFIG.state.user.dns.indexOf(bgg_id);
    CONFIG.state.user.dns.splice(ind, 1);
    if(comp.props.onToggleDNS){
      comp.props.onToggleDNS('delete', bgg_id);
    }
    axios.post(CONFIG.api.dns+'/delete', {bgg_id: bgg_id,t: (new Date()).getTime()}, {headers: {'Authorization': 'Bearer '+CONFIG.state.auth}}).catch(function(json){
      ToastsAPI.toast('error', null, 'Error deleting notification.', {timeOut:6000});
    });
    this.forceUpdate();
  }

  handleToggleDNS(bgg_id)
  {
    var comp = this;
    if(CONFIG.state.user.dns.indexOf(bgg_id) < 0){
      comp.addDNS(bgg_id);
    }else{
      comp.deleteDNS(bgg_id);
    }
  }


  // BUTTON: IGNORE GAME HOST
  // -----------------------------------------------

  addIgnore(bad_player_id)
  {
    var comp = this;
    console.log(CONFIG.state.user);
    CONFIG.state.user.ignore.push(bad_player_id);
    CONFIG.state.user.ignore = _.uniq(CONFIG.state.user.ignore);
    if(comp.props.onToggleIgnore){
      comp.props.onToggleIgnore('add', bad_player_id);
    }
    axios.post(CONFIG.api.ignore, {bad_player_id: bad_player_id, t: (new Date()).getTime()}, {headers: {'Authorization': 'Bearer '+CONFIG.state.auth}}).catch(function(json){
      ToastsAPI.toast('error', null, 'Error adding game.', {timeOut:6000});
    });
    this.forceUpdate();
  }

  deleteIgnore(bad_player_id)
  {
    var comp = this;
    var ind = CONFIG.state.user.ignore.indexOf(bad_player_id);
    CONFIG.state.user.ignore.splice(ind, 1);
    if(comp.props.onToggleIgnore){
      comp.props.onToggleIgnore('delete', bad_player_id);
    }
    axios.post(CONFIG.api.ignore+'/delete', {bad_player_id: bad_player_id, t: (new Date()).getTime()}, {headers: {'Authorization': 'Bearer '+CONFIG.state.auth}}).catch(function(json){
      ToastsAPI.toast('error', null, 'Error deleting notification.', {timeOut:6000});
    });
    this.forceUpdate();
  }

  handleToggleIgnore(bad_player_id)
  {
    var comp = this;
    if(CONFIG.state.user.ignore.indexOf(bad_player_id) < 0){
      comp.addIgnore(bad_player_id);
    }else{
      comp.deleteIgnore(bad_player_id);
    }
  }


  // =========================================
  // --

  handleCreateGame(game)
  {
    CONFIG.state.currentCreateGame = game;
    //CONFIG.transitionOut(this, function(){
    if(!CONFIG.state.auth || CONFIG.state.user.grant_type==='guest'){
      ToastsAPI.toast('error', "Sorry, guests can't create tables.", null, {timeOut:8000});
      return;
    }
    browserHistory.push('/tables/create/'+game.bgg_id);
    //});
  }

  renderGame()
  {
    var comp = this;
    var game = comp.state.game;

    function basic_image_replacer(image){
      return image.replace(/(\.[a-zA-Z]+)$/, function(match, p1){
        return "_md" + p1;
      });
    }

    function filtered_image_replacer(image){
      return image.replace(/original[\w\_\-\=\/]+(pic\d{3,})(\.[a-zA-Z]{2,4})$/, function(match, p1, p2){
        return "images/"+p1+"_md"+p2;
      });
    }

    var notifyActive = CONFIG.state.user.notify.indexOf(game.bgg_id) > -1 ? " active" : "";
    var wtpActive = CONFIG.state.user.wtp.indexOf(game.bgg_id) > -1 ? " active" : "";
    var dnsActive = CONFIG.state.user.dns.indexOf(game.bgg_id) > -1 ? " hide-active" : "";
    var ignoreActive = CONFIG.state.user.ignore.indexOf(comp.props.host_id) > -1 ? " hide-active" : "";
    var image = false;

    if(!!game.image)
    {
      if(game.image.indexOf('original')>-1){
        image = filtered_image_replacer(game.image);
      }else{
        image = basic_image_replacer(game.image);
      }
    }

    return (
      <div key={"game-item-"+game.bgg_id} className="game-item full-view">
        <div className="game-item-top-wrap">
          <div className="game-bg" style={image ? {backgroundImage: "url("+image+")"} : {}}>
            <div className="game-bg-olay"></div>
            <div className="game-bg-olay2"></div>
          </div>
          <div className="game-item-content">
            <div className="game-item-year">{game.year}</div>
            <div className="game-item-title">{game.title}</div>
            <div className="game-item-subtitle clearfix">
              <div className="game-item-rating hexagon"><span>{(+game.rating).toFixed(1)}</span></div>
              <div className="game-item-info">
                <p>
                  {game.minplayers===game.players[1] ? game.players[0] : (game.players[0]+'-'+game.players[1])} players<br />
                  {game.playtime[0]===game.playtime[1] ? game.playtime[0] : (game.playtime[0]+'-'+game.playtime[1])} minutes
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="game-item-bottom-wrap">
          <div className="game-item-tags">
            {game.tags.map(function(tag, i){
              return (<div key={'bggtag-'+i} className="plan-tag">{tag}</div>);
            })}
          </div>
          <div className={"game-item-description open"}>{entities.html.decode(entities.xml.decode(game.desc))}</div>
          <div className="game-item-actions">
            {(!CONFIG.state.auth || CONFIG.state.user.grant_type==='guest') ? (
              <div className="game-item-action">
                  <div className="game-item-action-line"><span><em>Sorry, guests cannot create tables.</em></span></div>
              </div>
            ) : (
              <div className="game-item-action">
                <button className="game-item-btn-giant" onClick={comp.handleCreateGame.bind(comp, game)}>Start a new game table!</button>
              </div>
            )}
            <div className="game-item-action">
              <div className="game-item-action-line">
                <div className="game-item-action-title">Wanting to play</div>
                <div className={"game-item-action-btn action-notify-btn" + notifyActive}><IconButton icon='notifications' onClick={comp.handleToggleNotify.bind(comp, game.bgg_id)} /></div>
                <div className={"game-item-action-btn action-wtp-btn" + wtpActive}><IconButton icon='check' onClick={comp.handleToggleWTP.bind(comp, game.bgg_id)} /></div>
                <div className="game-item-action-count">{+game.wtp}</div>
              </div>
            </div>
            <div className="game-item-action">
              <div className="game-item-action-line">
                <div className="game-item-action-title">Tables looking for players</div>
                <div className="game-item-action-btn action-searchtables-btn"><IconButton icon='search' onClick={comp.handleFindTables.bind(comp, game.bgg_id, 'now')} /></div>
                <div className="game-item-action-count">{+game.lfp}</div>
              </div>
            </div>
            <div className="game-item-action">
              <div className="game-item-action-line">
                <div className="game-item-action-title">Scheduled game tables</div>
                <div className="game-item-action-btn action-searchschedule-btn"><IconButton icon='search' onClick={comp.handleFindTables.bind(comp, game.bgg_id, 'future')} /></div>
                <div className="game-item-action-count">{+game.scheduled}</div>
              </div>
            </div>
            {((!comp.props.onToggleDNS && !comp.props.onToggleIgnore) || game.player_id==CONFIG.state.user.id) ? '' : (
            <div className="game-item-action">
              <div className="game-item-action-line">
                <div className="game-item-action-title">Hide this board game or host</div>
                {!comp.props.onToggleIgnore ? '' : (<div className={"game-item-action-btn action-ignore-btn " + ignoreActive}><IconButton icon='person' onClick={comp.handleToggleIgnore.bind(comp, comp.props.host_id)} /></div>)}
                {!comp.props.onToggleDNS ? '' : (<div className={"game-item-action-btn action-donotshow-btn " + dnsActive}><IconButton icon='remove_circle' onClick={comp.handleToggleDNS.bind(comp, game.bgg_id)} /></div>)}
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    );
  } // renderGame

  render()
  {
    var comp = this;
    return (
      <div className="game-item-wrap page-game-search" id="page-game-search">
        {comp.state.loaded ? comp.renderGame() : <div />}
      </div>
    );
  }
}

// {/* <LoadingInline active={!comp.state.loaded} /> */}
export default GamePopup;
