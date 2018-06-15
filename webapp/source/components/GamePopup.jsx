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
          <div className={"game-item-description"+(comp.state.activeGameOpenDesc ? " open" : "")}>{entities.html.decode(entities.xml.decode(game.desc))}<div className="desc-overlay"></div></div>
        </div>
      </div>
    );
  } // renderGame

  render()
  {
    var comp = this;
    return (
      <div className="game-item-wrap">
        {comp.state.loaded ? comp.renderGame() : <div />}
      </div>
    );
  }
}

// {/* <LoadingInline active={!comp.state.loaded} /> */}
export default GamePopup;
