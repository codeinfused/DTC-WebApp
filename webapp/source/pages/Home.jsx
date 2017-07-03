import CONFIG from '../config.jsx';
import axios from 'axios';
import React from 'react';
import {browserHistory} from 'react-router';
import {FontIcon} from 'react-toolbox';
import {Button, IconButton} from 'react-toolbox/lib/button';
import {LoadingInline} from '../components/Loaders.jsx';

class Home extends React.Component
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
      loader: false
    };
  }

  render()
  {
    var comp = this;

    return (
      <div id="page-home" className="transition-item page-home page-wrap">
        <div className={"home-header" + (comp.state.loader ? " loading" : "")}>
          <div id="app-logo"><img src="images/dtc-logo-transp-full.png" /></div>
        </div>

        <LoadingInline
          active={comp.state.loader}
        />
      </div>
    );
  }

};

export default Home;
