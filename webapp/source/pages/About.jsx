import CONFIG from '../config.jsx';
import axios from 'axios';
import React from 'react';
import {browserHistory} from 'react-router';
import {FontIcon} from 'react-toolbox';
import {Button, IconButton} from 'react-toolbox/lib/button';
import {LoadingInline} from '../components/Loaders.jsx';

class About extends React.Component
{
  constructor(props)
  {
    super(props);
    this.state = {
      loader: false
    };
  }

  render()
  {
    var comp = this;

    return (
      <div id="page-about" className="transition-item page-about page-wrap">
        <h2>Tips</h2>
        <ul>
          <li>You can add this app to your phone's home-screen for a smoother experience. From your browser <em>Share</em> menu, press "Add to Home screen".</li>
          <li>Most of the search options (like year or categories) also sort by their boardgamegeek ranking.</li>
        </ul>

        <h2>Thanks to BGG!</h2>
        <p>All the board game data used here is from the amazing folks at boardgamegeek.com, thanks to their open API service. Kudos.</p>

        <h2>Who Made This?</h2>
        <p>My name is Mike, and I created this little app simply because I love DTC. With the growing size, I wanted a way to easily find fellow gamers and the games I want to play.</p>
        <p>So if you've enjoyed using this app to find games to play, track me down for a high five!</p>
        <p><span className="about-mike-photo"><img src="/images/mike.jpg" /></span></p>
        <p><a className="dbox-donation-button" href="https://donorbox.org/dtcapp?amount=5" target="_donate">Buy Mike a Beer</a></p>

        <LoadingInline
          active={comp.state.loader}
        />
      </div>
    );
  }

};

export default About;
