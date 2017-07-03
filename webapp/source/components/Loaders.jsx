import React from 'react';

class LoadingInline extends React.Component
{
  render()
  {
    var comp = this;
    return (
      <div className="loader-layout-inline" style={{'display': comp.props.active===true ? 'block' : 'none'}}>
        <div className="loader-spinner2">
          <svg className="loader-spinner2-circular" viewBox="25 25 50 50">
            <circle className="loader-spinner2-path" cx="50" cy="50" r="20" fill="none" strokeWidth="2" strokeMiterlimit="10"/>
          </svg>
        </div>
      </div>
    );
  }
};

class LoadingFull extends React.Component
{
  render()
  {
    var comp = this;
    return (
      <div className="loader-layout-full">
        <div className="loader-layout-inner">
          <div className="loader-spinner2">
            <svg className="loader-spinner2-circular" viewBox="25 25 50 50">
              <circle className="loader-spinner2-path" cx="50" cy="50" r="20" fill="none" strokeWidth="2" strokeMiterlimit="10"/>
            </svg>
          </div>
        </div>
      </div>
    );
  }
};

export {LoadingInline, LoadingFull};
