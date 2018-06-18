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

class SearchGames extends React.Component
{
  constructor(props)
  {
    super(props);
    var comp = this;

    this.state = {
      transition: '',
      searchText: '',
      step: 1,
      table: {},
      games: [],
      currentGamePage: 0,
      perGamePage: 10,
      currentResultCount: 0,
      activeGameId: -1,
      activeGameOpenDesc: false,
      sortBy: 'bggrate',
      tag: '',
      loader: true,
      renderView: 'phone',
      source: props.route.source
    };

    this.sortOptions = [
      {label: 'Sort BGG Ranking', value: 'bggrate'},
      {label: 'Players Wanting To Play', value: 'wtp'},
      {label: 'Tables Needing Players', value: 'lfp'},
      {label: 'Scheduled Games', value: 'scheduled'},
      {label: 'Year Released', value: 'year'},
      {label: 'Popular 7+ Players', value: 'maxplayers'}
    ];

    this.tagOptions = [
      {label: 'No Filter', value: ''},
      {label: 'Abstract', value: 'Abstract Strategy'},
      {label: 'Action / Dexterity', value: 'Action / Dexterity'},
      {label: 'Area Control', value: 'Area Control / Area Influence'},
      {label: 'Auction / Bidding', value: 'Auction/Bidding'},
      {label: 'Bluffing', value: 'Bluffing'},
      {label: 'Card Games', value: 'Card Game'},
      {label: 'Coop Games', value: 'Co-operative Play'},
      {label: 'Deckbuilders / Pools', value: 'Deck / Pool Building'},
      {label: 'Deduction', value: 'Deduction'},
      {label: 'Dice Games', value: 'Dice'},
      {label: 'Drafting', value: "Card Drafting"},
      {label: 'Fantasy Theme', value: 'Fantasy'},
      {label: 'Horror Theme', value: 'Horror'},
      {label: 'Medieval Theme', value: 'Medieval'},
      {label: 'Movies & TV Theme', value: "Movies / TV / Radio theme"},
      {label: 'Party Games', value: 'Party Game'},
      {label: 'Pirate Theme', value: 'Pirates'},
      {label: 'Puzzles', value: 'Puzzle'},
      {label: 'Racing', value: 'Racing'},
      {label: 'Realtime Action', value:'Real-time'},
      {label: 'Science Fiction Theme', value: 'Science Fiction'},
      {label: 'Sports Theme', value: 'Sports'},
      {label: 'Storytelling', value: 'Storytelling'},
      {label: 'Take That', value: 'Take That'},
      {label: 'War Games', value: 'Wargame'},
      {label: 'Worker Placement', value: 'Worker Placement'},
      {label: 'Zombies Theme', value: 'Zombies'}
    ];

    this.handleSearchChange = this.handleSearchChange.bind(this);
    this.handleSearchGames = this.handleSearchGames.bind(this);
    this.handleOpenGameResult = this.handleOpenGameResult.bind(this);
    this.shrinkGameResult = this.shrinkGameResult.bind(this);
    this.gameListBack = this.gameListBack.bind(this);
    this.gameListNext = this.gameListNext.bind(this);
    this.notificationEngine = this.notificationEngine.bind(this);
    this.handleChangeSort = this.handleChangeSort.bind(this);
    this.handleChangeTag = this.handleChangeTag.bind(this);
    this.handleToggleDescription = this.handleToggleDescription.bind(this);
    this.addWTP = this.addWTP.bind(this);
  }

  componentWillReceiveProps(nextProps)
  {
    var comp = this;
    if(this.state.source !== nextProps.route.source)
    {
      comp.setState({
        loader: true,
        currentGamePage: 0,
        source: nextProps.route.source,
        games: [],
        currentResultCount: 0
      }, ()=>{setTimeout(function(){comp.searchGames();},300)});
    }
    if(this.state.renderView !== nextProps.renderView){
      comp.setState({
        renderView: nextProps.renderView
      });
    }
  }

  componentDidMount()
  {
    var comp = this;
    this.setState({
      searchText: (CONFIG.state.last_searchText || ''),
      tag: (CONFIG.state.last_tag ? CONFIG.state.last_tag : ''),
      sortBy: (CONFIG.state.last_sortBy ? CONFIG.state.last_sortBy : 'bggrate'),
      currentGamePage: (CONFIG.state.last_currentGamePage || 0)
    }, function(){
      comp.searchGames();
    });
    //CONFIG.transitionIn(this, function(){});

    //this.notificationEngine();
  }

  notificationEngine()
  {
    var comp = this;
    let notif = new Promise(
      // The resolver function is called with the ability to resolve or
      // reject the promise
      (resolve, reject) => {
        // axios.post(CONFIG.bgg.search, {
        //   term: 'firefly',
        //   t: (new Date()).getTime()
        // }).then(function(json)
        // {
        //   resolve();
        // }).catch(function()
        // {
        //   reject();
        // });
      }
    );

    notif.then(function()
    {
      setTimeout(function(){ comp.notificationEngine(); document.body.innerHTML = "<p>"+(new Date()).toString()+"</p>" + document.body.innerHTML; }, 20000);
    }).catch(function()
    {
      setTimeout(function(){ comp.notificationEngine(); document.body.innerHTML = "<p>"+(new Date()).toString()+"</p>" + document.body.innerHTML; }, 20000);
    });
  }

  shrinkGameResult()
  {
    this.setState({activeGameId: -1});
  }

  scrollListToTop()
  {
    var el = document.querySelector('.game-search-list');
    if(el){ el.scrollTop = 0; }
  }

  // WTP and NOTIFY actions
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

    axios.post(CONFIG.api.notify+'/delete', {
      bgg_id: bgg_id,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).catch(function(json){
      ToastsAPI.toast('error', null, 'Error deleting notification.', {timeOut:6000});
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

  handleToggleNotify(bgg_id)
  {
    var comp = this;
    if(CONFIG.state.user.notify.indexOf(bgg_id) < 0){
      comp.addNotify(bgg_id);
    }else{
      comp.deleteNotify(bgg_id);
    }
  }


  // SEARCH actions
  // -------------------------------------------

  searchGames()
  {
    var comp = this;
    comp.scrollListToTop();
    CONFIG.state.last_searchText = comp.state.searchText.trim();

    // NOT NEEDED WITH LOCALIZED DB?
    // if(comp.state.searchText.length < 4){
    //   //comp.renderSearchEmpty(['Search too short.', 'Your search phrase must have at least 4 characters.']);
    //   comp.setState({loader: false});
    //   return;
    // }
    comp.searchInput.blur();

    axios.post(CONFIG.bgg.search, {
      term: comp.state.searchText.trim(),
      db: CONFIG.state.searchDB,
      page: comp.state.currentGamePage,
      sort: comp.state.sortBy,
      tag: comp.state.tag,
      t: (new Date()).getTime()
    }, {
      headers: {'Authorization': 'Bearer '+CONFIG.state.auth}
    }).then(function(json){
      comp.setState({loader: false, games: json.data.games, currentResultCount: json.data.count});
    }).catch(function(json){
      ToastsAPI.toast('error', null, json.response.data.message, {timeOut:6000});
      comp.setState({loader: false, games: [], currentResultCount: 0, currentGamePage: 0});
    });
  }

  handleSearchGames(event)
  {
    var comp = this;
    event.preventDefault();
    comp.setState({loader: true, currentGamePage: 0}, ()=>{comp.searchGames();});
  }

  handleSearchChange(event)
  {
    CONFIG.state.last_searchText = event.target.value;
    this.setState({searchText: CONFIG.state.last_searchText});
  }

  handleOpenGameResult(game, event, another)
  {
    var newgame = game.bgg_id === this.state.activeGameId ? -1 : game.bgg_id;
    this.setState({activeGameId: newgame, activeGameOpenDesc: false});
  }

  handleToggleDescription()
  {
    var el = document.querySelectorAll('.game-item-description');
    for(var i=0; i<el.length; i++){
      el[i].scrollTop = 0;
    }
    this.setState({activeGameOpenDesc: !this.state.activeGameOpenDesc});
  }

  handleChangeSort(val)
  {
    var comp = this;
    CONFIG.state.last_sortBy = val;
    CONFIG.state.last_currentGamePage = 0;
    comp.setState({sortBy: val, loader: true, currentGamePage: 0}, ()=>{comp.searchGames();});
  }

  handleChangeTag(val)
  {
    var comp = this;
    CONFIG.state.last_tag = val;
    CONFIG.state.last_currentGamePage = 0;
    comp.setState({tag: val, loader: true, currentGamePage: 0}, ()=>{comp.searchGames();});
  }

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

  handleFindTables(bgg_id, type)
  {
    browserHistory.push('/list/'+type+'/'+bgg_id);
  }

  gameListBack()
  {
    var comp = this;
    CONFIG.state.last_currentGamePage = this.state.currentGamePage-1;
    comp.setState({loader: true, currentGamePage: this.state.currentGamePage-1}, ()=>{comp.searchGames();});
  }
  gameListNext()
  {
    var comp = this;
    CONFIG.state.last_currentGamePage = this.state.currentGamePage+1;
    comp.setState({loader: true, currentGamePage: this.state.currentGamePage+1}, ()=>{comp.searchGames();});
  }

  renderSearchResults()
  {
    var comp = this;
    var maxPage = Math.floor((+comp.state.currentResultCount-1) / comp.state.perGamePage);

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

    return (
      <div className="game-search-list clearfix">
        {comp.state.games.map(function(game, i)
        {
          var notifyActive = CONFIG.state.user.notify.indexOf(game.bgg_id) > -1 ? " active" : "";
          var wtpActive = CONFIG.state.user.wtp.indexOf(game.bgg_id) > -1 ? " active" : "";
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
            <div key={"game-item-"+game.bgg_id+"-"+i} className={"game-item" + (comp.state.activeGameId==game.bgg_id ? " full-view" : "")} >
              <div className="game-item-top-wrap" onClick={comp.handleOpenGameResult.bind(comp, game)}>
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
                <div className={"game-item-description"+(comp.state.activeGameOpenDesc ? " open" : "")} onClick={comp.handleToggleDescription}>{entities.html.decode(entities.xml.decode(game.desc))}<div className="desc-overlay"></div></div>
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
                      <div className={"game-item-action-btn action-notify-btn" + notifyActive}><IconButton icon='notifications' onClick={comp.handleToggleNotify.bind(comp, game.bgg_id)} /></div> {/* Detect support for notifications before displaying */}
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

                </div>

                <button className="game-item-bottom-close" onClick={comp.shrinkGameResult}><FontIcon value='keyboard_arrow_up' /></button>
              </div>
            </div>
          );
        })}

        <div className="game-list-pagination">
          {comp.state.currentGamePage > 0 ? (
            <Button raised onClick={comp.gameListBack} className="gameListBack">Back</Button>
          ) : ''}
          {comp.state.currentGamePage < maxPage ? (
            <Button raised onClick={comp.gameListNext} className="gameListNext">More</Button>
          ) : ''}

          {comp.state.currentGamePage >= maxPage && maxPage > 2 ? (<div style={{margin: '20px', color:'#b5b5b5', 'font-size':'1.4rem'}}>Didn't find the game you wanted? Try changing your search!</div>) : ''}
        </div>

      </div>
    );
  }

  renderSearchEmpty()
  {
    return (
      <div className="game-search-list-empty"><h3>No games found yet.</h3><p>Use the search above to find a game in BGG and start up a table!</p><p>Or use no keyword to see the top ranked BGG games!</p></div>
    );
  }

  renderGameSearch()
  {
    var comp = this;

    return (
      <div className="game-search-wrap">
        <div className="game-search">
          <form id="form-game-search" onSubmit={comp.handleSearchGames}>
            <div className="game-search-box">
              <input ref={(input) => {comp.searchInput = input;}} value={comp.state.searchText} placeholder='Search for a game...' onChange={comp.handleSearchChange} type="text" />
              <button type="submit" className="submit"><FontIcon value='search' /></button>
            </div>
            <div className="game-search-filters">
              <div className="game-search-filter">
                <Dropdown onChange={comp.handleChangeSort} source={comp.sortOptions} value={comp.state.sortBy} />
                  {/* {comp.sortOptions.map(function(item){
                    return (<option key={"sortoption-"+item.sortby} value={item.sortby}>{item.label}</option>);
                  })} */}
              </div>
              <div className="game-search-filter" style={{'float':'right'}}>
                <Dropdown onChange={comp.handleChangeTag} source={comp.tagOptions} value={comp.state.tag} />
                  {/* {comp.tagOptions.map(function(item){
                    return (<option key={"sortoption-"+item.tag} value={item.tag}>{item.label}</option>);
                  })} */}
              </div>
            </div>
          </form>
        </div>

        {(comp.state.games && comp.state.games.length > 0) ? comp.renderSearchResults() : comp.renderSearchEmpty()}

      </div>
    );
  }

  render()
  {
    var comp = this;
    var trans = '';
    switch(comp.state.transition){
      case 'in': trans = 'transition-appear'; break;
      case 'in-anim': trans = 'transition-appear transition-appear-active'; break;
      case 'out': trans = 'transition-leave'; break;
      case 'out-anim': trans = 'transition-leave transition-leave-active'; break;
    }

    return (
      <div id="page-game-search" className={"transition-item page-search page-wrap " + trans}>

        <div className={"game-search-section" + (comp.state.loader ? " loading" : "")}>
          {comp.renderGameSearch()}
        </div>

        <LoadingInline
          active={comp.state.loader}
        />

      </div>
    );
  }

};

export default SearchGames;
