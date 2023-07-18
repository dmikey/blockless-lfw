import { Console, Environ } from "as-wasi/assembly";

const env = new Environ();

let path = env.get("BLS_REQUEST_PATH");

var html = `<!DOCTYPE html>
<html>
<head>
<title>blockless : hyper local first web</title>
<style>
body, html{background:#000;color:#fff;padding:0;margin:0}
</style>
</head>
<body>
<h1>Hi, mnew version!</h1>
<p>${path as String}</p>
</body>
</html>`;

if (path == "/") {
  Console.log(html);
} else {
  Console.log("404");
}
