<?php

namespace OSjs\Packages;

use OSjs\Core\Request;

class EXAMPLE {

    public static function test(Request $request, Array $args = Array())
    {
        return 'This is a response from your extension';
    }

}

return 'OSjs\\Packages\\EXAMPLE';

?>
