<?php

class App {
    protected $controller = 'KasirController'; // Default Controller
    protected $method = 'index';
    protected $params = [];

    public function __construct() {
        $url = $this->parseURL();

        // Setup Controller
        if(isset($url[0])) {
            $controllerName = ucfirst($url[0]) . 'Controller';
            if(file_exists('../controllers/' . $controllerName . '.php')) {
                $this->controller = $controllerName;
                unset($url[0]);
            }
        }

        require_once '../controllers/' . $this->controller . '.php';
        $this->controller = new $this->controller;

        // Setup Method
        if(isset($url[1])) {
            if(method_exists($this->controller, $url[1])) {
                $this->method = $url[1];
                unset($url[1]);
            }
        }

        // Setup Params
        if(!empty($url)) {
            $this->params = array_values($url);
        }

        // Jalankan Controller & Method, serta kirim Params
        call_user_func_array([$this->controller, $this->method], $this->params);
    }

    public function parseURL() {
        if(isset($_GET['url'])) {
            $url = rtrim($_GET['url'], '/');
            $url = filter_var($url, FILTER_SANITIZE_URL);
            $url = explode('/', $url);
            return $url;
        }
        return [];
    }
}
