import CONFIG from '../config.jsx';
import axios from 'axios';
import React from 'react';
import {browserHistory} from 'react-router';
import {List, ListItem, ListSubHeader, ListDivider, ListCheckbox } from 'react-toolbox/lib/list';
import {Button, IconButton} from 'react-toolbox/lib/button';
//import {LoadingInline} from '../components/LoadingInline.jsx';

class GamesList extends React.Component
{
  constructor(props)
  {
    super(props);
    this.state = {
      calls: {
        get: {
          url: CONFIG.bgg.url + CONFIG.bgg.hot
        }
      },
      games: [],
      loaded: false
    };
  }

  componentDidMount()
  {
    var comp = this;
    var req = this.state.calls.get;
    this.hotRequest = axios.get(req.url);
    this.hotRequest.then(function(xml)
    {
      comp.setState({
        games: {},
        loaded: true
      });
    });
  }

  handleUserOpen(userId)
  {
    browserHistory.push('/games/'+userId);
  }

  handleBackHome()
  {
    browserHistory.push('/');
  }

  renderList()
  {
    if(this.state.loaded){
      var that = this;
      return this.state.games.map(function(user){
        return (
          <li
            className="games-list-item"
            /*
            key={"gameid-"+user.id}
            userId={user.id}
            caption={user.name}
            legend={user.roles[0] ? ThemeConfig.phraseCapitalize(user.roles[0]) : 'Subscriber'}
            avatar={user.avatar_urls['48']}
            rightActions={[
              <IconButton className="user-list-action" primary floating icon="mode_edit" onClick={that.handleUserOpen.bind(that, user.id)} />,
              <IconButton className="user-list-action" primary floating icon="delete" />
            ]}
            */
          ></li>
        );
      })
    }else{
      return (<li></li>);//(<li><LoadingInline /></li>);
    }
  }

  render()
  {
    return (
      <div id="page-games" className="page-wrap page-card transition-item">
        <h1 className="page-card-title">Browse Games</h1>
        <div className="page-card-actions-top">
          <Button label='Back' raised primary onClick={this.handleBackHome} />
        </div>
        <div className="page-card-content">
          <List className="games-list">
          </List>
        </div>
      </div>
    );
  }
};

export default GamesList;
