<?php

/*
  200 ok
  400 general bad request

*/

function is_error($obj)
{
  return is_a($obj, 'ApiError');
}

class ApiError {

  private $restcodes = array(
    "200"=> "Done.",
    "400"=> "Malformed request.",
    "401"=> "Authentication failed.",
    "403"=> "Access to resource denied.",
    "404"=> "Resource not found.",
    "405"=> "Call method not allowed.",
    "406"=> "Missing parameters.",
    "408"=> "Request timed out.",
    "409"=> "Could not complete change.",
    "422"=> "Invalid request data.",
    "500"=> "Unknown server error."
  );

  private $code;
  private $messages = array();
  private $data;

  public function __construct($code, $message='', $data=array())
  {
    $this->code = $code;
    if(!empty($message)){
      $this->messages = $message;
    }else{
      $this->messages = $this->restcodes[$code];
    }
  }

  public function add_message($message)
  {
    $this->messages .= $message;
  }

  public function get_code()
  {
    return $this->code;
  }

  public function get_messages()
  {
    return $this->messages;
  }

  public function get_data()
  {
    return $this->data;
  }

  public function __get($variable){
    if(isset($this->{$variable})){
      return $this->{$variable};
    }else{
      return false;
    }
  }

  public function json()
  {
    return array("message"=>$this->messages, "error_code"=>$this->code);
  }

}
