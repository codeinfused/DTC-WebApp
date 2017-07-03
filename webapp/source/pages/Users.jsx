import ThemeConfig from '../config.jsx';
import axios from 'axios';
import React from 'react';
import {browserHistory} from 'react-router';
import {List, ListItem, ListSubHeader, ListDivider, ListCheckbox } from 'react-toolbox/lib/list';
import {Button, IconButton} from 'react-toolbox/lib/button';
import {LoadingInline} from '../components/LoadingInline.jsx';
 
const Users = React.createClass(
{
  getInitialState: function()
  {
    return {
      calls: {
        get: {
          url: ThemeConfig.api + 'users',
          data: {context: 'edit'}
        }
      },
      users: [],
      loaded: false
    };
  },
  
  componentDidMount: function()
  {
    var comp = this;
    var req = this.state.calls.get;
    this.userRequest = axios.get(req.url, {
      params: req.data,
      headers: {'X-WP-Nonce': ThemeConfig.nonce}
    });
    this.userRequest.then(function(json)
    {
      comp.setState({
        users: json.data,
        loaded: true
      });
    });
  },
  
  handleUserOpen: function(userId)
  {
    browserHistory.push('/users/'+userId);
  },
  
  renderList: function()
  {
    if(this.state.loaded){
      var that = this;
      return this.state.users.map(function(user){
        return (
          <ListItem
            className="users-list-item"  
            key={"userid-"+user.id} 
            userId={user.id} 
            caption={user.name} 
            legend={user.roles[0] ? ThemeConfig.phraseCapitalize(user.roles[0]) : 'Subscriber'} 
            avatar={user.avatar_urls['48']} 
            rightActions={[
              <IconButton className="user-list-action" primary floating icon="mode_edit" onClick={that.handleUserOpen.bind(that, user.id)} />,
              <IconButton className="user-list-action" primary floating icon="delete" />
            ]}
          />
        );
      })
    }else{
      return (<li><LoadingInline /></li>);
    }

  },
  
  render: function()
  {
    return (
      <div id="page-users" className="page-wrap page-card">
        <h1 className="page-card-title">User Management</h1>
        <div className="page-card-actions-top">
          <Button icon='add_circle' label='Create User' raised primary />
        </div>
        <div className="page-card-content">
          <List className="users-list">
            {this.renderList()}
          </List>
        </div>
      </div>
    );
  }
});
 
export default Users;