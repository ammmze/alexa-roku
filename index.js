require('alexa-app-server').start({
    server_root: __dirname,     // Path to root 
    public_html: "public_html", // Static content 
    app_dir:     "apps",        // Where alexa-app modules are stored 
    app_root:    "/alexa/",           // Service root 
    port:        8080           // What port to use, duh 
});
