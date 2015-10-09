# How to contribute

Want to help in the development in OS.js, this document will explain how to submit changes.

If you have questions or suggestions you can also open an [issue](https://github.com/andersevenrud/OS.js-v2/issues/new).

You can also submit patches and questions directly to me via [email](mailto:andersevenrud@gmail.com), but using Github is preferred.


# Getting started

To get started you need a [Github](https://github.com/) account.

Then proceed to **fork** OS.js via the official [project page](https://github.com/andersevenrud/OS.js-v2).

Clone your newly created repository (*git*) and build:

```
sudo npm install -g grunt-cli
npm install
grunt
```

Start the server and test if everything is working:

```
./bin/start-node-dev.sh
```

## Making and submitting changes

Commit the changes to your repository and push changes like normal.

When you're done with the changes and want to submit your work, head over to the [pull request page](https://github.com/andersevenrud/OS.js-v2/pulls) and click "New pull request".

*Please note that you don't have to create a new pull-request if you make new changes to the branch you specified, github will update automatically*

If you don't know how pull requests work, look at the [documentation on Github](https://help.github.com/articles/using-pull-requests/).

# Style guide

The code style guide is located in [the wiki](https://github.com/andersevenrud/OS.js-v2/wiki/Style-guide).

Make sure your [commit messages](https://robots.thoughtbot.com/5-useful-tips-for-a-better-commit-message) are short and to the point.

# Other resources

* [Homepage](http://os.js.org/)
* [Documentation](http://os.js.org/doc/)
* [FAQ and discussion](https://github.com/andersevenrud/OS.js-v2/issues/49)
* [Chat room](https://gitter.im/andersevenrud/OS.js-v2)
