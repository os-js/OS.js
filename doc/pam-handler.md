With the *pam* handler you can enable a login prompt for OS.js and connect it to your system authentication system.

## Setup

```
# In OS.js root

$ npm install nan@1.1.0
$ npm install authenticate-pam
```

* Edit `src/conf/000-base.json` and set handler to `pam`
* Copy `src/client/javascript/handlers/pam/login.html` to `dist/login.html`
* Copy `src/client/javascript/handlers/pam/login.html` to `dist-dev/login.html`
* Run `grunt config` to update configuration files
* Run `grunt dist-dev-index` to update html index file (If using dist-dev)
* Run `grunt core` to rebuild (If using dist)

