# Contributing

These are some of the ways you can contribute to OS.js

* **Open issues** You can find a list of open issues on [Github](https://github.com/andersevenrud/OS.js-v2/issues)
* **New features** Create a [pull request](https://github.com/andersevenrud/OS.js-v2/pulls) or open a new issue if you have any ideas for new features
* **Translating** Language support is a bit lacking, so any help appreciated!
* **Testing** Things are always changing, and automated tests are not enough to ensure everything is working 100%.
* **Documentation** Found something in the documentation that does not seem right ?

You can also submit patches and questions directly to me via [email](mailto:andersevenrud@gmail.com), but using Github is preferred.

# Resources

* [Homepage](http://os.js.org/)
* [Documentation](http://os.js.org/doc/)
* [FAQ and discussion](https://github.com/andersevenrud/OS.js-v2/issues/49)
* [Chat room](https://gitter.im/andersevenrud/OS.js-v2)

# Source Code

* [OS.js Source Code](https://github.com/andersevenrud/OS.js-v2)
* [OS.js Homepage Code](https://github.com/andersevenrud/os.js.org)

# Guides etc

* [Code style guide](https://github.com/andersevenrud/OS.js-v2/wiki/Style-guide).
* [Commit message style guide](https://robots.thoughtbot.com/5-useful-tips-for-a-better-commit-message)
* [Github pull-requests guide](https://help.github.com/articles/using-pull-requests/)
* [Join the Testing team](https://github.com/andersevenrud/OS.js-v2/wiki/Join-the-testing-team)
* [Join the Translation team](https://github.com/andersevenrud/OS.js-v2/wiki/Join-the-translation-team)


# Setting up development Environment

To get started you need a [Github](https://github.com/) account.

Then proceed to **fork** OS.js via the official [project page](https://github.com/andersevenrud/OS.js-v2).

## Prepare


```
# Clone your newly created repository (*git*) and build:

sudo npm install -g grunt-cli
npm install
grunt

# Start the server and test if everything is working:

./bin/start-node-dev.sh
```

## Making and submitting changes

Commit the changes to your repository and push changes like normal. You can use `grunt watch` to automatically run tasks when you change files.

When you're done with the changes and want to submit your work, head over to the [pull request page](https://github.com/andersevenrud/OS.js-v2/pulls) and click "New pull request".

*Please note that you don't have to create a new pull-request if you make new changes to the branch you specified, github will update automatically*
