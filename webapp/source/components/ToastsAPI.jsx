import React from 'react';
import ReactDOM from 'react-dom';
import {ToastContainer, ToastMessage} from 'react-toastr';

class Toasts extends React.Component
{
  toastElement = null;

  toast(type, title, message, options)
  {
    let opts = Object.assign({}, options, {closeButton:true});
    this.toastElement[type](title, message, opts);
  }

  render()
  {
    var comp = this;
    return (
      <div className="react-toast-element"><ToastContainer ref={(elem)=>{comp.toastElement=elem;}} className="toast-top-right" preventDuplicates={false} toastMessageFactory={React.createFactory(ToastMessage.animation)} /></div>
    );
  }
};

const ToastsAPI = ReactDOM.render((
  <Toasts />
), document.getElementById('toasts-wrapper'));

export default ToastsAPI;
