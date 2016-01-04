# Contributing

These are some of the ways you can contribute to OS.js:

* **Open issues** You can post any issues to [Github](https://github.com/andersevenrud/OS.js-v2/issues).
* **New features** Create a [pull request](https://github.com/andersevenrud/OS.js-v2/pulls) or open a new issue if you have any ideas for new features.
* **Translating** Language support is a bit lacking, so any help is appreciated!
* **Testing** Things are always changing, and automated tests are not enough to ensure everything is working 100%.
* **Documentation** Found something in the documentation that does not seem right? Head over to the [homepage repositories](https://github.com/andersevenrud/os.js.org)
* **Community** Join in our [Gitter](https://gitter.im/andersevenrud/OS.js-v2) chat room for fun and tech talk!

You can also submit patches and questions directly to me via [email](mailto:andersevenrud@gmail.com), but using GitHub is preferred.

# Resources

* [Homepage](http://os.js.org/)
* [Documentation](http://os.js.org/doc/)
* [FAQ and discussion](https://github.com/andersevenrud/OS.js-v2/issues/49)
* [Chat room](https://gitter.im/andersevenrud/OS.js-v2)
* [Subreddit](https://www.reddit.com/r/osjs)
* [PayPal donation](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=andersevenrud%40gmail%2ecom&lc=NO&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted)
* [Gratipay donation](https://gratipay.com/os-js/)

# Source Code

* [OS.js Source Code](https://github.com/andersevenrud/OS.js-v2)
* [OS.js Homepage Code](https://github.com/andersevenrud/os.js.org)

# Guides etc

* [Code style guide](https://github.com/andersevenrud/OS.js-v2/wiki/Style-guide)
* [Commit message style guide](https://robots.thoughtbot.com/5-useful-tips-for-a-better-commit-message)
* [Github pull-requests guide](https://help.github.com/articles/using-pull-requests/)
* [Join the Testing team](https://github.com/andersevenrud/OS.js-v2/wiki/Join-the-testing-team)
* [Join the Translation team](https://github.com/andersevenrud/OS.js-v2/wiki/Join-the-translation-team)


# Setting up the development environment

To get started you need a [Github](https://github.com/) account.

Then proceed to **fork** OS.js via the official [project page](https://github.com/andersevenrud/OS.js-v2).

## Prepare

Follow the official documentation on how to [install and run OS.js](http://os.js.org/doc/manuals/man-install.html), with one exception -- run the development server instead:

```
./bin/start-node-dev.sh
```

## Making and submitting changes

* Fork OS.js on github
* Follow the [style guide](https://github.com/andersevenrud/OS.js-v2/wiki/Style-guide)
* I **strongly** recommend using a separate branch for your changes.
* I **strongly** recommend [squashing](http://makandracards.com/makandra/527-squash-several-git-commits-into-a-single-commit) your commits if you have spread out a task into several pieces.
* Make sure you test **all your changes** before commiting so it does not lead to extra commits with corrections.
* Keep your commit messages as short as possible and don't include filesnames. Write a short description of **what was done**, not *where*. Example: "Themes: Corrected colors" or "Locales: Added ru_RU locales"
* Send a [pull-request](https://help.github.com/articles/using-pull-requests/) when you are done
* Keep your fork [up-to-date](https://robots.thoughtbot.com/keeping-a-github-fork-updated) 

Tip: Have `grunt watch` running in the background to automatically run tasks for you when something changes.

Tip: Run `grunt jscs jshint` to check for syntax problems and style guide violations

Tip: Run `grunt mochaTest` to run server-side checks

Tip: Run `grunt test` to test everything

**NOTE THAT I DO NOT ACCEPT PULL-REQUESTS THAT DO NOT FOLLOW THE GUIDELINES ABOVE (AS OF 2016)**
