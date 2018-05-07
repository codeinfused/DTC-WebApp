<!DOCTYPE html>
<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js"> <!--<![endif]-->
<head>
  <?php require_once('../apiapp/conf.php'); ?>
  <?php $ver = "2.05"; ?>

  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
  <title>Dice Tower Convention App</title>
  <meta name="description" content="">

  <meta name="viewport" content="width=device-width, height=device-height, user-scalable=no, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, shrink-to-fit=no" />

  <!-- IOS Meta -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <!-- <link rel="apple-touch-startup-image" href="/ios-launch.png"> -->
  <meta name="apple-mobile-web-app-title" content="Dice Tower Con">
  <link rel="shortcut icon" href="/favicon.ico">

  <!-- Android Meta -->
  <link rel="manifest" href="/android-manifest.json">
  <meta name="application-name" content="Dice Tower Con">
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="theme-color" content="#601c88" />
  <meta name="msapplication-navbutton-color" content="#601c88" />
  <meta name="msapplication-starturl" content="/">

  <!-- Icon Meta -->
  <link rel="icon" type="image/png" href="/apple-touch-icon-192.png" sizes="192x192" />
  <link rel="apple-touch-icon" type="image/png" href="/apple-touch-icon-192.png" sizes="192x192" /> <!-- bookmarked icon? -->

  <!-- No Cache For Testing -->
  <meta http-equiv="cache-control" content="max-age=0" />
  <meta http-equiv="cache-control" content="no-cache" />
  <meta http-equiv="expires" content="0" />
  <meta http-equiv="expires" content="Tue, 01 Jan 1980 1:00:00 GMT" />
  <meta http-equiv="pragma" content="no-cache" />

  <link rel="stylesheet" href="/css/normalize.css">
  <link rel="stylesheet" href="/css/font-awesome.min.css" />
  <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />
  <link rel="stylesheet" href="/app/app.css?v=<?php echo $ver; ?>">
  <link rel="stylesheet" href="/css/main.css?v=<?php echo $ver; ?>">

  <script>
    const baseAPI = '<?php echo "/api/"; ?>';
  </script>

</head>
<body>

  <!-- <script>
    window.fbAsyncInit = function() {
      FB.init({
        appId      : '202475036823066',
        cookie     : true,
        xfbml      : true,
        version    : '2.8'
      });
      FB.AppEvents.logPageView();
    };

    (function(d, s, id){
       var js, fjs = d.getElementsByTagName(s)[0];
       if (d.getElementById(id)) {return;}
       js = d.createElement(s); js.id = id;
       js.src = "https://connect.facebook.net/en_US/sdk.js";
       fjs.parentNode.insertBefore(js, fjs);
     }(document, 'script', 'facebook-jssdk'));
  </script> -->

  <div id="app-wrapper">
    <div className="loader-layout-inline" style="display: block;">
      <div className="loader-layout-inner">
        <div className="loader-spinner2">
          <svg className="loader-spinner2-circular" viewBox="25 25 50 50">
            <circle className="loader-spinner2-path" cx="50" cy="50" r="20" fill="none" strokeWidth="2" strokeMiterlimit="10"/>
          </svg>
        </div>
      </div>
    </div>
  </div>
  <div id="toasts-wrapper"></div>

  <script defer src="/vendors/axios.js"></script>
  <script defer src='<?php if(APP_ENV==='LOCAL'){ echo "/app/app.js"; }else{ echo "/app/app.min.js?v=<?php echo $ver; ?>"; } ?>'></script>
</body>
</html>
