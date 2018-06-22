import CONFIG from '../config.jsx';
import axios from 'axios';
import React from 'react';
import {browserHistory} from 'react-router';
import {FontIcon, Dialog} from 'react-toolbox';
import {Button, IconButton} from 'react-toolbox/lib/button';
import {LoadingInline} from '../components/Loaders.jsx';
import MapPopup from '../components/MapPopup.jsx';

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
      <div id="page-about" className="transition-item page-about page-wrap page-basic">
        <h2>DTC App Info</h2>
        <p>This site provides a tool for finding and scheduling games to play during The Dice Tower Convention. The goal is to let players quickly see games they're interested in without having to roam all the rooms. Of course, this only works if you spread the word! The more people using DTCApp, the more games to find!</p>
        <ul>
          <li>This app is a website, not an Android or iPhone app. But you can add it to your phone like an app <em>(see next)</em></li>
          <li>To add our app icon to your phone, open <em>"Share"</em> on this website, and press <em>"Add to Home screen"</em>.</li>
          <li>The convention offers free wifi, use it!</li>
          <li>Grab a "Players Wanted" sign to help others find your table!</li>
        </ul>

        <MapPopup styles={{fontSize:"1.3rem", height:"2.6rem", lineHeight:"2.6rem", marginLeft:"0.1rem", marginTop:"1rem"}} raised />

        <h2>Thanks to BGG!</h2>
        <p>All the board game data used here is from the amazing folks at <a href="http://boardgamegeek.com" target="_blank" style={{color:'#fff'}}>boardgamegeek.com</a>, thanks to their open API service!</p>
        <ul>
          <li>On the "Search Games" page, results also sort by their boardgamegeek ranking!</li>
          <li>BGG data used here ignores board game expansions to make the lists shorter.</li>
        </ul>

        <h2>Who Made This?</h2>
        <p>My name is Mike, and I created this DTC App because I love Dice Tower Con. With the con growing in size each year, I wanted a way to easily find the games I want to play. There's plenty of improvements I want to make, and it'll only get better the more people that use it, making finding games more widespread!</p>
        <p>If you've enjoyed using this app to meet players, track me down for a high five.</p>
        <p><span className="about-mike-photo"><img src="/images/mike.jpg" /></span></p>

        <p>If you want to help with the costs of running this server, adding more features, or my coffee programming fuels... I welcome any support!</p>
        <p><a className="dbox-donation-button" href="https://donorbox.org/dtcapp?amount=5" target="_donate">Buy Mike a Coffee</a></p>

        <p><a href="/privacy" style={{color:'#fff'}}>View Privacy Policy</a></p>

        <LoadingInline
          active={comp.state.loader}
        />

      </div>
    );
  }

};

export default About;
