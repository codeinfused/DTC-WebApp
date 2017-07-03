<?php
namespace api\auth;
use \Firebase\JWT\JWT;
use \api\user\User;

abstract class Auth
{
  static function noop()
  {
    return "{}";
  }

  /**
    * Included on every API request
    * Verifies authorization header and JWT token
    * @RETURN decoded-jwt OR ApiError
  ***/
  static function checkAuthorization($pdo, $request)
  {
    $jwt = self::parseAuthorization($request);
    if( is_error($jwt) ){
      return $jwt;
    }

    $token = self::checkToken($pdo, $jwt);
    return $token;
  }

  /**
    * Retrieves jwt token from Authorization header
    * @RETURN encoded-jwt OR ApiError
  ***/
  static function parseAuthorization($request)
  {
    if( $request->hasHeader('Authorization') ){
      $reqAuth = $request->getHeader('Authorization');
      if( substr($reqAuth[0], 0, 6)==='Bearer' ){
        $jwt = substr($reqAuth[0], 7);
        return $jwt;
      }else{
        return new \ApiError('422', 'Invalid authentication header.');
      }
    }else{
      return new \ApiError('401', 'No authentication header.');
    }
  }

  /**
    * Decodes JWT for expiration check
    * @RETURN decoded-jwt OR ApiError
  ***/
  static function checkToken($pdo, $jwt)
  {
    try {
      $decoded = JWT::decode($jwt, JWT_APP_KEY, array('HS256'));
    } catch (\Exception $e) {
      $msg = $e->getMessage();
      if(strtolower($msg) === 'expired token'){
        return new \ApiError('401', 'Access token expired.');
      }else{
        return new \ApiError('401');
      }
    }

    return $decoded;
  }

  /**
    * Parse Auth header and CheckToken on jwt
    * Verify refresh-token and device-id
    * @RETURN new-jwt OR ApiError
  ***/
  static function checkRefresh($pdo, $device, $request, $body)
  {
    $refresh = $body['refresh_token'];
    $device_id = $body['device_id'];
    $jwt = self::parseAuthorization($request);
    if( is_error($jwt) ){
      return $jwt;
    }

    $jwtCheck = self::checkToken($pdo, $jwt);
    if(is_error($jwtCheck)){
      $message = $jwtCheck->get_messages();
      if($message !== 'Access token expired.'){
        return new \ApiError('401');
      }else{
        try{
          JWT::$leeway = 5184000; // 2 month refresh range
          $decoded = JWT::decode($jwt, JWT_APP_KEY, array('HS256'));
        }catch(\Exception $e){
          return new \ApiError('401', 'Refresh token expired.');
        }
        $jwtCheck = $decoded;
      }
    }

    $device = $device=='desktop' ? 'desktop' : 'mobile';
    $user_id = $jwtCheck->data->uid;
    $dbCheck = $pdo->prepare("SELECT id FROM user_devices WHERE user_id=:uid AND refresh_token=:token AND device_type=:device AND device_id=:device_id");
    $dbCheck->execute(array(':uid'=>$user_id, ':token'=>$refresh, ':device'=>$device, ':device_id'=>$device_id));
    $refresh_row_id = $dbCheck->fetchColumn();
    $dbCheck->closeCursor();

    if($refresh_row_id === false){
      return new \ApiError('401', 'Invalid refresh token.');
    }

    $newjwt = self::generateToken($pdo, $user_id, $body, $device);
    return $newjwt;
  }

  static function generateKey()
  {
    // base64_encode(mcrypt_create_iv(32)); // depreciated in php7
    return base64_encode(random_bytes(26));
  }

  /**
    * Generates jwt and refresh tokens
    * Inserts or updates user's device
    * @RETURN jwt/refresh object OR ApiError
  ***/
  static function generateToken($pdo, $user, $body)
  {
    //$device = $device=='desktop' ? 'desktop' : 'mobile';
    //$device_ip = $_SERVER['REMOTE_ADDR'];
    //$device_agent = $_SERVER['HTTP_USER_AGENT'];

    // if(empty($device_id)){
    //   return new \ApiError('406');
    // }

    $issued_at = time();
    $not_before = $issued_at + 0;
    $expire_seconds = 60 * 60 * 24 * 60; // 60 days    // 60 * 60 * 4; // 4 hours
    $expire_seconds_refresh = 60 * 60 * 24 * 120; // 120 days
    $expire = $not_before + $expire_seconds;

    // if($device==='desktop'){
    //   $expire_seconds_refresh = $expire_seconds + (60*30); // +30m
    // }

    $token_key = self::generateKey();
    $refresh_token = self::generateKey();

    $token = array(
      "iss" => ISSUER_URL,
      "jti" => $token_key,
      "iat" => $issued_at,
      //"nbf" => $notBefore,
      "exp" => $expire,
      "data" => array(
        "uid" => $user['id'],
        "role" => $user['role']
      )
    );

    $jwt = JWT::encode($token, JWT_APP_KEY);
    return array(
      "access_token" => $jwt,
      "refresh_token" => $refresh_token,
      "token_type" => "bearer",
      "expires_in" => $expire_seconds,
      "user" => array(
        "first_name" => $user['firstname'],
        "last_name" => $user['lastname'],
        "thumb" => $user['thumb']
      )
    );
  }

  static function invalidateToken($data)
  {

  }

  /**
    * Authenticate user and create jwt/refresh object
    * @RETURN jwt/refresh OR ApiError
  ***/
  static function authenticate($pdo, $request, $body)
  {
    $grant = $body['grant_type'];
    $token = $body['token'];
    $user_obj = $body['user']; // email, first_name, last_name

    if($grant === 'guest'){
      $user_obj = array("first_name"=>"Guest", "last_name"=>"", "email"=>self::generateKey());
    }

    $req = $pdo->prepare("SELECT id, firstname, lastname, email, role, grant_type, fb_token, google_token, thumb FROM users WHERE email = :email");
    $req->execute(array(":email"=>$user_obj['email']));
    $user = $req->fetch();
    $req->closeCursor();

    if($user === false)
    {
      $reqsql = "INSERT INTO users SET firstname = :fname, lastname = :lname, email = :email, grant_type = :grant, thumb = :thumb";
      if($grant==='facebook'){
        $reqsql .= ", fb_token = :token";
      }else if($grant==='google'){
        $reqsql .= ", google_token = :token";
      }

      $exec_array = array(
        ':fname'=>$user_obj['first_name'],
        ':lname'=>$user_obj['last_name'],
        ':email'=>$user_obj['email'],
        ':grant'=>$grant,
        ':thumb'=>$user_obj['thumb']
      );
      if($grant !== 'guest'){ $exec_array[':token'] = $token; }

      $req = $pdo->prepare($reqsql);
      $req->execute($exec_array);
      $uid = $pdo->lastInsertId();

      $req = $pdo->prepare("SELECT id, firstname, lastname, email, role, grant_type, fb_token, google_token FROM users WHERE id = :id");
      $req->execute(array(":id"=>$uid));
      $user = $req->fetch();
      $req->closeCursor();

    }else{
      // user already exists, update

      $reqsql = "UPDATE users SET firstname = :fname, lastname = :lname, email = :email, grant_type = :grant, thumb = :thumb";
      if($grant==='facebook'){
        $reqsql .= ", fb_token = :token";
      }else if($grant==='google'){
        $reqsql .= ", google_token = :token";
      }
      $reqsql .= " WHERE id = :id";

      $exec_array = array(
        ':fname'=>$user_obj['first_name'],
        ':lname'=>$user_obj['last_name'],
        ':email'=>$user_obj['email'],
        ':grant'=>$grant,
        ':thumb'=>$user_obj['thumb'],
        ':id'=>$user['id']
      );
      if($grant !== 'guest'){ $exec_array[':token'] = $token; }

      $req = $pdo->prepare($reqsql);
      $req->execute($exec_array);

      $req = $pdo->prepare("SELECT id, firstname, lastname, email, role, grant_type, fb_token, google_token FROM users WHERE id = :id");
      $req->execute(array(":id"=>$user['id']));
      $user = $req->fetch();
      $req->closeCursor();

    }

    if($user===false){
      return new \ApiError('401', 'Unable to authenticate account.');
    }

    $jwt = self::generateToken($pdo, $user, $body);
    return $jwt;
  }

} // end Auth class
