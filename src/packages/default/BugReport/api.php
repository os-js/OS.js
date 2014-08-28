<?php

require ROOTDIR . "/vendor/PHPMailer/PHPMailerAutoload.php";

class ApplicationBugReport
{
  public static function call($method, $arguments) {
    if ( !class_exists("PHPMailer") ) {
      throw new Exception("PHPMailer was not found");
    }

    $d    = new DateTime();
    $data = htmlspecialchars($arguments["message"]);
    $misc = htmlspecialchars($arguments["misc"]);

    $user = "osjs@gmail.com";
    $pass = "undefined";

    $subject = "OS.js v2 Bugreport";
    $html    = <<<EOHTML
<h1>OS.js Bug-report</h1>
<hr />
<pre>{$d->format("r")}</pre>
<hr />
<pre>{$data}</pre>
<hr />
<pre>{$misc}</pre>

EOHTML;

    if ( !$mail = new PHPMailer() ) {
      return false;
    }

    $mail->IsSMTP();
    $mail->IsHTML(true);

    $mail->SetFrom($user);
    $mail->AddAddress($user);

    $mail->Username   = $user;
    $mail->Password   = $pass;
    $mail->Subject    = $subject;
    $mail->Body       = $html;

    // GMail config
    $mail->SMTPAuth   = true;
    $mail->SMTPSecure = 'ssl';
    $mail->Host       = "smtp.gmail.com";
    $mail->Port       = 465; // or 587

    if ( !($result = $mail->Send()) ) {
      return $mail->ErrorInfo;
    }
    return true;
  }
}

?>
