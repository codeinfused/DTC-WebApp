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
          <li>This app is a website, not an actual Android or iOS app. But you can add it to your phone like an app <em>(see next)</em></li>
          <li>To add this site to your phone's home-screen for a smoother experience: from your browser's <em>Share</em> menu, press "Add to Home screen".</li>
          <li>Most of the search options (like year or categories) also sort by their boardgamegeek ranking!</li>
          <li>The convention offers free wifi, use it!</li>
        </ul>

        <h2>Thanks to BGG!</h2>
        <p>All the board game data used here is from the amazing folks at boardgamegeek.com, thanks to their open API service. Serious kudos.</p>

        <h2>Who Made This?</h2>
        <p>My name is Mike, and I created this little app because I love DTC. With the growing size, I wanted a way to easily find fellow gamers and the games I want to play.</p>
        <p>The app isn't perfect, and I have plenty of improvements to make. It'll only get better the more people that use it, which in turn encourages me to put more work into it.</p>
        <p>If you've enjoyed using this app to find games to play, track me down for a high five.</p>
        <p><span className="about-mike-photo"><img src="/images/mike.jpg" /></span></p>

        <p><br />If you're reading this, you must be extra crazy. Just schedule some games on the app already.</p>
        <p><a className="dbox-donation-button" href="https://donorbox.org/dtcapp?amount=5" target="_donate">Buy Mike a Beer</a></p>

        <LoadingInline
          active={comp.state.loader}
        />
      </div>
    );
  }

};

export default About;
