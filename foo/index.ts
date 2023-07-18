import { Console } from "as-wasi/assembly";

var html = `<!DOCTYPE html>
<html>
<head>
<style>
body, html{background:#000;color:#fff;padding:0;margin:0}
</style>
</head>
<body>
<h1>Hi, world!</h1>
<p>asdasds</p>
</body>
</html>`;
Console.log(html);
