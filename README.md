# Appcelerator SAML
Appcelerator SAML provides [SAML 2.0](http://en.wikipedia.org/wiki/SAML_2.0) Autehntication for Appcelerator Arrow driven applications. 
The module is tested and works with the following IDps : **Onelogin, Okta, Shibboleth, SimpleSAMLphp**. 

### The module uses
* node [passport](http://passportjs.org/)
* node [passport-saml](https://github.com/bergie/passport-saml)

### Authentication flow

*   User visits the application
*   The appcelerator-saml module checks if the user is logged in
*   If not authenticated, the user is redirected to loginUrl, which you have to set (see point 3.1.).
*   From the login route the user is redirected to the Identity Provider
    *   On success - the IDp returns the user to the callbaclUrl (see point 2.1. - configuration options)
    *   On error - user is redirected to the callbackUrl as well
*   appcelerator-saml grabs the data sent from the IDp, writes it and makes it accessable trough the application request object (see point 3.4.)
    

## 1.   Installation
* Install the module
    ``
    > npm install appcelerator-saml       
    ``
*   Add ***APIKeyAuthPlugin*** authentication type in the configuration file `./conf/default.js`
```
APIKeyAuthType: 'plugin', // Modify the default 'APIKeyAuthType', and set it to 'plugin'
APIKeyAuthPlugin: 'appcelerator-saml' 
```

Typescript files and the tsconfig.json file, are not included with the node module.
If you want to use the typescript files, clone the repo.

## 2.  Configuration
 Copy ``conf/example.config.js`` to you project's configuration folder, and rename the file to : 
 ``appc.saml.default.js``.
### 2.1.   Configuration options
 Set  the **privateCertLocation** and **certLocation** if you are going to use private key and certificate, to authenticate against the server.
 
 ```sh
    //Application login Url
    loginUrl: '/saml/login',
    //The url, where data sent from the IDp will be handled
    callbackUrl : '/saml/response/callback',
    //optional : Location of private key file (relative to project root)
    privateCertLocation : './pk/login.axway.com.pem',
    //optional : Location of certificat file (relative to project root)
    certLocation : './pk/login.axway.com.crt',
    // Routes that don't require authentication
    allowedPaths : ['/saml/response/callback', '/saml/login', '/successed'],
    //resultObject : is the Object structure, that you application requires
    //the object member values are the keys of the Object received from the IDp 
    resultObject : {
        firstName : 'firstname',
        lastName : 'lastname',
        email : 'email',
        username : 'username',
        language : 'preferredLanguage'
    },
    //passport-saml configuration object
    passport: {
        strategy: 'saml',
        saml: {
            //Should be an absolute path
            callbackUrl: 'https://localhost:8080/response/callback',
            entryPoint: 'https://idp.com/saml2/idp/SSOService.php',
            issuer: 'cloud:passport:saml',
            authnContext: 'http://schemas.microsoft.com/ws/2008/06/identity/authenticationmethod/windows',
            logoutCallbackUrl: 'https://localhost:8080/saml/logout'
        }
    }
 ```
*   **loginUrl** - string - Path of the login Route
*   **callbackUrl** - string - Where the user is redirected by the Identity Provider
*   **privateCertLocation** - string - (optional) Location of private key file (relative to project root)  
*   **certLocation** - string - (optional) Location of certificat file (relative to project root)
*   **allowedPaths** - Array - (optional) Array of Routes that don't require authentication
*   **passport** - passport-saml configuration object
*   **resultObject** - Object - Maps the response Object of the IDP to your desired structure. Where the parameter values are the parameter keys in the IDP's response. eg.: The IDP returns an object like this 
    ```sh
        {
            identifier  : 1001,
            firsNameOfUser : 'Name',
            surName : 'Othername',
            authenticationName : 'authname'
        }
    ```
    And the object structure that you want is :
    ```sh
        {
            id  : 1001,
            firstName : 'Name',
            lastName : 'Othername',
            username : 'authname'
        }
    ```
    So the **resultObject** should look like this :
    ```sh
        {
            id  : 'identifier',
            firstName : 'firsNameOfUser',
            lastName : 'surName',
            username : 'authenticationName'
        }
    ```
    

 For more infromation on the passport object, check the documentation of the [passport-saml extension](https://github.com/bergie/passport-saml).

## 3.  Usage
 
 Once set, appcelerator-saml checks if current user is authenticated, for all routes (except for the loginUrl). You can add exceptions ( routes / endpoints which unauthorized users can visit ). Just add paths to the `allowedPaths` Array. Don't forget to add loginUrl to it as well.
 
After you set `"appc.saml.default.js"` file, and add **APIKeyAuthPlugin** to `./conf/default.js`, you have to set the application Routes, which are going to intercept the information sent by the IDp.

### 3.1.    Setting a login route
This route should be the same, as the one you set as loginRoute in the module's configuration.

```sh
var Arrow = require('arrow');
//Require the Module
var SamlAuth = require('appcelerator-saml');
//Instantiate the SamlAuth and pass a server instance to the constructor
var auth = new SamlAuth(Arrow);

var LoginRoute = Arrow.Router.extend({
    name: 'login',
    path: '/saml/login',
    method: 'GET',
    description: 'Application login route',
    action: auth.passport.authenticate('saml',
        {
            failureRedirect: "/saml/login-error" // where the user gets redirected on errror
        })
        
});

module.exports = LoginRoute;
```
The `auth.passport.authenticate` method redirects the user to the login page of the identity provider ( **entryPoint** ).

### 3.2.    Setting a callback route
This route should match `callbackUrl` parameter from the config. This is where appcelerator-saml, grabs the response from the IDP and persists the data. You can later on access the data, trough the application's Request object.

```sh
var Arrow = require('arrow');
var SamlAuth = require('appcelerator-saml');
var auth = new SamlAuth(Arrow);

var CallbackRoute = Arrow.Router.extend({
    name: 'sso_callback',
    path: '/saml/response/callback',
    method: 'POST',
    description: 'Authorization page',
    action: auth
        .passport
        .authenticate('saml', {
            successRedirect : '/', // Redirect user to this route on success
            failureRedirect: '/saml/login-error', // Redirect on error
        })
}); 

module.exports = CallbackRoute;
```
The `successRedirect` property of auth.passport.authenticate, is the route where the user is going to be redirected on success.

### 3.3.    Authenticating with && without a certificate
Set the privateCertLocation and certLocation (the location of the .pem and .crt files), to enable certificate authentication

### 3.4.    Using the information sent from the server
The authentication information is accessable trough the Arrow's Request object

    request.isAuthenticated() // returns wether the user is authenticated
    request.user // returns user information object ( the one you set with resultObject )

Let's create a api endpoint that returns information on currently logged user.
```sh
    var Arrow = require('arrow');
    
    var UserAPI = Arrow.API.extend({
    	group: 'userapi',
    	path: '/loggeduser',
    	method: 'GET',
    	description: 'API information about logged in user',
    	action: function (req, resp, next) {
            user_data = req.user
    		resp.stream(getLoggedinData, next);
    	}
    });
    
    var user_data = {};
    
    function getLoggedinData(callback)
    {
    	callback(null,user_data);
    }
    
    module.exports = UserAPI;
    

```


    
### 3.4.    Setting up a logout route
```sh
var Arrow = require('arrow');

var LogoutRoute = Arrow.Router.extend({
    name: 'logout',
    path: '/saml/logout',
    method: 'GET',
    description: 'Application logout route',
    action: function (request, response) {
        request.logout();
        response.redirect('/welcome');
    }

});


module.exports = LogoutRoute;
```



