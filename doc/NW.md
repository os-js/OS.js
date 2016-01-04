# Making a NW build

Run:

```
grunt nw
```

Your build will be located in `.nw`

## Possible problems

If you get `Fatal error: path must be a string` (a bug in nw-builder)

Run:

```
npm install nw-builder@2.1.0
```

to downgrade and try again
