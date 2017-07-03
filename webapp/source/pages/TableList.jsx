import CONFIG from '../config.jsx';
import axios from 'axios';
import React from 'react';
import {browserHistory} from 'react-router';
import {FontIcon} from 'react-toolbox';
import {Button, IconButton} from 'react-toolbox/lib/button';
import {cloneDeep, slice} from 'lodash';
import {XmlEntities, AllHtmlEntities} from 'html-entities';

import {LoadingInline} from '../components/Loaders.jsx';
import ToastsAPI from '../components/ToastsAPI.jsx';

const entities = {xml: new XmlEntities(), html: new AllHtmlEntities()};

class TableList extends React.Component
{
  constructor(props)
  {
    super(props);
    var comp = this;

    console.log(props);

    this.state = {

    };
  }

  componentDidMount()
  {

  }

  componentWillReceiveProps(nextProps)
  {

  }

  getGameData(bgg_id)
  {

  }

  render()
  {
    var comp = this;
    return (
      <div id="page-table-edit" className="transition-item page-table-edit page-wrap">

      </div>
    );
  }
}

export default TableList;
