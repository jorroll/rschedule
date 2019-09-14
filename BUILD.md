# Build Steps

1. Run `yarn build` from project root.
2. Update the appropriate package.json peer dependencies.
3. Run `yarn lerna publish --contents build --preid next` or `yarn lerna publish --contents build`.
4. It will build again, but this second build is only for copying the new package version over to the release.
