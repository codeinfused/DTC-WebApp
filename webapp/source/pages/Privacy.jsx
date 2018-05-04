import CONFIG from '../config.jsx';
import axios from 'axios';
import React from 'react';
import {browserHistory} from 'react-router';
import {FontIcon} from 'react-toolbox';
import {Button, IconButton} from 'react-toolbox/lib/button';
import {LoadingInline} from '../components/Loaders.jsx';

class Privacy extends React.Component
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
      <div id="page-privacy" className="transition-item page-privacy page-wrap page-basic">
        <h2>DTC App Privacy Policy</h2>
        <p>Last updated: 5/4/2018</p>

        <p>If you want to create game tables or reserve space at another player's table, you'll need to be authenticated through either facebook or google on dtcapp.com (this "Site").</p>

        <p>This page informs you of our policies regarding the collection, use and disclosure of Personal Information we receive from users of the Site by logging in.</p>

<p>We use your Personal Information only for authentication and improving the Site. By using the Site, you agree to the collection and use of information in accordance with this policy.</p>

<h2>Information Collection And Use</h2>

<p>While using our Site, we may ask you to provide us with certain personally identifiable information that can be used to contact or identify you. Personally identifiable information may include, but is not limited to your name ("Personal Information") and email address.</p>

<h2>Log Data</h2>

<p>Like many site operators, we collect basic information that your browser sends whenever you visit our Site ("Log Data"). This Log Data may include information such as your computer's Internet Protocol ("IP") address, browser type, browser version, the pages of our Site that you visit, the time and date of your visit, the time spent on those pages and other statistics.</p>
<p>In addition, we may use third party services such as Google Analytics that collect, monitor and analyze this usage data.</p>

<h2>Communications</h2>

<p>We may use your Personal Information to contact you with information that relates to improving your experience with the Site, and in response to actions you take on the Site such as asking for notifications of game tables.</p>

<h2>Cookies</h2>

<p>Cookies are files with small amount of data, which may include an anonymous unique identifier. Cookies are sent to your browser from a web site and stored on your computer's hard drive. Like most sites, we use "cookies" to preserve your logged in state. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you will only be able to use the Site as a guest.</p>

<h2>Security</h2>

<p>The security of your Personal Information is important, but remember that no method of transmission over the Internet, or method of electronic storage, is 100% secure. While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security.</p>

<h2>Changes To This Privacy Policy</h2>

<p>This Privacy Policy is effective as of 5/4/2018 and will remain in effect except with respect to any changes in its provisions in the future, which will be in effect immediately after being posted on this page.</p>

<p>We reserve the right to update or change our Privacy Policy at any time and you should check this Privacy Policy periodically. Your continued use of the Service after we post any modifications to the Privacy Policy on this page will constitute your acknowledgment of the modifications and your consent to abide and be bound by the modified Privacy Policy.</p>

<p>If we make any material changes to this Privacy Policy, we will notify you either through the email address you have provided us, or by placing a notice on our website.</p>

<h2>Contact Us</h2>

<p>If you have any questions about this Privacy Policy, please contact us.</p>


        <LoadingInline
          active={comp.state.loader}
        />
      </div>
    );
  }

};

export default Privacy;
