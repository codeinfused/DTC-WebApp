import ThemeConfig from '../config.jsx';
import axios from 'axios';
import React from 'react';
import {List, ListItem, ListSubHeader, ListDivider, ListCheckbox } from 'react-toolbox/lib/list';
import {Button, IconButton} from 'react-toolbox/lib/button';
import {LoadingFull} from '../components/LoadingInline.jsx';
 
const User = React.createClass(
{
  getInitialState: function()
  {
    return {
      user: {
        id: this.props.params.id
      },
      calls: {
        get: {
          url: ThemeConfig.api + 'users/' + this.props.params.id,
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
    var req = comp.state.calls.get;

    comp.userRequest = axios.get(req.url, {
      params: req.data,
      headers: {'X-WP-Nonce': ThemeConfig.nonce}
    });
    comp.userRequest.then(function(json)
    {
      console.log(json);
      comp.setState({
        user: json.data,
        loaded: true
      });
    });
    
  },

  
  render: function()
  {
    if(this.state.loaded){
      return (
        <div id="page-users" className="page-wrap page-card">
          <h1 className="page-card-title">{this.state.user.name}</h1>
          <div className="page-card-actions-top">
            <Button icon='arrow_back' label='User List' raised />
            <Button icon='delete' label='Delete User' raised primary />
          </div>
          <div className="page-card-content">
            
          </div>
        </div>
      );
    }else{
      return (<LoadingFull />);
    }
  }
});
 
export default User;