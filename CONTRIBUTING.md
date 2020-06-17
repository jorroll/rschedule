## Contributing

If you find a bug or have a feature request, the first step is to create an issue in Gitlab for it. After that, contributions are most definitely welcome.

To make contributing easier, this repo has a `.devcontainer` configuration file ([learn more](https://code.visualstudio.com/docs/remote/containers#_creating-a-devcontainerjson-file)) that will configure VSCode for developing. If you're not already familiar with developing using VSCode and a docker container, I suggest you check out the [VSCode docs](https://code.visualstudio.com/docs/remote/containers#_creating-a-devcontainerjson-file). If you don't want to do that though, here's the short verson:

1. Open [VSCode](https://code.visualstudio.com/) on your computer.
2. Install the [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) official extension. Follow the installation instructions for the extension.
3. Clone this repo and open it on your computer. You should then be prompted to "Reopen in container" (do so).
4. After the container setup is complete, open the VSCode integrated terminal and try running the tests `yarn test`. They should all pass.

### FAQ

1. By default, you might not be able to push any git commits using VSCode running inside a dev container. To fix this issue, read this [VSCode Article](https://code.visualstudio.com/docs/remote/containers#_sharing-git-credentials-with-your-container).